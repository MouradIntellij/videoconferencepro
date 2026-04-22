/**
 * ChatSidebar.jsx — Chat Pro style Teams/Slack
 *
 * Fonctionnalités :
 *  ✅ Messages texte avec formatage (gras, italic, code inline)
 *  ✅ Envoi de fichiers (PDF, Word, Excel, ZIP…) — jusqu'à 10 MB
 *  ✅ Envoi d'images avec aperçu inline
 *  ✅ Drag & drop de fichiers sur le panneau
 *  ✅ Coller une image depuis le presse-papiers (Ctrl+V)
 *  ✅ Réactions emoji sur les messages (👍 ❤️ 😂 😮 🎉 👏)
 *  ✅ Répondre à un message (reply thread)
 *  ✅ Barre de progression pendant l'upload
 *  ✅ Aperçu d'image avant envoi
 *  ✅ Badge non-lus quand le chat est fermé
 *  ✅ Copier un message dans le presse-papiers
 *  ✅ Téléchargement des fichiers reçus
 *
 * Placer dans : client/src/components/chat/ChatSidebar.jsx
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { useSocket } from '../../context/SocketContext.jsx';
import { useUI }     from '../../context/UIContext.jsx';
import { EVENTS }    from '../../utils/events.js';

// ── Constantes ────────────────────────────────────────────────
const MAX_FILE_MB   = 10;
const MAX_FILE_SIZE = MAX_FILE_MB * 1024 * 1024;
const CHUNK_SIZE    = 64 * 1024;   // 64 KB
const QUICK_EMOJIS  = ['👍','❤️','😂','😮','🎉','👏'];
const ALLOWED_EXTS  = ['jpg','jpeg','png','gif','webp','pdf','doc','docx','xls','xlsx','ppt','pptx','txt','csv','zip','json'];

// ── Icônes SVG compactes ──────────────────────────────────────
const Ico = {
  Close:  ()=>(<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>),
  Send:   ()=>(<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>),
  Attach: ()=>(<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>),
  Img:    ()=>(<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>),
  Emoji:  ()=>(<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>),
  Reply:  ()=>(<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 17 4 12 9 7"/><path d="M20 18v-2a4 4 0 0 0-4-4H4"/></svg>),
  Copy:   ()=>(<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>),
  Down:   ()=>(<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>),
  File:   ()=>(<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>),
  X:      ()=>(<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>),
};

// ── Utilitaires ───────────────────────────────────────────────
function formatSize(bytes) {
  if (bytes < 1024) return bytes + ' o';
  if (bytes < 1024 * 1024) return Math.round(bytes / 1024) + ' Ko';
  return (bytes / 1024 / 1024).toFixed(1) + ' Mo';
}

function formatTime(iso) {
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function getFileIcon(type) {
  if (type?.startsWith('image/'))       return '🖼️';
  if (type?.includes('pdf'))            return '📄';
  if (type?.includes('word') || type?.includes('document')) return '📝';
  if (type?.includes('excel') || type?.includes('sheet'))   return '📊';
  if (type?.includes('powerpoint') || type?.includes('presentation')) return '📊';
  if (type?.includes('zip') || type?.includes('rar'))       return '🗜️';
  if (type?.includes('text') || type?.includes('json'))     return '📃';
  return '📎';
}

function getExt(name) { return name?.split('.').pop()?.toUpperCase() || 'FILE'; }

// Palette avatar déterministe
const AV_COLORS = [
  ['#1e3a5f','#60a5fa'],['#14532d','#4ade80'],['#4c1d95','#a78bfa'],
  ['#831843','#f472b6'],['#1c1917','#e2e8f0'],['#7c2d12','#fb923c'],
];
function avColor(name) { return AV_COLORS[(name?.charCodeAt(0) ?? 0) % AV_COLORS.length]; }

// ── Composant Avatar ──────────────────────────────────────────
function Av({ name, size = 28 }) {
  const [bg, color] = avColor(name || '');
  return (
      <div style={{ width:size, height:size, borderRadius:'50%', background:bg, color, flexShrink:0,
        display:'flex', alignItems:'center', justifyContent:'center',
        fontSize:Math.round(size*0.4), fontWeight:700, fontFamily:'monospace' }}>
        {name?.[0]?.toUpperCase() ?? '?'}
      </div>
  );
}

// ── Bulle de message ──────────────────────────────────────────
function MessageBubble({ msg, isMine, onReply, onReact, reactions, myId }) {
  const [hover,      setHover]      = useState(false);
  const [showEmoji,  setShowEmoji]  = useState(false);
  const [copied,     setCopied]     = useState(false);

  const handleCopy = () => {
    if (msg.message) { navigator.clipboard.writeText(msg.message); setCopied(true); setTimeout(()=>setCopied(false), 1500); }
  };

  const handleDownload = () => {
    if (!msg.data) return;
    const a = document.createElement('a');
    a.href = `data:${msg.fileType};base64,${msg.data}`;
    a.download = msg.fileName;
    a.click();
  };

  // Grouper les réactions
  const reactionGroups = {};
  (reactions || []).forEach(r => {
    if (!reactionGroups[r.emoji]) reactionGroups[r.emoji] = [];
    reactionGroups[r.emoji].push(r.userName);
  });

  return (
      <div
          style={{ display:'flex', gap:8, padding:'2px 0', flexDirection: isMine ? 'row-reverse' : 'row',
            position:'relative', marginBottom:4 }}
          onMouseEnter={() => setHover(true)}
          onMouseLeave={() => { setHover(false); setShowEmoji(false); }}
      >
        {/* Avatar — seulement pour les autres */}
        {!isMine && <Av name={msg.userName} size={28} />}

        <div style={{ maxWidth:'75%', minWidth:60 }}>
          {/* Nom + heure */}
          {!isMine && (
              <div style={{ display:'flex', alignItems:'baseline', gap:6, marginBottom:3 }}>
                <span style={{ fontSize:11, fontWeight:700, color: avColor(msg.userName)[1] }}>{msg.userName}</span>
                <span style={{ fontSize:10, color:'rgba(255,255,255,0.3)' }}>{formatTime(msg.timestamp)}</span>
              </div>
          )}

          {/* Reply preview */}
          {msg.replyTo && (
              <div style={{ borderLeft:'2.5px solid rgba(255,255,255,0.2)', paddingLeft:8, marginBottom:4,
                fontSize:11, color:'rgba(255,255,255,0.4)', fontStyle:'italic', lineHeight:1.4 }}>
                <span style={{ fontWeight:600, color:'rgba(255,255,255,0.55)' }}>{msg.replyTo.userName}: </span>
                {msg.replyTo.message || msg.replyTo.fileName}
              </div>
          )}

          {/* Contenu */}
          <div style={{
            background: isMine ? '#2563eb' : 'rgba(255,255,255,0.08)',
            borderRadius: isMine ? '16px 4px 16px 16px' : '4px 16px 16px 16px',
            padding: msg.type === 'image' ? '4px' : '9px 12px',
            border: '1px solid ' + (isMine ? 'rgba(59,130,246,0.4)' : 'rgba(255,255,255,0.08)'),
            overflow:'hidden',
          }}>

            {/* Image */}
            {msg.type === 'image' && msg.data && (
                <div>
                  <img
                      src={`data:${msg.fileType};base64,${msg.data}`}
                      alt={msg.fileName}
                      style={{ maxWidth:'100%', maxHeight:220, borderRadius:12, display:'block', cursor:'pointer' }}
                      onClick={() => window.open(`data:${msg.fileType};base64,${msg.data}`)}
                  />
                  <div style={{ padding:'6px 8px 4px', fontSize:10, color:'rgba(255,255,255,0.5)' }}>
                    {msg.fileName} · {formatSize(msg.fileSize)}
                  </div>
                </div>
            )}

            {/* Fichier */}
            {msg.type === 'file' && (
                <div style={{ display:'flex', alignItems:'center', gap:10, cursor:'pointer' }} onClick={handleDownload}>
                  <div style={{ width:40, height:40, borderRadius:10,
                    background: isMine ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.08)',
                    display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                    <span style={{ fontSize:18, lineHeight:1 }}>{getFileIcon(msg.fileType)}</span>
                    <span style={{ fontSize:7, fontWeight:800, color:'rgba(255,255,255,0.6)', marginTop:2 }}>{getExt(msg.fileName)}</span>
                  </div>
                  <div style={{ minWidth:0 }}>
                    <div style={{ fontSize:12, fontWeight:600, color:'#e2e8f0', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis', maxWidth:160 }}>{msg.fileName}</div>
                    <div style={{ fontSize:10, color:'rgba(255,255,255,0.45)', marginTop:1 }}>{formatSize(msg.fileSize)} · Cliquer pour télécharger</div>
                  </div>
                  <div style={{ color:'rgba(255,255,255,0.5)', flexShrink:0, marginLeft:'auto' }}><Ico.Down/></div>
                </div>
            )}

            {/* Texte */}
            {msg.type === 'text' && (
                <span style={{ fontSize:13, color:'#e2e8f0', lineHeight:1.5, wordBreak:'break-word', whiteSpace:'pre-wrap' }}>
              {msg.message}
            </span>
            )}
          </div>

          {/* Heure pour mes messages */}
          {isMine && (
              <div style={{ textAlign:'right', fontSize:10, color:'rgba(255,255,255,0.3)', marginTop:2 }}>
                {formatTime(msg.timestamp)}
              </div>
          )}

          {/* Réactions reçues */}
          {Object.keys(reactionGroups).length > 0 && (
              <div style={{ display:'flex', flexWrap:'wrap', gap:4, marginTop:4 }}>
                {Object.entries(reactionGroups).map(([emoji, users]) => (
                    <button key={emoji} onClick={() => onReact(msg.id, emoji)}
                            title={users.join(', ')}
                            style={{ display:'flex', alignItems:'center', gap:3,
                              background:'rgba(255,255,255,0.08)', border:'1px solid rgba(255,255,255,0.12)',
                              borderRadius:20, padding:'2px 8px', cursor:'pointer',
                              fontSize:12, color:'rgba(255,255,255,0.7)', fontFamily:'inherit' }}>
                      {emoji} <span style={{ fontSize:10 }}>{users.length}</span>
                    </button>
                ))}
              </div>
          )}
        </div>

        {/* Actions au survol */}
        {hover && (
            <div style={{
              position:'absolute', top:-2, [isMine?'left':'right']:0,
              display:'flex', gap:3, zIndex:10,
              background:'#1e2433', border:'1px solid rgba(255,255,255,0.12)',
              borderRadius:10, padding:'3px 5px', boxShadow:'0 4px 16px rgba(0,0,0,0.5)',
            }}>
              {/* Emoji picker rapide */}
              {QUICK_EMOJIS.map(e => (
                  <button key={e} onClick={() => { onReact(msg.id, e); setHover(false); }}
                          style={{ background:'none', border:'none', cursor:'pointer', fontSize:15, padding:'2px 3px',
                            borderRadius:6, transition:'transform .1s' }}
                          onMouseEnter={ev => ev.currentTarget.style.transform='scale(1.3)'}
                          onMouseLeave={ev => ev.currentTarget.style.transform='scale(1)'}>
                    {e}
                  </button>
              ))}
              <div style={{ width:1, background:'rgba(255,255,255,0.1)', margin:'2px 2px' }}/>
              {/* Répondre */}
              <button onClick={() => onReply(msg)}
                      title="Répondre"
                      style={{ background:'none', border:'none', cursor:'pointer', color:'rgba(255,255,255,0.6)',
                        padding:'3px 5px', borderRadius:6, display:'flex', alignItems:'center',
                        transition:'color .15s' }}
                      onMouseEnter={ev => ev.currentTarget.style.color='#fff'}
                      onMouseLeave={ev => ev.currentTarget.style.color='rgba(255,255,255,0.6)'}>
                <Ico.Reply/>
              </button>
              {/* Copier (texte seulement) */}
              {msg.type === 'text' && (
                  <button onClick={handleCopy}
                          title={copied ? 'Copié !' : 'Copier'}
                          style={{ background:'none', border:'none', cursor:'pointer',
                            color: copied ? '#4ade80' : 'rgba(255,255,255,0.6)',
                            padding:'3px 5px', borderRadius:6, display:'flex', alignItems:'center',
                            transition:'color .15s' }}>
                    <Ico.Copy/>
                  </button>
              )}
              {/* Télécharger fichier */}
              {(msg.type === 'file' || msg.type === 'image') && (
                  <button onClick={handleDownload}
                          title="Télécharger"
                          style={{ background:'none', border:'none', cursor:'pointer', color:'rgba(255,255,255,0.6)',
                            padding:'3px 5px', borderRadius:6, display:'flex', alignItems:'center' }}>
                    <Ico.Down/>
                  </button>
              )}
            </div>
        )}
      </div>
  );
}

// ── Barre de progression d'upload ────────────────────────────
function UploadProgress({ fileName, progress, onCancel }) {
  return (
      <div style={{ margin:'4px 12px', background:'rgba(59,130,246,0.1)', border:'1px solid rgba(59,130,246,0.25)',
        borderRadius:10, padding:'8px 10px' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:5 }}>
        <span style={{ fontSize:11, color:'#93c5fd', fontWeight:600, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', maxWidth:180 }}>
          ⬆ {fileName}
        </span>
          <button onClick={onCancel} style={{ background:'none', border:'none', cursor:'pointer', color:'rgba(255,255,255,0.4)', padding:2 }}><Ico.X/></button>
        </div>
        <div style={{ height:4, background:'rgba(255,255,255,0.1)', borderRadius:2, overflow:'hidden' }}>
          <div style={{ height:'100%', width:`${progress}%`, background:'#3b82f6', borderRadius:2, transition:'width .2s' }}/>
        </div>
        <div style={{ fontSize:10, color:'rgba(255,255,255,0.4)', marginTop:3, textAlign:'right' }}>{progress}%</div>
      </div>
  );
}

// ── Aperçu fichier avant envoi ────────────────────────────────
function FilePreview({ file, preview, onRemove }) {
  const isImg = file.type.startsWith('image/');
  return (
      <div style={{ display:'flex', alignItems:'center', gap:8,
        background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.1)',
        borderRadius:10, padding:'6px 10px', margin:'0 12px 6px' }}>
        {isImg && preview ? (
            <img src={preview} alt="" style={{ width:36, height:36, borderRadius:7, objectFit:'cover' }}/>
        ) : (
            <div style={{ width:36, height:36, borderRadius:7, background:'rgba(255,255,255,0.08)',
              display:'flex', alignItems:'center', justifyContent:'center', fontSize:18 }}>
              {getFileIcon(file.type)}
            </div>
        )}
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontSize:12, fontWeight:600, color:'#e2e8f0', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{file.name}</div>
          <div style={{ fontSize:10, color:'rgba(255,255,255,0.4)' }}>{formatSize(file.size)}</div>
        </div>
        <button onClick={onRemove} style={{ background:'rgba(239,68,68,0.15)', border:'none', borderRadius:6, cursor:'pointer',
          color:'#f87171', padding:'4px 6px', display:'flex', alignItems:'center', flexShrink:0 }}>
          <Ico.X/>
        </button>
      </div>
  );
}

// ══════════════════════════════════════════════════════════════
//  COMPOSANT PRINCIPAL
// ══════════════════════════════════════════════════════════════
export default function ChatSidebar({ roomId, userName, userId }) {
  const { socket }        = useSocket();
  const { chatOpen, setChatOpen } = useUI();

  const [messages,    setMessages]    = useState([]);
  const [reactions,   setReactions]   = useState({});    // messageId → [{emoji, userId, userName}]
  const [input,       setInput]       = useState('');
  const [unread,      setUnread]      = useState(0);
  const [isDragging,  setIsDragging]  = useState(false);

  // Fichier en attente
  const [pendingFile,    setPendingFile]    = useState(null);   // File object
  const [filePreview,    setFilePreview]    = useState(null);   // data URL pour images
  const [uploadProgress, setUploadProgress] = useState(null);   // { fileName, progress, transferId }

  // Reply
  const [replyTo, setReplyTo] = useState(null);   // message object

  // Emoji picker
  const [showEmojis, setShowEmojis] = useState(false);
  const EMOJI_LIST = ['😀','😂','😍','🥰','😎','🤔','👍','👎','❤️','🔥','🎉','🙏','😢','😮','✅','❌','🚀','⭐','💡','📌'];

  const endRef    = useRef(null);
  const fileRef   = useRef(null);
  const imgRef    = useRef(null);
  const inputRef  = useRef(null);
  const cancelRef = useRef(null);   // pour annuler un upload

  // ── Auto-scroll ───────────────────────────────────────────
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ── Réinitialiser non-lus quand on ouvre ─────────────────
  useEffect(() => { if (chatOpen) setUnread(0); }, [chatOpen]);

  // ── Socket : recevoir messages + réactions ────────────────
  useEffect(() => {
    if (!socket) return;

    const onMsg = (msg) => {
      setMessages(prev => [...prev, msg]);
      if (!chatOpen) setUnread(n => n + 1);
    };

    const onReaction = ({ messageId, emoji, userId: uid, userName: uname }) => {
      setReactions(prev => {
        const list = prev[messageId] || [];
        // Toggle : si déjà réagi avec ce emoji par cet user → retirer
        const exists = list.findIndex(r => r.userId === uid && r.emoji === emoji);
        const next = exists >= 0
            ? list.filter((_, i) => i !== exists)
            : [...list, { emoji, userId: uid, userName: uname }];
        return { ...prev, [messageId]: next };
      });
    };

    const onProgress = ({ transferId, progress }) => {
      setUploadProgress(prev => prev?.transferId === transferId ? { ...prev, progress } : prev);
    };

    const onReady = ({ transferId }) => {
      // Le serveur confirme → commencer à envoyer les chunks
      if (cancelRef.current?.transferId === transferId) {
        cancelRef.current.send();
      }
    };

    const onError = ({ error }) => {
      alert('Erreur upload : ' + error);
      setUploadProgress(null);
      setPendingFile(null);
      setFilePreview(null);
    };

    socket.on(EVENTS.CHAT,                  onMsg);
    socket.on(EVENTS.CHAT_REACTION,         onReaction);
    socket.on(EVENTS.FILE_TRANSFER_PROGRESS,onProgress);
    socket.on(EVENTS.FILE_TRANSFER_READY,   onReady);
    socket.on(EVENTS.FILE_TRANSFER_ERROR,   onError);

    return () => {
      socket.off(EVENTS.CHAT,                  onMsg);
      socket.off(EVENTS.CHAT_REACTION,         onReaction);
      socket.off(EVENTS.FILE_TRANSFER_PROGRESS,onProgress);
      socket.off(EVENTS.FILE_TRANSFER_READY,   onReady);
      socket.off(EVENTS.FILE_TRANSFER_ERROR,   onError);
    };
  }, [socket, chatOpen]);

  // ── Choisir un fichier ────────────────────────────────────
  const handleFilePicked = useCallback((file) => {
    if (!file) return;
    if (file.size > MAX_FILE_SIZE) { alert(`Fichier trop volumineux (max ${MAX_FILE_MB} Mo)`); return; }
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (!ALLOWED_EXTS.includes(ext)) { alert(`Type de fichier non supporté (.${ext})`); return; }

    setPendingFile(file);
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = e => setFilePreview(e.target.result);
      reader.readAsDataURL(file);
    } else {
      setFilePreview(null);
    }
  }, []);

  // ── Drag & drop ───────────────────────────────────────────
  const onDragOver  = (e) => { e.preventDefault(); setIsDragging(true); };
  const onDragLeave = (e) => { e.preventDefault(); setIsDragging(false); };
  const onDrop      = (e) => {
    e.preventDefault(); setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFilePicked(file);
  };

  // ── Coller image depuis presse-papiers ────────────────────
  const onPaste = useCallback((e) => {
    const items = e.clipboardData?.items;
    for (const item of items || []) {
      if (item.type.startsWith('image/')) {
        const file = item.getAsFile();
        if (file) { handleFilePicked(file); e.preventDefault(); break; }
      }
    }
  }, [handleFilePicked]);

  // ── Envoyer un fichier via chunks ─────────────────────────
  const sendFile = useCallback(async (file) => {
    if (!socket || !file) return;

    // Lire le fichier en base64
    const base64 = await new Promise((res, rej) => {
      const reader = new FileReader();
      reader.onload  = e => res(e.target.result.split(',')[1]);
      reader.onerror = rej;
      reader.readAsDataURL(file);
    });

    const totalChunks = Math.ceil(base64.length / CHUNK_SIZE);
    let cancelled = false;

    // Informer le serveur
    socket.emit(EVENTS.FILE_TRANSFER_START, {
      roomId, userId, userName,
      fileName:    file.name,
      fileType:    file.type,
      fileSize:    file.size,
      totalChunks,
    });

    setUploadProgress({ fileName: file.name, progress: 0, transferId: null });

    // Stocker la fonction d'envoi pour que le serveur puisse la déclencher via FILE_TRANSFER_READY
    cancelRef.current = {
      transferId: null,
      cancel: () => { cancelled = true; },
      send: async () => {
        // Envoyer chunk par chunk
        for (let i = 0; i < totalChunks; i++) {
          if (cancelled) break;
          const chunk = base64.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE);
          socket.emit(EVENTS.FILE_TRANSFER_CHUNK, {
            transferId: cancelRef.current.transferId,
            chunkIndex: i,
            data:       chunk,
          });
          // Petite pause pour ne pas saturer le socket
          if (i % 4 === 0) await new Promise(r => setTimeout(r, 10));
        }
        setUploadProgress(null);
        setPendingFile(null);
        setFilePreview(null);
      },
    };

    // Le serveur répond avec FILE_TRANSFER_READY et un transferId
    // → le handler onReady dans useEffect déclenche cancelRef.current.send()
  }, [socket, roomId, userId, userName]);

  // ── Envoyer (texte ou fichier) ────────────────────────────
  const handleSend = useCallback(() => {
    if (pendingFile) {
      sendFile(pendingFile);
      return;
    }
    const text = input.trim();
    if (!text) return;

    socket?.emit(EVENTS.CHAT, {
      roomId, message: text, userId, userName,
      replyTo: replyTo ? { id: replyTo.id, message: replyTo.message, fileName: replyTo.fileName, userName: replyTo.userName } : null,
    });
    setInput('');
    setReplyTo(null);
    setShowEmojis(false);
  }, [pendingFile, input, socket, roomId, userId, userName, replyTo, sendFile]);

  // ── Réagir à un message ───────────────────────────────────
  const handleReact = useCallback((messageId, emoji) => {
    socket?.emit(EVENTS.CHAT_REACTION, { roomId, messageId, emoji, userId, userName });
  }, [socket, roomId, userId, userName]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const addEmoji = (emoji) => { setInput(prev => prev + emoji); setShowEmojis(false); inputRef.current?.focus(); };

  if (!chatOpen) return null;

  return (
      <div
          style={{
            display:'flex', flexDirection:'column', height:'100%', width:300,
            background:'#0f1623',
            borderLeft:'1px solid rgba(255,255,255,0.07)',
            fontFamily:"'DM Sans', system-ui, sans-serif",
            position:'relative',
          }}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
      >

        {/* ── Overlay drag & drop ── */}
        {isDragging && (
            <div style={{ position:'absolute', inset:0, zIndex:50, background:'rgba(59,130,246,0.15)',
              border:'2px dashed #3b82f6', borderRadius:0, display:'flex',
              alignItems:'center', justifyContent:'center', flexDirection:'column', gap:8, pointerEvents:'none' }}>
              <span style={{ fontSize:32 }}>📎</span>
              <span style={{ fontSize:14, fontWeight:700, color:'#60a5fa' }}>Déposer le fichier ici</span>
            </div>
        )}

        {/* ── Header ── */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between',
          padding:'12px 14px', borderBottom:'1px solid rgba(255,255,255,0.07)',
          background:'rgba(255,255,255,0.02)', flexShrink:0 }}>
          <div>
            <div style={{ fontSize:13, fontWeight:700, color:'#f1f5f9' }}>
              💬 Discussion
            </div>
            <div style={{ fontSize:10, color:'rgba(255,255,255,0.3)', marginTop:1 }}>
              {messages.length} message{messages.length !== 1 ? 's' : ''}
            </div>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:6 }}>
            {unread > 0 && (
                <div style={{ background:'#ef4444', color:'#fff', borderRadius:20,
                  padding:'1px 7px', fontSize:10, fontWeight:800 }}>
                  {unread}
                </div>
            )}
            <button onClick={() => setChatOpen(false)} style={{ width:26, height:26, borderRadius:'50%',
              border:'none', background:'rgba(255,255,255,0.07)', color:'rgba(255,255,255,0.5)',
              cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center',
              transition:'all .15s' }}
                    onMouseEnter={e => { e.currentTarget.style.background='rgba(255,255,255,0.14)'; e.currentTarget.style.color='#fff'; }}
                    onMouseLeave={e => { e.currentTarget.style.background='rgba(255,255,255,0.07)'; e.currentTarget.style.color='rgba(255,255,255,0.5)'; }}>
              <Ico.Close/>
            </button>
          </div>
        </div>

        {/* ── Zone messages ── */}
        <div style={{ flex:1, overflowY:'auto', padding:'12px 10px 4px', display:'flex', flexDirection:'column', gap:2 }}
             onPaste={onPaste}>

          {messages.length === 0 ? (
              <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
                color:'rgba(255,255,255,0.2)', textAlign:'center', gap:10 }}>
                <span style={{ fontSize:36 }}>💬</span>
                <div>
                  <div style={{ fontSize:13, fontWeight:600, marginBottom:4 }}>Commencez la discussion</div>
                  <div style={{ fontSize:11, lineHeight:1.5 }}>Envoyez un message, une image<br/>ou un fichier à votre équipe.</div>
                </div>
              </div>
          ) : (
              messages.map(msg => (
                  <MessageBubble
                      key={msg.id}
                      msg={msg}
                      isMine={msg.socketId === socket?.id}
                      onReply={setReplyTo}
                      onReact={handleReact}
                      reactions={reactions[msg.id]}
                      myId={socket?.id}
                  />
              ))
          )}
          <div ref={endRef}/>
        </div>

        {/* ── Barre de progression upload ── */}
        {uploadProgress && (
            <UploadProgress
                fileName={uploadProgress.fileName}
                progress={uploadProgress.progress}
                onCancel={() => {
                  cancelRef.current?.cancel?.();
                  setUploadProgress(null);
                  setPendingFile(null);
                  setFilePreview(null);
                }}
            />
        )}

        {/* ── Aperçu fichier sélectionné ── */}
        {pendingFile && !uploadProgress && (
            <FilePreview
                file={pendingFile}
                preview={filePreview}
                onRemove={() => { setPendingFile(null); setFilePreview(null); }}
            />
        )}

        {/* ── Reply preview ── */}
        {replyTo && (
            <div style={{ margin:'0 12px 4px', display:'flex', alignItems:'center', gap:8,
              borderLeft:'2.5px solid #3b82f6', paddingLeft:8,
              background:'rgba(59,130,246,0.08)', borderRadius:'0 8px 8px 0', padding:'6px 8px 6px 10px' }}>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:10, color:'#93c5fd', fontWeight:700, marginBottom:2 }}>↩ {replyTo.userName}</div>
                <div style={{ fontSize:11, color:'rgba(255,255,255,0.5)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                  {replyTo.message || replyTo.fileName}
                </div>
              </div>
              <button onClick={() => setReplyTo(null)} style={{ background:'none', border:'none', cursor:'pointer', color:'rgba(255,255,255,0.4)', flexShrink:0 }}><Ico.X/></button>
            </div>
        )}

        {/* ── Emoji picker ── */}
        {showEmojis && (
            <div style={{ margin:'0 12px 6px', background:'#1e2433', border:'1px solid rgba(255,255,255,0.1)',
              borderRadius:12, padding:10, display:'flex', flexWrap:'wrap', gap:4 }}>
              {EMOJI_LIST.map(e => (
                  <button key={e} onClick={() => addEmoji(e)}
                          style={{ background:'none', border:'none', cursor:'pointer', fontSize:20, padding:'3px 4px',
                            borderRadius:7, transition:'transform .1s' }}
                          onMouseEnter={ev => ev.currentTarget.style.transform='scale(1.35)'}
                          onMouseLeave={ev => ev.currentTarget.style.transform='scale(1)'}>
                    {e}
                  </button>
              ))}
            </div>
        )}

        {/* ── Zone de saisie ── */}
        <div style={{ padding:'8px 10px 10px', borderTop:'1px solid rgba(255,255,255,0.07)', flexShrink:0 }}>

          {/* Barre d'outils */}
          <div style={{ display:'flex', gap:4, marginBottom:6 }}>
            {/* Image */}
            <button onClick={() => imgRef.current?.click()}
                    title="Envoyer une image"
                    style={{ width:28, height:28, borderRadius:7, border:'1px solid rgba(255,255,255,0.1)',
                      background:'rgba(255,255,255,0.06)', color:'rgba(255,255,255,0.55)', cursor:'pointer',
                      display:'flex', alignItems:'center', justifyContent:'center', transition:'all .15s' }}
                    onMouseEnter={e => { e.currentTarget.style.background='rgba(255,255,255,0.12)'; e.currentTarget.style.color='#fff'; }}
                    onMouseLeave={e => { e.currentTarget.style.background='rgba(255,255,255,0.06)'; e.currentTarget.style.color='rgba(255,255,255,0.55)'; }}>
              <Ico.Img/>
            </button>
            {/* Fichier */}
            <button onClick={() => fileRef.current?.click()}
                    title="Joindre un fichier"
                    style={{ width:28, height:28, borderRadius:7, border:'1px solid rgba(255,255,255,0.1)',
                      background:'rgba(255,255,255,0.06)', color:'rgba(255,255,255,0.55)', cursor:'pointer',
                      display:'flex', alignItems:'center', justifyContent:'center', transition:'all .15s' }}
                    onMouseEnter={e => { e.currentTarget.style.background='rgba(255,255,255,0.12)'; e.currentTarget.style.color='#fff'; }}
                    onMouseLeave={e => { e.currentTarget.style.background='rgba(255,255,255,0.06)'; e.currentTarget.style.color='rgba(255,255,255,0.55)'; }}>
              <Ico.Attach/>
            </button>
            {/* Emoji */}
            <button onClick={() => setShowEmojis(o => !o)}
                    title="Emoji"
                    style={{ width:28, height:28, borderRadius:7, border:'1px solid rgba(255,255,255,0.1)',
                      background: showEmojis ? 'rgba(245,158,11,0.2)' : 'rgba(255,255,255,0.06)',
                      color: showEmojis ? '#fbbf24' : 'rgba(255,255,255,0.55)', cursor:'pointer',
                      display:'flex', alignItems:'center', justifyContent:'center', transition:'all .15s' }}>
              <Ico.Emoji/>
            </button>

            {/* Tip drag & drop */}
            <div style={{ marginLeft:'auto', fontSize:9, color:'rgba(255,255,255,0.2)', alignSelf:'center', lineHeight:1.3 }}>
              Glisser-déposer<br/>ou Ctrl+V pour coller
            </div>
          </div>

          {/* Input texte */}
          <div style={{ display:'flex', gap:6, alignItems:'flex-end' }}>
          <textarea
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              onPaste={onPaste}
              placeholder={pendingFile ? `Ajouter un message… (Entrée pour envoyer)` : 'Message… (Maj+Entrée = nouvelle ligne)'}
              rows={1}
              style={{
                flex:1, background:'rgba(255,255,255,0.07)', border:'1px solid rgba(255,255,255,0.1)',
                borderRadius:10, padding:'8px 11px', color:'#e2e8f0', fontSize:13,
                fontFamily:'inherit', resize:'none', outline:'none', lineHeight:1.5,
                maxHeight:100, overflowY:'auto',
                transition:'border-color .15s',
              }}
              onFocus={e => e.currentTarget.style.borderColor='rgba(59,130,246,0.5)'}
              onBlur={e => e.currentTarget.style.borderColor='rgba(255,255,255,0.1)'}
          />
            <button
                onClick={handleSend}
                disabled={!input.trim() && !pendingFile}
                style={{
                  width:36, height:36, borderRadius:10, border:'none', flexShrink:0,
                  background: (input.trim() || pendingFile) ? '#3b82f6' : 'rgba(255,255,255,0.06)',
                  color: (input.trim() || pendingFile) ? '#fff' : 'rgba(255,255,255,0.25)',
                  cursor: (input.trim() || pendingFile) ? 'pointer' : 'not-allowed',
                  display:'flex', alignItems:'center', justifyContent:'center',
                  transition:'all .15s',
                  boxShadow: (input.trim() || pendingFile) ? '0 2px 12px rgba(59,130,246,0.4)' : 'none',
                }}>
              <Ico.Send/>
            </button>
          </div>

          {/* Inputs fichiers cachés */}
          <input ref={imgRef} type="file" accept="image/*" style={{display:'none'}} onChange={e => { handleFilePicked(e.target.files?.[0]); e.target.value=''; }}/>
          <input ref={fileRef} type="file" accept={ALLOWED_EXTS.map(e=>'.'+e).join(',')} style={{display:'none'}} onChange={e => { handleFilePicked(e.target.files?.[0]); e.target.value=''; }}/>
        </div>

        <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap');
        ::-webkit-scrollbar{width:4px} ::-webkit-scrollbar-track{background:transparent} ::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.1);border-radius:2px}
      `}</style>
      </div>
  );
}