import { useEffect, useMemo, useRef, useState } from 'react';

const SOURCES = [
    {
        id: 'monitor',
        label: 'Plein ecran',
        title: 'Partager tout l’ecran',
        description: 'Ideal pour une demo complete avec plusieurs applications.',
        tip: 'Les participants verront tout ce qui apparait sur votre moniteur.',
        accent: '#22c55e',
        icon: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                <rect x="2" y="3" width="20" height="14" rx="2" />
                <path d="M8 21h8M12 17v4" />
            </svg>
        ),
    },
    {
        id: 'window',
        label: 'Application',
        title: 'Partager une fenetre',
        description: 'Le plus proche du partage Zoom/Teams pour isoler une app.',
        tip: 'Choisissez ensuite Word, VS Code, Chrome ou une autre fenetre.',
        accent: '#60a5fa',
        icon: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                <rect x="3" y="4" width="18" height="16" rx="2" />
                <path d="M3 9h18" />
                <circle cx="7" cy="6.5" r="0.8" fill="currentColor" stroke="none" />
            </svg>
        ),
    },
    {
        id: 'browser',
        label: 'Onglet',
        title: 'Partager un onglet navigateur',
        description: 'Recommande pour video, YouTube ou contenu avec audio.',
        tip: 'Activez le son si vous voulez transmettre l’audio de l’onglet.',
        accent: '#f59e0b',
        icon: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                <rect x="3" y="5" width="18" height="14" rx="2" />
                <path d="M3 9h18" />
                <path d="M7 7h.01M11 7h.01M15 7h.01" />
            </svg>
        ),
    },
];

function LivePreview({ stream, className }) {
    const videoRef = useRef(null);

    useEffect(() => {
        const el = videoRef.current;
        if (!el) return;
        el.srcObject = stream || null;
        if (stream) {
            el.play().catch(() => {});
        }
        return () => {
            if (el) {
                el.pause();
                el.srcObject = null;
            }
        };
    }, [stream]);

    return (
        <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className={className}
        />
    );
}

function SurfacePreview({ source, active, showGreenBorder, previewUrl, previewName }) {
    const palette = {
        monitor: {
            bg: 'linear-gradient(135deg, #0f172a 0%, #1e3a8a 55%, #0b1120 100%)',
            panel: '#111827',
        },
        window: {
            bg: 'linear-gradient(135deg, #101827 0%, #1d4ed8 40%, #0f172a 100%)',
            panel: '#f8fafc',
        },
        browser: {
            bg: 'linear-gradient(135deg, #231b0b 0%, #b45309 50%, #111827 100%)',
            panel: '#f8fafc',
        },
    }[source.id];

    return (
        <div
            className={`relative aspect-video overflow-hidden rounded-2xl border transition-all duration-200 ${
                active ? 'border-white/30 shadow-[0_20px_60px_rgba(0,0,0,0.45)]' : 'border-white/10'
            }`}
            style={{
                background: palette.bg,
                boxShadow: showGreenBorder ? '0 0 0 3px rgba(34,197,94,0.95), 0 20px 60px rgba(0,0,0,0.45)' : undefined,
            }}
        >
            {previewUrl && (
                <img
                    src={previewUrl}
                    alt={previewName || source.title}
                    className="absolute inset-0 h-full w-full object-cover"
                />
            )}
            {previewUrl && <div className="absolute inset-0 bg-slate-950/20" />}

            <div className="absolute left-4 top-4 flex items-center gap-2 rounded-full bg-black/35 px-3 py-1 text-[11px] font-semibold text-white backdrop-blur-md">
                {source.icon}
                <span>{previewName || source.title}</span>
            </div>

            {!previewUrl && (
                <>
                    <div className="absolute inset-x-6 top-14 h-4 rounded-full bg-white/10" />
                    <div className="absolute inset-x-6 top-24 flex gap-4">
                        <div className="h-36 flex-1 rounded-2xl border border-white/15 bg-black/20" />
                        <div
                            className="h-36 w-[34%] rounded-2xl border"
                            style={{
                                background: palette.panel,
                                borderColor: source.id === 'window' ? 'rgba(96,165,250,0.7)' : 'rgba(255,255,255,0.18)',
                            }}
                        />
                    </div>

                    <div
                        className="absolute bottom-5 right-5 h-20 w-32 overflow-hidden rounded-2xl border border-white/20 bg-black/40 shadow-2xl"
                        style={showGreenBorder ? { boxShadow: '0 0 0 2px rgba(34,197,94,0.95), 0 10px 25px rgba(0,0,0,0.35)' } : undefined}
                    >
                        <div className="flex h-full items-center justify-center bg-gradient-to-br from-slate-700 to-slate-900 text-[10px] font-semibold uppercase tracking-[0.25em] text-white/85">
                            Preview
                        </div>
                    </div>
                </>
            )}

            {previewUrl && (
                <div className="absolute bottom-5 right-5 rounded-full border border-green-400/35 bg-slate-950/70 px-3 py-1.5 text-[11px] font-semibold text-green-200 backdrop-blur-md">
                    Source detectee
                </div>
            )}

            {showGreenBorder && (
                <div className="absolute inset-0 rounded-2xl border-[3px] border-green-500 pointer-events-none" />
            )}
        </div>
    );
}

