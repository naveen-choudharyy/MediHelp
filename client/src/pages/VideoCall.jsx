import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import { apiRequest, getAuthToken } from '../utils/api';

const DEFAULT_ICE_SERVERS = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
  { urls: 'stun:stun2.l.google.com:19302' }
];

// Helper to create a synthetic video/audio stream for testing in environments without physical media devices
const createSyntheticStream = () => {
  const canvas = document.createElement('canvas');
  canvas.width = 640;
  canvas.height = 480;
  const ctx = canvas.getContext('2d');

  let frame = 0;
  const draw = () => {
    frame++;
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#14b8a6';
    ctx.beginPath();
    ctx.arc(320 + Math.sin(frame * 0.05) * 50, 240, 40, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.font = '20px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Mediont Virtual Feed', 320, 245);
    ctx.font = '14px sans-serif';
    ctx.fillText(new Date().toLocaleTimeString(), 320, 310);
    requestAnimationFrame(draw);
  };
  draw();

  const stream = canvas.captureStream(30);

  // Add silent audio track via Web Audio API if supported
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (AudioContext) {
      const audioCtx = new AudioContext();
      const osc = audioCtx.createOscillator();
      const dst = audioCtx.createMediaStreamDestination();
      const gain = audioCtx.createGain();
      gain.gain.value = 0.001; // nearly silent tone
      osc.connect(gain);
      gain.connect(dst);
      osc.start();
      const audioTrack = dst.stream.getAudioTracks()[0];
      if (audioTrack) stream.addTrack(audioTrack);
    }
  } catch (e) {
    console.warn('AudioContext synth not available:', e);
  }

  return stream;
};

