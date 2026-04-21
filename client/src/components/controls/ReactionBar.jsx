import { useEffect, useState, useRef } from 'react';
import { useSocket }  from '../../context/SocketContext.jsx';
import { useUI }      from '../../context/UIContext.jsx';
import { EVENTS }     from '../../utils/events.js';

// ─── Réactions "Send with effect" (grandes animations) ───────
const EFFECT_REACTIONS = [
  { emoji: '🎈', label: 'Ballons' },
  { emoji: '🚀', label: 'Fusée'   },
  { emoji: '👍', label: 'Super'   },
  { emoji: '😂', label: 'Haha'    },
  { emoji: '🎉', label: 'Confetti'},
  { emoji: '❤️', label: 'Love'    },
];

// ─── Réactions rapides (style Teams/Zoom) ────────────────────
const QUICK_REACTIONS = [
  { emoji: '👋', label: 'Salut'   },
  { emoji: '👍', label: 'Super'   },
  { emoji: '❤️', label: 'Love'    },
  { emoji: '😂', label: 'Haha'    },
  { emoji: '😮', label: 'Wow'     },
  { emoji: '🎉', label: 'Fête'    },
];

// ─── Boutons statut ───────────────────────────────────────────
const STATUS_BUTTONS = [
  { emoji: '✅', label: 'Oui',       key: 'yes'  },
  { emoji: '❌', label: 'Non',       key: 'no'   },
  { emoji: '⏪', label: 'Plus lent', key: 'slow' },
  { emoji: '⏩', label: 'Plus vite', key: 'fast' },
  { emoji: '☕', label: 'Pause',     key: 'break'},
];

