import { useEffect, useRef } from 'react';
import { useMedia }  from '../../context/MediaContext.jsx';
import { useRoom }   from '../../context/RoomContext.jsx';
import { useUI }     from '../../context/UIContext.jsx';
import { useSocket } from '../../context/SocketContext.jsx';
import VideoTile     from './VideoTile.jsx';

// ─── PiP Camera overlay ───────────────────────────────
function PipCamera({ stream, name, muted, videoOff }) {
    const videoRef = useRef(null);

    useEffect(() => {
        const el = videoRef.current;
        if (!el || !stream) return;
        el.srcObject = stream;
        el.play().catch(() => {});
        return () => { el.srcObject = null; };
    }, [stream]);

    return (
        <div style={{
            position: 'absolute',
            bottom: 80,
            right: 16,
            width: 200,
            height: 113,
            zIndex: 60,
            borderRadius: 12,
            overflow: 'hidden',
            border: '2px solid rgba(255,255,255,0.25)',
            background: '#111',
        }}>
            {stream && !videoOff ? (
                <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        // ✅ ONLY LOCAL CAM MIRROR HERE
                        transform: 'scaleX(-1)',
                    }}
                />
            ) : (
                <div style={{ color: '#fff', textAlign: 'center' }}>
                    {name}
                </div>
            )}
        </div>
    );
}

// ─── SCREEN SHARE MODE ───────────────────────────────
function ScreenShareView({ screenStream, localStream }) {
    const videoRef = useRef(null);

    useEffect(() => {
        const el = videoRef.current;
        if (!el || !screenStream) return;

        el.srcObject = screenStream;

        // ❌ IMPORTANT FIX: NEVER mirror screen share
        el.style.transform = 'none';
        el.style.objectFit = 'contain';

        el.play().catch(() => {});
        return () => { el.srcObject = null; };
    }, [screenStream]);

    return (
        <div style={{
            width: '100%',
            height: '100%',
            background: '#000',
            position: 'relative'
        }}>
            <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'contain',
                    transform: 'none'
                }}
            />
        </div>
    );
}

// ─── MAIN GRID ───────────────────────────────
export default function VideoGrid() {
    const {
        localStream,
        remoteStreams,
        audioEnabled,
        videoEnabled,
        screenStream,
    } = useMedia();

    const { participants, hostId } = useRoom();
    const { activeSpeakerId, layout } = useUI();
    const { socket } = useSocket();

    // ✅ SCREEN SHARE MODE SAFE
    if (screenStream) {
        return (
            <ScreenShareView
                screenStream={screenStream}
                localStream={localStream}
            />
        );
    }

    // ─── GRID MODE ───────────────────────────────
    const cols = Math.min(4, Math.max(1, participants.length + 1));

    return (
        <div style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${cols}, 1fr)`,
            gap: 6,
            padding: 6,
            height: '100%',
            background: '#080c14',
        }}>
            {/* LOCAL */}
            <VideoTile
                stream={localStream}
                name="Vous"
                isLocal
                muted={!audioEnabled}
                videoOff={!videoEnabled}
            />

            {/* REMOTE */}
            {participants.map(p => (
                <VideoTile
                    key={p.socketId}
                    stream={remoteStreams.get(p.socketId)}
                    name={p.name}
                    socketId={p.socketId}
                    muted={!p.audioEnabled}
                    videoOff={!p.videoEnabled}
                    isHost={p.socketId === hostId}
                    isActive={activeSpeakerId === p.socketId}
                />
            ))}
        </div>
    );
}