/**
 * ControlBar.jsx — Barre de contrôle complète
 *
 * Inclut directement :
 *  - Le moteur d'arrière-plan virtuel (BodyPix + canvas pipeline)
 *  - Le panneau de sélection (flou / images / couleurs)
 *  - Le bouton "Fond" visible dans la barre
 *
 * Aucun fichier supplémentaire requis.
 * Placer dans : client/src/components/controls/ControlBar.jsx
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import { useMedia }       from '../../context/MediaContext.jsx';
import { useRoom }        from '../../context/RoomContext.jsx';
import { useUI }          from '../../context/UIContext.jsx';
import { useScreenShare } from '../../hooks/useScreenShare.js';
import { useRecording }   from '../../hooks/useRecording.js';
import ReactionBar        from './ReactionBar.jsx';

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
    const [tab,      setTab]      = useState('blur');
    const [phase,    setPhase]    = useState('idle'); // idle|loading|active|error
    const [msg,      setMsg]      = useState('');
    const [mode,     setMode]     = useState(null);   // null|blur|image|color
    const [selId,    setSelId]    = useState(null);
    const [blur,     setBlur]     = useState(14);
    const [color,    setColor]    = useState('#0f172a');
    const [custom,   setCustom]   = useState(null);

    const rafRef     = useRef(null);
    const canvasRef  = useRef(null);
    const hidVidRef  = useRef(null);
    const outStRef   = useRef(null);
    const origTrRef  = useRef(null);
    const segRef     = useRef(null);
    const frmRef     = useRef(0);
    const modeRef    = useRef(null);
    const blurRef    = useRef(14);
    const imgRef     = useRef(null);
    const colorRef   = useRef('#0f172a');
    const cacheRef   = useRef({});
    const prevRef    = useRef(null);
    const fileRef    = useRef(null);

    // Sync refs
    useEffect(() => { modeRef.current = mode; },  [mode]);
    useEffect(() => { blurRef.current = blur; },  [blur]);
    useEffect(() => { colorRef.current = color; }, [color]);

    // Init DOM elements
    useEffect(() => {
        const c = document.createElement('canvas'); c.width = 1280; c.height = 720; canvasRef.current = c;
        const v = document.createElement('video'); v.autoplay = true; v.playsInline = true; v.muted = true; hidVidRef.current = v;
        if (localStream) { v.srcObject = localStream; v.play().catch(() => {}); }
        return () => stopEngine();
    }, []);

    // Live preview update
    useEffect(() => {
        const el = prevRef.current; if (!el) return;
        const st = (mode && outStRef.current) ? outStRef.current : localStream;
        if (st && el.srcObject !== st) { el.srcObject = st; el.play().catch(() => {}); }
    });

    // Render loop
    const loop = useCallback(async () => {
        const v = hidVidRef.current, c = canvasRef.current; if (!v || !c || v.readyState < 2) { rafRef.current = requestAnimationFrame(loop); return; }
        const ctx = c.getContext('2d'), W = v.videoWidth || 1280, H = v.videoHeight || 720;
        if (c.width !== W) c.width = W; if (c.height !== H) c.height = H;
        frmRef.current++;
        if (bpNet && modeRef.current && frmRef.current % 3 === 0) {
            try { segRef.current = await bpNet.segmentPerson(v, { flipHorizontal:false, internalResolution:'medium', segmentationThreshold:0.68 }); } catch {}
        }
        const seg = segRef.current, m = modeRef.current;
        if (!m || !seg) { ctx.drawImage(v, 0, 0, W, H); }
        else if (m === 'blur') { ctx.filter = `blur(${blurRef.current}px)`; ctx.drawImage(v, 0, 0, W, H); ctx.filter = 'none'; compositePersonOnBg(ctx, v, seg, W, H); }
        else if (m === 'image' && imgRef.current) { drawImageCover(ctx, imgRef.current, W, H); compositePersonOnBg(ctx, v, seg, W, H); }
        else if (m === 'color') { ctx.fillStyle = colorRef.current; ctx.fillRect(0, 0, W, H); compositePersonOnBg(ctx, v, seg, W, H); }
        else ctx.drawImage(v, 0, 0, W, H);
        rafRef.current = requestAnimationFrame(loop);
    }, []);

    const stopEngine = useCallback(() => {
        if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null; }
        const ot = origTrRef.current;
        if (ot && peerConnections?.current) peerConnections.current.forEach(pc => { const s = pc.getSenders().find(s => s.track?.kind === 'video'); if (s) s.replaceTrack(ot).catch(() => {}); });
        segRef.current = null; frmRef.current = 0;
    }, [peerConnections]);

    const startEngine = useCallback(async (newMode) => {
        setPhase('loading');
        try {
            await ensureBodyPix(m => setMsg(m));

            if (!origTrRef.current && localStream) {
                origTrRef.current = localStream.getVideoTracks()[0];
            }

            // ✅ 1. définir le mode AVANT le loop
            modeRef.current = newMode;
            setMode(newMode);

            // ✅ 2. démarrer le rendu AVANT capture
            if (rafRef.current) cancelAnimationFrame(rafRef.current);
            rafRef.current = requestAnimationFrame(loop);

            // ✅ 3. attendre 1 frame (IMPORTANT)
            await new Promise(r => setTimeout(r, 100));

            // ✅ 4. capturer le stream APRÈS que le canvas dessine
            if (!outStRef.current) {
                outStRef.current = canvasRef.current.captureStream(24);
            }

            const ct = outStRef.current.getVideoTracks()[0];

            console.log('Canvas track:', ct);

            // ✅ 5. remplacer track
            if (ct && peerConnections?.current) {
                peerConnections.current.forEach(pc => {
                    const s = pc.getSenders().find(s => s.track?.kind === 'video');
                    if (s) s.replaceTrack(ct).catch(console.error);
                });
            }

            setPhase('active');
            setMsg('');
            onActiveChange?.(true);

        } catch (e) {
            console.error(e);
            setPhase('error');
            setMsg('Erreur de chargement. Vérifiez votre connexion.');
        }
    }, [localStream, peerConnections, loop, onActiveChange]);

    const loadImg = (p) => new Promise(res => {
        if (cacheRef.current[p.id]) { res(cacheRef.current[p.id]); return; }
        const img = new Image(); img.crossOrigin = 'anonymous';
        img.onload = () => { cacheRef.current[p.id] = img; res(img); }; img.onerror = () => res(null); img.src = p.url;
    });

    const applyBlurMode = () => { setSelId('__blur__'); startEngine('blur'); };
    const applyPreset = async (p) => { setSelId(p.id); const img = await loadImg(p); imgRef.current = img; startEngine('image'); };
    const applyColor  = (c) => { setColor(c); colorRef.current = c; setSelId('__c_' + c); startEngine('color'); };
    const removeAll   = () => { setSelId(null); setMode(null); stopEngine(); setPhase('idle'); onActiveChange?.(false); };

    const handleUpload = (e) => {
        const f = e.target.files?.[0]; if (!f) return;
        const r = new FileReader(); r.onload = ev => {
            const img = new Image(); img.onload = () => {
                const p = { id:'__custom__', emoji:'🖼️', label:f.name.slice(0,12), color:'#111', url:ev.target.result };
                cacheRef.current['__custom__'] = img; imgRef.current = img;
                setCustom(p); setSelId('__custom__'); setTab('image'); startEngine('image');
            }; img.src = ev.target.result;
        }; r.readAsDataURL(f);
    };

    const allPresets = [...BG_PRESETS, ...(custom ? [custom] : [])];

    const statusColor = phase==='active'?'#4ade80':phase==='error'?'#f87171':phase==='loading'?'#fbbf24':'rgba(255,255,255,0.35)';
    const statusText  = phase==='active'?'✓ Fond actif':phase==='loading'?`⏳ ${msg||'…'}`:phase==='error'?`⚠ ${msg}`:'Choisissez un fond ou un flou';

    return (
        <div
            style={{
                display: open ? 'flex' : 'none', // ✅ AJOUT ICI
                position: 'fixed',
                inset: 0,
                zIndex: 300,
                alignItems: 'flex-end',
                justifyContent: 'center',
                background: 'rgba(0,0,0,0.72)',
                backdropFilter: 'blur(3px)',
                fontFamily: "'DM Sans',system-ui,sans-serif"
            }}
            onClick={e => { if (e.target === e.currentTarget) onClose(); }}
        >
            <div style={{
                width: '100%',
                maxWidth: 800,
                background: '#111827',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '22px 22px 0 0',
                animation: 'bsUp .28s cubic-bezier(.34,1.2,.64,1)'
            }}>

                <div style={{ display:'flex' }}>

                    {/* Aperçu */}
                    <div style={{ width:230,flexShrink:0,padding:12,borderRight:'1px solid rgba(255,255,255,0.07)' }}>
                        <div style={{ position:'relative',aspectRatio:'16/9',borderRadius:10,overflow:'hidden',background:'#0d1117',marginBottom:10 }}>
                            <video ref={prevRef} autoPlay playsInline muted style={{ width:'100%',height:'100%',objectFit:'cover',display:'block' }}/>
                            {phase==='loading' && (<div style={{ position:'absolute',inset:0,background:'rgba(0,0,0,0.72)',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:7 }}><div style={{ width:18,height:18,border:'2.5px solid #3b82f6',borderTopColor:'transparent',borderRadius:'50%',animation:'bsSpin .8s linear infinite' }}/><span style={{ fontSize:9,color:'rgba(255,255,255,0.5)',textAlign:'center',padding:'0 6px' }}>{msg}</span></div>)}
                            <div style={{ position:'absolute',bottom:5,left:6,fontSize:9,color:'rgba(255,255,255,0.4)',background:'rgba(0,0,0,0.5)',borderRadius:4,padding:'2px 6px' }}>{phase==='active'?'● FOND ACTIF':'Aperçu'}</div>
                        </div>
                        <div style={{ background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.08)',borderRadius:8,padding:'7px 10px',marginBottom:8 }}>
                            <div style={{ fontSize:9,color:'rgba(255,255,255,0.3)',textTransform:'uppercase',letterSpacing:'.07em',marginBottom:2 }}>Mode actif</div>
                            <div style={{ fontSize:12,fontWeight:700,color:mode?'#60a5fa':'rgba(255,255,255,0.3)' }}>
                                {!mode?'Aucun':mode==='blur'?`Flou (${blur}px)`:mode==='image'?'Image':mode==='color'?'Couleur':'—'}
                            </div>
                        </div>
                        <button onClick={removeAll} disabled={!mode} style={{ width:'100%',padding:'7px',borderRadius:8,border:'1px solid rgba(255,255,255,0.09)',background:mode?'rgba(239,68,68,0.12)':'rgba(255,255,255,0.04)',color:mode?'#f87171':'rgba(255,255,255,0.25)',fontSize:11,fontWeight:700,cursor:mode?'pointer':'not-allowed',fontFamily:'inherit',transition:'all .15s',marginBottom:8 }}>
                            {mode?'✕ Désactiver':'Aucun fond'}
                        </button>
                        <p style={{ fontSize:9,color:'rgba(255,255,255,0.18)',lineHeight:1.5,textAlign:'center' }}>BodyPix · TF.js<br/>Chargé 1 seule fois • ~4 MB</p>
                    </div>

                    {/* Sélection */}
                    <div style={{ flex:1,padding:12,overflowY:'auto',maxHeight:400 }}>

                        {/* Tabs */}
                        <div style={{ display:'flex',gap:3,marginBottom:12,background:'rgba(255,255,255,0.05)',borderRadius:9,padding:3 }}>
                            {[['blur','🌫 Flou'],['image','🖼 Images'],['color','🎨 Couleurs']].map(([k,l]) => (
                                <button key={k} onClick={()=>setTab(k)} style={{ flex:1,padding:'7px 4px',borderRadius:7,border:'none',cursor:'pointer',fontFamily:'inherit',background:tab===k?'rgba(59,130,246,0.28)':'transparent',color:tab===k?'#60a5fa':'rgba(255,255,255,0.4)',fontSize:11,fontWeight:700,borderBottom:tab===k?'2px solid #3b82f6':'2px solid transparent',transition:'all .15s' }}>{l}</button>
                            ))}
                        </div>

                        {/* Tab Flou */}
                        {tab==='blur' && (
                            <div>
                                <p style={{ fontSize:12,color:'rgba(255,255,255,0.4)',marginBottom:10 }}>Votre silhouette reste nette, l'arrière-plan est flouté.</p>
                                <div style={{ display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:7,marginBottom:12 }}>
                                    {[['Léger',6],['Moyen',14],['Fort',24]].map(([lb,v]) => (
                                        <button key={v} onClick={()=>{ setBlur(v); blurRef.current=v; setSelId('__blur__'); startEngine('blur'); }} style={{ borderRadius:9,border:'none',cursor:'pointer',fontFamily:'inherit',padding:'9px 5px',background:selId==='__blur__'&&blur===v?'rgba(59,130,246,0.25)':'rgba(255,255,255,0.06)',color:selId==='__blur__'&&blur===v?'#60a5fa':'rgba(255,255,255,0.6)',fontSize:11,fontWeight:700,borderBottom:`2px solid ${selId==='__blur__'&&blur===v?'#3b82f6':'transparent'}` }}>
                                            <div style={{ height:28,borderRadius:5,background:'rgba(255,255,255,0.08)',filter:`blur(${v/4}px)`,marginBottom:5 }}/>
                                            {lb}<br/><span style={{fontSize:9,opacity:.6}}>{v}px</span>
                                        </button>
                                    ))}
                                </div>
                                <div style={{ marginBottom:12 }}>
                                    <div style={{ display:'flex',justifyContent:'space-between',fontSize:11,color:'rgba(255,255,255,0.4)',marginBottom:4 }}>
                                        <span>Intensité</span><span style={{color:'#60a5fa',fontWeight:700}}>{blur}px</span>
                                    </div>
                                    <input type="range" min="4" max="30" step="1" value={blur} onChange={e=>{const v=+e.target.value;setBlur(v);blurRef.current=v;}} style={{width:'100%',accentColor:'#3b82f6'}}/>
                                </div>
                                <button onClick={applyBlurMode} style={{ width:'100%',padding:'10px',borderRadius:9,border:'none',cursor:'pointer',background:selId==='__blur__'?'rgba(59,130,246,0.2)':'linear-gradient(135deg,#3b82f6,#2563eb)',color:'#fff',fontSize:13,fontWeight:700,fontFamily:'inherit',boxShadow:selId==='__blur__'?'none':'0 4px 16px rgba(59,130,246,0.35)' }}>
                                    {selId==='__blur__'?'✓ Flou appliqué':'🌫 Appliquer le flou'}
                                </button>
                            </div>
                        )}

                        {/* Tab Images */}
                        {tab==='image' && (
                            <div>
                                <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:10 }}>
                                    <span style={{ fontSize:12,color:'rgba(255,255,255,0.4)' }}>{allPresets.length} fonds</span>
                                    <button onClick={()=>fileRef.current?.click()} style={{ display:'flex',alignItems:'center',gap:5,padding:'5px 10px',borderRadius:7,border:'1px solid rgba(255,255,255,0.14)',background:'rgba(255,255,255,0.07)',color:'rgba(255,255,255,0.7)',fontSize:11,fontWeight:700,cursor:'pointer',fontFamily:'inherit' }}><I.Upload/> Importer</button>
                                    <input ref={fileRef} type="file" accept="image/*" style={{display:'none'}} onChange={handleUpload}/>
                                </div>
                                <div style={{ display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:7 }}>
                                    {allPresets.map(p => <ThumbCard key={p.id} p={p} sel={selId===p.id} loading={phase==='loading'&&selId===p.id} onClick={()=>applyPreset(p)}/>)}
                                </div>
                            </div>
                        )}

                        {/* Tab Couleurs */}
                        {tab==='color' && (
                            <div>
                                <p style={{ fontSize:12,color:'rgba(255,255,255,0.4)',marginBottom:12 }}>Arrière-plan remplacé par une couleur unie.</p>
                                <div style={{ display:'flex',flexWrap:'wrap',gap:8,marginBottom:12 }}>
                                    {BG_COLORS.map(c => (
                                        <button key={c} onClick={()=>applyColor(c)} style={{ width:40,height:40,borderRadius:9,border:'none',background:c,cursor:'pointer',outline:selId==='__c_'+c?'3px solid #60a5fa':'2px solid rgba(255,255,255,0.1)',outlineOffset:2,transform:selId==='__c_'+c?'scale(0.9)':'scale(1)',transition:'all .15s',display:'flex',alignItems:'center',justifyContent:'center' }}>
                                            {selId==='__c_'+c&&<I.Check/>}
                                        </button>
                                    ))}
                                </div>
                                <div style={{ display:'flex',gap:10,alignItems:'center',marginBottom:10 }}>
                                    <input type="color" value={color} onChange={e=>applyColor(e.target.value)} style={{ width:40,height:40,borderRadius:9,border:'none',cursor:'pointer',padding:2 }}/>
                                    <span style={{ fontSize:13,color:'#e2e8f0',fontFamily:'monospace',fontWeight:700 }}>{color.toUpperCase()}</span>
                                    <div style={{ flex:1,height:40,borderRadius:9,background:color,border:'1px solid rgba(255,255,255,0.1)' }}/>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div style={{ borderTop:'1px solid rgba(255,255,255,0.06)',padding:'7px 16px',display:'flex',alignItems:'center',gap:6,background:'rgba(255,255,255,0.02)' }}>
                    <span style={{ fontSize:9 }}>⚡</span>
                    <span style={{ fontSize:10,color:'rgba(255,255,255,0.22)',lineHeight:1.4 }}>Traitement 100% local via TensorFlow.js BodyPix — GPU recommandé pour les meilleures performances.</span>
                </div>
            </div>
            <style>{`@keyframes bsUp{from{transform:translateY(40px);opacity:0}to{transform:translateY(0);opacity:1}} @keyframes bsSpin{to{transform:rotate(360deg)}}`}</style>
        </div>
    );
}

