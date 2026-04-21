import { useEffect, useState } from 'react';
import { useSocket }  from '../../context/SocketContext.jsx';
import { useUI }      from '../../context/UIContext.jsx';
import { EVENTS }     from '../../utils/events.js';

const EMOJIS = [
  { emoji: '👍', label: 'Super' },
  { emoji: '👏', label: 'Bravo' },
  { emoji: '😂', label: 'Haha' },
  { emoji: '❤️', label: 'Love' },
  { emoji: '🔥', label: 'Fire' },
  { emoji: '🎉', label: 'Fête' },
  { emoji: '😮', label: 'Wow' },
  { emoji: '🙏', label: 'Merci' },
];

export default function ReactionBar({ roomId, userName }) {
  const { socket }      = useSocket();
  const { addReaction } = useUI();
  const [open, setOpen] = useState(false);

  // Listen for reactions from OTHER participants
  useEffect(() => {
    if (!socket) return;
    const handler = (reaction) => {
      console.log('[ReactionBar] received broadcast:', reaction);
      addReaction(reaction);
    };
    socket.on(EVENTS.REACTION_BROADCAST, handler);
    return () => socket.off(EVENTS.REACTION_BROADCAST, handler);
  }, [socket, addReaction]);

  const send = (emoji) => {
    if (!socket) {
      console.warn('[ReactionBar] no socket!');
      return;
    }
    console.log('[ReactionBar] emitting reaction:', emoji, 'room:', roomId, 'user:', userName);

    // Show immediately for the sender (server broadcasts to others only if
    // using socket.to(roomId), so we must display locally ourselves)
    addReaction({
      userId:    socket.id,
      userName:  userName || 'Moi',
      emoji,
      timestamp: Date.now(),
    });

    // Emit to server so others receive it
    socket.emit(EVENTS.REACTION, { roomId, emoji, userName: userName || 'Moi' });

    setOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className={`flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
          open
            ? 'bg-yellow-600 text-white'
            : 'bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white'
        }`}
        title="Réactions"
      >
        <span className="text-xl leading-none">😀</span>
        <span>Réaction</span>
      </button>

      {open && (
        <>
          {/* Click outside to close */}
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />

          <div className="absolute bottom-full mb-2 right-0 bg-gray-800 border border-gray-700 rounded-2xl p-3 shadow-2xl z-50 min-w-[200px]">
            <p className="text-gray-500 text-[10px] uppercase tracking-wider mb-2 px-1">
              Choisir une réaction
            </p>
            <div className="grid grid-cols-4 gap-1">
              {EMOJIS.map(({ emoji, label }) => (
                <button
                  key={emoji}
                  onClick={() => send(emoji)}
                  className="flex flex-col items-center gap-0.5 p-2 rounded-xl hover:bg-gray-700 transition-all hover:scale-110 active:scale-95"
                  title={label}
                >
                  <span className="text-2xl leading-none">{emoji}</span>
                  <span className="text-gray-400 text-[9px]">{label}</span>
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
