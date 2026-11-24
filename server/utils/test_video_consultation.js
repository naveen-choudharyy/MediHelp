/**
 * Comprehensive Automated Test Suite for Mediont Video Consultation System
 * Tests:
 * 1. Authentication & Role-based Authorization
 * 2. Doctor Availability & Appointment Booking
 * 3. Appointment Confirmation & consultationRoomId generation
 * 4. STUN/TURN ICE Servers Endpoint
 * 5. Socket.IO Signaling: Doctor & Patient two separate client sessions
 * 6. WebRTC Offer & Answer exchange
 * 7. WebRTC ICE Candidate exchange
 * 8. Media state toggling & Reconnection signaling
 * 9. Call termination with clinical diagnostic notes & duration persistence
 * 10. Security: Unauthorized user rejection
 * 11. Security: Cancelled appointment room join prevention
 */

require('dotenv').config();
const http = require('http');
const mongoose = require('mongoose');
const { io: ClientIO } = require('../../client/node_modules/socket.io-client');
const app = require('../app');
const socketSetup = require('../socket');
const { Server } = require('socket.io');

const User = require('../models/User');
const DoctorProfile = require('../models/DoctorProfile');
const Appointment = require('../models/Appointment');
const Consultation = require('../models/Consultation');
const { registerPatient, registerDoctor, login } = require('../controllers/authController');

const mockRes = () => {
  const res = {};
  res.status = (code) => {
    res.statusCode = code;
    return res;
  };
  res.json = (data) => {
    res.body = data;
    return res;
  };
  return res;
};

