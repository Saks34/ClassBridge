import { useState, useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import YouTube from 'react-youtube';
import { Play, Pause, Volume2, VolumeX, Maximize, Minimize, Radio } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

import api from '../../services/api';

const CustomYouTubePlayer = forwardRef(({ videoId, liveClassId, autoplay = false }, ref) => {
    const [player, setPlayer] = useState(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isMuted, setIsMuted] = useState(autoplay);
    const [volume, setVolume] = useState(100);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [showControls, setShowControls] = useState(false);
    const [isEnded, setIsEnded] = useState(false);
    const [isSeeking, setIsSeeking] = useState(false);
    const [lastSavedPosition, setLastSavedPosition] = useState(0);
    const [hasLoadedHistory, setHasLoadedHistory] = useState(false);
    const containerRef = useRef(null);
    const controlsTimeoutRef = useRef(null);
    const progressBarRef = useRef(null);

    const { isDark } = useTheme();

    const opts = {
        height: '100%',
        width: '100%',
        playerVars: {
            autoplay: autoplay ? 1 : 0,
            mute: autoplay ? 1 : 0,
            controls: 0,
            disablekb: 1,
            fs: 0,
            iv_load_policy: 3,
            modestbranding: 1,
            rel: 0,
            showinfo: 0,
            ecver: 2,
        },
    };

    const handleReady = (event) => {
        const ytPlayer = event.target;
        setPlayer(ytPlayer);

        // Poll for duration since it might not be immediately available
        const checkDuration = () => {
            const dur = ytPlayer.getDuration();
            if (dur && dur > 0) {
                setDuration(dur);
            } else {
                setTimeout(checkDuration, 500);
            }
        };
        checkDuration();

        if (autoplay) {
            ytPlayer.mute();
            ytPlayer.playVideo();
            setIsPlaying(true);
        }
    };

    // Load watch history
    useEffect(() => {
        if (!liveClassId || !player) return;

        const loadHistory = async () => {
            try {
                const { data } = await api.get(`/watch-history/${liveClassId}`);
                if (data && data.lastPosition > 0) {
                    setLastSavedPosition(data.lastPosition);
                    player.seekTo(data.lastPosition, true);
                    setCurrentTime(data.lastPosition);
                }
                setHasLoadedHistory(true);
            } catch (err) {
                console.error('Failed to load watch history:', err);
                setHasLoadedHistory(true);
            }
        };

        loadHistory();
    }, [liveClassId, player]);

    // Save watch history periodically
    useEffect(() => {
        if (!liveClassId || !player || !isPlaying) return;

        const saveHistory = async () => {
            const currentPos = Math.floor(player.getCurrentTime());
            const dur = Math.floor(player.getDuration());
            
            // Only save if moved at least 5 seconds from last record
            if (Math.abs(currentPos - lastSavedPosition) < 5) return;

            try {
                await api.post('/watch-history/update', {
                    liveClassId,
                    videoId,
                    lastPosition: currentPos,
                    totalDuration: dur,
                    isCompleted: currentPos > dur - 10 // Consider completed if at the end
                });
                setLastSavedPosition(currentPos);
            } catch (err) {
                console.error('Failed to save watch history:', err);
            }
        };

        const interval = setInterval(saveHistory, 10000); // Every 10 seconds
        return () => clearInterval(interval);
    }, [liveClassId, player, isPlaying, lastSavedPosition, videoId]);

    const handleStateChange = (event) => {
        if (event.data === 1) {
            setIsPlaying(true);
            // Update duration when playing starts (for live streams)
            if (player) {
                const dur = player.getDuration();
                if (dur && dur > 0) setDuration(dur);
            }
        }
        if (event.data === 2) setIsPlaying(false);
        if (event.data === 0) {
            setIsPlaying(false);
            setIsEnded(true);
        } else {
            setIsEnded(false);
        }
    };

    useImperativeHandle(ref, () => ({
        seekToLive: () => {
            if (player && typeof player.getDuration === 'function') {
                const dur = player.getDuration();
                player.seekTo(dur, true);
                player.playVideo();
                setIsPlaying(true);
                setIsEnded(false);
            }
        }
    }));

    // Update progress and duration
    useEffect(() => {
        let interval;
        if (player) {
            interval = setInterval(() => {
                if (!isSeeking) {
                    setCurrentTime(player.getCurrentTime());
                    // Keep updating duration for live streams
                    const dur = player.getDuration();
                    if (dur && dur > 0 && dur !== duration) {
                        setDuration(dur);
                    }
                }
            }, 500);
        }
        return () => clearInterval(interval);
    }, [player, isSeeking, duration]);

    const formatTime = (seconds) => {
        if (!seconds || seconds === 0) return '00:00';
        const hrs = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        const secs = Math.floor(seconds % 60);
        if (hrs > 0) {
            return `${hrs}:${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
        }
        return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    };

    const togglePlay = () => {
        if (!player) return;
        if (isPlaying) {
            player.pauseVideo();
        } else {
            player.playVideo();
            setIsEnded(false);
        }
    };

    const toggleMute = () => {
        if (!player) return;
        if (isMuted) {
            player.unMute();
            setIsMuted(false);
            if (volume > 0) player.setVolume(volume);
        } else {
            player.mute();
            setIsMuted(true);
        }
    };

    const handleVolumeChange = (newVolume) => {
        if (!player) return;
        setVolume(newVolume);
        player.setVolume(newVolume);
        if (newVolume === 0) {
            setIsMuted(true);
            player.mute();
        } else if (isMuted) {
            setIsMuted(false);
            player.unMute();
        }
    };

    const toggleFullscreen = () => {
        if (!containerRef.current) return;
        if (!document.fullscreenElement) {
            containerRef.current.requestFullscreen().catch(err => {
                console.error(`Error: ${err.message}`);
            });
        } else {
            document.exitFullscreen();
        }
    };

    const handleProgressClick = (e) => {
        if (!player || !progressBarRef.current || duration === 0) return;
        const rect = progressBarRef.current.getBoundingClientRect();
        const percent = (e.clientX - rect.left) / rect.width;
        const seekTime = percent * duration;
        player.seekTo(seekTime, true);
        setCurrentTime(seekTime);
    };

    const skip = (seconds) => {
        if (!player || duration === 0) return;
        const newTime = Math.max(0, Math.min(duration, currentTime + seconds));
        player.seekTo(newTime, true);
        setCurrentTime(newTime);
    };

    // Keyboard shortcuts (YouTube-style)
    useEffect(() => {
        const handleKeyPress = (e) => {
            // Ignore if typing in input/textarea
            if (['INPUT', 'TEXTAREA'].includes(e.target.tagName)) return;

            switch (e.key.toLowerCase()) {
                case ' ':
                case 'k':
                    e.preventDefault();
                    togglePlay();
                    break;
                case 'm':
                    e.preventDefault();
                    toggleMute();
                    break;
                case 'f':
                    e.preventDefault();
                    toggleFullscreen();
                    break;
                case 'j':
                    e.preventDefault();
                    skip(-10);
                    break;
                case 'l':
                    e.preventDefault();
                    skip(10);
                    break;
                case 'arrowleft':
                    e.preventDefault();
                    skip(-5);
                    break;
                case 'arrowright':
                    e.preventDefault();
                    skip(5);
                    break;
                case 'arrowup':
                    e.preventDefault();
                    handleVolumeChange(Math.min(100, volume + 5));
                    break;
                case 'arrowdown':
                    e.preventDefault();
                    handleVolumeChange(Math.max(0, volume - 5));
                    break;
                case '0':
                case '1':
                case '2':
                case '3':
                case '4':
                case '5':
                case '6':
                case '7':
                case '8':
                case '9':
                    e.preventDefault();
                    if (player && duration > 0) {
                        const percent = parseInt(e.key) * 10 / 100;
                        player.seekTo(duration * percent, true);
                    }
                    break;
                case 'home':
                    e.preventDefault();
                    if (player) player.seekTo(0, true);
                    break;
                case 'end':
                    e.preventDefault();
                    if (player && duration > 0) player.seekTo(duration - 1, true);
                    break;
            }
        };

        document.addEventListener('keydown', handleKeyPress);
        return () => document.removeEventListener('keydown', handleKeyPress);
    }, [player, isPlaying, isMuted, volume, duration, currentTime]);

    const handleMouseMove = () => {
        setShowControls(true);
        if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
        controlsTimeoutRef.current = setTimeout(() => {
            if (isPlaying) setShowControls(false);
        }, 2000);
    };

    useEffect(() => {
        const handleFsChange = () => {
            setIsFullscreen(!!document.fullscreenElement);
        };
        document.addEventListener('fullscreenchange', handleFsChange);
        return () => document.removeEventListener('fullscreenchange', handleFsChange);
    }, []);

    return (
        <div
            ref={containerRef}
            className="relative w-full h-full bg-black group overflow-hidden"
            onMouseMove={handleMouseMove}
            onMouseLeave={() => isPlaying && setShowControls(false)}
            tabIndex={0}
        >
            <div className="absolute inset-0 pointer-events-none overflow-hidden flex items-center justify-center">
                <div className="w-full h-full flex-shrink-0">
                    <YouTube
                        videoId={videoId}
                        opts={opts}
                        onReady={handleReady}
                        onStateChange={handleStateChange}
                        className="w-full h-full"
                        iframeClassName="w-full h-full object-cover"
                    />
                </div>
            </div>

            <div
                className="absolute inset-0 z-10 cursor-pointer"
                onClick={togglePlay}
            ></div>

            {!isPlaying && !isEnded && (
                <div
                    onClick={togglePlay}
                    className="absolute inset-0 z-15 bg-black/40 backdrop-blur-md flex flex-col items-center justify-center text-white/90 cursor-pointer hover:bg-black/50 transition-colors"
                >
                    <div className="bg-white/10 p-4 rounded-full mb-2">
                        <Pause size={32} fill="currentColor" />
                    </div>
                    <p className="font-medium text-lg tracking-wide">Stream Paused</p>
                    <p className="text-sm text-white/50 mt-1">Press Space or K to resume</p>
                </div>
            )}

            {isEnded && (
                <div className="absolute inset-0 z-20 bg-black/90 flex flex-col items-center justify-center text-white">
                    <p className="text-xl font-bold mb-4">Class Ended</p>
                    <button
                        onClick={togglePlay}
                        className="flex items-center gap-2 px-6 py-3 bg-violet-600 rounded-full hover:bg-violet-700 transition"
                    >
                        <Play size={20} fill="currentColor" /> Watch Again
                    </button>
                </div>
            )}

            <div
                className={`absolute bottom-0 left-0 right-0 z-30 bg-gradient-to-t from-black/80 to-transparent p-4 transition-opacity duration-300 ${showControls || !isPlaying ? 'opacity-100' : 'opacity-0'}`}
            >
                {/* Progress Bar - Now Clickable */}
                <div
                    ref={progressBarRef}
                    onClick={handleProgressClick}
                    className="w-full h-1 bg-gray-600 rounded-full mb-4 cursor-pointer relative group/progress hover:h-1.5 transition-all"
                >
                    <div
                        className="h-full bg-violet-500 rounded-full relative pointer-events-none"
                        style={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
                    >
                        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full opacity-0 group-hover/progress:opacity-100 transition-opacity"></div>
                    </div>
                </div>

                <div className="flex items-center justify-between text-white">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={(e) => { e.stopPropagation(); togglePlay(); }}
                            className="hover:text-violet-400 transition"
                            title="Play/Pause (Space or K)"
                        >
                            {isPlaying ? <Pause size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" />}
                        </button>

                        <div className="flex items-center gap-2 group/volume">
                            <button
                                onClick={(e) => { e.stopPropagation(); toggleMute(); }}
                                className="hover:text-violet-400 transition"
                                title="Mute (M)"
                            >
                                {isMuted || volume === 0 ? <VolumeX size={24} /> : <Volume2 size={24} />}
                            </button>
                            <input
                                type="range"
                                min="0"
                                max="100"
                                value={isMuted ? 0 : volume}
                                onChange={(e) => { e.stopPropagation(); handleVolumeChange(parseInt(e.target.value)); }}
                                onClick={(e) => e.stopPropagation()}
                                className="w-0 group-hover/volume:w-20 transition-all opacity-0 group-hover/volume:opacity-100 h-1 bg-gray-600 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white"
                                title="Volume (Arrow Up/Down)"
                            />
                        </div>

                        <span className="text-sm font-medium" title="Current Time / Duration">
                            {formatTime(currentTime)} / {formatTime(duration)}
                        </span>

                        {duration > 0 && currentTime > duration - 30 && (
                            <span className="bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 rounded animate-pulse">
                                LIVE
                            </span>
                        )}
                    </div>

                    <button
                        onClick={(e) => { e.stopPropagation(); toggleFullscreen(); }}
                        className="hover:text-violet-400 transition"
                        title="Fullscreen (F)"
                    >
                        {isFullscreen ? <Minimize size={24} /> : <Maximize size={24} />}
                    </button>
                </div>
            </div>
        </div>
    );
});

export default CustomYouTubePlayer;
