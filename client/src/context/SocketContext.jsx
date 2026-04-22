import { createContext, useContext, useState, useEffect } from 'react';
import { io } from 'socket.io-client';

const SocketContext = createContext(null);

export const useSocket = () => {
  const ctx = useContext(SocketContext);
  if (!ctx) throw new Error('useSocket must be inside SocketProvider');
  return ctx;
};
console.log("🧠 SocketProvider MOUNT");

export function SocketProvider({ children }) {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';  // Vérifie bien l'URL de production

  useEffect(() => {
    console.log(`Tentative de connexion à WebSocket : ${API_URL}`);

    const s = io(API_URL, {
      transports: ['websocket', 'polling'],
      withCredentials: true,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });

    setSocket(s);

    s.on('connect', () => {
      setConnected(true);
      console.log('✅ Socket connected');
    });

    s.on('disconnect', () => {
      setConnected(false);
      console.log('❌ Socket disconnected');
    });

    s.on('connect_error', (e) => {
      console.warn('⚠️ Socket error:', e.message);
    });

    return () => {
      console.log('🧹 Socket cleanup');
      s.disconnect();
    };
  }, []);

  return (
      <SocketContext.Provider value={{ socket, connected }}>
        {children}
      </SocketContext.Provider>
  );
}