import { useState, useRef, useEffect, useCallback } from 'react';
import { useMedia } from '../../context/MediaContext.jsx';
import { useRoom } from '../../context/RoomContext.jsx';
import { useUI } from '../../context/UIContext.jsx';
import { useScreenShare } from '../../hooks/useScreenShare.js';
import { useRecording } from '../../hooks/useRecording.js';
import ReactionBar from './ReactionBar.jsx';
import ScreenShareSelector from './ScreenShareSelector.jsx';

// ══════════════════════════════════════════════════════════════
//  ICÔNES SVG
// ══════════════════════════════════════════════════════════════
const I = {
    MicOn: () => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-7 h-7"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>),
    MicOff:()=>(<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-7 h-7"><line x1="1" y1="1" x2="23" y2="23"/><path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6"/><path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>),
    CamOn: ()=>(<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-7 h-7"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>),
    CamOff:()=>(<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-7 h-7"><path d="M16 16v1a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h2m5.66 0H14a2 2 0 0 1 2 2v3.34"/><path d="M23 7l-7 5 7 5V7z"/><line x1="1" y1="1" x2="23" y2="23"/></svg>),
    Share: ()=>(<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-7 h-7"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/><path d="M9 10l3-3 3 3M12 7v6"/></svg>),
    Rec:   ()=>(<svg viewBox="0 0 24 24" className="w-7 h-7"><circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="1.8"/><circle cx="12" cy="12" r="5" fill="currentColor"/></svg>),
    Stop:  ()=>(<svg viewBox="0 0 24 24" className="w-7 h-7"><circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="1.8"/><rect x="8" y="8" width="8" height="8" rx="1" fill="currentColor"/></svg>),
    Grid:  ()=>(<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-7 h-7"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>),
    Focus: ()=>(<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-7 h-7"><rect x="2" y="3" width="20" height="13" rx="1"/><path d="M2 17h5v4H2zM10 17h4v4h-4zM17 17h5v4h-5z"/></svg>),
    Phone: ()=>(<svg viewBox="0 0 24 24" fill="currentColor" className="w-7 h-7"><path d="M10.68 13.31a16 16 0 0 0 3.41 2.6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7 2 2 0 0 1 1.72 1.98v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.42 19.42 0 0 1 4.26 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.17 1.3h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.1 9.18"/><line x1="23" y1="1" x2="1" y2="23" stroke="white" strokeWidth="2" strokeLinecap="round"/></svg>),
    Chat:  ()=>(<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>),
    People:()=>(<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>),
    Board: ()=>(<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>),
    Bg:    ()=>(<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-7 h-7"><rect x="2" y="3" width="20" height="14" rx="2"/><circle cx="8" cy="8" r="2"/><path d="M21 14l-5-5L8 17"/><line x1="2" y1="20" x2="22" y2="20"/></svg>),
    X:     ()=>(<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>),
    Check: ()=>(<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>),
    Upload:()=>(<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/><path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/></svg>),
};

// ══════════════════════════════════════════════════════════════
//  DONNÉES FONDS PRÉDÉFINIS
// ══════════════════════════════════════════════════════════════
const BG_PRESETS = [
    { id:'office',    emoji:'🏢', label:'Bureau',    color:'#1e293b', url:'https://images.unsplash.com/photo-1497366216548-37526070297c?w=1280&q=75' },
    { id:'library',   emoji:'📚', label:'Biblio',    color:'#78350f', url:'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=1280&q=75' },
    { id:'nature',    emoji:'🌲', label:'Forêt',     color:'#14532d', url:'https://images.unsplash.com/photo-1448375240586-882707db888b?w=1280&q=75' },
    { id:'city',      emoji:'🌆', label:'Ville',     color:'#0f172a', url:'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=1280&q=75' },
    { id:'beach',     emoji:'🏖️', label:'Plage',     color:'#1e40af', url:'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1280&q=75' },
    { id:'space',     emoji:'🚀', label:'Espace',    color:'#020617', url:'https://images.unsplash.com/photo-1462331940025-496dfbfc7564?w=1280&q=75' },
    { id:'mountains', emoji:'🏔️', label:'Montagnes', color:'#1e3a5f', url:'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1280&q=75' },
    { id:'studio',    emoji:'🎙️', label:'Studio',    color:'#1c1917', url:'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=1280&q=75' },
];
const BG_COLORS = ['#0f172a','#1e3a5f','#14532d','#4c1d95','#831843','#1c1917','#312e81','#7c2d12'];

// ══════════════════════════════════════════════════════════════
//  MOTEUR BODYPIX (singleton chargé une seule fois)
// ══════════════════════════════════════════════════════════════
let bpNet = null, bpLoading = false;

async function ensureBodyPix(onMsg) {
    if (bpNet) return bpNet;
    if (bpLoading) {
        await new Promise(r => { const iv = setInterval(() => { if (bpNet || !bpLoading) { clearInterval(iv); r(); }}, 250); });
        return bpNet;
    }
    bpLoading = true;
    const loadScript = (src) => new Promise((res, rej) => {
        const s = document.createElement('script'); s.src = src;
        s.onload = res; s.onerror = rej; document.head.appendChild(s);
    });
    if (!window.tf) { onMsg?.('Chargement TensorFlow.js…'); await loadScript('https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@4.10.0/dist/tf.min.js'); }
    if (!window.bodyPix) { onMsg?.('Chargement modèle BodyPix…'); await loadScript('https://cdn.jsdelivr.net/npm/@tensorflow-models/body-pix@2.2.0/dist/body-pix.min.js'); }
    onMsg?.('Initialisation…');
    bpNet = await window.bodyPix.load({ architecture:'MobileNetV1', outputStride:16, multiplier:0.75, quantBytes:2 });
    bpLoading = false;
    return bpNet;
}

function compositePersonOnBg(ctx, videoEl, seg, W, H) {
    const tmp = document.createElement('canvas'); tmp.width = W; tmp.height = H;
    const tc = tmp.getContext('2d'); tc.drawImage(videoEl, 0, 0, W, H);
    const id = tc.getImageData(0, 0, W, H), d = id.data, sd = seg.data, sw = seg.width, sh = seg.height;
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
        const si = Math.floor(y * sh / H) * sw + Math.floor(x * sw / W);
        if (!sd[si]) d[(y * W + x) * 4 + 3] = 0;
    }
    tc.putImageData(id, 0, 0); ctx.drawImage(tmp, 0, 0);
}

function drawImageCover(ctx, img, W, H) {
    const s = Math.max(W / img.naturalWidth, H / img.naturalHeight);
    ctx.drawImage(img, (W - img.naturalWidth * s) / 2, (H - img.naturalHeight * s) / 2, img.naturalWidth * s, img.naturalHeight * s);
}

// ══════════════════════════════════════════════════════════════
//  PANNEAU ARRIÈRE-PLAN VIRTUEL
// ══════════════════════════════════════════════════════════════
function VirtualBgPanel({ open, localStream, peerConnections, onClose, onActiveChange }) {
    // ... (le contenu de VirtualBgPanel reste inchangé)
}

// ══════════════════════════════════════════════════════════════
//  BOUTONS DE LA BARRE
// ══════════════════════════════════════════════════════════════
function ZoomBtn({ onClick, active, danger, highlight, title, icon, label, pulse }) {
    return (
        <button onClick={onClick} title={title} className={`relative flex flex-col items-center justify-center gap-1.5 min-w-[76px] px-3 py-3 rounded-2xl text-[10px] font-bold tracking-widest uppercase transition-all duration-150 select-none group ${danger?'bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-900/50':highlight?'bg-purple-600 hover:bg-purple-500 text-white shadow-lg':active?'bg-gray-600 text-white ring-2 ring-white/30':'bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white border border-gray-700/60'} ${pulse?'ring-2 ring-offset-1 ring-offset-gray-900 ring-purple-400':''}`}>
            <span className="transition-transform duration-150 group-hover:scale-110 group-active:scale-95">{icon}</span>
            <span className="leading-none whitespace-nowrap">{label}</span>
        </button>
    );
}
function PanelBtn({ onClick, active, title, icon, label }) {
    return (
        <button onClick={onClick} title={title} className={`flex flex-col items-center justify-center gap-1 min-w-[56px] px-2 py-2 rounded-xl text-[9px] font-bold tracking-widest uppercase transition-all duration-150 ${active?'bg-blue-600 text-white shadow-md':'bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white border border-gray-700/40'}`}>
            {icon}<span className="leading-none mt-0.5">{label}</span>
        </button>
    );
}

// ══════════════════════════════════════════════════════════════
//  EXPORT PRINCIPAL
// ══════════════════════════════════════════════════════════════
export default function ControlBar({ roomId, onLeave, toggleHand, handRaised, userName }) {
    const { audioEnabled, videoEnabled, toggleAudio, toggleVideo, localStream, peerConnections } = useMedia();
    const { locked } = useRoom();
    const { chatOpen, setChatOpen, participantsOpen, setParticipantsOpen, whiteboardOpen, setWhiteboardOpen, layout, toggleLayout } = useUI();
    const { isSharing, toggle: toggleScreenShare } = useScreenShare();
    const { isRecording, toggle: toggleRecording } = useRecording();

    const [bgOpen, setBgOpen] = useState(false);
    const [bgActive, setBgActive] = useState(false);
    const [showScreenShareSelector, setShowScreenShareSelector] = useState(false);

    const handleScreenShare = (option) => {
        toggleScreenShare(option);
        setShowScreenShareSelector(false);
    };

    return (
        <>
            <div className="bg-gray-900 border-t border-gray-800 px-4 py-3 flex items-center justify-between gap-2 shadow-2xl" style={{ minHeight:'84px' }}>
                {/* Gauche */}
                <div className="hidden md:flex items-center gap-3 w-48 shrink-0">
                    {locked && (<span className="flex items-center gap-1.5 text-yellow-400 text-xs font-medium"><svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>Verrouillée</span>)}
                    {isSharing && (<button onClick={() => toggleScreenShare('stop')} className="flex items-center gap-2 px-3 py-2 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded-xl"><svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><rect x="6" y="6" width="12" height="12" rx="1"/></svg>Arrêter le partage</button>)}
                </div>

                {/* Centre — tous les boutons */}
                <div className="flex items-center gap-2 mx-auto flex-wrap justify-center">
                    <ZoomBtn onClick={toggleAudio} active={!audioEnabled} icon={audioEnabled?<I.MicOn/>:<I.MicOff/>} label={audioEnabled?'Micro':'Muet'} title={audioEnabled?'Couper le micro':'Activer le micro'}/>
                    <ZoomBtn onClick={toggleVideo} active={!videoEnabled} icon={videoEnabled?<I.CamOn/>:<I.CamOff/>} label={videoEnabled?'Vidéo':'Arrêtée'} title={videoEnabled?'Couper la caméra':'Activer la caméra'}/>

                    {/* ✅ BOUTON FOND VIRTUEL */}
                    <ZoomBtn
                        onClick={() => setBgOpen(o => !o)}
                        active={bgOpen && !bgActive}
                        highlight={bgActive}
                        pulse={bgActive}
                        icon={<I.Bg/>}
                        label={bgActive ? 'Fond ●' : 'Fond'}
                        title="Arrière-plan virtuel"
                    />

                    {/* ✅ BOUTON PARTAGE D'ÉCRAN */}
                    <ZoomBtn
                        onClick={() => setShowScreenShareSelector(true)}
                        highlight={isSharing}
                        pulse={isSharing}
                        icon={<I.Share/>}
                        label={isSharing ? 'Arrêter' : 'Partager'}
                        title="Partager l'écran"
                    />

                    <ZoomBtn onClick={toggleRecording} active={isRecording} icon={isRecording?<I.Stop/>:<I.Rec/>} label={isRecording?'Stop Rec':'Enregistrer'} title={isRecording?"Arrêter l'enregistrement":"Démarrer l'enregistrement"}/>
                    <ReactionBar roomId={roomId} userName={userName} toggleHand={toggleHand} handRaised={handRaised}/>
                    <ZoomBtn onClick={toggleLayout} icon={layout==='grid'?<I.Grid/>:<I.Focus/>} label={layout==='grid'?'Grille':'Focus'} title="Changer la disposition"/>
                    <div className="w-px h-12 bg-gray-700 mx-1 self-center"/>
                    <ZoomBtn onClick={onLeave} danger icon={<I.Phone/>} label="Quitter" title="Quitter la réunion"/>
                </div>

                {/* Droite */}
                <div className="flex items-center gap-1.5 w-48 justify-end shrink-0">
                    <PanelBtn onClick={()=>setParticipantsOpen(o=>!o)} active={participantsOpen} icon={<I.People/>} label="Participants"/>
                    <PanelBtn onClick={()=>setChatOpen(o=>!o)} active={chatOpen} icon={<I.Chat/>} label="Chat"/>
                    <PanelBtn onClick={()=>setWhiteboardOpen(o=>!o)} active={whiteboardOpen} icon={<I.Board/>} label="Tableau"/>
                </div>
            </div>

            {/* Panneau fond virtuel — s'ouvre AU-DESSUS de la barre */}
            {localStream && (
                <VirtualBgPanel
                    open={bgOpen}
                    localStream={localStream}
                    peerConnections={peerConnections}
                    onClose={() => setBgOpen(false)}
                    onActiveChange={active => {
                        setBgActive(active);
                        if (!active) setBgOpen(false);
                    }}
                />
            )}

            {/* Sélecteur de partage d'écran */}
            {showScreenShareSelector && (
                <ScreenShareSelector
                    onSelect={handleScreenShare}
                    onCancel={() => setShowScreenShareSelector(false)}
                />
            )}
        </>
    );
}