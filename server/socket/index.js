const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Appointment = require('../models/Appointment');
const Consultation = require('../models/Consultation');

// In-memory room tracking: Map<roomName, Map<userId, socketId>>
const roomParticipants = new Map();

const socketSetup = (io) => {
  // Authentication Middleware via JWT
  io.use(async (socket, next) => {
    try {
      const token =
        socket.handshake.auth?.token ||
        socket.handshake.query?.token ||
        (socket.handshake.headers?.authorization &&
          socket.handshake.headers.authorization.split(' ')[1]);

      if (!token) {
        return next(new Error('Authentication error: Token required'));
      }

      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || 'secret_telemedicine_key_123_456_789'
      );

      const user = await User.findById(decoded.id).select('-password');
      if (!user) {
        return next(new Error('Authentication error: User not found'));
      }

      socket.user = user;
      next();
    } catch (err) {
      console.error('Socket authentication error:', err.message);
      return next(new Error('Authentication error: Invalid or expired token'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`[Socket] Connected: ${socket.user.name} (${socket.user.role}) [Socket ID: ${socket.id}]`);

    // Helper to retrieve standardized room name
    const getRoomName = (appointmentId) => `room_${appointmentId}`;

    // Helper to update participant left timestamp in DB
    const markParticipantLeft = async (appointmentId, userId) => {
      try {
        const now = new Date();
        const consultation = await Consultation.findOne({ appointment: appointmentId });
        if (consultation && consultation.participants) {
          const participant = consultation.participants.find(
            (p) => p.user && p.user.toString() === userId.toString() && !p.leftAt
          );
          if (participant) {
            participant.leftAt = now;
            await consultation.save();
          }
        }
      } catch (err) {
        console.error('[Socket] Error updating participant leftAt:', err.message);
      }
    };

    // 1. JOIN ROOM
    socket.on('join-room', async ({ appointmentId }) => {
      if (!appointmentId) {
        return socket.emit('call-error', { message: 'Appointment ID is required' });
      }

      try {
        const appointment = await Appointment.findById(appointmentId);
        if (!appointment) {
          return socket.emit('call-error', { message: 'Appointment not found' });
        }

        // Authorization check: User must be doctor or patient assigned to this appointment
        const isPatient = appointment.patient.toString() === socket.user._id.toString();
        const isDoctor = appointment.doctor.toString() === socket.user._id.toString();

        if (!isPatient && !isDoctor) {
          console.warn(`[Socket] Unauthorized join attempt by ${socket.user._id} for appointment ${appointmentId}`);
          return socket.emit('call-error', {
            message: 'Unauthorized: You are not a designated participant in this appointment'
          });
        }

        // Check appointment status
        if (appointment.status === 'cancelled') {
          return socket.emit('call-error', { message: 'Cannot join: This appointment has been cancelled' });
        }
        if (appointment.status === 'rejected') {
          return socket.emit('call-error', { message: 'Cannot join: This appointment request was rejected' });
        }
        if (appointment.status === 'completed' && appointment.callStatus === 'completed') {
          return socket.emit('call-error', { message: 'This consultation has already concluded' });
        }

        const roomName = appointment.consultationRoomId || getRoomName(appointmentId);

        // Manage active participants map for this room
        if (!roomParticipants.has(roomName)) {
          roomParticipants.set(roomName, new Map());
        }
        const activeUsersInRoom = roomParticipants.get(roomName);

        // Check if another socket for this same user exists (e.g. reload or multiple tabs)
        const existingSocketId = activeUsersInRoom.get(socket.user._id.toString());
        if (existingSocketId && existingSocketId !== socket.id) {
          const oldSocket = io.sockets.sockets.get(existingSocketId);
          if (oldSocket) {
            oldSocket.leave(roomName);
            oldSocket.emit('call-error', { message: 'Session opened in another window or tab.' });
          }
        }

        // Enforce maximum 2 participants (1 doctor, 1 patient)
        if (activeUsersInRoom.size >= 2 && !activeUsersInRoom.has(socket.user._id.toString())) {
          return socket.emit('call-error', { message: 'Consultation room is already full (maximum 2 participants).' });
        }

        // Join socket room
        socket.join(roomName);
        socket.activeRoomName = roomName;
        socket.activeAppointmentId = appointmentId;
        activeUsersInRoom.set(socket.user._id.toString(), socket.id);

        console.log(`[Socket] User ${socket.user.name} (${socket.user.role}) joined ${roomName}. Room occupancy: ${activeUsersInRoom.size}`);

        // Update database: Consultation and Appointment records
        const now = new Date();
        if (appointment.callStatus === 'idle') {
          appointment.callStatus = 'in-progress';
          appointment.callStartTime = now;
          await appointment.save();
        }

        let consultation = await Consultation.findOne({ appointment: appointmentId });
        if (!consultation) {
          consultation = await Consultation.create({
            appointment: appointmentId,
            doctor: appointment.doctor,
            patient: appointment.patient,
            roomId: roomName,
            callStatus: 'in-progress',
            startedAt: now,
            participants: [
              {
                user: socket.user._id,
                role: socket.user.role,
                socketId: socket.id,
                joinedAt: now
              }
            ]
          });
        } else {
          consultation.callStatus = 'in-progress';
          if (!consultation.startedAt) consultation.startedAt = now;
          if (!consultation.roomId) consultation.roomId = roomName;

          // Check if participant entry exists without leftAt
          const activeEntry = consultation.participants.find(
            (p) => p.user && p.user.toString() === socket.user._id.toString() && !p.leftAt
          );
          if (activeEntry) {
            activeEntry.socketId = socket.id;
          } else {
            consultation.participants.push({
              user: socket.user._id,
              role: socket.user.role,
              socketId: socket.id,
              joinedAt: now
            });
          }
          await consultation.save();
        }

        // Notify other participants in the room
        socket.to(roomName).emit('user-joined', {
          userId: socket.user._id,
          name: socket.user.name,
          role: socket.user.role,
          socketId: socket.id
        });

        // If another participant is already present in the room, signal to the joining user
        if (activeUsersInRoom.size > 1) {
          socket.emit('peer-present', {
            message: 'Remote participant is already present in consultation room.',
            occupancy: activeUsersInRoom.size
          });
        }
      } catch (err) {
        console.error('[Socket] Error in join-room handler:', err);
        socket.emit('call-error', { message: 'Internal server error while joining consultation room' });
      }
    });

    // 2. WebRTC OFFER
    socket.on('offer', ({ offer, appointmentId }) => {
      const roomName = socket.activeRoomName || getRoomName(appointmentId);
      socket.to(roomName).emit('offer', {
        offer,
        senderId: socket.user._id,
        senderRole: socket.user.role
      });
    });

    // 3. WebRTC ANSWER
    socket.on('answer', ({ answer, appointmentId }) => {
      const roomName = socket.activeRoomName || getRoomName(appointmentId);
      socket.to(roomName).emit('answer', {
        answer,
        senderId: socket.user._id,
        senderRole: socket.user.role
      });
    });

    // 4. WebRTC ICE CANDIDATE
    socket.on('ice-candidate', ({ candidate, appointmentId }) => {
      const roomName = socket.activeRoomName || getRoomName(appointmentId);
      socket.to(roomName).emit('ice-candidate', {
        candidate,
        senderId: socket.user._id
      });
    });

    // 5. RECONNECT / RENEGOTIATION REQUEST
    socket.on('reconnect', ({ appointmentId }) => {
      const roomName = socket.activeRoomName || getRoomName(appointmentId);
      console.log(`[Socket] Reconnect requested in ${roomName} by ${socket.user.name}`);
      socket.to(roomName).emit('reconnect', {
        requesterId: socket.user._id,
        requesterRole: socket.user.role
      });
    });

    // 6. LEAVE ROOM (explicit participant departure)
    socket.on('leave-room', async ({ appointmentId }) => {
      const roomName = socket.activeRoomName || getRoomName(appointmentId);
      socket.leave(roomName);

      if (roomParticipants.has(roomName)) {
        const roomMap = roomParticipants.get(roomName);
        roomMap.delete(socket.user._id.toString());
        if (roomMap.size === 0) {
          roomParticipants.delete(roomName);
        }
      }

      console.log(`[Socket] User ${socket.user.name} left room: ${roomName}`);
      socket.to(roomName).emit('user-left', {
        userId: socket.user._id,
        name: socket.user.name,
        role: socket.user.role
      });

      await markParticipantLeft(appointmentId, socket.user._id);
    });

    // 7. END CALL (Doctor completes consultation or either party ends call session)
    socket.on('end-call', async ({ appointmentId, notes }) => {
      const roomName = socket.activeRoomName || getRoomName(appointmentId);
      console.log(`[Socket] Call ended by ${socket.user.name} (${socket.user.role}) in room ${roomName}`);

      socket.to(roomName).emit('call-ended', {
        endedBy: socket.user._id,
        name: socket.user.name,
        role: socket.user.role
      });

      try {
        const now = new Date();
        const appointment = await Appointment.findById(appointmentId);
        if (appointment) {
          // If ended by doctor, mark appointment completed
          if (socket.user.role === 'doctor') {
            appointment.status = 'completed';
          }
          appointment.callStatus = 'completed';
          appointment.callEndTime = now;
          await appointment.save();
        }

        const consultation = await Consultation.findOne({ appointment: appointmentId });
        if (consultation) {
          if (notes && socket.user.role === 'doctor') {
            consultation.notes = notes;
          }
          consultation.callStatus = 'completed';
          consultation.endedAt = now;
          if (consultation.startedAt) {
            consultation.duration = Math.max(
              0,
              Math.round((now.getTime() - new Date(consultation.startedAt).getTime()) / 1000)
            );
          }
          if (consultation.participants) {
            consultation.participants.forEach((p) => {
              if (!p.leftAt) p.leftAt = now;
            });
          }
          await consultation.save();
        }
      } catch (err) {
        console.error('[Socket] Error updating call records on end-call:', err.message);
      }
    });

    // 8. DISCONNECTING & CLEANUP
    socket.on('disconnecting', async () => {
      const rooms = Array.from(socket.rooms).filter((r) => r !== socket.id);
      for (const roomName of rooms) {
        if (roomParticipants.has(roomName)) {
          const roomMap = roomParticipants.get(roomName);
          roomMap.delete(socket.user._id.toString());
          if (roomMap.size === 0) {
            roomParticipants.delete(roomName);
          }
        }

        socket.to(roomName).emit('user-left', {
          userId: socket.user._id,
          name: socket.user.name,
          role: socket.user.role
        });

        if (socket.activeAppointmentId) {
          await markParticipantLeft(socket.activeAppointmentId, socket.user._id);
        }
      }
    });

    socket.on('disconnect', () => {
      console.log(`[Socket] Disconnected: ${socket.user.name} [Socket ID: ${socket.id}]`);
    });
  });
};

module.exports = socketSetup;