function ThumbCard({ p, sel, loading, onClick }) {
    const [loaded, setLoaded] = useState(false);
    return (
        <button onClick={onClick} style={{ position:'relative',width:'100%',aspectRatio:'16/9',borderRadius:8,overflow:'hidden',border:'none',cursor:'pointer',background:p.color||'#1e2433',outline:sel?'2.5px solid #60a5fa':'1.5px solid rgba(255,255,255,0.1)',outlineOffset:0,transform:sel?'scale(0.96)':'scale(1)',transition:'all .15s' }}
                onMouseEnter={e=>{if(!sel)e.currentTarget.style.outlineColor='rgba(96,165,250,0.45)';}}
                onMouseLeave={e=>{if(!sel)e.currentTarget.style.outlineColor='rgba(255,255,255,0.1)';}}>
            {p.url&&<img src={p.url} alt={p.label} onLoad={()=>setLoaded(true)} style={{ position:'absolute',inset:0,width:'100%',height:'100%',objectFit:'cover',opacity:loaded?1:0,transition:'opacity .3s' }}/>}
            <div style={{ position:'absolute',bottom:0,left:0,right:0,background:'linear-gradient(transparent,rgba(0,0,0,0.75))',padding:'10px 4px 4px',fontSize:9,fontWeight:700,color:'#fff',textAlign:'center' }}>{p.emoji} {p.label}</div>
            {sel&&<div style={{ position:'absolute',top:4,right:4,width:17,height:17,borderRadius:'50%',background:'#3b82f6',display:'flex',alignItems:'center',justifyContent:'center' }}><I.Check/></div>}
            {loading&&sel&&<div style={{ position:'absolute',inset:0,background:'rgba(0,0,0,0.6)',display:'flex',alignItems:'center',justifyContent:'center' }}><div style={{ width:15,height:15,border:'2.5px solid #60a5fa',borderTopColor:'transparent',borderRadius:'50%',animation:'bsSpin .8s linear infinite' }}/></div>}
        </button>
    );
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
    const { isSharing, toggle: toggleScreen }      = useScreenShare();
    const { isRecording, toggle: toggleRecording } = useRecording();

    const [bgOpen,   setBgOpen]   = useState(false);
    const [bgActive, setBgActive] = useState(false);

    return (
        <>
            <div className="bg-gray-900 border-t border-gray-800 px-4 py-3 flex items-center justify-between gap-2 shadow-2xl" style={{ minHeight:'84px' }}>

                {/* Gauche */}
                <div className="hidden md:flex items-center gap-3 w-48 shrink-0">
                    {locked && (<span className="flex items-center gap-1.5 text-yellow-400 text-xs font-medium"><svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>Verrouillée</span>)}
                    {isSharing && (<button onClick={toggleScreen} className="flex items-center gap-2 px-3 py-2 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded-xl"><svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><rect x="6" y="6" width="12" height="12" rx="1"/></svg>Stop Share</button>)}
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

                    <ZoomBtn onClick={toggleScreen} highlight={isSharing} pulse={isSharing} icon={<I.Share/>} label={isSharing?'Arrêter':'Partager'} title="Partager l'écran"/>
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
                    open={bgOpen} // ✅ IMPORTANT
                    localStream={localStream}
                    peerConnections={peerConnections}
                    onClose={() => setBgOpen(false)}
                    onActiveChange={active => {
                        setBgActive(active);
                        if (!active) setBgOpen(false);
                    }}
                />
            )}
        </>
    );
}