export default function ReactionBar({ roomId, userName, toggleHand, handRaised }) {
  const { socket }      = useSocket();
  const { addReaction } = useUI();
  const [open, setOpen] = useState(false);
  const [brbActive, setBrbActive] = useState(false);
  const panelRef = useRef(null);

  // Fermer sur clic extérieur
  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  // Écouter réactions des autres participants
  useEffect(() => {
    if (!socket) return;
    const handler = (reaction) => addReaction(reaction);
    socket.on(EVENTS.REACTION_BROADCAST, handler);
    return () => socket.off(EVENTS.REACTION_BROADCAST, handler);
  }, [socket, addReaction]);

  // ── Envoyer une réaction ──────────────────────────────────
  const send = (emoji, isEffect = false) => {
    if (!socket) return;

    // Affichage local immédiat
    addReaction({
      userId:    socket.id,
      userName:  userName || 'Moi',
      emoji,
      isEffect,
      timestamp: Date.now(),
    });

    // Broadcast aux autres
    socket.emit(EVENTS.REACTION, {
      roomId,
      emoji,
      isEffect,
      userName: userName || 'Moi',
    });

    setOpen(false);
  };

  // ── Lever / baisser la main ───────────────────────────────
  const handleRaiseHand = () => {
    if (toggleHand) toggleHand();
    setOpen(false);
  };

  // ── Be right back ─────────────────────────────────────────
  const handleBrb = () => {
    setBrbActive(v => !v);
    send(brbActive ? '👋' : '⏳');
    setOpen(false);
  };

  return (
      <div style={{ position: 'relative' }} ref={panelRef}>

        {/* ── Bouton React ── */}
        <button
            onClick={() => setOpen(o => !o)}
            style={{
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center', gap: 4,
              padding: '8px 14px', borderRadius: 12, border: 'none',
              cursor: 'pointer', fontFamily: 'inherit',
              background: open ? 'rgba(245,158,11,0.2)' : 'rgba(255,255,255,0.07)',
              color: open ? '#fbbf24' : 'rgba(255,255,255,0.75)',
              transition: 'all 0.15s',
              minWidth: 64,
            }}
            onMouseEnter={e => { if (!open) e.currentTarget.style.background = 'rgba(255,255,255,0.12)'; }}
            onMouseLeave={e => { if (!open) e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; }}
            title="Réagir"
        >
        <span style={{ fontSize: 20, lineHeight: 1 }}>
          {handRaised ? '✋' : '😀'}
        </span>
          <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.03em' }}>
          {handRaised ? 'Main levée' : 'Réagir'}
        </span>
        </button>

        {/* ── Panneau déroulant style Zoom/Teams ── */}
        {open && (
            <div style={{
              position: 'absolute',
              bottom: 'calc(100% + 10px)',
              left: '50%',
              transform: 'translateX(-50%)',
              background: '#1e2433',
              border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: 16,
              padding: '14px',
              width: 280,
              zIndex: 100,
              boxShadow: '0 20px 60px rgba(0,0,0,0.7)',
              animation: 'popUp 0.18s cubic-bezier(0.34,1.56,0.64,1)',
            }}>

              {/* ── Section 1 : Send with effect ── */}
              <p style={{
                fontSize: 11, fontWeight: 700, letterSpacing: '0.08em',
                color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase',
                margin: '0 0 8px',
              }}>
                Send with effect
              </p>
              <div style={{
                display: 'grid', gridTemplateColumns: 'repeat(6,1fr)', gap: 4, marginBottom: 14,
              }}>
                {EFFECT_REACTIONS.map(({ emoji, label }) => (
                    <button
                        key={emoji + 'e'}
                        onClick={() => send(emoji, true)}
                        title={label}
                        style={{
                          background: 'rgba(255,255,255,0.07)',
                          border: '1px solid rgba(255,255,255,0.1)',
                          borderRadius: 10, cursor: 'pointer',
                          padding: '7px 4px',
                          fontSize: 20, lineHeight: 1,
                          transition: 'all 0.15s',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}
                        onMouseEnter={e => {
                          e.currentTarget.style.background = 'rgba(255,255,255,0.15)';
                          e.currentTarget.style.transform = 'scale(1.2)';
                        }}
                        onMouseLeave={e => {
                          e.currentTarget.style.background = 'rgba(255,255,255,0.07)';
                          e.currentTarget.style.transform = 'scale(1)';
                        }}
                    >
                      {emoji}
                    </button>
                ))}
              </div>

              {/* Séparateur */}
              <div style={{ height: 1, background: 'rgba(255,255,255,0.08)', margin: '0 0 12px' }} />

              {/* ── Section 2 : Reactions ── */}
              <p style={{
                fontSize: 11, fontWeight: 700, letterSpacing: '0.08em',
                color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase',
                margin: '0 0 8px',
              }}>
                Reactions
              </p>
              <div style={{
                display: 'grid', gridTemplateColumns: 'repeat(6,1fr)', gap: 4, marginBottom: 14,
              }}>
                {QUICK_REACTIONS.map(({ emoji, label }) => (
                    <button
                        key={emoji + 'q'}
                        onClick={() => send(emoji, false)}
                        title={label}
                        style={{
                          background: 'transparent', border: 'none', cursor: 'pointer',
                          borderRadius: 8, padding: '6px 2px',
                          fontSize: 22, lineHeight: 1,
                          transition: 'transform 0.15s',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}
                        onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.3)'}
                        onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                    >
                      {emoji}
                    </button>
                ))}
              </div>

              {/* ── Section 3 : Boutons statut ── */}
              <div style={{
                display: 'flex', gap: 6, marginBottom: 10, flexWrap: 'wrap',
              }}>
                {STATUS_BUTTONS.map(({ emoji, label, key }) => (
                    <button
                        key={key}
                        onClick={() => send(emoji, false)}
                        title={label}
                        style={{
                          background: 'rgba(255,255,255,0.08)',
                          border: '1px solid rgba(255,255,255,0.12)',
                          borderRadius: 10, cursor: 'pointer',
                          padding: '7px 10px', fontSize: 18, lineHeight: 1,
                          transition: 'all 0.15s',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.16)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
                    >
                      {emoji}
                    </button>
                ))}
              </div>

              {/* Séparateur */}
              <div style={{ height: 1, background: 'rgba(255,255,255,0.08)', margin: '0 0 10px' }} />

              {/* ── Raise hand ── */}
              <button
                  onClick={handleRaiseHand}
                  style={{
                    width: '100%', padding: '10px 14px',
                    borderRadius: 10, border: 'none', cursor: 'pointer',
                    background: handRaised
                        ? 'rgba(245,158,11,0.2)' : 'rgba(255,255,255,0.06)',
                    color: handRaised ? '#fbbf24' : 'rgba(255,255,255,0.8)',
                    fontSize: 13, fontWeight: 600,
                    display: 'flex', alignItems: 'center', gap: 10,
                    transition: 'all 0.15s', fontFamily: 'inherit',
                    marginBottom: 6,
                    border: handRaised
                        ? '1px solid rgba(245,158,11,0.35)' : '1px solid rgba(255,255,255,0.08)',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = handRaised
                      ? 'rgba(245,158,11,0.3)' : 'rgba(255,255,255,0.12)'}
                  onMouseLeave={e => e.currentTarget.style.background = handRaised
                      ? 'rgba(245,158,11,0.2)' : 'rgba(255,255,255,0.06)'}
              >
                <span style={{ fontSize: 18 }}>✋</span>
                {handRaised ? 'Baisser la main' : 'Raise hand'}
              </button>

              {/* ── Be right back ── */}
              <button
                  onClick={handleBrb}
                  style={{
                    width: '100%', padding: '10px 14px',
                    borderRadius: 10, border: 'none', cursor: 'pointer',
                    background: brbActive
                        ? 'rgba(139,92,246,0.2)' : 'rgba(255,255,255,0.06)',
                    color: brbActive ? '#a78bfa' : 'rgba(255,255,255,0.8)',
                    fontSize: 13, fontWeight: 600,
                    display: 'flex', alignItems: 'center', gap: 10,
                    transition: 'all 0.15s', fontFamily: 'inherit',
                    border: brbActive
                        ? '1px solid rgba(139,92,246,0.35)' : '1px solid rgba(255,255,255,0.08)',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = brbActive
                      ? 'rgba(139,92,246,0.3)' : 'rgba(255,255,255,0.12)'}
                  onMouseLeave={e => e.currentTarget.style.background = brbActive
                      ? 'rgba(139,92,246,0.2)' : 'rgba(255,255,255,0.06)'}
              >
                <span style={{ fontSize: 18 }}>⏳</span>
                {brbActive ? 'Je suis de retour' : 'Be right back'}
              </button>
            </div>
        )}

        <style>{`
        @keyframes popUp {
          from { opacity:0; transform:translateX(-50%) translateY(8px) scale(0.95); }
          to   { opacity:1; transform:translateX(-50%) translateY(0)    scale(1); }
        }
      `}</style>
      </div>
  );
}