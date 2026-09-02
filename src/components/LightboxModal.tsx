import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  ChevronRight,
  ChevronLeft,
  Volume2,
  VolumeX,
  Play,
  Pause,
  RotateCw,
  Loader2,
  Sparkles,
  Maximize,
  Minimize,
  Repeat,
  Film,
  AlertCircle,
} from 'lucide-react';
import { MemoryItem } from '../types';

interface LightboxModalProps {
  memory: MemoryItem | null;
  items: MemoryItem[];
  isOpen: boolean;
  onClose: () => void;
  onSelectMemory: (item: MemoryItem) => void;
  isAudioPlaying?: boolean;
}

export const LightboxModal: React.FC<LightboxModalProps> = ({
  memory,
  items,
  isOpen,
  onClose,
  onSelectMemory,
  isAudioPlaying = false,
}) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [mounted, setMounted] = useState(false);

  // Video Player States
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [videoProgress, setVideoProgress] = useState(0);
  const [videoDuration, setVideoDuration] = useState(0);
  const [videoCurrentTime, setVideoCurrentTime] = useState(0);
  const [isVideoMuted, setIsVideoMuted] = useState(false);
  const [videoVolume, setVideoVolume] = useState(1);
  const [isVideoBuffering, setIsVideoBuffering] = useState(true);
  const [isVideoLooping, setIsVideoLooping] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showVideoControls, setShowVideoControls] = useState(true);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const videoContainerRef = useRef<HTMLDivElement | null>(null);

  const isVideo = Boolean(memory?.mediaType === 'video' || memory?.videoSrc);

  // Mark client mounted for Portal
  useEffect(() => {
    setMounted(true);
  }, []);

  // Clean scroll lock that precisely preserves scroll position without jumping to top
  useEffect(() => {
    if (!isOpen || !memory) return;

    const scrollY = window.scrollY || document.documentElement.scrollTop;
    const previousBodyOverflow = document.body.style.overflow;
    
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = previousBodyOverflow;
      // Guarantee the user remains at their exact scroll location
      window.scrollTo({
        top: scrollY,
        left: 0,
        behavior: 'instant' as ScrollBehavior,
      });
    };
  }, [isOpen, memory]);

  // Reset states on memory switch or retry
  useEffect(() => {
    if (!memory || !isOpen) return;

    setImageLoaded(false);
    setImageError(false);
    setIsVideoPlaying(false);
    setVideoProgress(0);
    setVideoCurrentTime(0);
    setIsVideoBuffering(true);

    if (!isVideo) {
      const img = new Image();
      img.src = memory.image;
      img.onload = () => {
        setImageLoaded(true);
      };
      img.onerror = () => {
        setImageError(true);
      };

      return () => {
        img.onload = null;
        img.onerror = null;
      };
    }
  }, [memory?.id, memory?.image, memory?.videoSrc, retryCount, isOpen, isVideo]);

  // Video Autoplay & Cleanup on memory switch
  useEffect(() => {
    if (isVideo && videoRef.current) {
      videoRef.current.currentTime = 0;
      const playPromise = videoRef.current.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => setIsVideoPlaying(true))
          .catch(() => {
            // Autoplay might require mute in some browsers
            if (videoRef.current) {
              videoRef.current.muted = true;
              setIsVideoMuted(true);
              videoRef.current.play().then(() => setIsVideoPlaying(true)).catch(() => {});
            }
          });
      }
    }

    return () => {
      if (videoRef.current) {
        videoRef.current.pause();
      }
    };
  }, [memory?.id, isVideo]);

  // Keyboard navigation listener (Escape, ArrowRight, ArrowLeft, Space for video)
  useEffect(() => {
    if (!isOpen || !memory || items.length === 0) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }

      if (e.key === ' ' && isVideo) {
        e.preventDefault();
        toggleVideoPlay();
        return;
      }

      const currentIndex = items.findIndex((m) => m.id === memory.id);
      if (currentIndex === -1) return;

      // In RTL: ArrowRight is previous, ArrowLeft is next
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        const prevIdx = (currentIndex - 1 + items.length) % items.length;
        onSelectMemory(items[prevIdx]);
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        const nextIdx = (currentIndex + 1) % items.length;
        onSelectMemory(items[nextIdx]);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, memory, items, onClose, onSelectMemory, isVideo, isVideoPlaying]);

  if (!mounted) return null;

  const currentIndex = memory ? items.findIndex((m) => m.id === memory.id) : -1;
  const hasMultiple = items.length > 1;

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!memory || items.length === 0) return;
    const prevIdx = (currentIndex - 1 + items.length) % items.length;
    onSelectMemory(items[prevIdx]);
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!memory || items.length === 0) return;
    const nextIdx = (currentIndex + 1) % items.length;
    onSelectMemory(items[nextIdx]);
  };

  const handleRetry = (e: React.MouseEvent) => {
    e.stopPropagation();
    setImageError(false);
    setImageLoaded(false);
    setRetryCount((prev) => prev + 1);
  };

  // Video Player Control Handlers
  const toggleVideoPlay = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play();
      setIsVideoPlaying(true);
    } else {
      videoRef.current.pause();
      setIsVideoPlaying(false);
    }
  };

  const handleVideoTimeUpdate = () => {
    if (!videoRef.current) return;
    const current = videoRef.current.currentTime;
    const dur = videoRef.current.duration || 1;
    setVideoCurrentTime(current);
    setVideoProgress((current / dur) * 100);
  };

  const handleVideoSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!videoRef.current) return;
    const seekPercent = parseFloat(e.target.value);
    const dur = videoRef.current.duration || 1;
    const seekTime = (seekPercent / 100) * dur;
    videoRef.current.currentTime = seekTime;
    setVideoProgress(seekPercent);
    setVideoCurrentTime(seekTime);
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !videoRef.current.muted;
    setIsVideoMuted(videoRef.current.muted);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!videoRef.current) return;
    const val = parseFloat(e.target.value);
    videoRef.current.volume = val;
    setVideoVolume(val);
    videoRef.current.muted = val === 0;
    setIsVideoMuted(val === 0);
  };

  const toggleFullscreen = () => {
    if (!videoContainerRef.current) return;
    if (!document.fullscreenElement) {
      videoContainerRef.current.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  const formatTime = (seconds: number) => {
    if (isNaN(seconds)) return '00:00';
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleMouseMoveControls = () => {
    setShowVideoControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    controlsTimeoutRef.current = setTimeout(() => {
      if (isVideoPlaying) setShowVideoControls(false);
    }, 3000);
  };

  return createPortal(
    <AnimatePresence>
      {isOpen && memory && (
        <motion.div
          id="gallery-lightbox-portal"
          role="dialog"
          aria-modal="true"
          aria-label={memory.title}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={onClose}
          className="fixed inset-0 z-[9999] w-screen h-screen min-h-[100vh] min-h-[100dvh] max-h-[100dvh] bg-black/90 backdrop-blur-xl select-none overflow-hidden"
          style={{
            paddingTop: 'max(8px, env(safe-area-inset-top, 8px))',
            paddingBottom: 'max(8px, env(safe-area-inset-bottom, 8px))',
            paddingLeft: 'max(8px, env(safe-area-inset-left, 8px))',
            paddingRight: 'max(8px, env(safe-area-inset-right, 8px))',
          }}
        >
          {/* 3-Row Grid Layout: Top Bar (auto), Stage (1fr), Bottom Caption (auto) */}
          <div
            className="w-full h-full max-w-7xl mx-auto grid grid-rows-[auto_minmax(0,1fr)_auto] gap-2 p-2 sm:p-3 overflow-hidden pointer-events-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* ROW 1: TOP BAR CONTROLS */}
            <header className="flex items-center justify-between gap-2 px-2 py-1 z-30 min-w-0">
              {/* Close Button */}
              <button
                type="button"
                onClick={onClose}
                className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-[#08080D]/90 hover:bg-[#6E1835] border border-[#D7B56D]/40 text-[#FFFFFF] hover:text-[#D7B56D] flex items-center justify-center transition-all cursor-pointer shadow-lg active:scale-95 shrink-0"
                title="إغلاق (Esc)"
                aria-label="إغلاق"
              >
                <X className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>

              {/* Memory Tag & Media Type Status */}
              <div className="flex items-center gap-2 min-w-0 mx-2 overflow-hidden">
                {isVideo ? (
                  <span className="px-3 py-1 rounded-full bg-[#D7B56D]/20 border border-[#D7B56D]/50 text-xs font-sans-arabic text-[#D7B56D] flex items-center gap-1.5 shrink-0">
                    <Film className="w-3.5 h-3.5" />
                    <span>مقطع فيديو</span>
                  </span>
                ) : (
                  memory.date && (
                    <span className="px-3 py-1 rounded-full bg-[#6E1835]/60 border border-[#E8A0B7]/30 text-xs font-sans-arabic text-[#E8A0B7] shrink-0">
                      {memory.date}
                    </span>
                  )
                )}

                {memory.audioSrc && (
                  <span className="px-2.5 py-1 rounded-full bg-[#D7B56D]/20 border border-[#D7B56D]/40 text-[11px] font-sans-arabic text-[#D7B56D] flex items-center gap-1.5 animate-pulse truncate">
                    <Volume2 className="w-3.5 h-3.5 text-[#D7B56D] shrink-0" />
                    <span className="hidden sm:inline truncate">
                      {isAudioPlaying
                        ? 'تسجيل صوتي مخصص...'
                        : memory.audioTitle || 'مقطع صوتي'}
                    </span>
                  </span>
                )}
              </div>

              {/* Counter Badge */}
              <div className="text-xs font-display-en text-[#D7B56D] font-bold px-3.5 py-1.5 rounded-full bg-[#08080D]/90 border border-[#D7B56D]/35 shrink-0 shadow-sm tabular-nums">
                {currentIndex + 1} / {items.length}
              </div>
            </header>

            {/* ROW 2: STAGE (Guaranteed available height via minmax(0, 1fr)) */}
            <main
              className="relative w-full h-full min-h-0 min-w-0 flex items-center justify-center overflow-hidden my-auto"
              onClick={(e) => {
                if (e.target === e.currentTarget) {
                  onClose();
                }
              }}
            >
              {/* Navigation Previous Button (RTL: Right Arrow) */}
              {hasMultiple && (
                <button
                  type="button"
                  onClick={handlePrev}
                  className="absolute right-1 sm:right-3 md:right-5 z-40 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-[#08080D]/85 hover:bg-[#6E1835] border border-[#D7B56D]/40 text-[#FFFFFF] hover:text-[#D7B56D] flex items-center justify-center transition-all cursor-pointer shadow-2xl active:scale-95 backdrop-blur-md"
                  title="السابق"
                  aria-label="السابق"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              )}

              {/* Navigation Next Button (RTL: Left Arrow) */}
              {hasMultiple && (
                <button
                  type="button"
                  onClick={handleNext}
                  className="absolute left-1 sm:left-3 md:left-5 z-40 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-[#08080D]/85 hover:bg-[#6E1835] border border-[#D7B56D]/40 text-[#FFFFFF] hover:text-[#D7B56D] flex items-center justify-center transition-all cursor-pointer shadow-2xl active:scale-95 backdrop-blur-md"
                  title="التالي"
                  aria-label="التالي"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
              )}

              {/* VIDEO PLAYER RENDERER */}
              {isVideo ? (
                <div
                  ref={videoContainerRef}
                  onMouseMove={handleMouseMoveControls}
                  className="relative max-w-full max-h-full flex items-center justify-center rounded-2xl overflow-hidden bg-black/80 border border-[#D7B56D]/40 shadow-[0_20px_60px_rgba(0,0,0,0.95)] group"
                  style={{ maxHeight: '100%', maxWidth: '100%' }}
                >
                  <video
                    ref={videoRef}
                    src={memory.videoSrc || memory.image}
                    poster={memory.image}
                    playsInline
                    loop={isVideoLooping}
                    onTimeUpdate={handleVideoTimeUpdate}
                    onLoadedMetadata={() => {
                      if (videoRef.current) {
                        setVideoDuration(videoRef.current.duration);
                        setIsVideoBuffering(false);
                      }
                    }}
                    onWaiting={() => setIsVideoBuffering(true)}
                    onPlaying={() => setIsVideoBuffering(false)}
                    onError={() => setImageError(true)}
                    onClick={toggleVideoPlay}
                    className="max-w-full max-h-[75vh] object-contain rounded-xl cursor-pointer"
                  />

                  {/* Video Center Play/Buffering Overlay Indicator */}
                  <div
                    onClick={toggleVideoPlay}
                    className={`absolute inset-0 flex items-center justify-center bg-black/30 transition-opacity duration-300 cursor-pointer ${
                      !isVideoPlaying || isVideoBuffering ? 'opacity-100' : 'opacity-0 hover:opacity-100'
                    }`}
                  >
                    {isVideoBuffering ? (
                      <div className="w-16 h-16 rounded-full bg-[#08080D]/80 border border-[#D7B56D]/50 flex items-center justify-center text-[#D7B56D] shadow-2xl">
                        <Loader2 className="w-8 h-8 animate-spin" />
                      </div>
                    ) : (
                      <motion.div
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                        className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-tr from-[#6E1835] to-[#8B2245] border-2 border-[#D7B56D] flex items-center justify-center text-[#FFFFFF] shadow-[0_0_30px_rgba(215,181,109,0.5)]"
                      >
                        {isVideoPlaying ? (
                          <Pause className="w-8 h-8 text-[#D7B56D]" />
                        ) : (
                          <Play className="w-8 h-8 text-[#D7B56D] translate-x-0.5" />
                        )}
                      </motion.div>
                    )}
                  </div>

                  {/* Cinematic Video Controls Bottom Bar */}
                  <div
                    className={`absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent p-3 sm:p-4 flex flex-col gap-2 transition-opacity duration-300 z-20 ${
                      showVideoControls || !isVideoPlaying ? 'opacity-100' : 'opacity-0 pointer-events-none'
                    }`}
                  >
                    {/* Progress Bar (Scrubber) */}
                    <div className="flex items-center gap-2">
                      <input
                        type="range"
                        min={0}
                        max={100}
                        step={0.1}
                        value={videoProgress}
                        onChange={handleVideoSeek}
                        className="w-full h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer accent-[#D7B56D] focus:outline-none"
                      />
                    </div>

                    {/* Controls Row */}
                    <div className="flex items-center justify-between gap-2 text-white text-xs font-medium">
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={toggleVideoPlay}
                          className="hover:text-[#D7B56D] transition-colors cursor-pointer"
                        >
                          {isVideoPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                        </button>

                        <button
                          type="button"
                          onClick={toggleMute}
                          className="hover:text-[#D7B56D] transition-colors cursor-pointer"
                        >
                          {isVideoMuted || videoVolume === 0 ? (
                            <VolumeX className="w-4 h-4 text-rose-400" />
                          ) : (
                            <Volume2 className="w-4 h-4" />
                          )}
                        </button>

                        <input
                          type="range"
                          min={0}
                          max={1}
                          step={0.05}
                          value={isVideoMuted ? 0 : videoVolume}
                          onChange={handleVolumeChange}
                          className="w-16 h-1 bg-white/20 rounded-lg appearance-none cursor-pointer accent-[#D7B56D] hidden sm:inline"
                        />

                        <span className="font-display-en text-[11px] text-[#A49CA8] tabular-nums">
                          {formatTime(videoCurrentTime)} / {formatTime(videoDuration)}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setIsVideoLooping(!isVideoLooping)}
                          className={`p-1 rounded transition-colors cursor-pointer ${
                            isVideoLooping ? 'text-[#D7B56D]' : 'text-white/60 hover:text-white'
                          }`}
                          title={isVideoLooping ? 'إلغاء التكرار' : 'تكرار مستمر'}
                        >
                          <Repeat className="w-3.5 h-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={toggleFullscreen}
                          className="hover:text-[#D7B56D] transition-colors cursor-pointer p-1"
                        >
                          {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                /* IMAGE RENDERER */
                <>
                  {/* Loading Spinner */}
                  {!imageLoaded && !imageError && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 z-10 text-[#D7B56D]">
                      <Loader2 className="w-10 h-10 animate-spin text-[#D7B56D]" />
                      <span className="text-xs font-sans-arabic text-[#A49CA8]/90">
                        جاري تحميل الصورة...
                      </span>
                    </div>
                  )}

                  {/* Error State with Retry Button */}
                  {imageError && (
                    <div className="flex flex-col items-center justify-center gap-4 p-6 rounded-2xl bg-[#08080D]/90 border border-rose-500/40 text-center max-w-sm z-20 shadow-2xl">
                      <AlertCircle className="w-12 h-12 text-rose-400" />
                      <div className="space-y-1">
                        <h4 className="text-base font-serif-arabic font-bold text-white">
                          تعذر تحميل الصورة
                        </h4>
                        <p className="text-xs text-[#A49CA8] font-sans-arabic">
                          تحقق من الاتصال بالإنترنت أو رابط الملف.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={handleRetry}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#6E1835] hover:bg-[#8B2245] border border-[#D7B56D]/40 text-xs font-sans-arabic text-[#FFFFFF] transition-all cursor-pointer active:scale-95"
                      >
                        <RotateCw className="w-4 h-4" />
                        <span>إعادة المحاولة</span>
                      </button>
                    </div>
                  )}

                  <div
                    className="relative w-full h-full flex items-center justify-center min-h-0 min-w-0"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <img
                      key={`${memory.id}-${retryCount}`}
                      src={memory.image}
                      alt={memory.title}
                      referrerPolicy="no-referrer"
                      onLoad={() => setImageLoaded(true)}
                      onError={() => setImageError(true)}
                      className={`max-w-full max-h-full w-auto h-auto object-contain rounded-xl sm:rounded-2xl border border-[#D7B56D]/40 shadow-[0_20px_60px_rgba(0,0,0,0.95)] transition-opacity duration-300 select-none block mx-auto ${
                        imageLoaded ? 'opacity-100' : 'opacity-0'
                      }`}
                      style={{
                        maxHeight: '100%',
                        maxWidth: '100%',
                      }}
                    />
                  </div>
                </>
              )}
            </main>

            {/* ROW 3: BOTTOM CAPTION BAR */}
            <footer
              className="w-full max-w-xl mx-auto px-4 py-2 sm:py-2.5 rounded-xl sm:rounded-2xl bg-[#08080D]/90 border border-[#D7B56D]/30 backdrop-blur-md text-center shrink-0 z-30 shadow-lg"
              dir="rtl"
            >
              <div className="flex items-center justify-center gap-2 mb-0.5">
                <Sparkles className="w-3.5 h-3.5 text-[#D7B56D] shrink-0" />
                <h3 className="text-sm sm:text-base font-serif-arabic font-bold text-gold-gradient leading-snug">
                  {memory.title}
                </h3>
                <Sparkles className="w-3.5 h-3.5 text-[#D7B56D] shrink-0" />
              </div>
              {memory.caption && (
                <p className="text-[11px] sm:text-xs font-serif-arabic text-white/80 line-clamp-2 max-w-lg mx-auto leading-normal">
                  {memory.caption}
                </p>
              )}
            </footer>
          </div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
};
