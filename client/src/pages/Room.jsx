import { useEffect, useState } from 'react';
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

export default function Room({ roomId, userName, onLeave }) {
  const { socket, connected }       = useSocket();
  const { participants }            = useRoom();
  const { screenStream, leaveRoom } = useMedia();
  const { joinRoom }                = useWebRTC(roomId, userName);

  const [joined, setJoined] = useState(false);
  const [kicked, setKicked] = useState(false);

  useEffect(() => {
    if (!connected || joined) return;
    joinRoom().then(() => setJoined(true)).catch(console.error);
  }, [connected, joined, joinRoom]);

  useEffect(() => {
    if (!socket) return;
    socket.on(EVENTS.KICKED, () => setKicked(true));
    return () => socket.off(EVENTS.KICKED);
  }, [socket]);

  const handleLeave = () => { leaveRoom(); onLeave(); };

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
        <div className="text-center text-white">
          <div className="text-5xl mb-4 animate-spin">⏳</div>
          <p>Connexion au serveur…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gray-950 flex flex-col overflow-hidden">

      {/* ── Header ── */}
      <div className="bg-gray-900 border-b border-gray-800 px-4 py-2 flex items-center justify-between shrink-0 h-12">
        <div className="flex items-center gap-3">
          <span className="text-white font-bold text-sm">📹 VideoConf</span>

          {/* Affichage complet du roomId */}
          <span className="text-gray-500 text-xs font-mono hidden sm:block">
      Room ID: {roomId} {/* Affichage complet du roomId */}
    </span>

          <span className="text-gray-400 text-xs hidden sm:block">
      {participants.length + 1} participant{participants.length !== 0 ? 's' : ''}
    </span>

          {/* Indicateur partage actif dans le header */}
          {screenStream && (
              <span className="flex items-center gap-1.5 bg-red-600/20 border border-red-600/50
        text-red-400 text-xs px-3 py-0.5 rounded-full">
        <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse inline-block" />
        Partage actif
      </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <HostControls roomId={roomId} />
          <ReactionBar roomId={roomId} userName={userName} />
        </div>
      </div>

      {/* ── Ajouter le lien de la room à partager pour rejoindre la réunion ── */}
      <div className="bg-gray-800 p-4 rounded-xl mt-4">
        <p className="text-white font-semibold text-sm mb-2">Partager cette salle avec vos invités :</p>
        <a href={`https://videoconferencepro-client.vercel.app/room/${roomId}`} target="_blank" rel="noopener noreferrer"
           className="text-blue-400 hover:text-blue-600 text-lg">
          https://videoconferencepro-client.vercel.app/room/{roomId}  {/* Lien pour rejoindre la room */}
        </a>
      </div>


      {/* ── Zone principale ── */}
      <div className="flex flex-1 overflow-hidden min-h-0">
        <div className="relative flex-1 overflow-hidden bg-gray-950">
          <VideoGrid />
          <ReactionsOverlay />
        </div>
        <ParticipantsPanel roomId={roomId} />
        <ChatSidebar roomId={roomId} userName={userName} userId={socket?.id} />
      </div>

      {/* ── Barre de contrôle ── */}
      <div className="shrink-0">
        <ControlBar roomId={roomId} onLeave={handleLeave} />
      </div>

      <Whiteboard    roomId={roomId} />
      <BreakoutPanel roomId={roomId} />
    </div>
  );
}
