import { EVENTS } from '../../constants/events.js';
import { generateId } from '../../utils/uuid.js';
import { logger } from '../../utils/logger.js';

// ─── Limites de sécurité ──────────────────────────────────────
const MAX_FILE_SIZE  = 10 * 1024 * 1024;   // 10 MB max par fichier
const MAX_CHUNK_SIZE = 64 * 1024;           // 64 KB par chunk
const ALLOWED_TYPES  = [
  // Images
  'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
  // Documents
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  // Texte & code
  'text/plain', 'text/csv', 'text/html', 'application/json',
  // Archives
  'application/zip', 'application/x-rar-compressed',
];

// ─── Store temporaire des transferts en cours ─────────────────
// Map<transferId, { roomId, userId, userName, fileName, fileType,
//                   fileSize, totalChunks, receivedChunks, data[] }>
const activeTransfers = new Map();

export function registerChatHandlers(io, socket) {

  // ── Message texte (inchangé) ──────────────────────────────
  socket.on(EVENTS.CHAT, ({ roomId, message, userId, userName }) => {
    logger.socket(EVENTS.CHAT, { roomId, userName, message: message?.slice(0, 40) });
    io.to(roomId).emit(EVENTS.CHAT, {
      id:        generateId(),
      type:      'text',
      message,
      userId,
      userName,
      socketId:  socket.id,
      timestamp: new Date().toISOString(),
    });
  });

  // ── Initiation transfert fichier ──────────────────────────
  // Le client envoie les métadonnées avant les chunks
  socket.on(EVENTS.FILE_TRANSFER_START, ({ roomId, userId, userName, fileName, fileType, fileSize, totalChunks }) => {

    // Validation taille
    if (fileSize > MAX_FILE_SIZE) {
      socket.emit(EVENTS.FILE_TRANSFER_ERROR, {
        error: `Fichier trop volumineux. Maximum : ${Math.round(MAX_FILE_SIZE / 1024 / 1024)} MB`,
      });
      return;
    }

    // Validation type MIME
    if (!ALLOWED_TYPES.includes(fileType)) {
      socket.emit(EVENTS.FILE_TRANSFER_ERROR, {
        error: `Type de fichier non autorisé : ${fileType}`,
      });
      return;
    }

    const transferId = generateId();
    activeTransfers.set(transferId, {
      roomId, userId, userName,
      fileName, fileType, fileSize,
      totalChunks, receivedChunks: 0,
      chunks: new Array(totalChunks),
      socketId: socket.id,
    });

    // Confirmer au client qu'il peut commencer à envoyer
    socket.emit(EVENTS.FILE_TRANSFER_READY, { transferId });
    logger.socket(EVENTS.FILE_TRANSFER_START, { fileName, fileSize, totalChunks });
  });

  // ── Réception d'un chunk ──────────────────────────────────
  socket.on(EVENTS.FILE_TRANSFER_CHUNK, ({ transferId, chunkIndex, data }) => {
    const transfer = activeTransfers.get(transferId);
    if (!transfer) return;

    transfer.chunks[chunkIndex] = data;
    transfer.receivedChunks++;

    // Progression pour le sender
    socket.emit(EVENTS.FILE_TRANSFER_PROGRESS, {
      transferId,
      progress: Math.round((transfer.receivedChunks / transfer.totalChunks) * 100),
    });

    // Tous les chunks reçus → assembler et broadcaster
    if (transfer.receivedChunks === transfer.totalChunks) {
      const fullData = transfer.chunks.join('');   // base64 complet
      const isImage  = transfer.fileType.startsWith('image/');

      const payload = {
        id:          generateId(),
        type:        isImage ? 'image' : 'file',
        fileName:    transfer.fileName,
        fileType:    transfer.fileType,
        fileSize:    transfer.fileSize,
        data:        fullData,           // base64
        userId:      transfer.userId,
        userName:    transfer.userName,
        socketId:    transfer.socketId,
        timestamp:   new Date().toISOString(),
      };

      // Broadcaster à toute la salle
      io.to(transfer.roomId).emit(EVENTS.CHAT, payload);
      logger.success(`File "${transfer.fileName}" (${Math.round(transfer.fileSize/1024)} KB) shared in ${transfer.roomId}`);

      // Nettoyer
      activeTransfers.delete(transferId);
    }
  });

  // ── Annulation transfert ──────────────────────────────────
  socket.on(EVENTS.FILE_TRANSFER_CANCEL, ({ transferId }) => {
    activeTransfers.delete(transferId);
    logger.info(`Transfer ${transferId} cancelled`);
  });

  // ── Réaction sur un message (👍 👏 etc.) ─────────────────
  socket.on(EVENTS.CHAT_REACTION, ({ roomId, messageId, emoji, userId, userName }) => {
    io.to(roomId).emit(EVENTS.CHAT_REACTION, { messageId, emoji, userId, userName });
  });

  // Nettoyage si le socket se déconnecte en cours de transfert
  socket.on('disconnect', () => {
    for (const [id, transfer] of activeTransfers.entries()) {
      if (transfer.socketId === socket.id) activeTransfers.delete(id);
    }
  });
}