const VideoCall = () => {
  const { appointmentId } = useParams();
  const navigate = useNavigate();

  // Primary data states
  const [appointment, setAppointment] = useState(null);
  const [userRole, setUserRole] = useState(''); // 'doctor' or 'patient'
  const [_currentUserId, setCurrentUserId] = useState('');
  const [loading, setLoading] = useState(true);
  const [fatalError, setFatalError] = useState('');

  // Call lifecycle state:
  // 'INITIALIZING' | 'PRE_CALL_CHECK' | 'WAITING' | 'CONNECTING' | 'CONNECTED' | 'RECONNECTING' | 'ENDED' | 'PERMISSION_DENIED'
  const [callState, setCallState] = useState('INITIALIZING');
  const [statusMessage, setStatusMessage] = useState('Checking permissions and devices...');
  const [peerConnected, setPeerConnected] = useState(false);
  const [_remotePeerInfo, setRemotePeerInfo] = useState(null);

  // Permission Diagnostics & Device Health
  const [_permissionStatus, setPermissionStatus] = useState({
    isSecure: typeof window !== 'undefined' ? window.isSecureContext : true,
    camera: 'prompt', // 'granted' | 'denied' | 'prompt' | 'unavailable'
    microphone: 'prompt',
    hasMediaDevices: typeof navigator !== 'undefined' && !!navigator.mediaDevices,
    detectedError: null
  });
  const [mediaMode, setMediaMode] = useState('full'); // 'full' | 'audio-only' | 'video-only' | 'synthetic'

  // Audio & Video track states
  const [micEnabled, setMicEnabled] = useState(true);
  const [cameraEnabled, setCameraEnabled] = useState(true);
  const [facingMode, setFacingMode] = useState('user'); // 'user' | 'environment'
  const [hasMultipleCameras, setHasMultipleCameras] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Duration Timer
  const [callDuration, setCallDuration] = useState(0);
  const callDurationRef = useRef(0);
  callDurationRef.current = callDuration;

  // Doctor Clinical Notes
  const [clinicalNotes, setClinicalNotes] = useState('');
  const [notesSaving, setNotesSaving] = useState(false);
  const [callSummary, setCallSummary] = useState(null);

  // References
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const localStreamRef = useRef(null);
  const remoteStreamRef = useRef(null);
  const socketRef = useRef(null);
  const pcRef = useRef(null);
  const iceServersRef = useRef(DEFAULT_ICE_SERVERS);
  const pendingCandidatesRef = useRef([]);
  const makingOfferRef = useRef(false);
  const isPoliteRef = useRef(false);
  const videoAreaRef = useRef(null);
  const timerIntervalRef = useRef(null);
  const isMountedRef = useRef(true);

  // Format seconds to MM:SS
  const formatDuration = (totalSeconds) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Timer helpers
  const startTimer = useCallback(() => {
    if (!timerIntervalRef.current) {
      timerIntervalRef.current = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
    }
  }, []);

  const stopTimer = useCallback(() => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
  }, []);

  // Cleanup all media tracks and socket sessions cleanly
  const cleanUpSession = useCallback(() => {
    stopTimer();

    // Stop and release camera/microphone hardware
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch (e) {
          console.warn('Error stopping local track:', e);
        }
      });
      localStreamRef.current = null;
    }

    if (localVideoRef.current) {
      localVideoRef.current.srcObject = null;
    }

    // Close WebRTC peer connection
    if (pcRef.current) {
      try {
        pcRef.current.close();
      } catch (e) {
        console.warn('Error closing peer connection:', e);
      }
      pcRef.current = null;
    }

    if (remoteStreamRef.current) {
      remoteStreamRef.current.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch (e) {
          console.warn('Error stopping remote track:', e);
        }
      });
      remoteStreamRef.current = null;
    }

    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = null;
    }

    // Leave socket room and disconnect
    if (socketRef.current) {
      try {
        socketRef.current.emit('leave-room', { appointmentId });
        socketRef.current.disconnect();
      } catch (e) {
        console.warn('Error disconnecting socket:', e);
      }
      socketRef.current = null;
    }

    pendingCandidatesRef.current = [];
    setPeerConnected(false);
  }, [appointmentId, stopTimer]);

  // Drain queued early-arrival ICE candidates
  const drainPendingCandidates = async (pcInstance) => {
    const pc = pcInstance || pcRef.current;
    if (!pc || !pc.remoteDescription) return;

    while (pendingCandidatesRef.current.length > 0) {
      const candidate = pendingCandidatesRef.current.shift();
      try {
        if (pc.signalingState !== 'closed') {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        }
      } catch (err) {
        console.warn('Error adding queued ICE candidate:', err.message);
      }
    }
  };

  // Helper to attach stream to video elements safely
  const bindStreamToElement = (videoElem, stream) => {
    if (!videoElem || !stream) return;
    if (videoElem.srcObject !== stream) {
      videoElem.srcObject = stream;
    }
    videoElem.play().catch((err) => {
      console.warn('Autoplay prevented or stream muted:', err.message);
    });
  };

  // Diagnostic helper to query browser permissions
  const queryBrowserPermissions = useCallback(async () => {
    const isSecure = window.isSecureContext;
    const hasMedia = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
    let camStatus = 'prompt';
    let micStatus = 'prompt';

    if (navigator.permissions && navigator.permissions.query) {
      try {
        const cam = await navigator.permissions.query({ name: 'camera' });
        camStatus = cam.state;
        cam.onchange = () => queryBrowserPermissions();
      } catch {
        camStatus = 'prompt';
      }
      try {
        const mic = await navigator.permissions.query({ name: 'microphone' });
        micStatus = mic.state;
        mic.onchange = () => queryBrowserPermissions();
      } catch {
        micStatus = 'prompt';
      }
    }

    setPermissionStatus((prev) => ({
      ...prev,
      isSecure,
      hasMediaDevices: hasMedia,
      camera: camStatus,
      microphone: micStatus
    }));

    return { isSecure, hasMedia, camStatus, micStatus };
  }, []);

  // 1. Fetch Appointment and Auth Profile
  useEffect(() => {
    isMountedRef.current = true;

    const loadAppointmentData = async () => {
      try {
        setLoading(true);
        queryBrowserPermissions();

        const [appData, meData] = await Promise.all([
          apiRequest(`/appointments/${appointmentId}`),
          apiRequest('/auth/me')
        ]);

        if (!isMountedRef.current) return;

        if (appData.success && meData.success) {
          const apt = appData.appointment;
          const user = meData.user;
          setAppointment(apt);
          setUserRole(user.role);
          setCurrentUserId(user._id);

          // Patient is polite peer; Doctor is impolite peer
          isPoliteRef.current = user.role === 'patient';

          // Validate appointment status
          if (apt.status === 'cancelled') {
            setFatalError('This appointment has been cancelled. Video consultation is not accessible.');
            setCallState('ENDED');
            return;
          }
          if (apt.status === 'rejected') {
            setFatalError('This appointment request was rejected.');
            setCallState('ENDED');
            return;
          }
          if (apt.status === 'completed' && apt.callStatus === 'completed') {
            setFatalError('This video consultation has already concluded.');
            setCallState('ENDED');
            return;
          }

          // Fetch dynamic ICE servers from backend
          try {
            const iceData = await apiRequest('/consultations/ice-servers');
            if (iceData.success && Array.isArray(iceData.iceServers) && iceData.iceServers.length > 0) {
              iceServersRef.current = iceData.iceServers;
            }
          } catch (e) {
            console.warn('Using fallback STUN servers:', e.message);
          }
        } else {
          setFatalError('Could not verify consultation access credentials.');
        }
      } catch (err) {
        if (isMountedRef.current) {
          setFatalError(err.message || 'Access denied: Unable to join consultation.');
        }
      } finally {
        if (isMountedRef.current) {
          setLoading(false);
        }
      }
    };

    loadAppointmentData();

    return () => {
      isMountedRef.current = false;
    };
  }, [appointmentId, queryBrowserPermissions]);

  // Check for multi-camera support
  useEffect(() => {
    const checkVideoDevices = async () => {
      try {
        if (navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
          const devices = await navigator.mediaDevices.enumerateDevices();
          const videoInputs = devices.filter((d) => d.kind === 'videoinput');
          if (videoInputs.length > 1) {
            setHasMultipleCameras(true);
          }
        }
      } catch (e) {
        console.warn('Could not enumerate media devices:', e);
      }
    };
    checkVideoDevices();
  }, []);

  // Resilient media acquisition with smooth fallbacks
  const acquireMediaStream = useCallback(async (forcedMode = null) => {
    // If synthetic mode explicitly selected or mediaDevices not available
    if (forcedMode === 'synthetic') {
      const synthStream = createSyntheticStream();
      setMediaMode('synthetic');
      return synthStream;
    }

    // If audio-only mode selected
    if (forcedMode === 'audio-only') {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        setMediaMode('audio-only');
        setCameraEnabled(false);
        return audioStream;
      }
      return createSyntheticStream();
    }

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      console.warn('getUserMedia not supported in this environment, using virtual feed fallback');
      const fallbackStream = createSyntheticStream();
      setMediaMode('synthetic');
      return fallbackStream;
    }

    // Try Video + Audio directly
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });
      setMediaMode('full');
      setPermissionStatus((prev) => ({ ...prev, camera: 'granted', microphone: 'granted', detectedError: null }));
      return stream;
    } catch (primaryErr) {
      console.warn('Video+Audio capture encountered:', primaryErr.name);

      // If user denied or hardware blocked, try audio only
      try {
        const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        setMediaMode('audio-only');
        setCameraEnabled(false);
        return audioStream;
      } catch {
        console.warn('Audio capture failed, falling back to virtual testing stream');
        // Fallback to virtual stream so call still functions without crashing
        const synthStream = createSyntheticStream();
        setMediaMode('synthetic');
        return synthStream;
      }
    }
  }, []);

  // Main Call Initializer triggered after appointment & auth are verified
  const startCallSession = useCallback(async (forcedMode = null) => {
    let localSocket = null;

    try {
      setCallState('INITIALIZING');
      setStatusMessage('Acquiring camera & microphone...');

      let mediaStream = null;
      try {
        mediaStream = await acquireMediaStream(forcedMode);
      } catch (mediaErr) {
        console.error('Media capture error:', mediaErr);
        if (!isMountedRef.current) return;
        setCallState('PERMISSION_DENIED');
        return;
      }

      if (!isMountedRef.current) {
        mediaStream.getTracks().forEach((t) => t.stop());
        return;
      }

      localStreamRef.current = mediaStream;
      bindStreamToElement(localVideoRef.current, mediaStream);

      // Initialize RTCPeerConnection
      const pc = new RTCPeerConnection({
        iceServers: iceServersRef.current
      });
      pcRef.current = pc;

      // Add local media tracks to peer connection
      mediaStream.getTracks().forEach((track) => {
        pc.addTrack(track, mediaStream);
      });

      // Connect to Socket.IO signaling server
      setStatusMessage('Connecting to real-time consultation server...');
      const token = getAuthToken();
      const socketUrl = import.meta.env.VITE_SOCKET_URL || window.location.origin;

      const socket = io(socketUrl, {
        auth: { token },
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000
      });
      socketRef.current = socket;
      localSocket = socket;

      // WebRTC ICE candidate emission
      pc.onicecandidate = (event) => {
        if (event.candidate && socketRef.current) {
          socketRef.current.emit('ice-candidate', {
            candidate: event.candidate,
            appointmentId
          });
        }
      };

      // Remote media track arrival
      pc.ontrack = (event) => {
        console.log('[WebRTC] Remote track received:', event.track.kind);
        let remoteStream = remoteStreamRef.current;
        if (!remoteStream) {
          remoteStream = event.streams && event.streams[0] ? event.streams[0] : new MediaStream();
          remoteStreamRef.current = remoteStream;
        }

        if (!remoteStream.getTracks().find((t) => t.id === event.track.id)) {
          remoteStream.addTrack(event.track);
        }

        bindStreamToElement(remoteVideoRef.current, remoteStream);
        setPeerConnected(true);
        setCallState('CONNECTED');
        setStatusMessage('Consultation in progress');
        startTimer();
      };

      // Monitor connection states
      pc.onconnectionstatechange = () => {
        console.log('[WebRTC] Connection state:', pc.connectionState);
        if (pc.connectionState === 'connected') {
          setCallState('CONNECTED');
          setPeerConnected(true);
          setStatusMessage('Consultation in progress');
          startTimer();
        } else if (pc.connectionState === 'disconnected') {
          setCallState('RECONNECTING');
          setStatusMessage('Participant disconnected. Reconnecting...');
        } else if (pc.connectionState === 'failed') {
          setCallState('RECONNECTING');
          setStatusMessage('Connection failed. Re-initiating WebRTC ICE...');
          try {
            pc.restartIce();
          } catch (e) {
            console.warn('ICE restart error:', e);
          }
        }
      };

      pc.oniceconnectionstatechange = () => {
        console.log('[WebRTC] ICE state:', pc.iceConnectionState);
        if (pc.iceConnectionState === 'connected' || pc.iceConnectionState === 'completed') {
          setCallState('CONNECTED');
          setPeerConnected(true);
        } else if (pc.iceConnectionState === 'disconnected') {
          setCallState('RECONNECTING');
          setStatusMessage('Network lag detected...');
        }
      };

      // Perfect Negotiation: onnegotiationneeded
      pc.onnegotiationneeded = async () => {
        try {
          console.log('[WebRTC] Negotiation needed. Creating offer...');
          makingOfferRef.current = true;
          await pc.setLocalDescription();
          socket.emit('offer', {
            offer: pc.localDescription,
            appointmentId
          });
        } catch (err) {
          console.error('[WebRTC] Negotiation error:', err);
        } finally {
          makingOfferRef.current = false;
        }
      };

      // ==================== SOCKET SIGNALING LISTENERS ====================

      socket.on('connect', async () => {
        console.log('[Socket] Connected with ID:', socket.id);
        try {
          await apiRequest(`/consultations/${appointmentId}/start`, { method: 'POST' });
        } catch (err) {
          console.warn('Start timestamp error:', err.message);
        }
        socket.emit('join-room', { appointmentId });
        setCallState('WAITING');
        setStatusMessage('Waiting for other participant to join...');
      });

      // Remote peer joined
      socket.on('user-joined', (peer) => {
        console.log('[Socket] Peer joined:', peer.name, `(${peer.role})`);
        setRemotePeerInfo(peer);
        setStatusMessage(`${peer.name} (${peer.role}) joined room. Connecting...`);
        setCallState('CONNECTING');
      });

      // Remote peer was already in room
      socket.on('peer-present', (data) => {
        console.log('[Socket] Remote peer already in room:', data);
        setStatusMessage('Other participant is in room. Establishing connection...');
        setCallState('CONNECTING');
      });

      // Incoming SDP Offer
      socket.on('offer', async ({ offer, _senderId, senderRole }) => {
        console.log('[WebRTC] Received SDP Offer from', senderRole);
        try {
          const offerCollision = makingOfferRef.current || pc.signalingState !== 'stable';
          const ignoreOffer = !isPoliteRef.current && offerCollision;

          if (ignoreOffer) {
            console.log('[WebRTC] Glare detected: Impolite peer ignoring offer');
            return;
          }

          await pc.setRemoteDescription(new RTCSessionDescription(offer));
          await drainPendingCandidates(pc);

          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);

          socket.emit('answer', {
            answer,
            appointmentId
          });
        } catch (err) {
          console.error('[WebRTC] Error handling offer:', err);
        }
      });

      // Incoming SDP Answer
      socket.on('answer', async ({ answer }) => {
        console.log('[WebRTC] Received SDP Answer');
        try {
          await pc.setRemoteDescription(new RTCSessionDescription(answer));
          await drainPendingCandidates(pc);
        } catch (err) {
          console.error('[WebRTC] Error handling answer:', err);
        }
      });

      // Incoming ICE Candidate
      socket.on('ice-candidate', async ({ candidate }) => {
        try {
          if (pc.remoteDescription && pc.remoteDescription.type) {
            await pc.addIceCandidate(new RTCIceCandidate(candidate));
          } else {
            pendingCandidatesRef.current.push(candidate);
          }
        } catch (err) {
          console.warn('[WebRTC] ICE candidate error:', err.message);
        }
      });

      // Peer requested renegotiation
      socket.on('reconnect', async () => {
        console.log('[Socket] Peer requested renegotiation');
        if (pcRef.current) {
          try {
            pcRef.current.restartIce();
          } catch (e) {
            console.warn('ICE restart error:', e);
          }
        }
      });

      // Remote peer left
      socket.on('user-left', (peer) => {
        console.log('[Socket] Peer left:', peer.name);
        setPeerConnected(false);
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = null;
        }
        remoteStreamRef.current = null;
        setCallState('WAITING');
        setStatusMessage(`${peer.name || 'Participant'} disconnected. Waiting for re-entry...`);
      });

      // Call ended by doctor or session closed
      socket.on('call-ended', (data) => {
        console.log('[Socket] Call concluded:', data);
        setCallSummary({
          endedBy: data.name || 'Doctor',
          duration: callDurationRef.current,
          timestamp: new Date().toLocaleTimeString()
        });
        setCallState('ENDED');
        cleanUpSession();
      });

      // Backend room / authorization error
      socket.on('call-error', (data) => {
        console.error('[Socket] Call error:', data.message);
        setFatalError(data.message || 'Consultation room error');
        setCallState('ENDED');
        cleanUpSession();
      });

      socket.on('connect_error', (err) => {
        console.error('[Socket] Connection error:', err.message);
        setStatusMessage('Connecting to signaling network...');
      });

    } catch (err) {
      console.error('Call initialization failed:', err);
      if (isMountedRef.current) {
        setFatalError(err.message || 'Failed to initialize video consultation.');
        setCallState('ENDED');
      }
    }

    return localSocket;
  }, [acquireMediaStream, appointmentId, cleanUpSession, startTimer]);

  // Trigger call startup when appointment is loaded
  useEffect(() => {
    if (!appointment || !userRole || fatalError) return;

    let localSocket = null;
    startCallSession().then((sock) => {
      localSocket = sock;
    });

    return () => {
      if (localSocket) {
        localSocket.emit('leave-room', { appointmentId });
        localSocket.disconnect();
      }
      cleanUpSession();
    };
  }, [appointment, userRole, fatalError, appointmentId, cleanUpSession, startCallSession]);

  // Re-bind remote stream when remote video element mounts
  useEffect(() => {
    if (peerConnected && remoteVideoRef.current && remoteStreamRef.current) {
      bindStreamToElement(remoteVideoRef.current, remoteStreamRef.current);
    }
  }, [peerConnected]);

  // Toggle Microphone
  const toggleMute = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setMicEnabled(audioTrack.enabled);
      }
    }
  };

  // Toggle Camera
  const toggleVideo = () => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setCameraEnabled(videoTrack.enabled);
      }
    }
  };

  // Switch Camera (Front/Back)
  const switchCamera = async () => {
    if (!hasMultipleCameras || !localStreamRef.current) return;
    try {
      const newFacingMode = facingMode === 'user' ? 'environment' : 'user';
      const newStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: newFacingMode },
        audio: false
      });
      const newVideoTrack = newStream.getVideoTracks()[0];

      if (pcRef.current) {
        const senders = pcRef.current.getSenders();
        const videoSender = senders.find((s) => s.track && s.track.kind === 'video');
        if (videoSender) {
          await videoSender.replaceTrack(newVideoTrack);
        }
      }

      const oldTrack = localStreamRef.current.getVideoTracks()[0];
      if (oldTrack) oldTrack.stop();

      localStreamRef.current.removeTrack(oldTrack);
      localStreamRef.current.addTrack(newVideoTrack);

      setFacingMode(newFacingMode);
      bindStreamToElement(localVideoRef.current, localStreamRef.current);
    } catch (err) {
      console.warn('Could not switch camera:', err);
    }
  };

  // Toggle Fullscreen mode
  const toggleFullscreen = () => {
    if (!videoAreaRef.current) return;
    if (!document.fullscreenElement) {
      videoAreaRef.current.requestFullscreen().catch((err) => {
        console.warn('Error attempting fullscreen:', err.message);
      });
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch((err) => {
        console.warn('Error exiting fullscreen:', err.message);
      });
      setIsFullscreen(false);
    }
  };

  // End Call Handler
  const handleEndCall = async () => {
    if (userRole === 'doctor') {
      if (window.confirm('End this consultation and save diagnosis / clinical notes?')) {
        setNotesSaving(true);
        try {
          await apiRequest(`/consultations/${appointmentId}/end`, {
            method: 'POST',
            body: { notes: clinicalNotes }
          });

          if (socketRef.current) {
            socketRef.current.emit('end-call', { appointmentId, notes: clinicalNotes });
          }

          setCallSummary({
            endedBy: 'You (Doctor)',
            duration: callDurationRef.current,
            notes: clinicalNotes,
            timestamp: new Date().toLocaleTimeString()
          });
          setCallState('ENDED');
          cleanUpSession();
        } catch (err) {
          alert('Failed to complete consultation: ' + err.message);
        } finally {
          setNotesSaving(false);
        }
      }
    } else {
      // Patient leaving
      if (window.confirm('Are you sure you want to exit the video consultation?')) {
        if (socketRef.current) {
          socketRef.current.emit('leave-room', { appointmentId });
        }
        setCallSummary({
          endedBy: 'You (Patient)',
          duration: callDurationRef.current,
          timestamp: new Date().toLocaleTimeString()
        });
        setCallState('ENDED');
        cleanUpSession();
      }
    }
  };

  // Retry permissions callback
  const handleRetryPermissions = (forcedMode = null) => {
    setFatalError('');
    cleanUpSession();
    startCallSession(forcedMode);
  };

  // ==================== RENDER VIEWS ====================

  if (loading) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
        <div className="pulse-indicator" style={{ margin: '0 auto 1.5rem' }} />
        <h2>Connecting to Consultation Room...</h2>
        <p style={{ color: 'var(--text-muted)' }}>Verifying appointment authorization and clinical credentials</p>
      </div>
    );
  }

  // Permission Denied View & Troubleshooter
  if (callState === 'PERMISSION_DENIED') {
    return (
      <div className="card" style={{ maxWidth: '620px', margin: '2rem auto', textAlign: 'center', padding: '2.5rem' }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📹</div>
        <h2 style={{ marginBottom: '0.75rem' }}>Camera & Microphone Setup</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
          Please allow camera and microphone access when prompted by your browser to start your video call.
        </p>

        {/* Action Buttons with Fallback Modes */}
        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button onClick={() => handleRetryPermissions()} className="btn btn-primary">
            Retry Camera & Microphone
          </button>
          <button onClick={() => handleRetryPermissions('audio-only')} className="btn btn-secondary">
            Continue with Audio Only
          </button>
          <button
            onClick={() => handleRetryPermissions('synthetic')}
            className="btn btn-secondary"
            title="Use synthetic simulated feed for testing without physical webcam"
          >
            Test with Virtual Camera
          </button>
          <button onClick={() => navigate(-1)} className="btn btn-secondary">
            Exit
          </button>
        </div>
      </div>
    );
  }

  // Call Ended / Summary View
  if (callState === 'ENDED') {
    return (
      <div className="card" style={{ maxWidth: '600px', margin: '2rem auto', textAlign: 'center', padding: '2.5rem' }}>
        <div style={{ fontSize: '3.5rem', marginBottom: '1rem' }}>✅</div>
        <h2>Consultation Concluded</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
          {fatalError ? fatalError : 'The video consultation session has ended.'}
        </p>

        {callSummary && (
          <div style={{ backgroundColor: 'var(--bg-muted)', borderRadius: '6px', padding: '1.25rem', textAlign: 'left', marginBottom: '1.5rem', fontSize: '0.95rem' }}>
            <div style={{ marginBottom: '0.5rem' }}>
              <strong>Appointment ID:</strong> #{appointmentId.substring(appointmentId.length - 8)}
            </div>
            <div style={{ marginBottom: '0.5rem' }}>
              <strong>Duration:</strong> {formatDuration(callSummary.duration || callDuration)}
            </div>
            <div style={{ marginBottom: '0.5rem' }}>
              <strong>Concluded By:</strong> {callSummary.endedBy}
            </div>
            {callSummary.notes && (
              <div style={{ marginTop: '0.75rem', borderTop: '1px solid var(--border)', paddingTop: '0.75rem' }}>
                <strong>Clinical Diagnosis / Notes:</strong>
                <p style={{ whiteSpace: 'pre-wrap', marginTop: '0.25rem', color: 'var(--text-main)' }}>{callSummary.notes}</p>
              </div>
            )}
          </div>
        )}

        <button
          onClick={() => navigate(userRole === 'doctor' ? '/doctor/dashboard' : '/patient/dashboard')}
          className="btn btn-primary"
          style={{ width: '100%' }}
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  // Fatal Error View
  if (fatalError) {
    return (
      <div className="alert-banner alert-banner-error" style={{ maxWidth: '650px', margin: '2rem auto' }}>
        <h3>Consultation Notice</h3>
        <p>{fatalError}</p>
        <button onClick={() => navigate(-1)} className="btn btn-secondary" style={{ marginTop: '1rem' }}>
          Back to Dashboard
        </button>
      </div>
    );
  }

  const otherPersonName =
    userRole === 'doctor'
      ? appointment?.patient?.name || 'Patient'
      : `Dr. ${appointment?.doctor?.name || 'Doctor'}`;

  return (
    <div style={{ paddingBottom: '2rem' }}>
      {/* Top Header Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <h2 style={{ margin: 0 }}>
            Consultation with {otherPersonName}
          </h2>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Room ID: #{appointmentId.substring(appointmentId.length - 8)} &bull; Scheduled: {appointment?.startTime} - {appointment?.endTime}
            {mediaMode !== 'full' && ` (${mediaMode} mode)`}
          </span>
        </div>

        {/* Live Call Duration & Status Badges */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div
            className={`status-pill ${
              callState === 'CONNECTED'
                ? 'status-pill-connected'
                : callState === 'RECONNECTING'
                ? 'status-pill-reconnecting'
                : 'status-pill-waiting'
            }`}
          >
            <span className="dot" />
            {callState === 'CONNECTED' ? 'Live Connected' : callState === 'RECONNECTING' ? 'Reconnecting' : 'Waiting'}
          </div>

          <div className="call-duration-timer">
            ⏱️ {formatDuration(callDuration)}
          </div>
        </div>
      </div>

      {/* Main Video Layout */}
      <div className="video-consultation-layout">
        {/* Video Area */}
        <div className="video-call-area" ref={videoAreaRef}>
          {/* Status Message Overlay */}
          <div className="connection-status-overlay">
            {statusMessage}
          </div>

          {/* Video Grid */}
          <div className={`video-grid ${peerConnected ? 'peer-connected' : ''}`}>
            {/* Local Video Feed */}
            <div className="video-container">
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                style={{ transform: facingMode === 'user' ? 'scaleX(-1)' : 'none' }}
              />
              {(!cameraEnabled || mediaMode === 'audio-only') && (
                <div className="camera-off-overlay">
                  <span>{mediaMode === 'audio-only' ? '🎙️ Audio-Only Mode' : '📹 Camera Off'}</span>
                </div>
              )}
              <div className="video-label">
                You ({userRole === 'doctor' ? 'Doctor' : 'Patient'}) {!micEnabled && '🔇'}
              </div>
            </div>

            {/* Remote Video Feed (when peer connected) */}
            {peerConnected ? (
              <div className="video-container">
                <video ref={remoteVideoRef} autoPlay playsInline />
                <div className="video-label">
                  {otherPersonName}
                </div>
              </div>
            ) : (
              /* Waiting Screen when remote participant hasn't joined yet */
              <div className="video-container waiting-screen">
                <div className="waiting-content">
                  <div className="pulse-indicator" />
                  <h4>Waiting for {otherPersonName}</h4>
                  <p>
                    {userRole === 'patient'
                      ? 'Dr. will join your secure consultation room shortly. Please remain on this screen.'
                      : 'The patient has been notified. Live video feed will start automatically upon connection.'}
                  </p>
                  <span className="security-tag">🔒 End-to-End Encrypted Peer-to-Peer WebRTC</span>
                </div>
              </div>
            )}
          </div>

          {/* Video Controls Bar */}
          <div className="call-controls-bar">
            {/* Mic Button */}
            <button
              onClick={toggleMute}
              className={`control-btn ${!micEnabled ? 'active' : ''}`}
              title={micEnabled ? 'Mute Microphone' : 'Unmute Microphone'}
              aria-label="Toggle Microphone"
            >
              {micEnabled ? '🎙️' : '🔇'}
            </button>

            {/* Camera Button */}
            <button
              onClick={toggleVideo}
              className={`control-btn ${!cameraEnabled ? 'active' : ''}`}
              title={cameraEnabled ? 'Turn Off Camera' : 'Turn On Camera'}
              aria-label="Toggle Camera"
            >
              {cameraEnabled ? '📹' : '🚫'}
            </button>

            {/* Switch Camera (if multi-camera device) */}
            {hasMultipleCameras && (
              <button
                onClick={switchCamera}
                className="control-btn"
                title="Switch Camera (Front/Rear)"
                aria-label="Switch Camera"
              >
                🔄
              </button>
            )}

            {/* Fullscreen Button */}
            <button
              onClick={toggleFullscreen}
              className="control-btn"
              title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
              aria-label="Toggle Fullscreen"
            >
              {isFullscreen ? '🗗' : '⛶'}
            </button>

            {/* End Call Button */}
            <button
              onClick={handleEndCall}
              className="control-btn active end-call-btn"
              title={userRole === 'doctor' ? 'Save Notes & End Consultation' : 'Leave Consultation'}
              aria-label="End Call"
            >
              📞
            </button>
          </div>
        </div>

        {/* Sidebar Panel */}
        <div className="call-sidebar">
          {/* Appointment Meta Card */}
          <div className="card" style={{ margin: 0 }}>
            <h3>Appointment Details</h3>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', margin: 0 }}>
              <strong>Date:</strong> {new Date(appointment?.appointmentDate).toLocaleDateString(undefined, { timeZone: 'UTC' })}
              <br />
              <strong>Time Slot:</strong> {appointment?.startTime} - {appointment?.endTime}
              <br />
              <strong>Participant:</strong> {otherPersonName}
            </p>
          </div>

          {/* Doctor: Diagnostic Notes / Patient: Medical Guidelines */}
          {userRole === 'doctor' ? (
            <div className="card" style={{ margin: 0, flex: 1, display: 'flex', flexDirection: 'column' }}>
              <h3>Clinical Diagnosis & Notes</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                Record clinical evaluation, prescriptions, and recommended care. Saved to the patient's record when consultation concludes.
              </p>
              <textarea
                value={clinicalNotes}
                onChange={(e) => setClinicalNotes(e.target.value)}
                placeholder="Enter medical observations, diagnosis, prescriptions, or follow-up instructions..."
                style={{ flex: 1, marginTop: '0.75rem', minHeight: '180px', resize: 'vertical' }}
              />
              <button
                onClick={handleEndCall}
                className="btn btn-danger"
                style={{ width: '100%', marginTop: '1rem' }}
                disabled={notesSaving}
              >
                {notesSaving ? 'Completing Consultation...' : 'Complete & Save Notes'}
              </button>
            </div>
          ) : (
            <div className="card" style={{ margin: 0, flex: 1, backgroundColor: 'var(--bg-muted)', border: 'none' }}>
              <h3>Consultation Instructions</h3>
              <ul style={{ fontSize: '0.85rem', color: 'var(--text-muted)', paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                <li>Ensure you are in a quiet, well-lit environment.</li>
                <li>Keep your microphone unmuted when addressing your doctor.</li>
                <li>Your video and audio streams are transmitted directly peer-to-peer using WebRTC encryption.</li>
                <li>After the consultation, your doctor's diagnostic notes will appear on your appointments dashboard.</li>
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VideoCall;
