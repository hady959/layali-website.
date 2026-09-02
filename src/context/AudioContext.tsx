import React, { createContext, useContext, useState, useRef, useEffect, useCallback } from 'react';
import { useSiteData } from './SiteDataContext';

export interface AudioContextType {
  // Main Background Audio
  isBgPlaying: boolean;
  hasMainAudio: boolean;
  mainAudioTitle: string;
  playBgAudio: () => Promise<void>;
  pauseBgAudio: () => void;
  stopBgAudio: () => void;
  toggleBgAudio: () => void;
  volume: number;
  setVolume: (v: number) => void;
  isMuted: boolean;
  setIsMuted: (m: boolean) => void;
  toggleMute: () => void;

  // Memory Specific Audio
  activeMemoryAudioSrc: string | null;
  isMemoryAudioPlaying: boolean;
  playMemoryAudio: (src: string, onEnded?: () => void) => Promise<void>;
  stopMemoryAudio: () => void;

  // Global Audio Safety
  stopAllAudio: () => void;
}

const AudioContext = createContext<AudioContextType | undefined>(undefined);

export const AudioProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { siteData } = useSiteData();

  const mainAudioSrc = siteData.audio?.audioSrc?.trim() || '';
  const mainAudioTitle = siteData.audio?.trackTitle?.trim() || 'الموسيقى الرئيسية';
  const hasMainAudio = Boolean(mainAudioSrc);

  // Background Audio State
  const [isBgPlaying, setIsBgPlaying] = useState<boolean>(false);
  const isBgPlayingRef = useRef<boolean>(false);
  const [volume, setVolumeState] = useState<number>(siteData.audio?.defaultVolume ?? 0.65);
  const [isMuted, setIsMutedState] = useState<boolean>(false);

  const bgAudioRef = useRef<HTMLAudioElement | null>(null);
  const wasBgPlayingBeforeMemory = useRef<boolean>(false);

  // Memory Audio State
  const [activeMemoryAudioSrc, setActiveMemoryAudioSrc] = useState<string | null>(null);
  const [isMemoryAudioPlaying, setIsMemoryAudioPlaying] = useState<boolean>(false);
  const memoryAudioRef = useRef<HTMLAudioElement | null>(null);
  const onMemoryEndedRef = useRef<(() => void) | undefined>(undefined);

  // Sync ref with state
  useEffect(() => {
    isBgPlayingRef.current = isBgPlaying;
  }, [isBgPlaying]);

  // Initialize standard audio elements
  useEffect(() => {
    const bgAudio = new Audio();
    bgAudio.id = 'layali-main-audio';
    bgAudio.preload = 'auto';
    bgAudio.crossOrigin = 'anonymous'; // CRITICAL for iOS Safari and Supabase Storage
    bgAudio.loop = true; // Seamless native looping
    bgAudio.volume = isMuted ? 0 : volume;
    bgAudioRef.current = bgAudio;

    const memAudio = new Audio();
    memAudio.id = 'layali-memory-audio';
    memAudio.preload = 'auto';
    memAudio.crossOrigin = 'anonymous'; // CRITICAL for iOS Safari and Supabase Storage
    memAudio.volume = isMuted ? 0 : volume;
    memoryAudioRef.current = memAudio;

    // Automatic seamless replay if track reaches end
    const handleBgEnded = () => {
      if (bgAudioRef.current && isBgPlayingRef.current) {
        bgAudioRef.current.currentTime = 0;
        bgAudioRef.current.play().catch(() => {});
      }
    };

    const handleBgPlay = () => {
      isBgPlayingRef.current = true;
      setIsBgPlaying(true);
    };

    const handleBgPause = () => {
      // Only set false if not temporary memory switch
      if (!wasBgPlayingBeforeMemory.current) {
        isBgPlayingRef.current = false;
        setIsBgPlaying(false);
      }
    };

    const handleMemEnded = () => {
      setIsMemoryAudioPlaying(false);
      setActiveMemoryAudioSrc(null);

      // Trigger callback (e.g. auto close memory lightbox)
      if (onMemoryEndedRef.current) {
        const cb = onMemoryEndedRef.current;
        onMemoryEndedRef.current = undefined;
        cb();
      }

      // Resume main music if it was playing prior to memory audio
      if (wasBgPlayingBeforeMemory.current) {
        wasBgPlayingBeforeMemory.current = false;
        if (bgAudioRef.current && bgAudioRef.current.src) {
          bgAudioRef.current
            .play()
            .then(() => {
              isBgPlayingRef.current = true;
              setIsBgPlaying(true);
            })
            .catch(() => {
              isBgPlayingRef.current = false;
              setIsBgPlaying(false);
            });
        }
      }
    };

    bgAudio.addEventListener('ended', handleBgEnded);
    bgAudio.addEventListener('play', handleBgPlay);
    bgAudio.addEventListener('pause', handleBgPause);
    memAudio.addEventListener('ended', handleMemEnded);

    return () => {
      bgAudio.removeEventListener('ended', handleBgEnded);
      bgAudio.removeEventListener('play', handleBgPlay);
      bgAudio.removeEventListener('pause', handleBgPause);
      memAudio.removeEventListener('ended', handleMemEnded);
      bgAudio.pause();
      bgAudio.src = '';
      memAudio.pause();
      memAudio.src = '';
    };
  }, []);

  // Update background audio src when siteData.audio.audioSrc changes
  useEffect(() => {
    if (!bgAudioRef.current) return;

    if (!hasMainAudio) {
      // Audio was deleted or empty: stop immediately
      bgAudioRef.current.pause();
      bgAudioRef.current.currentTime = 0;
      bgAudioRef.current.removeAttribute('src');
      bgAudioRef.current.load();
      setIsBgPlaying(false);
      wasBgPlayingBeforeMemory.current = false;
    } else {
      // Audio source is valid
      const currentSrc = bgAudioRef.current.src;
      const isSameSrc =
        currentSrc === mainAudioSrc ||
        currentSrc === window.location.origin + mainAudioSrc;

      if (!isSameSrc) {
        const wasPlaying = isBgPlaying;
        bgAudioRef.current.src = mainAudioSrc;
        bgAudioRef.current.load();
        if (wasPlaying) {
          bgAudioRef.current
            .play()
            .then(() => setIsBgPlaying(true))
            .catch(() => setIsBgPlaying(false));
        }
      }
    }
  }, [hasMainAudio, mainAudioSrc]);

  // Volume & Mute Controls
  const setVolume = useCallback(
    (v: number) => {
      const clamped = Math.max(0, Math.min(1, v));
      setVolumeState(clamped);
      if (clamped > 0 && isMuted) {
        setIsMutedState(false);
      }
      if (bgAudioRef.current) {
        bgAudioRef.current.volume = isMuted ? 0 : clamped;
      }
      if (memoryAudioRef.current) {
        memoryAudioRef.current.volume = isMuted ? 0 : clamped;
      }
    },
    [isMuted]
  );

  const setIsMuted = useCallback(
    (m: boolean) => {
      setIsMutedState(m);
      if (bgAudioRef.current) bgAudioRef.current.volume = m ? 0 : volume;
      if (memoryAudioRef.current) memoryAudioRef.current.volume = m ? 0 : volume;
    },
    [volume]
  );

  const toggleMute = useCallback(() => {
    setIsMuted(!isMuted);
  }, [isMuted, setIsMuted]);

  // Background Audio Actions
  const playBgAudio = useCallback(async () => {
    if (!hasMainAudio || !bgAudioRef.current) return;

    try {
      if (!bgAudioRef.current.src) {
        bgAudioRef.current.src = mainAudioSrc;
      }
      bgAudioRef.current.loop = true;
      bgAudioRef.current.volume = isMuted ? 0 : volume;
      const playPromise = bgAudioRef.current.play();
      if (playPromise !== undefined) {
        await playPromise;
      }
      isBgPlayingRef.current = true;
      setIsBgPlaying(true);
    } catch (err: any) {
      // Gracefully handle browser autoplay rejection without throwing errors
      isBgPlayingRef.current = false;
      setIsBgPlaying(false);
    }
  }, [hasMainAudio, mainAudioSrc, isMuted, volume]);

  const pauseBgAudio = useCallback(() => {
    if (bgAudioRef.current) {
      bgAudioRef.current.pause();
    }
    isBgPlayingRef.current = false;
    setIsBgPlaying(false);
  }, []);

  const stopBgAudio = useCallback(() => {
    if (bgAudioRef.current) {
      bgAudioRef.current.pause();
      bgAudioRef.current.currentTime = 0;
    }
    isBgPlayingRef.current = false;
    setIsBgPlaying(false);
  }, []);

  const toggleBgAudio = useCallback(() => {
    if (isBgPlaying) {
      pauseBgAudio();
    } else {
      playBgAudio();
    }
  }, [isBgPlaying, pauseBgAudio, playBgAudio]);

  // Memory Audio Actions
  const playMemoryAudio = useCallback(
    async (src: string, onEnded?: () => void) => {
      if (!src || !memoryAudioRef.current) return;

      // Remember if main background music was playing before memory audio
      if (isBgPlaying) {
        wasBgPlayingBeforeMemory.current = true;
        pauseBgAudio();
      }

      try {
        memoryAudioRef.current.pause();
        memoryAudioRef.current.currentTime = 0;
        memoryAudioRef.current.src = src;
        memoryAudioRef.current.volume = isMuted ? 0 : volume;
        onMemoryEndedRef.current = onEnded;

        setActiveMemoryAudioSrc(src);
        const promise = memoryAudioRef.current.play();
        if (promise !== undefined) {
          await promise;
        }
        setIsMemoryAudioPlaying(true);
      } catch (err) {
        console.warn('Memory audio playback failed:', err);
        setIsMemoryAudioPlaying(false);
        setActiveMemoryAudioSrc(null);
      }
    },
    [isBgPlaying, isMuted, volume, pauseBgAudio]
  );

  const stopMemoryAudio = useCallback(() => {
    if (memoryAudioRef.current) {
      memoryAudioRef.current.pause();
      memoryAudioRef.current.currentTime = 0;
    }
    setIsMemoryAudioPlaying(false);
    setActiveMemoryAudioSrc(null);
    onMemoryEndedRef.current = undefined;

    // Resume main background audio if it was active before
    if (wasBgPlayingBeforeMemory.current) {
      wasBgPlayingBeforeMemory.current = false;
      if (hasMainAudio) {
        playBgAudio();
      }
    }
  }, [hasMainAudio, playBgAudio]);

  // Global Audio Safety Stop
  const stopAllAudio = useCallback(() => {
    if (bgAudioRef.current) {
      bgAudioRef.current.pause();
      bgAudioRef.current.currentTime = 0;
    }
    if (memoryAudioRef.current) {
      memoryAudioRef.current.pause();
      memoryAudioRef.current.currentTime = 0;
    }
    isBgPlayingRef.current = false;
    setIsBgPlaying(false);
    setIsMemoryAudioPlaying(false);
    setActiveMemoryAudioSrc(null);
    wasBgPlayingBeforeMemory.current = false;
    onMemoryEndedRef.current = undefined;
  }, []);

  return (
    <AudioContext.Provider
      value={{
        isBgPlaying,
        hasMainAudio,
        mainAudioTitle,
        playBgAudio,
        pauseBgAudio,
        stopBgAudio,
        toggleBgAudio,
        volume,
        setVolume,
        isMuted,
        setIsMuted,
        toggleMute,
        activeMemoryAudioSrc,
        isMemoryAudioPlaying,
        playMemoryAudio,
        stopMemoryAudio,
        stopAllAudio,
      }}
    >
      {children}
    </AudioContext.Provider>
  );
};

export const useAudio = (): AudioContextType => {
  const context = useContext(AudioContext);
  if (!context) {
    throw new Error('useAudio must be used within an AudioProvider');
  }
  return context;
};
