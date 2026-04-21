import { useState, useRef } from 'react';
import { SocketProvider } from './context/SocketContext.jsx';
import { RoomProvider }   from './context/RoomContext.jsx';
import { UIProvider }     from './context/UIContext.jsx';
import { MediaProvider }  from './context/MediaContext.jsx';
import Home        from './pages/Home.jsx';
import Lobby       from './pages/Lobby.jsx';
import WaitingRoom from './pages/WaitingRoom.jsx';
import Room        from './pages/Room.jsx';

function getRouteRoomId() {
  const match = window.location.pathname.match(/\/room\/([^/?#]+)/);
  return match ? match[1] : null;
}

export default function App() {
  const urlRoomId = getRouteRoomId();

  const [screen,   setScreen]   = useState(urlRoomId ? 'home-join' : 'home');
  const [roomId,   setRoomId]   = useState(urlRoomId || '');
  const [userName, setUserName] = useState('');
  const [isHost,   setIsHost]   = useState(false);
  const existingStream = useRef(null);

  const handleJoin = (rid, uname) => {
    setRoomId(rid);
    setUserName(uname);
    setScreen('lobby');
    window.history.replaceState(null, '', `/room/${rid}`);
  };

  // Lobby appelle ceci quand l'user clique Rejoindre/Démarrer
  const handleEnterWaiting = async (stream) => {
    existingStream.current = stream || null;
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';
      const res  = await fetch(`${API_URL}/api/rooms/${roomId}`);
      const data = await res.json();
      // Salle vide ou inexistante = premier arrivant = hôte
      const willBeHost = !data.exists || (data.participantCount ?? 0) === 0;
      setIsHost(willBeHost);
      // ✅ FIX : hôte → room directement, invité → salle d'attente
      setScreen(willBeHost ? 'room' : 'waiting');
    } catch {
      // Erreur réseau : entrer quand même en tant qu'hôte
      setIsHost(true);
      setScreen('room');
    }
  };

  const handleEnterRoom = (stream) => {
    existingStream.current = stream || null;
    setScreen('room');
  };

  const handleLeave = () => {
    existingStream.current = null;
    setRoomId('');
    setUserName('');
    setIsHost(false);
    setScreen('home');
    window.history.replaceState(null, '', '/');
  };

  // ── Accueil ───────────────────────────────────────────────
  if (screen === 'home' || screen === 'home-join') {
    return (
        <Home
            onJoin={handleJoin}
            prefillRoomId={screen === 'home-join' ? roomId : ''}
        />
    );
  }

  // ── Lobby : SocketProvider requis car Lobby utilise useSocket ─
  if (screen === 'lobby') {
    return (
        <SocketProvider>
          <Lobby
              roomId={roomId}
              userName={userName}
              onJoin={handleEnterWaiting}
              onBack={() => {
                setScreen('home');
                window.history.replaceState(null, '', '/');
              }}
          />
        </SocketProvider>
    );
  }

  // ── Salle d'attente (invités uniquement) ──────────────────
  if (screen === 'waiting') {
    return (
        <SocketProvider>
          <WaitingRoom
              roomId={roomId}
              userName={userName}
              isHost={false}
              onJoin={handleEnterRoom}
              onBack={() => setScreen('lobby')}
          />
        </SocketProvider>
    );
  }

  // ── Salle principale ──────────────────────────────────────
  return (
      <SocketProvider>
        <RoomProvider>
          <UIProvider>
            <MediaProvider initialStream={existingStream.current}>
              <Room
                  roomId={roomId}
                  userName={userName}
                  onLeave={handleLeave}
              />
            </MediaProvider>
          </UIProvider>
        </RoomProvider>
      </SocketProvider>
  );
}