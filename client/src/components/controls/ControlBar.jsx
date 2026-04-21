import { useMedia }       from '../../context/MediaContext.jsx';
import { useRoom }        from '../../context/RoomContext.jsx';
import { useUI }          from '../../context/UIContext.jsx';
import { useScreenShare } from '../../hooks/useScreenShare.js';
import { useRecording }   from '../../hooks/useRecording.js';
import ReactionBar        from './ReactionBar.jsx';

// ── SVG Icons ─────────────────────────────────────────────────
const IconMicOn = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
         strokeLinecap="round" strokeLinejoin="round" className="w-7 h-7">
        <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
        <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
        <line x1="12" y1="19" x2="12" y2="23"/>
        <line x1="8" y1="23" x2="16" y2="23"/>
    </svg>
);
const IconMicOff = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
         strokeLinecap="round" strokeLinejoin="round" className="w-7 h-7">
        <line x1="1" y1="1" x2="23" y2="23"/>
        <path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6"/>
        <path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23"/>
        <line x1="12" y1="19" x2="12" y2="23"/>
        <line x1="8" y1="23" x2="16" y2="23"/>
    </svg>
);
const IconCamOn = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
         strokeLinecap="round" strokeLinejoin="round" className="w-7 h-7">
        <polygon points="23 7 16 12 23 17 23 7"/>
        <rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
    </svg>
);
const IconCamOff = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
         strokeLinecap="round" strokeLinejoin="round" className="w-7 h-7">
        <path d="M16 16v1a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h2m5.66 0H14a2 2 0 0 1 2 2v3.34"/>
        <path d="M23 7l-7 5 7 5V7z"/>
        <line x1="1" y1="1" x2="23" y2="23"/>
    </svg>
);
const IconShare = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
         strokeLinecap="round" strokeLinejoin="round" className="w-7 h-7">
        <rect x="2" y="3" width="20" height="14" rx="2"/>
        <path d="M8 21h8M12 17v4"/>
        <path d="M9 10l3-3 3 3M12 7v6"/>
    </svg>
);
const IconRecord = () => (
    <svg viewBox="0 0 24 24" className="w-7 h-7">
        <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="1.8"/>
        <circle cx="12" cy="12" r="5" fill="currentColor"/>
    </svg>
);
const IconStop = () => (
    <svg viewBox="0 0 24 24" className="w-7 h-7">
        <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="1.8"/>
        <rect x="8" y="8" width="8" height="8" rx="1" fill="currentColor"/>
    </svg>
);
const IconGrid = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
         strokeLinecap="round" strokeLinejoin="round" className="w-7 h-7">
        <rect x="3" y="3" width="7" height="7"/>
        <rect x="14" y="3" width="7" height="7"/>
        <rect x="3" y="14" width="7" height="7"/>
        <rect x="14" y="14" width="7" height="7"/>
    </svg>
);
const IconSpotlight = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
         strokeLinecap="round" strokeLinejoin="round" className="w-7 h-7">
        <rect x="2" y="3" width="20" height="13" rx="1"/>
        <path d="M2 17h5v4H2zM10 17h4v4h-4zM17 17h5v4h-5z"/>
    </svg>
);
const IconPhone = () => (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-7 h-7">
        <path d="M10.68 13.31a16 16 0 0 0 3.41 2.6l1.27-1.27a2 2 0 0 1 2.11-.45
      12.84 12.84 0 0 0 2.81.7 2 2 0 0 1 1.72 1.98v3a2 2 0 0 1-2.18 2
      19.79 19.79 0 0 1-8.63-3.07A19.42 19.42 0 0 1 4.26 12a19.79 19.79 0
      0 1-3.07-8.67A2 2 0 0 1 3.17 1.3h3a2 2 0 0 1 2 1.72c.127.96.361
      1.903.7 2.81a2 2 0 0 1-.45 2.11L7.1 9.18"/>
        <line x1="23" y1="1" x2="1" y2="23" stroke="white" strokeWidth="2" strokeLinecap="round"/>
    </svg>
);
const IconChat = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
         strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
    </svg>
);
const IconPeople = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
         strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
        <circle cx="9" cy="7" r="4"/>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
        <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
);
const IconBoard = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
         strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <path d="M12 20h9"/>
        <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
    </svg>
);

// ── Bouton principal de la barre ──────────────────────────────
function ZoomBtn({ onClick, active, danger, highlight, title, icon, label, pulse }) {
    return (
        <button
            onClick={onClick}
            title={title}
            className={`
        relative flex flex-col items-center justify-center gap-1.5
        min-w-[76px] px-3 py-3 rounded-2xl
        text-[10px] font-bold tracking-widest uppercase
        transition-all duration-150 select-none group
        ${danger
                ? 'bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-900/50'
                : highlight
                    ? 'bg-yellow-500 hover:bg-yellow-400 text-black shadow-lg'
                    : active
                        ? 'bg-gray-600 text-white ring-2 ring-white/30'
                        : 'bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white border border-gray-700/60'
            }
        ${pulse ? 'ring-2 ring-offset-1 ring-offset-gray-900 ring-yellow-400' : ''}
      `}
        >
      <span className="transition-transform duration-150 group-hover:scale-110 group-active:scale-95">
        {icon}
      </span>
            <span className="leading-none whitespace-nowrap">{label}</span>
        </button>
    );
}

