import { createContext, useContext, useState, useCallback, useRef } from 'react';

const UIContext = createContext(null);

export const useUI = () => {
  const ctx = useContext(UIContext);
  if (!ctx) throw new Error('useUI must be inside UIProvider');
  return ctx;
};

export function UIProvider({ children }) {
  const [layout,           setLayout]          = useState('grid');
  const [activeSpeakerId,  setActiveSpeakerId] = useState(null);
  const [chatOpen,         setChatOpen]        = useState(false);
  const [participantsOpen, setParticipantsOpen]= useState(false);
  const [whiteboardOpen,   setWhiteboardOpen]  = useState(false);
  const [breakoutOpen,     setBreakoutOpen]    = useState(false);
  const [reactions,        setReactions]       = useState([]);

  const reactionCounter = useRef(0);

  const addReaction = useCallback((reaction) => {
    // Use an incrementing counter to guarantee unique IDs
    const id = `reaction-${Date.now()}-${++reactionCounter.current}`;
    const item = { ...reaction, id };

    console.log('[UIContext] addReaction called:', item);

    setReactions(prev => {
      const next = [...prev, item];
      console.log('[UIContext] reactions state now:', next.length);
      return next;
    });

    // Auto-remove after 3.5s
    setTimeout(() => {
      setReactions(prev => prev.filter(r => r.id !== id));
    }, 3500);
  }, []);

  const toggleLayout = useCallback(() =>
    setLayout(l => l === 'grid' ? 'spotlight' : 'grid'), []);

  return (
    <UIContext.Provider value={{
      layout, setLayout, toggleLayout,
      activeSpeakerId, setActiveSpeakerId,
      chatOpen, setChatOpen,
      participantsOpen, setParticipantsOpen,
      whiteboardOpen, setWhiteboardOpen,
      breakoutOpen, setBreakoutOpen,
      reactions, addReaction,
    }}>
      {children}
    </UIContext.Provider>
  );
}
