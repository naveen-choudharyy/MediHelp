const Consultation = require('../models/Consultation');
const Appointment = require('../models/Appointment');

// @desc    Get WebRTC ICE servers (STUN / TURN) securely
// @route   GET /api/consultations/ice-servers
// @access  Private
exports.getIceServers = async (req, res) => {
  try {
    const iceServers = [
      {
        urls: [
          'stun:stun.l.google.com:19302',
          'stun:stun1.l.google.com:19302',
          'stun:stun2.l.google.com:19302',
          'stun:stun3.l.google.com:19302',
          'stun:stun4.l.google.com:19302'
        ]
      }
    ];

    // Support configurable TURN server from environment variables
    const turnUrl = process.env.TURN_URL || process.env.TURN_SERVER_URL;
    const turnUsername = process.env.TURN_USERNAME;
    const turnCredential = process.env.TURN_CREDENTIAL || process.env.TURN_PASSWORD;

    if (turnUrl) {
      const turnConfig = {
        urls: turnUrl.split(',').map((u) => u.trim())
      };
      if (turnUsername) turnConfig.username = turnUsername;
      if (turnCredential) turnConfig.credential = turnCredential;
      iceServers.push(turnConfig);
    }

    return res.json({
      success: true,
      iceServers
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Start/join a consultation session
// @route   POST /api/consultations/:appointmentId/start
// @access  Private (Patient or Doctor associated with the appointment)
exports.startConsultation = async (req, res) => {
  const { appointmentId } = req.params;

  try {
    const appointment = await Appointment.findById(appointmentId)
      .populate('patient', 'name email phone')
      .populate('doctor', 'name email phone');

    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Appointment not found' });
    }

    // Verify ownership
    const isPatient = appointment.patient._id.toString() === req.user._id.toString();
    const isDoctor = appointment.doctor._id.toString() === req.user._id.toString();

    if (!isPatient && !isDoctor) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: you are not authorized to access this consultation'
      });
    }

    // Check appointment status
    if (appointment.status === 'cancelled') {
      return res.status(400).json({
        success: false,
        message: 'Cannot join consultation: This appointment has been cancelled'
      });
    }

    if (appointment.status === 'rejected') {
      return res.status(400).json({
        success: false,
        message: 'Cannot join consultation: This appointment request was rejected'
      });
    }

    if (appointment.status === 'completed' && appointment.callStatus === 'completed') {
      return res.status(400).json({
        success: false,
        message: 'This consultation has already concluded'
      });
    }

    // Ensure room ID exists on appointment
    if (!appointment.consultationRoomId) {
      appointment.consultationRoomId = `room_${appointment._id}`;
    }

    // Update appointment call status
    if (appointment.callStatus === 'idle') {
      appointment.callStatus = 'in-progress';
      appointment.callStartTime = new Date();
    }
    await appointment.save();

    // Check if consultation record already exists
    let consultation = await Consultation.findOne({ appointment: appointmentId });

    if (!consultation) {
      consultation = await Consultation.create({
        appointment: appointmentId,
        doctor: appointment.doctor._id,
        patient: appointment.patient._id,
        roomId: appointment.consultationRoomId,
        callStatus: 'in-progress',
        startedAt: new Date(),
        participants: [
          {
            user: req.user._id,
            role: req.user.role,
            joinedAt: new Date()
          }
        ]
      });
    } else {
      consultation.callStatus = 'in-progress';
      if (!consultation.startedAt) {
        consultation.startedAt = new Date();
      }
      if (!consultation.roomId) {
        consultation.roomId = appointment.consultationRoomId;
      }

      // Record participant entry if not already logged
      const existingParticipant = consultation.participants.find(
        (p) => p.user && p.user.toString() === req.user._id.toString() && !p.leftAt
      );
      if (!existingParticipant) {
        consultation.participants.push({
          user: req.user._id,
          role: req.user.role,
          joinedAt: new Date()
        });
      }
      await consultation.save();
    }

    return res.json({
      success: true,
      message: 'Consultation session active',
      roomId: appointment.consultationRoomId,
      consultation,
      appointment
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    End consultation session and record doctor notes
// @route   POST /api/consultations/:appointmentId/end
// @access  Private (Doctor only)
exports.endConsultation = async (req, res) => {
  const { appointmentId } = req.params;
  const { notes } = req.body;

  try {
    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Appointment not found' });
    }

    // Only the doctor assigned to the appointment can submit notes and end it
    if (appointment.doctor.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: only the assigned doctor can end this consultation'
      });
    }

    let consultation = await Consultation.findOne({ appointment: appointmentId });

    const now = new Date();
    if (!consultation) {
      consultation = new Consultation({
        appointment: appointmentId,
        doctor: appointment.doctor,
        patient: appointment.patient,
        roomId: appointment.consultationRoomId || `room_${appointment._id}`,
        startedAt: appointment.callStartTime || now
      });
    }

    consultation.notes = notes || '';
    consultation.endedAt = now;
    consultation.callStatus = 'completed';

    // Calculate duration in seconds
    if (consultation.startedAt) {
      consultation.duration = Math.max(
        0,
        Math.round((now.getTime() - new Date(consultation.startedAt).getTime()) / 1000)
      );
    }

    // Mark active participants as left
    if (consultation.participants && consultation.participants.length > 0) {
      consultation.participants.forEach((p) => {
        if (!p.leftAt) p.leftAt = now;
      });
    }

    await consultation.save();

    // Mark appointment as completed
    appointment.status = 'completed';
    appointment.callStatus = 'completed';
    appointment.callEndTime = now;
    await appointment.save();

    return res.json({
      success: true,
      message: 'Consultation completed and notes saved successfully',
      consultation,
      appointment
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get consultation records for an appointment
// @route   GET /api/consultations/:appointmentId
// @access  Private (Patient or Doctor associated with the appointment)
exports.getConsultation = async (req, res) => {
  const { appointmentId } = req.params;

  try {
    const consultation = await Consultation.findOne({ appointment: appointmentId })
      .populate('doctor', 'name email phone')
      .populate('patient', 'name email phone');

    if (!consultation) {
      return res.status(404).json({
        success: false,
        message: 'No consultation records found for this appointment'
      });
    }

    // Verify ownership
    const isPatient = consultation.patient._id.toString() === req.user._id.toString();
    const isDoctor = consultation.doctor._id.toString() === req.user._id.toString();

    if (!isPatient && !isDoctor) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: you are not authorized to view this consultation record'
      });
    }

    return res.json({
      success: true,
      consultation
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