function PanelBtn({ onClick, active, title, icon, label }) {
    return (
        <button
            onClick={onClick}
            title={title}
            className={`
        flex flex-col items-center justify-center gap-1
        min-w-[56px] px-2 py-2 rounded-xl
        text-[9px] font-bold tracking-widest uppercase
        transition-all duration-150
        ${active
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white border border-gray-700/40'
            }
      `}
        >
            {icon}
            <span className="leading-none mt-0.5">{label}</span>
        </button>
    );
}

// ── ControlBar ────────────────────────────────────────────────
// ✅ FIX : ReactionBar reçoit toggleHand + handRaised
// → le bouton Réagir gère aussi Raise Hand (style Zoom)
export default function ControlBar({ roomId, onLeave, toggleHand, handRaised, userName }) {
    const { audioEnabled, videoEnabled, toggleAudio, toggleVideo } = useMedia();
    const { locked } = useRoom();
    const {
        chatOpen, setChatOpen,
        participantsOpen, setParticipantsOpen,
        whiteboardOpen, setWhiteboardOpen,
        layout, toggleLayout,
    } = useUI();
    const { isSharing, toggle: toggleScreen }      = useScreenShare();
    const { isRecording, toggle: toggleRecording } = useRecording();

    return (
        <div
            className="bg-gray-900 border-t border-gray-800 px-4 py-3
        flex items-center justify-between gap-2 shadow-2xl"
            style={{ minHeight: '84px' }}
        >
            {/* ── Gauche ── */}
            <div className="hidden md:flex items-center gap-3 w-48 shrink-0">
                {locked && (
                    <span className="flex items-center gap-1.5 text-yellow-400 text-xs font-medium">
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
            Verrouillée
          </span>
                )}
                {isSharing && (
                    <button onClick={toggleScreen}
                            className="flex items-center gap-2 px-3 py-2 bg-red-600
              hover:bg-red-500 text-white text-xs font-bold rounded-xl">
                        <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                            <rect x="6" y="6" width="12" height="12" rx="1"/>
                        </svg>
                        Stop Share
                    </button>
                )}
            </div>

            {/* ── Centre ── */}
            <div className="flex items-center gap-2 mx-auto">

                <ZoomBtn
                    onClick={toggleAudio}
                    active={!audioEnabled}
                    icon={audioEnabled ? <IconMicOn /> : <IconMicOff />}
                    label={audioEnabled ? 'Micro' : 'Muet'}
                    title={audioEnabled ? 'Couper le micro' : 'Activer le micro'}
                />

                <ZoomBtn
                    onClick={toggleVideo}
                    active={!videoEnabled}
                    icon={videoEnabled ? <IconCamOn /> : <IconCamOff />}
                    label={videoEnabled ? 'Vidéo' : 'Arrêtée'}
                    title={videoEnabled ? 'Couper la caméra' : 'Activer la caméra'}
                />

                <ZoomBtn
                    onClick={toggleScreen}
                    highlight={isSharing}
                    pulse={isSharing}
                    icon={<IconShare />}
                    label={isSharing ? 'Arrêter' : 'Partager'}
                    title="Partager l'écran"
                />

                <ZoomBtn
                    onClick={toggleRecording}
                    active={isRecording}
                    icon={isRecording ? <IconStop /> : <IconRecord />}
                    label={isRecording ? 'Stop Rec' : 'Enregistrer'}
                    title={isRecording ? "Arrêter l'enregistrement" : "Démarrer l'enregistrement"}
                />

                {/* ✅ FIX : ReactionBar remplace le bouton Main séparé.
            Il contient Raise Hand + Be right back + toutes les réactions
            exactement comme Zoom / Teams. */}
                <ReactionBar
                    roomId={roomId}
                    userName={userName}
                    toggleHand={toggleHand}
                    handRaised={handRaised}
                />

                <ZoomBtn
                    onClick={toggleLayout}
                    icon={layout === 'grid' ? <IconGrid /> : <IconSpotlight />}
                    label={layout === 'grid' ? 'Grille' : 'Focus'}
                    title="Changer la disposition"
                />

                <div className="w-px h-12 bg-gray-700 mx-1 self-center" />

                <ZoomBtn
                    onClick={onLeave}
                    danger
                    icon={<IconPhone />}
                    label="Quitter"
                    title="Quitter la réunion"
                />
            </div>

            {/* ── Droite ── */}
            <div className="flex items-center gap-1.5 w-48 justify-end shrink-0">
                <PanelBtn
                    onClick={() => setParticipantsOpen(o => !o)}
                    active={participantsOpen}
                    icon={<IconPeople />}
                    label="Participants"
                />
                <PanelBtn
                    onClick={() => setChatOpen(o => !o)}
                    active={chatOpen}
                    icon={<IconChat />}
                    label="Chat"
                />
                <PanelBtn
                    onClick={() => setWhiteboardOpen(o => !o)}
                    active={whiteboardOpen}
                    icon={<IconBoard />}
                    label="Tableau"
                />
            </div>
        </div>
    );
}