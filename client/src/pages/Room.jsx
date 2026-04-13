import { useEffect, useState, useCallback } from 'react';
import { useSocket }     from '../context/SocketContext.jsx';
import { useRoom }       from '../context/RoomContext.jsx';
import { useUI }         from '../context/UIContext.jsx';
import { useMedia }      from '../context/MediaContext.jsx';
import { useWebRTC }     from '../hooks/useWebRTC.js';
import { EVENTS }        from '../utils/events.js';

import VideoGrid         from '../components/video/VideoGrid.jsx';
import ControlBar        from '../components/controls/ControlBar.jsx';
import HostControls      from '../components/controls/HostControls.jsx';
import ReactionBar       from '../components/controls/ReactionBar.jsx';
import ChatSidebar       from '../components/chat/ChatSidebar.jsx';
import ParticipantsPanel from '../components/participants/ParticipantsPanel.jsx';
import Whiteboard        from '../components/layout/Whiteboard.jsx';
import BreakoutPanel     from '../components/layout/BreakoutPanel.jsx';
import ReactionsOverlay  from '../components/layout/ReactionsOverlay.jsx';

// ── Invite banner ─────────────────────────────────────────────
// Uses window.location.origin so it works on ANY deployment:
//   localhost:5173  →  http://localhost:5173/room/xxx
//   Vercel          →  https://videoconferencepro-client.vercel.app/room/xxx
function InviteBanner({ roomId }) {
  const [copied, setCopied] = useState(false);

  // Dynamic: always matches the current host
  const inviteLink = `${window.location.origin}/room/${roomId}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(inviteLink).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  return (
    <div className="bg-blue-950/50 border-b border-blue-900/40 px-4 py-2 flex items-center gap-3 shrink-0">
      <svg viewBox="0 0 24 24" fill="none" stroke="#60a5fa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 shrink-0">
        <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
        <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
      </svg>
      <span className="text-blue-300 text-xs font-mono truncate flex-1 min-w-0 select-all">
        {inviteLink}
      </span>
      <button
        onClick={handleCopy}
        className={`shrink-0 flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all duration-200 ${
          copied
            ? 'bg-green-600 text-white'
            : 'bg-blue-700 hover:bg-blue-600 text-white'
        }`}
      >
        {copied ? (
          <>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-3.5 h-3.5">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
            Copié !
          </>
        ) : (
          <>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
            </svg>
            Copier le lien
          </>
        )}
      </button>
    </div>
  );
}

// ── Room ──────────────────────────────────────────────────────
export default function Room({ roomId, userName, onLeave }) {
  const { socket, connected }       = useSocket();
  const { participants }            = useRoom();
  const { screenStream, leaveRoom } = useMedia();
  const { joinRoom }                = useWebRTC(roomId, userName);

  const [joined,     setJoined]     = useState(false);
  const [kicked,     setKicked]     = useState(false);
  const [showInvite, setShowInvite] = useState(true);

  useEffect(() => {
    if (!connected || joined) return;
    joinRoom().then(() => setJoined(true)).catch(console.error);
  }, [connected, joined, joinRoom]);

  useEffect(() => {
    if (!socket) return;
    socket.on(EVENTS.KICKED, () => setKicked(true));
    return () => socket.off(EVENTS.KICKED);
  }, [socket]);

  const handleLeave = useCallback(() => {
    leaveRoom();
    onLeave();
  }, [leaveRoom, onLeave]);

  if (kicked) {
    return (
      <div className="h-screen bg-gray-950 flex items-center justify-center">
        <div className="bg-gray-900 rounded-2xl p-8 text-center border border-red-800 max-w-sm mx-4">
          <div className="text-5xl mb-4">🚫</div>
          <h2 className="text-white text-xl font-bold mb-2">Vous avez été expulsé</h2>
          <p className="text-gray-400 text-sm mb-6">L'hôte vous a retiré de cette réunion.</p>
          <button onClick={onLeave}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-semibold">
            Retour à l'accueil
          </button>
        </div>
      </div>
    );
  }

  if (!connected) {
    return (
      <div className="h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400 text-sm">Connexion au serveur…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gray-950 flex flex-col overflow-hidden">

      {/* ── Header ── */}
      <div className="bg-gray-900 border-b border-gray-800 px-4 py-2 flex items-center justify-between shrink-0 h-12">
        <div className="flex items-center gap-3">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <svg viewBox="0 0 24 24" fill="none" stroke="#60a5fa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
              <polygon points="23 7 16 12 23 17 23 7"/>
              <rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
            </svg>
            <span className="text-white font-bold text-sm hidden sm:block">VideoConf</span>
          </div>

          <div className="w-px h-5 bg-gray-700 hidden sm:block" />

          {/* Room ID (shortened for display) */}
          <span className="text-gray-500 text-xs font-mono hidden md:block">
            {roomId.slice(0, 8)}…
          </span>

          {/* Participant count */}
          <span className="bg-gray-800 text-gray-300 text-xs px-2 py-0.5 rounded-full">
            {participants.length + 1} participant{participants.length !== 0 ? 's' : ''}
          </span>

          {/* Screen share badge */}
          {screenStream && (
            <span className="flex items-center gap-1.5 bg-red-600/20 border border-red-600/50 text-red-400 text-xs px-3 py-0.5 rounded-full">
              <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse inline-block" />
              Partage actif
            </span>
          )}
        </div>

        {/* Right: host controls + reactions + invite toggle */}
        <div className="flex items-center gap-2">
          <HostControls roomId={roomId} />
          <ReactionBar roomId={roomId} userName={userName} />
          <button
            onClick={() => setShowInvite(v => !v)}
            title="Afficher/masquer le lien d'invitation"
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              showInvite
                ? 'bg-blue-700 text-white'
                : 'bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white'
            }`}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5">
              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
              <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
            </svg>
            <span className="hidden sm:block">Inviter</span>
          </button>
        </div>
      </div>

      {/* ── Invite banner (collapsible) ── */}
      {showInvite && <InviteBanner roomId={roomId} />}

      {/* ── Main area ── */}
      <div className="flex flex-1 overflow-hidden min-h-0">
        <div className="relative flex-1 overflow-hidden bg-gray-950">
          <VideoGrid />
          <ReactionsOverlay />
        </div>
        <ParticipantsPanel roomId={roomId} />
        <ChatSidebar roomId={roomId} userName={userName} userId={socket?.id} />
      </div>

      {/* ── Control bar ── */}
      <div className="shrink-0">
        <ControlBar roomId={roomId} onLeave={handleLeave} />
      </div>

      <Whiteboard    roomId={roomId} />
      <BreakoutPanel roomId={roomId} />
    </div>
  );
}
