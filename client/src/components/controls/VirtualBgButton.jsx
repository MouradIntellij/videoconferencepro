/**
 * VirtualBgButton.jsx
 *
 * Bouton à ajouter dans la barre de contrôle (ControlBar).
 * Ouvre/ferme le panneau VirtualBackground via un state local.
 *
 * Utilisation dans ControlBar.jsx :
 *   import VirtualBgButton from './VirtualBgButton.jsx';
 *   ...
 *   <VirtualBgButton peerConnections={peerConnections} />
 */

import { useState } from 'react';
import { useMedia } from '../../context/MediaContext.jsx';
import VirtualBackground from '../layout/VirtualBackground.jsx';

const BgIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
         strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
         width="28" height="28">
        <rect x="2" y="3" width="20" height="14" rx="2"/>
        <circle cx="8" cy="8" r="2"/>
        <path d="M21 14l-5-5L8 17"/>
        <line x1="2" y1="20" x2="22" y2="20"/>
    </svg>
);

export default function VirtualBgButton({ peerConnections }) {
    const { localStream } = useMedia();
    const [open, setOpen] = useState(false);

    return (
        <>
            <button
                onClick={() => setOpen(o => !o)}
                title="Arrière-plan virtuel"
                className={`
          relative flex flex-col items-center justify-center gap-1.5
          min-w-[76px] px-3 py-3 rounded-2xl
          text-[10px] font-bold tracking-widest uppercase
          transition-all duration-150 select-none group
          ${open
                    ? 'bg-purple-600 text-white ring-2 ring-purple-400/50'
                    : 'bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white border border-gray-700/60'
                }
        `}
            >
        <span className="transition-transform duration-150 group-hover:scale-110 group-active:scale-95">
          <BgIcon />
        </span>
                <span className="leading-none whitespace-nowrap">Fond</span>
            </button>

            {open && localStream && (
                <VirtualBackground
                    localStream={localStream}
                    peerConnections={peerConnections}
                    onClose={() => setOpen(false)}
                />
            )}
        </>
    );
}