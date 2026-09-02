import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Play, Pause, Volume2, VolumeX, Music } from 'lucide-react';
import { useAudio } from '../context/AudioContext';

interface AudioPlayerProps {
  autoStart?: boolean;
}

export const AudioPlayer: React.FC<AudioPlayerProps> = ({ autoStart = false }) => {
  const {
    hasMainAudio,
    mainAudioTitle,
    isBgPlaying,
    playBgAudio,
    toggleBgAudio,
    volume,
    setVolume,
    isMuted,
    toggleMute,
  } = useAudio();

  const [showVolumeSlider, setShowVolumeSlider] = useState<boolean>(false);

  // Trigger autoStart only when requested and when main audio exists
  useEffect(() => {
    if (autoStart && hasMainAudio && !isBgPlaying) {
      playBgAudio();
    }
  }, [autoStart, hasMainAudio]);

  // If no main audio exists, do not render the player at all
  if (!hasMainAudio) {
    return null;
  }

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
  };

  return (
    <div
      id="floating-audio-player"
      className="fixed z-[1000] flex items-center gap-3 select-none pointer-events-auto"
      style={{
        bottom: 'max(16px, env(safe-area-inset-bottom, 16px))',
        right: 'max(16px, env(safe-area-inset-right, 16px))',
        maxWidth: 'calc(100vw - 32px)',
      }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="flex items-center gap-2.5 sm:gap-3 px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-full glass-panel border border-[#D7B56D]/40 bg-[#08080D]/90 shadow-[0_10px_35px_rgba(0,0,0,0.7)] backdrop-blur-xl group hover:border-[#D7B56D]/70 transition-all max-w-full"
        dir="rtl"
      >
        {/* Play/Pause Button */}
        <button
          id="audio-play-pause-btn"
          onClick={toggleBgAudio}
          className={`relative w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-gradient-to-r from-[#6E1835] to-[#8B2245] border border-[#D7B56D]/50 flex items-center justify-center text-[#FFFFFF] shadow-[0_0_15px_rgba(110,24,53,0.7)] hover:scale-105 active:scale-95 transition-transform cursor-pointer shrink-0 ${
            !isBgPlaying ? 'animate-pulse' : ''
          }`}
          title={isBgPlaying ? 'إيقاف الموسيقى' : 'تشغيل الموسيقى'}
        >
          {isBgPlaying ? (
            <Pause className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#D7B56D]" />
          ) : (
            <Play className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#D7B56D] -translate-x-0.5" />
          )}

          {/* Glowing pulse ring when playing */}
          {isBgPlaying && (
            <span className="absolute inset-0 rounded-full border border-[#D7B56D]/50 animate-ping opacity-30 pointer-events-none" />
          )}
        </button>

        {/* Track info & visualizer */}
        <div className="flex flex-col text-right pl-1 min-w-0">
          <div className="flex items-center gap-1.5 justify-start">
            <Music className="w-3.5 h-3.5 text-[#D7B56D] shrink-0" />
            <span className="text-xs font-sans-arabic font-semibold text-[#FFFFFF] max-w-[110px] sm:max-w-[190px] truncate">
              {mainAudioTitle}
            </span>
          </div>

          {/* Sound wave visualizer bars */}
          <div className="flex items-center gap-1 h-2 mt-1 justify-start">
            {[0.3, 0.7, 0.4, 0.9, 0.5, 0.2].map((height, i) => (
              <motion.div
                key={i}
                animate={
                  isBgPlaying
                    ? {
                        scaleY: [height, height * 1.8, height * 0.35, height],
                      }
                    : { scaleY: 0.2 }
                }
                transition={
                  isBgPlaying
                    ? {
                        duration: 0.7 + i * 0.12,
                        repeat: Infinity,
                        ease: 'easeInOut',
                      }
                    : { duration: 0.2 }
                }
                className="w-[2px] bg-[#D7B56D] origin-bottom rounded-full"
                style={{ height: '9px' }}
              />
            ))}
          </div>
        </div>

        {/* Volume controls */}
        <div
          className="relative flex items-center"
          onMouseEnter={() => setShowVolumeSlider(true)}
          onMouseLeave={() => setShowVolumeSlider(false)}
        >
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              // On touch, toggle slider if not already open; if open and clicked again, toggle mute
              if (!showVolumeSlider) {
                setShowVolumeSlider(true);
              } else {
                toggleMute();
              }
            }}
            className="w-7 h-7 rounded-full flex items-center justify-center text-[#A49CA8] hover:text-[#D7B56D] transition-colors cursor-pointer"
            title={isMuted ? 'إلغاء الكتم' : 'كتم الصوت'}
          >
            {isMuted || volume === 0 ? (
              <VolumeX className="w-3.5 h-3.5 text-[#E8A0B7]" />
            ) : (
              <Volume2 className="w-3.5 h-3.5" />
            )}
          </button>

          {/* Volume Slider Popover */}
          <AnimatePresence>
            {showVolumeSlider && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 5 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 5 }}
                onClick={(e) => e.stopPropagation()}
                className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 p-2.5 rounded-xl glass-panel border border-[#D7B56D]/30 shadow-xl flex flex-col items-center bg-[#121019] z-50"
              >
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={isMuted ? 0 : volume}
                  onChange={handleVolumeChange}
                  className="w-20 h-1.5 bg-[#08080D] rounded-lg appearance-none cursor-pointer accent-[#D7B56D]"
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
};
