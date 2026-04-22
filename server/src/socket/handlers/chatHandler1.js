import { EVENTS } from '../../constants/events.js';
import { generateId } from '../../utils/uuid.js';
import { logger } from '../../utils/logger.js';

export function registerChatHandlers(io, socket) {

  socket.on(EVENTS.CHAT, ({ roomId, message, userId, userName }) => {
    logger.socket(EVENTS.CHAT, { roomId, userName, message: message.slice(0, 40) });

    // Broadcast to entire room (including sender — so sender gets the server timestamp)
    io.to(roomId).emit(EVENTS.CHAT, {
      id: generateId(),
      message,
      userId,
      userName,
      socketId: socket.id,
      timestamp: new Date().toISOString(),
    });
  });
}
