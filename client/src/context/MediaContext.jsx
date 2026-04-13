import { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { useSocket } from './SocketContext.jsx';
import { useRoom }   from './RoomContext.jsx';
import { EVENTS }    from '../utils/events.js';
import { createPeerConnection } from '../utils/peer.js';
import { createAudioAnalyser }  from '../utils/audioLevel.js';

const MediaContext = createContext(null);

export const useMedia = () => {
  const ctx = useContext(MediaContext);
  if (!ctx) throw new Error('useMedia must be inside MediaProvider');
  return ctx;
};

export function MediaProvider({ children, initialStream = null }) {
  const { socket }                    = useSocket();
  const { roomId, removeParticipant } = useRoom();

  const [localStream,  setLocalStream]  = useState(initialStream);
  const [remoteStreams, setRemoteStreams]= useState(new Map());
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [screenStream, setScreenStream] = useState(null);
  const [isRecording,  setIsRecording]  = useState(false);

  const peerConnections = useRef(new Map());
  const recorderRef     = useRef(null);
  const chunksRef       = useRef([]);
  const cleanupAudio    = useRef(null);
  const localStreamRef  = useRef(initialStream);

  useEffect(() => { localStreamRef.current = localStream; }, [localStream]);

  // Audio analyser on initial stream
  useEffect(() => {
    if (!initialStream || !socket || !roomId) return;
    if (cleanupAudio.current) cleanupAudio.current();
    cleanupAudio.current = createAudioAnalyser(initialStream, (level) => {
      socket.emit(EVENTS.AUDIO_LEVEL, { roomId, level });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const addRemoteStream = useCallback((socketId, stream) => {
    console.log(`[WebRTC] Remote stream received from ${socketId}`);
    setRemoteStreams(prev => new Map(prev).set(socketId, stream));
  }, []);

  const removeRemoteStream = useCallback((socketId) => {
    setRemoteStreams(prev => { const n = new Map(prev); n.delete(socketId); return n; });
  }, []);

  const buildPC = useCallback((targetId) => {
    if (peerConnections.current.has(targetId)) {
      peerConnections.current.get(targetId).close();
    }
    const stream = localStreamRef.current;
    const pc = createPeerConnection({ targetId, socket, roomId, stream, onTrack: addRemoteStream });
    peerConnections.current.set(targetId, pc);
    return pc;
  }, [socket, roomId, addRemoteStream]);

  const getMedia = useCallback(async () => {
    if (localStreamRef.current) return localStreamRef.current;
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: "user" },
      audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true, sampleRate: 48000 }
    });
    localStreamRef.current = stream;
    setLocalStream(stream);
    if (cleanupAudio.current) cleanupAudio.current();
    cleanupAudio.current = createAudioAnalyser(stream, (level) => {
      if (socket && roomId) socket.emit(EVENTS.AUDIO_LEVEL, { roomId, level });
    });
    return stream;
  }, [socket, roomId]);

  const toggleAudio = useCallback(() => {
    const stream = localStreamRef.current;
    if (!stream) return;
    const track = stream.getAudioTracks()[0];
    if (!track) return;
    track.enabled = !track.enabled;
    setAudioEnabled(track.enabled);
    socket?.emit(EVENTS.TOGGLE_AUDIO, { roomId, userId: socket.id, enabled: track.enabled });
  }, [socket, roomId]);

  const toggleVideo = useCallback(() => {
    const stream = localStreamRef.current;
    if (!stream) return;
    const track = stream.getVideoTracks()[0];
    if (!track) return;
    track.enabled = !track.enabled;
    setVideoEnabled(track.enabled);
    socket?.emit(EVENTS.TOGGLE_VIDEO, { roomId, userId: socket.id, enabled: track.enabled });
  }, [socket, roomId]);

  const startScreenShare = useCallback(async () => {
    try {
      const screen = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: false });
      setScreenStream(screen);
      socket?.emit(EVENTS.SCREEN_START, { roomId });
      const videoTrack = screen.getVideoTracks()[0];
      peerConnections.current.forEach(pc => {
        const sender = pc.getSenders().find(s => s.track?.kind === 'video');
        if (sender) sender.replaceTrack(videoTrack);
      });
      videoTrack.onended = () => stopScreenShare();
    } catch (e) {
      console.warn('Screen share cancelled:', e.message);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socket, roomId]);

  const stopScreenShare = useCallback(() => {
    if (!screenStream) return;
    screenStream.getTracks().forEach(t => t.stop());
    setScreenStream(null);
    socket?.emit(EVENTS.SCREEN_STOP, { roomId });
    const cameraTrack = localStreamRef.current?.getVideoTracks()[0];
    peerConnections.current.forEach(pc => {
      const sender = pc.getSenders().find(s => s.track?.kind === 'video');
      if (sender && cameraTrack) sender.replaceTrack(cameraTrack);
    });
  }, [screenStream, socket, roomId]);

  const startRecording = useCallback(() => {
    const stream = localStreamRef.current;
    if (!stream) return;
    chunksRef.current = [];
    try {
      const recorder = new MediaRecorder(stream, { mimeType: 'video/webm;codecs=vp9,opus' });
      recorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      recorder.start(1000);
      recorderRef.current = recorder;
      setIsRecording(true);
      socket?.emit(EVENTS.RECORDING_START, { roomId });
    } catch {
      const recorder = new MediaRecorder(stream);
      recorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      recorder.start(1000);
      recorderRef.current = recorder;
      setIsRecording(true);
    }
  }, [socket, roomId]);

  const stopRecording = useCallback(() => {
    if (!recorderRef.current) return;
    recorderRef.current.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: 'video/webm' });
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href = url; a.download = `recording-${Date.now()}.webm`; a.click();
      URL.revokeObjectURL(url);
    };
    recorderRef.current.stop();
    recorderRef.current = null;
    setIsRecording(false);
    socket?.emit(EVENTS.RECORDING_STOP, { roomId });
  }, [socket, roomId]);

  const leaveRoom = useCallback(() => {
    localStreamRef.current?.getTracks().forEach(t => t.stop());
    screenStream?.getTracks().forEach(t => t.stop());
    peerConnections.current.forEach(pc => pc.close());
    peerConnections.current.clear();
    if (cleanupAudio.current) cleanupAudio.current();
    localStreamRef.current = null;
    setLocalStream(null);
    setScreenStream(null);
    setRemoteStreams(new Map());
  }, [screenStream]);

  // ── WebRTC events ─────────────────────────────────────────
  useEffect(() => {
    if (!socket) return;

    const onUserJoined = async ({ socketId }) => {
      // ✅ CRITICAL FIX: never create a PC to ourselves
      if (socketId === socket.id) return;
      console.log(`[WebRTC] Sending OFFER to ${socketId}`);
      const pc    = buildPC(socketId);
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      socket.emit(EVENTS.OFFER, { offer: pc.localDescription, targetUserId: socketId, roomId });
    };

    const onOffer = async ({ offer, fromUserId }) => {
      console.log(`[WebRTC] OFFER received from ${fromUserId}`);
      const pc = buildPC(fromUserId);
      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      socket.emit(EVENTS.ANSWER, { answer: pc.localDescription, targetUserId: fromUserId, roomId });
    };

    const onAnswer = async ({ answer, fromUserId }) => {
      const pc = peerConnections.current.get(fromUserId);
      if (pc) {
        try { await pc.setRemoteDescription(new RTCSessionDescription(answer)); }
        catch (err) { console.error('[WebRTC] setRemoteDescription error:', err); }
      }
    };

    const onIce = async ({ candidate, fromUserId }) => {
      const pc = peerConnections.current.get(fromUserId);
      if (pc && candidate) {
        try { await pc.addIceCandidate(new RTCIceCandidate(candidate)); } catch {}
      }
    };

    const onUserLeft = ({ socketId }) => {
      const pc = peerConnections.current.get(socketId);
      if (pc) { pc.close(); peerConnections.current.delete(socketId); }
      removeRemoteStream(socketId);
      removeParticipant(socketId);
    };

    socket.on(EVENTS.USER_JOINED, onUserJoined);
    socket.on(EVENTS.OFFER,       onOffer);
    socket.on(EVENTS.ANSWER,      onAnswer);
    socket.on(EVENTS.ICE,         onIce);
    socket.on(EVENTS.USER_LEFT,   onUserLeft);

    return () => {
      socket.off(EVENTS.USER_JOINED, onUserJoined);
      socket.off(EVENTS.OFFER,       onOffer);
      socket.off(EVENTS.ANSWER,      onAnswer);
      socket.off(EVENTS.ICE,         onIce);
      socket.off(EVENTS.USER_LEFT,   onUserLeft);
    };
  }, [socket, roomId, buildPC, removeRemoteStream, removeParticipant]);

  return (
    <MediaContext.Provider value={{
      localStream, remoteStreams,
      audioEnabled, videoEnabled,
      screenStream, isRecording,
      peerConnections,
      getMedia, toggleAudio, toggleVideo,
      startScreenShare, stopScreenShare,
      startRecording, stopRecording,
      leaveRoom,
    }}>
      {children}
    </MediaContext.Provider>
  );
}