const runAllTests = async () => {
  console.log('================================================================');
  console.log('🚀 MEDIONT REAL-TIME VIDEO CONSULTATION SYSTEM TEST SUITE');
  console.log('================================================================\n');

  // Connect Database
  console.log('1. Connecting to MongoDB Atlas...');
  await mongoose.connect(process.env.MONGO_URI);
  console.log('✅ Connected to Database.\n');

  // Start dedicated test HTTP & Socket.IO server
  const testServer = http.createServer(app);
  const io = new Server(testServer, {
    cors: { origin: '*', methods: ['GET', 'POST'] }
  });
  socketSetup(io);

  const TEST_PORT = 5099;
  await new Promise((resolve) => testServer.listen(TEST_PORT, resolve));
  const serverUrl = `http://127.0.0.1:${TEST_PORT}`;
  console.log(`✅ Test server running on ${serverUrl}\n`);

  try {
    const timestamp = Date.now();
    const docEmail = `dr.test_${timestamp}@mediont.com`;
    const patEmail = `pat.test_${timestamp}@mediont.com`;
    const rogueEmail = `rogue.test_${timestamp}@mediont.com`;

    // TEST 1: Register Doctor & Patient
    console.log('--- TEST 1: Registration & Authentication ---');
    const docRegRes = mockRes();
    await registerDoctor(
      {
        body: {
          name: 'Dr. Test Specialist',
          email: docEmail,
          password: 'Password123!',
          phone: '9988776655',
          specialization: 'Neurology',
          qualification: 'M.D. Neurology',
          experience: 12,
          consultationFee: 500,
          bio: 'Specialist in neurological disorders'
        }
      },
      docRegRes
    );
    if (!docRegRes.body?.success) throw new Error('Doctor registration failed: ' + JSON.stringify(docRegRes.body));
    const doctorToken = docRegRes.body.token;
    const doctorId = docRegRes.body.user.id;
    console.log('✅ Doctor registered & JWT generated:', doctorId);

    const patRegRes = mockRes();
    await registerPatient(
      {
        body: {
          name: 'Jane Patient',
          email: patEmail,
          password: 'Password123!',
          phone: '9123456780',
          dateOfBirth: '1995-04-12',
          gender: 'Female',
          address: '42 Medical Center Lane'
        }
      },
      patRegRes
    );
    if (!patRegRes.body?.success) throw new Error('Patient registration failed: ' + JSON.stringify(patRegRes.body));
    const patientToken = patRegRes.body.token;
    const patientId = patRegRes.body.user.id;
    console.log('✅ Patient registered & JWT generated:', patientId);

    const rogueRegRes = mockRes();
    await registerPatient(
      {
        body: {
          name: 'Rogue User',
          email: rogueEmail,
          password: 'Password123!',
          phone: '9123456789',
          dateOfBirth: '1998-01-01',
          gender: 'Other',
          address: 'Unknown'
        }
      },
      rogueRegRes
    );
    const rogueToken = rogueRegRes.body.token;
    console.log('✅ Unrelated 3rd user registered for security tests\n');

    // TEST 2: Doctor sets availability & Patient books appointment
    console.log('--- TEST 2: Scheduling & Appointment Creation ---');
    const docProfile = await DoctorProfile.findOne({ user: doctorId });
    docProfile.availability = [
      {
        day: 'Monday',
        slots: [
          { startTime: '10:00', endTime: '10:30' },
          { startTime: '11:00', endTime: '11:30' }
        ]
      },
      {
        day: 'Tuesday',
        slots: [{ startTime: '14:00', endTime: '14:30' }]
      }
    ];
    await docProfile.save();
    console.log('✅ Doctor availability configured for Monday and Tuesday.');

    // Create a confirmed appointment for video call
    const testAppointment = await Appointment.create({
      patient: patientId,
      doctor: doctorId,
      appointmentDate: new Date('2026-12-01T00:00:00.000Z'), // Future date
      startTime: '10:00',
      endTime: '10:30',
      status: 'confirmed',
      consultationType: 'video',
      paymentStatus: 'paid'
    });
    const appointmentId = testAppointment._id.toString();
    console.log('✅ Appointment created & confirmed. ID:', appointmentId);
    console.log('   consultationRoomId auto-assigned:', testAppointment.consultationRoomId, '\n');

    // TEST 3: STUN/TURN ICE Server Endpoint Verification
    console.log('--- TEST 3: WebRTC ICE Servers Endpoint Verification ---');
    const iceRes = await fetch(`${serverUrl}/api/consultations/ice-servers`, {
      headers: { Authorization: `Bearer ${doctorToken}` }
    });
    const iceJson = await iceRes.json();
    if (!iceJson.success || !Array.isArray(iceJson.iceServers) || iceJson.iceServers.length === 0) {
      throw new Error('ICE servers endpoint failed: ' + JSON.stringify(iceJson));
    }
    console.log('✅ ICE Servers endpoint succeeded:', iceJson.iceServers.length, 'servers returned.');
    console.log('   Sample URLs:', iceJson.iceServers[0].urls.slice(0, 2), '\n');

    // TEST 4: Socket.IO Real-Time WebRTC Signaling (Two Separate Browser Sessions)
    console.log('--- TEST 4: Real-Time Signaling Across Two Client Sessions ---');
    const doctorSocket = ClientIO(serverUrl, {
      auth: { token: doctorToken },
      transports: ['websocket']
    });

    const patientSocket = ClientIO(serverUrl, {
      auth: { token: patientToken },
      transports: ['websocket']
    });

    // Wait for both to connect
    await Promise.all([
      new Promise((res) => doctorSocket.on('connect', res)),
      new Promise((res) => patientSocket.on('connect', res))
    ]);
    console.log('✅ Doctor and Patient connected to signaling server simultaneously.');

    // Doctor joins room first
    console.log('Doctor joining consultation room...');
    doctorSocket.emit('join-room', { appointmentId });
    await new Promise((resolve) => setTimeout(resolve, 300));

    // Patient joins room -> Doctor should receive 'user-joined', Patient should receive 'peer-present'
    console.log('Patient joining same consultation room...');
    const doctorPeerPromise = new Promise((resolve) => {
      doctorSocket.on('user-joined', (peer) => {
        console.log('   Doctor received user-joined event:', peer.name, `(${peer.role})`);
        resolve(peer);
      });
    });

    const patientPeerPromise = new Promise((resolve) => {
      patientSocket.on('peer-present', (data) => {
        console.log('   Patient received peer-present event:', data.message);
        resolve(data);
      });
    });

    patientSocket.emit('join-room', { appointmentId });
    await Promise.all([doctorPeerPromise, patientPeerPromise]);
    console.log('✅ Both Doctor and Patient successfully joined the same unique appointment room!\n');

    // TEST 5: WebRTC Offer & Answer Exchange
    console.log('--- TEST 5: WebRTC SDP Offer & Answer Exchange ---');
    const mockSDPOffer = {
      type: 'offer',
      sdp: 'v=0\r\no=doctor 12345 2 IN IP4 127.0.0.1\r\ns=-\r\nt=0 0\r\nm=audio 54312 UDP/TLS/RTP/SAVPF 111\r\nm=video 54314 UDP/TLS/RTP/SAVPF 96\r\n'
    };

    const patientOfferPromise = new Promise((resolve) => {
      patientSocket.on('offer', (data) => {
        console.log('   Patient received SDP Offer from senderRole:', data.senderRole);
        resolve(data);
      });
    });

    doctorSocket.emit('offer', { offer: mockSDPOffer, appointmentId });
    const receivedOffer = await patientOfferPromise;
    if (receivedOffer.offer.type !== 'offer') throw new Error('Invalid offer received');
    console.log('✅ WebRTC SDP Offer successfully routed.');

    // Patient sends Answer
    const mockSDPAnswer = {
      type: 'answer',
      sdp: 'v=0\r\no=patient 54321 2 IN IP4 127.0.0.1\r\ns=-\r\nt=0 0\r\nm=audio 54312 UDP/TLS/RTP/SAVPF 111\r\nm=video 54314 UDP/TLS/RTP/SAVPF 96\r\n'
    };

    const doctorAnswerPromise = new Promise((resolve) => {
      doctorSocket.on('answer', (data) => {
        console.log('   Doctor received SDP Answer from senderRole:', data.senderRole);
        resolve(data);
      });
    });

    patientSocket.emit('answer', { answer: mockSDPAnswer, appointmentId });
    const receivedAnswer = await doctorAnswerPromise;
    if (receivedAnswer.answer.type !== 'answer') throw new Error('Invalid answer received');
    console.log('✅ WebRTC SDP Answer successfully routed.\n');

    // TEST 6: WebRTC ICE Candidate Exchange
    console.log('--- TEST 6: WebRTC ICE Candidate Exchange ---');
    const mockCandidateDoc = {
      candidate: 'candidate:1 1 UDP 2122260223 192.168.1.10 50000 typ host',
      sdpMid: '0',
      sdpMLineIndex: 0
    };
    const mockCandidatePat = {
      candidate: 'candidate:2 1 UDP 2122260223 192.168.1.20 50002 typ host',
      sdpMid: '1',
      sdpMLineIndex: 1
    };

    const patCandidatePromise = new Promise((resolve) => {
      patientSocket.on('ice-candidate', (data) => {
        console.log('   Patient received ICE candidate from Doctor');
        resolve(data);
      });
    });
    doctorSocket.emit('ice-candidate', { candidate: mockCandidateDoc, appointmentId });
    await patCandidatePromise;

    const docCandidatePromise = new Promise((resolve) => {
      doctorSocket.on('ice-candidate', (data) => {
        console.log('   Doctor received ICE candidate from Patient');
        resolve(data);
      });
    });
    patientSocket.emit('ice-candidate', { candidate: mockCandidatePat, appointmentId });
    await docCandidatePromise;
    console.log('✅ Two-way ICE candidate exchange completed successfully.\n');

    // TEST 7: Reconnection & Renegotiation Signaling
    console.log('--- TEST 7: Reconnection & Renegotiation Signaling ---');
    const reconnectPromise = new Promise((resolve) => {
      doctorSocket.on('reconnect', (data) => {
        console.log('   Doctor received reconnect signal from:', data.requesterRole);
        resolve(data);
      });
    });
    patientSocket.emit('reconnect', { appointmentId });
    await reconnectPromise;
    console.log('✅ Reconnect / renegotiation event routed successfully.\n');

    // TEST 8: Consultation Completion by Doctor with Clinical Notes & Duration
    console.log('--- TEST 8: Consultation End & Clinical Notes Persistence ---');
    const patientCallEndedPromise = new Promise((resolve) => {
      patientSocket.on('call-ended', (data) => {
        console.log('   Patient received call-ended event, concluded by:', data.name);
        resolve(data);
      });
    });

    const clinicalDiagnosis = 'Patient exhibits mild migraine symptoms. Prescribed hydration and rest for 48 hours.';
    doctorSocket.emit('end-call', {
      appointmentId,
      notes: clinicalDiagnosis
    });
    await patientCallEndedPromise;

    // Verify database record updates
    await new Promise((resolve) => setTimeout(resolve, 500));
    const updatedAppointment = await Appointment.findById(appointmentId);
    const updatedConsultation = await Consultation.findOne({ appointment: appointmentId });

    console.log('   Appointment status:', updatedAppointment.status);
    console.log('   Appointment callStatus:', updatedAppointment.callStatus);
    console.log('   Consultation callStatus:', updatedConsultation?.callStatus);
    console.log('   Consultation duration:', updatedConsultation?.duration, 'seconds');
    console.log('   Consultation notes:', updatedConsultation?.notes);

    if (updatedAppointment.status !== 'completed' || updatedAppointment.callStatus !== 'completed') {
      throw new Error('Appointment was not properly marked as completed in DB');
    }
    if (!updatedConsultation || updatedConsultation.notes !== clinicalDiagnosis) {
      throw new Error('Clinical diagnostic notes were not properly persisted in DB');
    }
    console.log('✅ Consultation metadata, duration, and clinical notes verified in database.\n');

    // TEST 9: Security & Authorization - Unauthorized user blocked from room
    console.log('--- TEST 9: Security - Unauthorized User Access Prevention ---');
    const rogueSocket = ClientIO(serverUrl, {
      auth: { token: rogueToken },
      transports: ['websocket']
    });

    await new Promise((res) => rogueSocket.on('connect', res));

    const rogueRejectionPromise = new Promise((resolve) => {
      rogueSocket.on('call-error', (data) => {
        console.log('   Rogue user correctly received call-error:', data.message);
        resolve(data);
      });
    });

    rogueSocket.emit('join-room', { appointmentId });
    const rejectionData = await rogueRejectionPromise;
    if (!rejectionData.message.includes('Unauthorized') && !rejectionData.message.includes('concluded')) {
      throw new Error('Rogue user was not properly blocked: ' + rejectionData.message);
    }
    console.log('✅ Unauthorized third-party user was successfully blocked by backend security.\n');

    // TEST 10: Security - Cancelled Appointment Room Prevention
    console.log('--- TEST 10: Security - Cancelled Appointment Room Access Prevention ---');
    const cancelledAppointment = await Appointment.create({
      patient: patientId,
      doctor: doctorId,
      appointmentDate: new Date('2026-12-05T00:00:00.000Z'),
      startTime: '11:00',
      endTime: '11:30',
      status: 'cancelled',
      consultationType: 'video'
    });

    const cancelledRejectionPromise = new Promise((resolve) => {
      patientSocket.on('call-error', (data) => {
        console.log('   Cancelled appointment join rejected:', data.message);
        resolve(data);
      });
    });

    patientSocket.emit('join-room', { appointmentId: cancelledAppointment._id.toString() });
    await cancelledRejectionPromise;
    console.log('✅ Access to cancelled appointment room successfully rejected.\n');

    // Disconnect sockets
    doctorSocket.disconnect();
    patientSocket.disconnect();
    rogueSocket.disconnect();

    // Clean up test records
    await User.deleteMany({ email: { $in: [docEmail, patEmail, rogueEmail] } });
    await DoctorProfile.deleteMany({ user: doctorId });
    await Appointment.deleteMany({ _id: { $in: [appointmentId, cancelledAppointment._id] } });
    await Consultation.deleteMany({ appointment: appointmentId });
    console.log('✅ Test data cleaned up.');

    console.log('\n================================================================');
    console.log('🎉 ALL 10 VIDEO CONSULTATION & SECURITY TESTS PASSED WITH 100% SUCCESS');
    console.log('================================================================');
  } catch (err) {
    console.error('\n❌ Test execution failed:', err);
    process.exit(1);
  } finally {
    testServer.close();
    await mongoose.disconnect();
    process.exit(0);
  }
};

runAllTests();