function OptionToggle({ checked, onChange, label, description }) {
    return (
        <button
            type="button"
            onClick={onChange}
            className="flex w-full items-center justify-between rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-left transition hover:border-white/20 hover:bg-white/[0.06]"
        >
            <div>
                <div className="text-sm font-semibold text-slate-100">{label}</div>
                <div className="mt-1 text-xs text-slate-400">{description}</div>
            </div>
            <span
                className={`relative ml-4 h-6 w-11 rounded-full transition ${
                    checked ? 'bg-blue-500' : 'bg-slate-700'
                }`}
            >
                <span
                    className={`absolute top-1 h-4 w-4 rounded-full bg-white transition ${
                        checked ? 'left-6' : 'left-1'
                    }`}
                />
            </span>
        </button>
    );
}

function MiniNativeHint({ sourceId }) {
    const label =
        sourceId === 'window'
            ? 'Le navigateur va ouvrir la boite native pour choisir une application.'
            : sourceId === 'browser'
                ? 'Le navigateur va ouvrir la boite native pour choisir un onglet.'
                : 'Le navigateur va ouvrir la boite native pour choisir un ecran.';

    return <p className="text-xs leading-5 text-slate-400">{label}</p>;
}

export default function ScreenShareSelector({ onSelect, onCancel, activeShare }) {
    const [selectedSource, setSelectedSource] = useState('window');
    const [loading, setLoading] = useState(false);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [previewName, setPreviewName] = useState('');
    const [recentPreviews, setRecentPreviews] = useState([]);
    const [error, setError] = useState('');
    const [options, setOptions] = useState({
        sound: false,
        presenter: true,
        optimize: 'detail',
    });
    const previewStreamRef = useRef(null);
    const previewSourceRef = useRef(null);

    const activeSource = useMemo(
        () => SOURCES.find((item) => item.id === selectedSource) || SOURCES[0],
        [selectedSource]
    );

    useEffect(() => {
        return () => {
            previewStreamRef.current?.getTracks().forEach((track) => track.stop());
        };
    }, []);

    useEffect(() => {
        if (previewSourceRef.current === selectedSource) return;
        previewStreamRef.current?.getTracks().forEach((track) => track.stop());
        previewStreamRef.current = null;
        previewSourceRef.current = null;
        setPreviewUrl(null);
        setPreviewName('');
        setError('');
    }, [selectedSource]);

    const updateOption = (key, value) => {
        setOptions((current) => ({ ...current, [key]: value }));
    };

    const rememberPreview = (sourceId, name, imageUrl) => {
        if (!imageUrl) return;

        setRecentPreviews((current) => {
            const nextItem = {
                id: `${sourceId}-${name}`,
                sourceId,
                name,
                imageUrl,
            };

            const deduped = current.filter((item) => item.id !== nextItem.id);
            return [nextItem, ...deduped].slice(0, 6);
        });
    };

    const captureFrame = async (stream) => {
        const video = document.createElement('video');
        video.srcObject = stream;
        video.muted = true;
        video.playsInline = true;
        await video.play();

        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth || 1280;
        canvas.height = video.videoHeight || 720;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        video.pause();
        video.srcObject = null;
        return canvas.toDataURL('image/jpeg', 0.82);
    };

    const buildDisplayMediaOptions = () => {
        const wantsBrowser = selectedSource === 'browser';
        return {
            video: {
                displaySurface: selectedSource,
                frameRate: options.optimize === 'motion' ? { ideal: 30, max: 60 } : { ideal: 15, max: 30 },
            },
            audio: Boolean(options.sound),
            preferCurrentTab: wantsBrowser,
            selfBrowserSurface: wantsBrowser ? 'include' : 'exclude',
            surfaceSwitching: 'include',
            systemAudio: options.sound ? 'include' : 'exclude',
        };
    };

    const handleGeneratePreview = async () => {
        setLoading(true);
        setError('');

        try {
            const stream = await navigator.mediaDevices.getDisplayMedia(buildDisplayMediaOptions());
            previewStreamRef.current?.getTracks().forEach((track) => track.stop());
            previewStreamRef.current = stream;
            previewSourceRef.current = selectedSource;

            const track = stream.getVideoTracks()[0];
            const frame = await captureFrame(stream);
            const resolvedName = track?.label || activeSource.title;

            setPreviewUrl(frame);
            setPreviewName(resolvedName);
            rememberPreview(selectedSource, resolvedName, frame);
        } catch (err) {
            if (err?.name !== 'NotAllowedError') {
                setError("Impossible de recuperer l'aperçu.");
            }
        } finally {
            setLoading(false);
        }
    };

    const handleShare = async () => {
        setLoading(true);
        setError('');

        try {
            const stream = previewStreamRef.current || await navigator.mediaDevices.getDisplayMedia(buildDisplayMediaOptions());
            const track = stream.getVideoTracks()[0];
            const settings = track?.getSettings?.() ?? {};

            previewStreamRef.current = null;
            previewSourceRef.current = null;

            onSelect(stream, {
                ...options,
                displaySurface: settings.displaySurface || selectedSource,
                sourceLabel: track?.label || activeSource.title,
                presenterMode: options.presenter,
            });
        } catch (err) {
            if (err?.name !== 'NotAllowedError') {
                setError('Le partage a echoue.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[1200] flex items-center justify-center bg-slate-950/75 px-4 py-6 backdrop-blur-md">
            <div className="flex max-h-[92vh] w-full max-w-6xl overflow-hidden rounded-[28px] border border-white/10 bg-[#0a1020] text-white shadow-[0_30px_120px_rgba(0,0,0,0.6)]">
                <div className="flex min-w-0 flex-1 flex-col">
                    <div className="flex items-start justify-between border-b border-white/10 px-8 py-6">
                        <div>
                            <div className="text-[11px] font-bold uppercase tracking-[0.35em] text-emerald-400">Screen Share</div>
                            <h2 className="mt-3 text-2xl font-semibold text-slate-50">Choisir une source a partager</h2>
                            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
                                Pour une experience proche de Zoom ou Teams, choisissez le type de source ici, puis le navigateur ouvrira la fenetre native de selection de votre systeme.
                            </p>
                            <p className="mt-2 max-w-2xl text-xs leading-6 text-slate-500">
                                Limite du web: le navigateur ne fournit pas la vraie galerie de miniatures de toutes vos applications avant selection. En revanche, vous pouvez maintenant capturer un aperçu réel de la source choisie puis partager cette même source sans rouvrir la boite.
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={onCancel}
                            className="rounded-full border border-white/10 bg-white/5 p-3 text-slate-300 transition hover:bg-white/10 hover:text-white"
                        >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
                                <path d="M18 6L6 18M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    <div className="grid min-h-0 flex-1 grid-cols-[1.25fr_0.75fr]">
                        <div className="min-w-0 border-r border-white/10 px-8 py-7">
                            <div className="grid gap-4 md:grid-cols-3">
                                {SOURCES.map((source) => {
                                    const selected = source.id === selectedSource;
                                    return (
                                        <button
                                            key={source.id}
                                            type="button"
                                            onClick={() => setSelectedSource(source.id)}
                                            className={`rounded-[24px] border p-4 text-left transition ${
                                                selected ? 'border-white/25 bg-white/[0.08]' : 'border-white/10 bg-white/[0.03] hover:bg-white/[0.05]'
                                            }`}
                                        >
                                            <div className="mb-3 flex items-center justify-between">
                                                <div
                                                    className="flex h-10 w-10 items-center justify-center rounded-2xl"
                                                    style={{ background: `${source.accent}22`, color: source.accent }}
                                                >
                                                    {source.icon}
                                                </div>
                                                {selected && (
                                                    <span className="rounded-full bg-emerald-500/20 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.25em] text-emerald-300">
                                                        Select
                                                    </span>
                                                )}
                                            </div>
                                            <div className="text-base font-semibold text-slate-50">{source.label}</div>
                                            <div className="mt-2 text-sm leading-6 text-slate-400">{source.description}</div>
                                        </button>
                                    );
                                })}
                            </div>

                            <div className="mt-7">
                                <SurfacePreview
                                    source={activeSource}
                                    active
                                    showGreenBorder={Boolean(previewUrl || activeShare)}
                                    previewUrl={previewUrl}
                                    previewName={previewName}
                                />
                            </div>

                            <div className="mt-5 flex items-start justify-between gap-6 rounded-[22px] border border-emerald-500/20 bg-emerald-500/10 px-5 py-4">
                                <div>
                                    <div className="text-sm font-semibold text-emerald-300">Aperçu et selection systeme</div>
                                    <div className="mt-1 text-sm leading-6 text-emerald-50/80">{activeSource.tip}</div>
                                </div>
                                <button
                                    type="button"
                                    onClick={handleGeneratePreview}
                                    disabled={loading}
                                    className="shrink-0 rounded-2xl border border-emerald-400/30 bg-emerald-400/15 px-4 py-2 text-sm font-semibold text-emerald-200 transition hover:bg-emerald-400/20 disabled:cursor-wait disabled:opacity-60"
                                >
                                    {loading ? 'Ouverture...' : previewUrl ? "Changer l’aperçu" : "Choisir et prévisualiser"}
                                </button>
                            </div>

                            {recentPreviews.length > 0 && (
                                <div className="mt-5 rounded-[22px] border border-white/10 bg-white/[0.03] p-5">
                                    <div className="flex items-center justify-between gap-3">
                                        <div>
                                            <div className="text-[11px] font-bold uppercase tracking-[0.35em] text-slate-500">Recents</div>
                                            <div className="mt-1 text-sm text-slate-300">Dernières sources prévisualisées</div>
                                        </div>
                                        <div className="text-xs text-slate-500">
                                            Cliquez pour retrouver visuellement une source déjà testée.
                                        </div>
                                    </div>

                                    <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                                        {recentPreviews.map((item) => {
                                            const isSelected = item.name === previewName && item.imageUrl === previewUrl;
                                            return (
                                                <button
                                                    key={item.id}
                                                    type="button"
                                                    onClick={() => {
                                                        setSelectedSource(item.sourceId);
                                                        setPreviewUrl(item.imageUrl);
                                                        setPreviewName(item.name);
                                                        setError('');
                                                    }}
                                                    className={`overflow-hidden rounded-2xl border text-left transition ${
                                                        isSelected
                                                            ? 'border-emerald-400/40 bg-emerald-400/10'
                                                            : 'border-white/10 bg-slate-950/40 hover:bg-white/[0.05]'
                                                    }`}
                                                >
                                                    <div className="aspect-video overflow-hidden bg-black">
                                                        <img src={item.imageUrl} alt={item.name} className="h-full w-full object-cover" />
                                                    </div>
                                                    <div className="p-3">
                                                        <div className="truncate text-sm font-semibold text-slate-100">{item.name}</div>
                                                        <div className="mt-1 text-xs text-slate-400">
                                                            {item.sourceId === 'window' ? 'Application' : item.sourceId === 'browser' ? 'Onglet' : 'Plein ecran'}
                                                        </div>
                                                    </div>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>

                        <aside className="flex min-h-0 flex-col bg-white/[0.02] px-7 py-7">
                            <div className="text-[11px] font-bold uppercase tracking-[0.35em] text-slate-500">Options</div>

                            <div className="mt-5 space-y-3">
                                <OptionToggle
                                    checked={options.sound}
                                    onChange={() => updateOption('sound', !options.sound)}
                                    label="Partager le son"
                                    description="Utile pour un onglet navigateur, une video ou une demo multimedia."
                                />
                                <OptionToggle
                                    checked={options.presenter}
                                    onChange={() => updateOption('presenter', !options.presenter)}
                                    label="Mode presentateur"
                                    description="Affiche votre camera dans une petite vignette pendant le partage."
                                />
                            </div>

                            <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                                <label className="text-sm font-semibold text-slate-100">Optimiser pour</label>
                                <select
                                    value={options.optimize}
                                    onChange={(event) => updateOption('optimize', event.target.value)}
                                    className="mt-3 w-full rounded-xl border border-white/10 bg-slate-900 px-3 py-3 text-sm text-slate-100 outline-none transition focus:border-blue-400"
                                >
                                    <option value="detail">Texte et details</option>
                                    <option value="motion">Video et mouvement</option>
                                </select>
                            </div>

                            <div className="mt-6 rounded-[24px] border border-white/10 bg-slate-950/50 p-4">
                                <div className="text-[11px] font-bold uppercase tracking-[0.35em] text-slate-500">Apercu</div>
                                <div className="mt-4 overflow-hidden rounded-2xl border border-white/10 bg-black">
                                    {previewStreamRef.current ? (
                                        <LivePreview stream={previewStreamRef.current} className="aspect-video w-full object-cover" />
                                    ) : previewUrl ? (
                                        <img src={previewUrl} alt="Preview" className="aspect-video w-full object-cover" />
                                    ) : (
                                        <div className="flex aspect-video items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 px-6 text-center text-sm leading-6 text-slate-500">
                                            L’aperçu réel apparait ici après choix dans la fenêtre native.
                                        </div>
                                    )}
                                </div>
                                <div className="mt-3 text-sm font-medium text-slate-200">{previewName || activeSource.title}</div>
                                <div className="mt-1">
                                    <MiniNativeHint sourceId={selectedSource} />
                                </div>
                            </div>

                            {activeShare && (
                                <div className="mt-4 rounded-2xl border border-green-500/30 bg-green-500/10 px-4 py-3 text-sm text-green-100">
                                    Partage actif: {activeShare.label || 'Source courante'}
                                </div>
                            )}

                            {error && (
                                <div className="mt-4 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                                    {error}
                                </div>
                            )}

                            <div className="mt-auto pt-6">
                                <div className="flex gap-3">
                                    <button
                                        type="button"
                                        onClick={onCancel}
                                        className="flex-1 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-semibold text-slate-200 transition hover:bg-white/[0.08]"
                                    >
                                        Annuler
                                    </button>
                                    <button
                                    type="button"
                                    onClick={handleShare}
                                    disabled={loading}
                                    className="flex-1 rounded-2xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:cursor-wait disabled:opacity-60"
                                    >
                                        {loading ? 'Ouverture...' : previewStreamRef.current ? 'Partager cette source' : previewUrl ? 'Rechoisir et partager' : 'Choisir et partager'}
                                    </button>
                                </div>
                            </div>
                        </aside>
                    </div>
                </div>
            </div>
        </div>
    );
}
