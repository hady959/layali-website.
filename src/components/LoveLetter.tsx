import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'motion/react';
import { Feather, Sparkles, RotateCcw, Volume2, VolumeX, FastForward, ChevronDown, Heart } from 'lucide-react';
import { useSiteData } from '../context/SiteDataContext';
import { letterAudio } from '../utils/letterAudio';
import { EnvelopeHeartsBurst, FloatingHeartParticle } from './EnvelopeHeartsBurst';

type SequencePhase =
  | 'idle'
  | 'seal_pressed'
  | 'seal_lifting'
  | 'flap_opening'
  | 'paper_extracting'
  | 'paper_settling'
  | 'seal_landing'
  | 'writing_paragraphs'
  | 'writing_heart'
  | 'writing_signature'
  | 'finished';

export const LoveLetter: React.FC = () => {
  const { siteData } = useSiteData();
  const [phase, setPhase] = useState<SequencePhase>('idle');
  const [isMuted, setIsMuted] = useState(false);
  const [isSealHovered, setIsSealHovered] = useState(false);

  // Floating Romantic Hearts & Sparkles Particles
  const [burstParticles, setBurstParticles] = useState<FloatingHeartParticle[]>([]);

  // Dynamic True Ink-Reveal State (starts 100% EMPTY - NO PRE-EXISTING TEXT)
  const [writtenParagraphs, setWrittenParagraphs] = useState<string[]>([]);
  const [activeParaIdx, setActiveParaIdx] = useState(0);
  const [heartProgress, setHeartProgress] = useState(0); // 0 -> 1
  const [closingWritten, setClosingWritten] = useState('');
  const [signatureWritten, setSignatureWritten] = useState('');

  // Pen Nib Contact Coordinates (in Paper coordinate space)
  const [penPos, setPenPos] = useState<{ x: number; y: number }>({ x: 500, y: 120 });
  const [isPenWriting, setIsPenWriting] = useState(false);

  // References
  const stageRef = useRef<HTMLDivElement | null>(null);
  const paperRef = useRef<HTMLDivElement | null>(null);
  const heartPathRef = useRef<SVGPathElement | null>(null);
  const activeNibRef = useRef<HTMLSpanElement | null>(null);
  const timersRef = useRef<NodeJS.Timeout[]>([]);
  const animationFrameRef = useRef<number | null>(null);
  const [paperHeight, setPaperHeight] = useState<number>(560);

  const paragraphs = siteData.letter.paragraphs || [];
  const closingText = siteData.letter.closing || 'مع كل الحب،';
  const signatureText = siteData.letter.signature || '— هادي';
  const letterDate = siteData.letter.date || '١٦ أغسطس ٢٠٢٦';

  // Observe paper height changes as text writes and expands naturally
  useEffect(() => {
    if (!paperRef.current) return;
    const updateHeight = () => {
      if (paperRef.current) {
        setPaperHeight(paperRef.current.offsetHeight);
      }
    };
    updateHeight();

    const ro = new ResizeObserver(() => {
      updateHeight();
    });
    ro.observe(paperRef.current);
    return () => ro.disconnect();
  }, [writtenParagraphs, closingWritten, signatureWritten, heartProgress, phase]);

  // Cleanup helper
  const clearAllTimers = useCallback(() => {
    timersRef.current.forEach((t) => clearTimeout(t));
    timersRef.current = [];
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      clearAllTimers();
    };
  }, [clearAllTimers]);

  // Sound toggle
  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    letterAudio.setMuted(nextMuted);
  };

  // Particle Cleanup Callback
  const handleParticleComplete = useCallback((id: string | number) => {
    setBurstParticles((prev) => prev.filter((p) => p.id !== id));
  }, []);

  // Spawn High-Craft Floating Hearts & Sparkle Particles Around the Perimeter of Envelope
  const spawnPerimeterHeartBurst = useCallback((count = 42) => {
    const typePool: FloatingHeartParticle['type'][] = [
      'heart_ruby',
      'heart_ruby',
      'heart_rose',
      'heart_rose',
      'heart_gold',
      'heart_gold',
      'heart_crimson',
      'star_gold',
      'sparkle_glow',
    ];

    const envHalfW = 260; // 520px / 2
    const envHalfH = 175; // 350px / 2

    const newParticles: FloatingHeartParticle[] = Array.from({ length: count }).map((_, i) => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}-${i}`;

      // Distribute evenly along envelope perimeter: 4 edges + 4 corners
      const zone = i % 8;
      let startX = 0;
      let startY = 0;
      let targetX = 0;
      let targetY = 0;

      switch (zone) {
        case 0: // Top Edge (Spans across the top)
          startX = (Math.random() - 0.5) * (envHalfW * 1.8);
          startY = -envHalfH + (Math.random() - 0.5) * 20;
          targetX = startX + (Math.random() - 0.5) * 140;
          targetY = startY - (170 + Math.random() * 260);
          break;
        case 1: // Bottom Edge (Spans across the bottom)
          startX = (Math.random() - 0.5) * (envHalfW * 1.8);
          startY = envHalfH + (Math.random() - 0.5) * 20;
          targetX = startX + (startX < 0 ? -1 : 1) * (60 + Math.random() * 140);
          targetY = startY - (120 + Math.random() * 240); // Fountains up and around
          break;
        case 2: // Left Edge (Spans down left side)
          startX = -envHalfW + (Math.random() - 0.5) * 20;
          startY = (Math.random() - 0.5) * (envHalfH * 1.6);
          targetX = startX - (90 + Math.random() * 200);
          targetY = startY - (70 + Math.random() * 230);
          break;
        case 3: // Right Edge (Spans down right side)
          startX = envHalfW + (Math.random() - 0.5) * 20;
          startY = (Math.random() - 0.5) * (envHalfH * 1.6);
          targetX = startX + (90 + Math.random() * 200);
          targetY = startY - (70 + Math.random() * 230);
          break;
        case 4: // Top-Left Corner
          startX = -envHalfW + (Math.random() - 0.5) * 25;
          startY = -envHalfH + (Math.random() - 0.5) * 25;
          targetX = startX - (100 + Math.random() * 180);
          targetY = startY - (160 + Math.random() * 240);
          break;
        case 5: // Top-Right Corner
          startX = envHalfW + (Math.random() - 0.5) * 25;
          startY = -envHalfH + (Math.random() - 0.5) * 25;
          targetX = startX + (100 + Math.random() * 180);
          targetY = startY - (160 + Math.random() * 240);
          break;
        case 6: // Bottom-Left Corner
          startX = -envHalfW + (Math.random() - 0.5) * 25;
          startY = envHalfH + (Math.random() - 0.5) * 25;
          targetX = startX - (90 + Math.random() * 160);
          targetY = startY - (140 + Math.random() * 240);
          break;
        case 7: // Bottom-Right Corner
        default:
          startX = envHalfW + (Math.random() - 0.5) * 25;
          startY = envHalfH + (Math.random() - 0.5) * 25;
          targetX = startX + (90 + Math.random() * 160);
          targetY = startY - (140 + Math.random() * 240);
          break;
      }

      // Smooth sinusoidal wobble trajectory
      const midX1 = startX + (targetX - startX) * 0.35 + (Math.random() - 0.5) * 70;
      const midX2 = startX + (targetX - startX) * 0.75 + (Math.random() - 0.5) * 70;

      const size = Math.floor(16 + Math.random() * 28);
      const duration = 2.5 + Math.random() * 1.7;
      const delay = Math.random() * 0.45;
      const scale = 0.8 + Math.random() * 0.5;
      const rotate = (Math.random() - 0.5) * 45;
      const targetRotate = rotate + (Math.random() - 0.5) * 70;
      const opacity = 0.85 + Math.random() * 0.15;
      const type = typePool[Math.floor(Math.random() * typePool.length)];

      return {
        id,
        startX,
        startY,
        targetX,
        targetY,
        wobbleX: [startX, midX1, midX2, targetX],
        size,
        rotate,
        targetRotate,
        duration,
        delay,
        scale,
        type,
        opacity,
      };
    });

    setBurstParticles((prev) => [...prev.slice(-45), ...newParticles]);
  }, []);

  // Instant Skip - instantly finishes reveal
  const handleSkipWriting = (e: React.MouseEvent) => {
    e.stopPropagation();
    clearAllTimers();
    setWrittenParagraphs([...paragraphs]);
    setHeartProgress(1);
    setClosingWritten(closingText);
    setSignatureWritten(signatureText);
    setIsPenWriting(false);
    setPhase('finished');
    letterAudio.playCompletionChime();
    spawnPerimeterHeartBurst(36);
  };

  // =========================================================================
  // PEN CONTACT POSITION TRACKING
  // =========================================================================
  const alignNibPosition = useCallback(() => {
    if (!paperRef.current) return;
    const paperRect = paperRef.current.getBoundingClientRect();

    if (activeNibRef.current) {
      const nibCharRect = activeNibRef.current.getBoundingClientRect();
      const targetX = nibCharRect.left - paperRect.left - 2;
      const targetY = nibCharRect.top - paperRect.top + nibCharRect.height * 0.72;

      setPenPos({
        x: Math.max(25, Math.min(paperRect.width - 25, targetX)),
        y: Math.max(30, targetY),
      });
    }
  }, []);

  useEffect(() => {
    if (phase === 'writing_paragraphs' || phase === 'writing_signature') {
      alignNibPosition();
    }
  }, [writtenParagraphs, closingWritten, signatureWritten, phase, alignNibPosition]);

  // =========================================================================
  // 1. OPENING SEQUENCE CONTROLLER
  // =========================================================================
  const startOpeningSequence = () => {
    if (phase !== 'idle') return;
    clearAllTimers();

    // 1. User Clicks Seal -> Seal Pressed
    setPhase('seal_pressed');
    letterAudio.playWaxCrack();

    // 2. The SAME Seal Lifts up from Envelope
    const t1 = setTimeout(() => {
      setPhase('seal_lifting');
    }, 200);

    // 3. Top Flap Swings Open (180deg hinge) -> RADIANT PERIMETER BURST OF HEARTS & CHIMES!
    const t2 = setTimeout(() => {
      setPhase('flap_opening');
      letterAudio.playPaperRustle();
      letterAudio.playMagicSparkleChime();
      spawnPerimeterHeartBurst(48);
    }, 650);

    // 4. Physical Paper Extracts from inside envelope -> SECOND ENCHANTING WAVE
    const t3 = setTimeout(() => {
      setPhase('paper_extracting');
      spawnPerimeterHeartBurst(28);
    }, 1400);

    // 5. Paper Moves Forward and Settles into Reading Focus
    const t4 = setTimeout(() => {
      setPhase('paper_settling');
    }, 2600);

    // 6. The SAME Seal Lands on the Paper's Crest Area
    const t5 = setTimeout(() => {
      setPhase('seal_landing');
      letterAudio.playPaperRustle();
    }, 3200);

    // 7. True Handwriting Begins directly on the Paper (within ~350ms after settle/landing)
    const t6 = setTimeout(() => {
      setPhase('writing_paragraphs');
      setIsPenWriting(true);
      startTrueHandwriting();
    }, 3550);

    timersRef.current = [t1, t2, t3, t4, t5, t6];
  };

  // =========================================================================
  // 2. TRUE HANDWRITING ENGINE (Zero text pre-rendered, ink forms progressively)
  // =========================================================================
  const startTrueHandwriting = () => {
    // Reset all written text to empty strings
    setWrittenParagraphs(paragraphs.map(() => ''));
    setActiveParaIdx(0);
    setClosingWritten('');
    setSignatureWritten('');
    setHeartProgress(0);

    let currentPIdx = 0;
    let currentCharCount = 0;
    let tick = 0;

    const writeNextTick = () => {
      if (currentPIdx >= paragraphs.length) {
        // Paragraphs finished -> Proceed to Heart
        startDrawingHeart();
        return;
      }

      const fullText = paragraphs[currentPIdx] || '';
      if (currentCharCount < fullText.length) {
        currentCharCount++;
        const currentSlice = fullText.slice(0, currentCharCount);

        setWrittenParagraphs((prev) => {
          const next = [...prev];
          next[currentPIdx] = currentSlice;
          return next;
        });

        tick++;
        if (tick % 5 === 0) {
          letterAudio.playPenScratch();
        }

        // Random organic delay between Arabic characters (28ms - 42ms)
        const delay = fullText[currentCharCount - 1] === ' ' ? 42 : 28;
        const timer = setTimeout(writeNextTick, delay);
        timersRef.current.push(timer);
      } else {
        // Jump to next paragraph with slight pause
        currentPIdx++;
        currentCharCount = 0;
        setActiveParaIdx(currentPIdx);

        const timer = setTimeout(writeNextTick, 280);
        timersRef.current.push(timer);
      }
    };

    writeNextTick();
  };

  // 3. DRAWING CALLIGRAPHIC HEART (Visible in full flow as paper expands)
  const startDrawingHeart = () => {
    setPhase('writing_heart');
    setIsPenWriting(true);

    const startTime = Date.now();
    const duration = 1500;
    let lastScratchTick = 0;

    const drawHeartFrame = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(1, elapsed / duration);
      setHeartProgress(progress);

      if (Math.floor(elapsed / 150) !== lastScratchTick) {
        letterAudio.playPenScratch();
        lastScratchTick = Math.floor(elapsed / 150);
      }

      // Smooth Fountain Pen follow along the SVG heart contour
      if (heartPathRef.current && paperRef.current) {
        try {
          const pathEl = heartPathRef.current;
          const totalLen = pathEl.getTotalLength() || 120;
          const pt = pathEl.getPointAtLength(progress * totalLen);
          const pathRect = pathEl.getBoundingClientRect();
          const paperRect = paperRef.current.getBoundingClientRect();

          const targetX = pathRect.left - paperRect.left + (pt.x / 60) * pathRect.width;
          const targetY = pathRect.top - paperRect.top + (pt.y / 40) * pathRect.height;

          setPenPos({
            x: Math.max(20, Math.min(paperRect.width - 20, targetX)),
            y: Math.max(30, targetY),
          });
        } catch {
          // ignore
        }
      }

      if (progress < 1) {
        animationFrameRef.current = requestAnimationFrame(drawHeartFrame);
      } else {
        startWritingClosingAndSignature();
      }
    };

    animationFrameRef.current = requestAnimationFrame(drawHeartFrame);
  };

  // 4. WRITING CLOSING & SIGNATURE
  const startWritingClosingAndSignature = () => {
    setPhase('writing_signature');
    setIsPenWriting(true);

    let cIdx = 0;
    let sIdx = 0;

    const writeClosingTick = () => {
      if (cIdx < closingText.length) {
        cIdx++;
        setClosingWritten(closingText.slice(0, cIdx));
        if (cIdx % 4 === 0) letterAudio.playPenScratch();
        const t = setTimeout(writeClosingTick, 32);
        timersRef.current.push(t);
      } else if (sIdx < signatureText.length) {
        sIdx++;
        setSignatureWritten(signatureText.slice(0, sIdx));
        if (sIdx % 3 === 0) letterAudio.playPenScratch();
        const t = setTimeout(writeClosingTick, 38);
        timersRef.current.push(t);
      } else {
        // Complete! Finished state
        setIsPenWriting(false);
        setPhase('finished');
        letterAudio.playCompletionChime();
        spawnPerimeterHeartBurst(32);
      }
    };

    writeClosingTick();
  };

  // 5. RE-FOLD LETTER TO ENVELOPE (REVERSIBLE PHYSICAL CYCLE)
  const handleResetToEnvelope = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    clearAllTimers();
    setIsPenWriting(false);
    setWrittenParagraphs([]);
    setClosingWritten('');
    setSignatureWritten('');
    setHeartProgress(0);
    setBurstParticles([]);
    setPhase('idle');
  };

  // Stage Boolean Helpers
  const isFlapOpen =
    phase === 'flap_opening' ||
    phase === 'paper_extracting' ||
    phase === 'paper_settling' ||
    phase === 'seal_landing' ||
    phase === 'writing_paragraphs' ||
    phase === 'writing_heart' ||
    phase === 'writing_signature' ||
    phase === 'finished';

  const isPaperVisible =
    phase === 'flap_opening' ||
    phase === 'paper_extracting' ||
    phase === 'paper_settling' ||
    phase === 'seal_landing' ||
    phase === 'writing_paragraphs' ||
    phase === 'writing_heart' ||
    phase === 'writing_signature' ||
    phase === 'finished';

  const isPaperExtracted =
    phase === 'paper_settling' ||
    phase === 'seal_landing' ||
    phase === 'writing_paragraphs' ||
    phase === 'writing_heart' ||
    phase === 'writing_signature' ||
    phase === 'finished';

  // =========================================================================
  // 6. CONTINUOUS SINGLE WAX SEAL 3D POSITION CALCULATOR (Pre-landing phases)
  // =========================================================================
  const getSealAnimation = () => {
    switch (phase) {
      case 'idle':
        return {
          y: 20, // Centered directly over envelope flap apex
          z: 38,
          scale: isSealHovered ? 1.06 : 1,
          rotate: isSealHovered ? 2 : 0,
          rotateX: 0,
          rotateY: 0,
          opacity: 1,
        };
      case 'seal_pressed':
        return {
          y: 22,
          z: 28,
          scale: 0.94,
          rotate: 0,
          rotateX: 4,
          rotateY: 0,
          opacity: 1,
        };
      case 'seal_lifting':
        return {
          y: -50,
          z: 120,
          scale: 1.15,
          rotate: -6,
          rotateX: 18,
          rotateY: -8,
          opacity: 1,
        };
      case 'flap_opening':
        return {
          y: -120,
          z: 140,
          scale: 1.08,
          rotate: 3,
          rotateX: 10,
          rotateY: 2,
          opacity: 1,
        };
      case 'paper_extracting':
        // Traveling in 3D arc toward top crest of emerging paper
        return {
          y: -210,
          z: 160,
          scale: 0.98,
          rotate: 1,
          rotateX: 6,
          rotateY: 0,
          opacity: 1,
        };
      case 'paper_settling':
        return {
          y: -225,
          z: 175,
          scale: 0.92,
          rotate: 0,
          rotateX: 2,
          rotateY: 0,
          opacity: 0.8,
        };
      case 'seal_landing':
      case 'writing_paragraphs':
      case 'writing_heart':
      case 'writing_signature':
      case 'finished':
      default:
        // Seamlessly transitions & docks directly inside the Paper's Dotted Crest Circle!
        return {
          y: -225,
          z: 175,
          scale: 0.88,
          rotate: 0,
          rotateX: 0,
          rotateY: 0,
          opacity: 0, // Hidden in outer stage because it is permanently docked in the paper
        };
    }
  };

  return (
    <section
      id="letter-section"
      className="relative py-16 sm:py-24 px-3 sm:px-6 max-w-5xl mx-auto select-none"
    >
      {/* Background Atmosphere */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[420px] sm:w-[800px] h-[420px] sm:h-[800px] bg-gradient-to-tr from-[#6E1835]/25 via-[#D7B56D]/12 to-transparent rounded-full blur-3xl pointer-events-none -z-10" />

      {/* SECTION HEADER (STATIONARY - NEVER MOVES) */}
      <div className="text-center mb-10 sm:mb-14 relative z-10">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="inline-flex items-center justify-center w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-[#6E1835]/30 border border-[#D7B56D]/40 mb-4 shadow-[0_0_25px_rgba(215,181,109,0.2)]"
        >
          <Feather className="w-4 h-4 sm:w-5 sm:h-5 text-[#D7B56D]" />
        </motion.div>

        <h2 className="text-2xl sm:text-4xl md:text-5xl font-serif-arabic text-gold-gradient-artistic font-bold mb-3 sm:mb-4 gold-glow leading-snug">
          {siteData.letter.title || 'رسالة من القلب'}
        </h2>

        <p className="text-sm sm:text-base md:text-lg font-serif-arabic text-[#A49CA8] max-w-xl mx-auto px-2">
          {siteData.letter.subtitle}
        </p>

        {/* Action Controls */}
        <div className="flex items-center justify-center flex-wrap gap-2.5 sm:gap-3 mt-5">
          <button
            type="button"
            onClick={toggleMute}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-xs font-sans-arabic text-[#D7B56D] transition-colors cursor-pointer"
            title={isMuted ? 'تفعيل الصوت' : 'كتم الصوت'}
          >
            {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
            <span>{isMuted ? 'الصوت مكتوم' : 'صوت المؤثرات'}</span>
          </button>

          {(phase === 'writing_paragraphs' ||
            phase === 'writing_heart' ||
            phase === 'writing_signature') && (
            <motion.button
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              type="button"
              onClick={handleSkipWriting}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#6E1835]/70 hover:bg-[#8B2245] border border-[#D7B56D]/50 text-xs font-sans-arabic text-white transition-all cursor-pointer shadow-[0_0_15px_rgba(215,181,109,0.3)]"
            >
              <FastForward className="w-3.5 h-3.5 text-[#D7B56D]" />
              <span>تخطي الكتابة وعرض الرسالة</span>
            </motion.button>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3D CONTINUOUS STAGE WITH SINGLE PERSISTENT OBJECTS                        */}
      {/* ========================================================================= */}
      <div
        ref={stageRef}
        style={{
          minHeight: isPaperExtracted ? `${paperHeight + 140}px` : '420px',
        }}
        className="relative w-full flex flex-col items-center justify-start pt-4 sm:pt-6 [perspective:1800px] transition-[min-height] duration-700 ease-out"
      >
        {/* Floating Romantic Hearts & Radiant Sparkle Particle Eruption System */}
        <EnvelopeHeartsBurst
          particles={burstParticles}
          onParticleComplete={handleParticleComplete}
        />

        {/* Soft Ambient Floor Reflection */}
        <motion.div
          animate={{
            scale: isPaperExtracted ? 1.4 : 1,
            opacity: isPaperExtracted ? 0.7 : 0.95,
            y: isPaperExtracted ? 260 : 0,
          }}
          transition={{ duration: 0.8 }}
          className="absolute bottom-[-10px] inset-x-6 sm:inset-x-20 h-16 bg-black/90 rounded-full blur-2xl pointer-events-none -z-20"
        />

        {/* ===================================================================== */}
        {/* 1. PHYSICAL 3D ENVELOPE ASSEMBLY                                      */}
        {/* ===================================================================== */}
        <motion.div
          id="envelope-assembly"
          animate={{
            y: isPaperExtracted ? 280 : phase === 'paper_extracting' ? 140 : 20,
            scale: isPaperExtracted ? 0.82 : 1,
            opacity: isPaperExtracted ? 0.28 : 1,
            rotateX: isPaperExtracted ? 14 : phase === 'seal_pressed' ? 2 : 0,
            filter: isPaperExtracted ? 'blur(1.5px)' : 'blur(0px)',
          }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
          className="relative w-full max-w-[580px] h-[340px] sm:h-[380px] rounded-2xl [transform-style:preserve-3d] z-10 cursor-pointer shrink-0"
          onClick={() => {
            if (phase === 'idle') startOpeningSequence();
          }}
        >
          {/* Subtle Golden Envelope Halo Glow */}
          <motion.div
            animate={{
              scale: isSealHovered && phase === 'idle' ? 1.06 : [1, 1.03, 1],
              opacity: isSealHovered && phase === 'idle' ? 0.85 : [0.35, 0.6, 0.35],
            }}
            transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute -inset-4 rounded-3xl bg-gradient-to-r from-[#D7B56D]/20 via-[#8B2245]/35 to-[#D7B56D]/20 blur-2xl pointer-events-none -z-10"
          />

          {/* Envelope Back Plate Shell */}
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-b from-[#7A1C3C] via-[#5C132C] to-[#3B0B1B] border-2 border-[#D7B56D]/75 shadow-[0_25px_60px_rgba(0,0,0,0.95),inset_0_2px_4px_rgba(255,255,255,0.25)] overflow-hidden z-[1]">
            {/* Dark Ruby Interior Velvet Pocket Lining */}
            <div className="absolute inset-2.5 rounded-xl bg-gradient-to-b from-[#250512] via-[#150209] to-[#0A0104] border border-[#D7B56D]/20 shadow-inner">
              <div className="absolute top-4 inset-x-8 h-px bg-gradient-to-r from-transparent via-[#D7B56D]/30 to-transparent" />
            </div>
          </div>

          {/* Left Envelope Flap (3D Fold) */}
          <div
            className="absolute inset-y-0 left-0 w-1/2 pointer-events-none z-20"
            style={{
              clipPath: 'polygon(0 0, 100% 50%, 0 100%)',
              background:
                'linear-gradient(135deg, #9C274E 0%, #731737 55%, #4A0E23 100%)',
              filter: 'drop-shadow(6px 0 14px rgba(0,0,0,0.65))',
              borderLeft: '2px solid rgba(215,181,109,0.7)',
            }}
          />

          {/* Right Envelope Flap (3D Fold) */}
          <div
            className="absolute inset-y-0 right-0 w-1/2 pointer-events-none z-20"
            style={{
              clipPath: 'polygon(100% 0, 0 50%, 100% 100%)',
              background:
                'linear-gradient(-135deg, #9C274E 0%, #731737 55%, #4A0E23 100%)',
              filter: 'drop-shadow(-6px 0 14px rgba(0,0,0,0.65))',
              borderRight: '2px solid rgba(215,181,109,0.7)',
            }}
          />

          {/* Bottom Pocket Flap */}
          <div
            className="absolute inset-x-0 bottom-0 h-[65%] pointer-events-none z-25"
            style={{
              clipPath: 'polygon(0 100%, 50% 16%, 100% 100%)',
              background:
                'linear-gradient(180deg, #A82E56 0%, #7E1B3E 50%, #520F27 100%)',
              filter: 'drop-shadow(0 -8px 18px rgba(0,0,0,0.75))',
            }}
          >
            <div className="absolute top-0 inset-x-0 h-[1.5px] bg-gradient-to-r from-transparent via-[#D7B56D]/80 to-transparent" />
          </div>

          {/* 3D Hinged Top Flap */}
          <motion.div
            className="absolute inset-x-0 top-0 h-[58%] pointer-events-none rounded-t-2xl [transform-style:preserve-3d]"
            style={{
              transformOrigin: 'top center',
              zIndex: isFlapOpen ? 12 : 30,
            }}
            animate={{
              rotateX: isFlapOpen ? 180 : 0,
            }}
            transition={{
              duration: 0.9,
              ease: [0.35, 0, 0.15, 1],
            }}
          >
            {/* Front Side of Flap (Closed) */}
            <div
              className="w-full h-full border-b border-[#D7B56D]/80"
              style={{
                clipPath: 'polygon(0 0, 100% 0, 50% 100%)',
                filter: 'drop-shadow(0 14px 22px rgba(0,0,0,0.85))',
                backfaceVisibility: 'hidden',
                background:
                  'linear-gradient(180deg, #B5345E 0%, #871D43 65%, #59102C 100%)',
              }}
            >
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-28 h-[1.5px] bg-[#D7B56D]" />
            </div>

            {/* Back Side of Flap (When flipped open) */}
            <div
              className="absolute inset-0 [transform:rotateX(180deg)] [backface-visibility:hidden] overflow-hidden"
              style={{
                clipPath: 'polygon(0 0, 100% 0, 50% 100%)',
                background:
                  'linear-gradient(180deg, #2B0715 0%, #1A040D 70%, #0F0208 100%)',
              }}
            >
              <div className="absolute inset-0 border-b border-[#D7B56D]/30" />
            </div>
          </motion.div>
        </motion.div>

        {/* ===================================================================== */}
        {/* 2. THE PHYSICAL PARCHMENT SHEET (NATURALLY AUTO-EXPANDS DOWNWARD)     */}
        {/* ===================================================================== */}
        <motion.div
          ref={paperRef}
          id="physical-parchment-sheet"
          initial={false}
          animate={{
            visibility: isPaperVisible ? 'visible' : 'hidden',
            opacity: isPaperVisible ? 1 : 0,
            pointerEvents: isPaperExtracted ? 'auto' : 'none',
            y:
              !isPaperVisible
                ? 100
                : phase === 'flap_opening'
                ? 90
                : phase === 'paper_extracting'
                ? 20
                : 0,
            z:
              !isPaperVisible
                ? 0
                : phase === 'flap_opening'
                ? 4
                : phase === 'paper_extracting'
                ? 85
                : 160,
            scale:
              !isPaperVisible
                ? 0.72
                : phase === 'flap_opening'
                ? 0.72
                : phase === 'paper_extracting'
                ? 0.96
                : 1.02,
            rotateX: phase === 'paper_extracting' ? -4 : 0,
            rotateZ: phase === 'paper_extracting' ? -1 : 0,
          }}
          transition={{
            duration:
              phase === 'paper_extracting'
                ? 1.2
                : phase === 'paper_settling'
                ? 0.9
                : 0.5,
            ease: [0.22, 1, 0.36, 1],
          }}
          style={{
            zIndex: isPaperExtracted ? 45 : 15,
            display: isPaperVisible ? 'flex' : 'none',
            top: '16px',
            filter: 'none',
            transformOrigin: 'top center',
          }}
          className="absolute inset-x-0 mx-auto w-[96%] max-w-[740px] min-h-[460px] h-auto rounded-2xl bg-[#0e0a12] border-2 border-[#D7B56D]/70 shadow-[0_40px_100px_rgba(0,0,0,0.98),0_0_50px_rgba(215,181,109,0.2)] p-6 sm:p-10 md:p-12 pb-10 sm:pb-14 text-right overflow-visible [transform-style:preserve-3d] flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Paper Texture and Luxury Watermarks */}
          <div className="absolute inset-0 bg-gradient-to-b from-[#180f1a] via-[#110914] to-[#0a050d] pointer-events-none rounded-2xl" />
          <div className="absolute inset-2.5 sm:inset-3.5 border border-[#D7B56D]/40 rounded-xl pointer-events-none" />
          <div className="absolute inset-4 sm:inset-5 border border-white/10 rounded-lg pointer-events-none" />

          {/* Faint H&L Watermark */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 font-display-en text-[#D7B56D]/[0.035] text-5xl sm:text-7xl md:text-8xl lg:text-9xl font-bold select-none pointer-events-none whitespace-nowrap leading-none text-center flex items-center justify-center max-w-full overflow-hidden">
            <span className="whitespace-nowrap tracking-wider select-none">
              {siteData.intro?.monogramText || 'H & L'}
            </span>
          </div>

          {/* Re-fold Button (When reading or finished) */}
          {isPaperExtracted && (
            <div className="absolute top-4 left-4 sm:top-6 sm:left-6 z-30">
              <button
                type="button"
                onClick={handleResetToEnvelope}
                className="w-8 h-8 rounded-full bg-white/[0.06] hover:bg-[#6E1835]/50 border border-white/15 hover:border-[#D7B56D]/50 text-[#A49CA8] hover:text-[#D7B56D] flex items-center justify-center transition-all cursor-pointer shadow-md"
                title="إعادة طي الرسالة داخل الظرف"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Top Monogram Crest Base (Where the Seal permanently lands & docks) */}
          <div className="flex justify-center mb-5 sm:mb-7 relative z-10 shrink-0">
            <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-full border-2 border-dashed border-[#D7B56D]/60 flex items-center justify-center bg-black/40 shadow-inner p-1">
              {/* The Wax Seal docked securely inside the Dotted Circle */}
              {(isPaperExtracted || phase === 'seal_landing') && (
                <motion.div
                  initial={{ scale: 1.3, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                  onClick={(e) => {
                    e.stopPropagation();
                    letterAudio.playMagicSparkleChime();
                    spawnPerimeterHeartBurst(32);
                  }}
                  className="w-full h-full rounded-full flex items-center justify-center relative select-none shadow-md cursor-pointer hover:scale-105 active:scale-95 transition-transform"
                  title="انقري لإطلاق قلوب متطايرة"
                  style={{
                    borderRadius: '48% 52% 51% 49% / 53% 47% 53% 47%',
                    background:
                      'radial-gradient(circle at 35% 35%, #A82850 0%, #751433 55%, #42071A 100%)',
                    boxShadow: `
                      0 8px 20px rgba(0,0,0,0.85),
                      inset 0 3px 5px rgba(255,255,255,0.45),
                      inset 0 -4px 8px rgba(0,0,0,0.9),
                      0 0 18px rgba(215,181,109,0.45)
                    `,
                    border: '2px solid #D7B56D',
                  }}
                >
                  {/* Organic Wax Rim Ridges */}
                  <div className="absolute inset-1 rounded-full border border-white/25 pointer-events-none opacity-70" />

                  {/* Debossed Seal Inner Monogram Ring */}
                  <div className="absolute inset-2 rounded-full border border-dashed border-[#D7B56D]/80 flex items-center justify-center bg-black/30 shadow-[inset_0_2px_6px_rgba(0,0,0,0.85)] overflow-hidden">
                    <span
                      className="font-display-en font-bold text-[10px] sm:text-xs md:text-sm tracking-wider text-gold-gradient select-none whitespace-nowrap leading-none flex items-center justify-center text-center px-0.5 shrink-0"
                      style={{
                        textShadow: `
                          0 2px 4px rgba(0,0,0,0.95),
                          0 -1px 1px rgba(255,255,255,0.3),
                          0 0 8px rgba(215,181,109,0.7)
                        `,
                      }}
                    >
                      {siteData.intro?.monogramText || 'H & L'}
                    </span>
                  </div>

                  {/* Specular Highlight Glint */}
                  <div className="absolute top-1.5 left-2 w-3.5 h-1.5 bg-white/45 rounded-full blur-[0.5px] transform -rotate-25 pointer-events-none" />
                </motion.div>
              )}
            </div>
          </div>

          {/* CONTINUOUS NATURAL AUTO-EXPANDING WRITING AREA (ZERO INNER SCROLLBAR) */}
          <div
            className="relative z-10 flex-1 space-y-5 sm:space-y-6 overflow-visible pr-1 pl-2"
          >
            {/* ZERO PRE-EXISTING TEXT: Only strictly revealed characters exist */}
            {writtenParagraphs.map((paraText, pIdx) => {
              if (paraText.length === 0) return null;

              const isCurrentWritingPara =
                pIdx === activeParaIdx && phase === 'writing_paragraphs';

              return (
                <p
                  key={pIdx}
                  className="text-base sm:text-lg md:text-xl font-serif-arabic text-[#FFFFFF] leading-relaxed sm:leading-loose font-normal relative"
                >
                  <span>{paraText}</span>
                  {/* Active character anchor for nib tracking */}
                  {isCurrentWritingPara && (
                    <span
                      ref={activeNibRef}
                      className="inline-block w-0.5 h-4 opacity-0 pointer-events-none align-middle"
                    />
                  )}
                </p>
              );
            })}

            {/* CALLIGRAPHIC HEART (Grows smoothly in flow with drawing progress) */}
            {(heartProgress > 0 || phase === 'finished') && (
              <div className="flex justify-center my-6 relative z-10">
                <svg width="68" height="46" viewBox="0 0 60 40" className="overflow-visible">
                  <defs>
                    <linearGradient id="goldHeartStroke" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#D7B56D" />
                      <stop offset="50%" stopColor="#F9E29B" />
                      <stop offset="100%" stopColor="#8B2245" />
                    </linearGradient>
                  </defs>
                  <path
                    ref={heartPathRef}
                    d="M 30,14 C 30,6 20,4 14,10 C 6,18 16,28 30,36 C 44,28 54,18 46,10 C 40,4 30,6 30,14 Z"
                    fill="none"
                    stroke="url(#goldHeartStroke)"
                    strokeWidth="2.4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeDasharray="120"
                    strokeDashoffset={120 * (1 - heartProgress)}
                  />
                </svg>
              </div>
            )}

            {/* Divider Line after Heart */}
            {heartProgress >= 1 && (
              <motion.div
                initial={{ scaleX: 0, opacity: 0 }}
                animate={{ scaleX: 1, opacity: 1 }}
                transition={{ duration: 0.6 }}
                className="my-5 sm:my-7 h-px bg-gradient-to-r from-transparent via-[#D7B56D]/50 to-transparent relative z-10"
              />
            )}

            {/* CLOSING & SIGNATURE (Reveals cleanly below the heart) */}
            {(closingWritten.length > 0 || signatureWritten.length > 0 || phase === 'finished') && (
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-6 mt-4 relative z-10">
                <div>
                  <p className="text-lg sm:text-xl font-serif-arabic text-rose-gradient font-semibold mb-1 relative">
                    <span>{closingWritten}</span>
                    {phase === 'writing_signature' && closingWritten.length < closingText.length && (
                      <span
                        ref={activeNibRef}
                        className="inline-block w-0.5 h-4 opacity-0 pointer-events-none align-middle"
                      />
                    )}
                  </p>
                  {signatureWritten.length >= signatureText.length && (
                    <motion.span
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-[11px] sm:text-xs font-display-en text-[#A49CA8] tracking-widest uppercase"
                    >
                      {letterDate}
                    </motion.span>
                  )}
                </div>

                <div className="self-end sm:self-auto text-left">
                  <span className="text-xl sm:text-2xl md:text-3xl font-serif-arabic text-gold-gradient font-bold gold-glow relative">
                    <span>{signatureWritten}</span>
                    {phase === 'writing_signature' && closingWritten.length >= closingText.length && (
                      <span
                        ref={activeNibRef}
                        className="inline-block w-0.5 h-4 opacity-0 pointer-events-none align-middle"
                      />
                    )}
                  </span>
                </div>
              </div>
            )}
          </div>
        </motion.div>

        {/* ===================================================================== */}
        {/* 3. THE ONE AND ONLY WAX SEAL (EXACT HITBOX & CONTINUOUS PHYSICAL OBJECT) */}
        {/* ===================================================================== */}
        <motion.div
          id="wax-seal-wrapper"
          animate={getSealAnimation()}
          transition={{
            duration:
              phase === 'seal_lifting'
                ? 0.45
                : phase === 'flap_opening' || phase === 'paper_extracting'
                ? 0.9
                : phase === 'seal_landing'
                ? 0.6
                : 0.35,
            ease: [0.22, 1, 0.36, 1],
          }}
          style={{
            top: '195px',
            left: '50%',
            width: '84px',
            height: '84px',
            marginLeft: '-42px',
            marginTop: '-42px',
            transformStyle: 'preserve-3d',
            zIndex: 50,
          }}
          className="absolute flex items-center justify-center pointer-events-none"
        >
          {/* Moving Contact Shadow */}
          <motion.div
            animate={{
              scale:
                phase === 'seal_lifting' || phase === 'flap_opening' || phase === 'paper_extracting'
                  ? 1.5
                  : isSealHovered
                  ? 1.15
                  : 1,
              opacity:
                phase === 'seal_lifting' || phase === 'flap_opening' || phase === 'paper_extracting'
                  ? 0.35
                  : 0.7,
              y:
                phase === 'seal_lifting' || phase === 'flap_opening'
                  ? 28
                  : 8,
              filter:
                phase === 'seal_lifting' || phase === 'flap_opening'
                  ? 'blur(12px)'
                  : 'blur(6px)',
            }}
            className="absolute inset-0 rounded-full bg-black pointer-events-none -z-10"
          />

          {/* The Physical Wax Seal Button - Click Hitbox is 100% Identical to Visual Seal */}
          <button
            type="button"
            id="wax-seal-btn"
            disabled={phase !== 'idle'}
            onMouseEnter={() => setIsSealHovered(true)}
            onMouseLeave={() => setIsSealHovered(false)}
            onClick={(e) => {
              e.stopPropagation();
              if (phase === 'idle') startOpeningSequence();
            }}
            className={`w-full h-full select-none focus:outline-none flex items-center justify-center rounded-full ${
              phase === 'idle'
                ? 'cursor-pointer pointer-events-auto hover:scale-105 active:scale-95'
                : 'pointer-events-none'
            } transition-transform duration-150`}
            style={{
              borderRadius: '48% 52% 51% 49% / 53% 47% 53% 47%',
              background:
                'radial-gradient(circle at 35% 35%, #A82850 0%, #751433 55%, #42071A 100%)',
              boxShadow: `
                0 14px 32px rgba(0,0,0,0.85),
                inset 0 4px 6px rgba(255,255,255,0.45),
                inset 0 -6px 12px rgba(0,0,0,0.9),
                0 0 25px rgba(215,181,109,0.5)
              `,
              border: '2.5px solid #D7B56D',
            }}
            title={phase === 'idle' ? 'انقري لكسر ختم الشمع وفتح الرسالة' : 'ختم الشمع الأصلي'}
          >
            {/* Organic Wax Rim Ridges */}
            <div className="absolute inset-1 rounded-full border border-white/25 pointer-events-none opacity-70" />

            {/* Debossed Seal Inner Monogram Ring */}
            <div className="absolute inset-2.5 rounded-full border border-dashed border-[#D7B56D]/80 flex items-center justify-center bg-black/30 shadow-[inset_0_3px_8px_rgba(0,0,0,0.85)] overflow-hidden">
              <span
                className="font-display-en font-bold text-xs sm:text-sm md:text-base tracking-wider text-gold-gradient select-none whitespace-nowrap leading-none flex items-center justify-center text-center px-1 shrink-0"
                style={{
                  textShadow: `
                    0 2px 4px rgba(0,0,0,0.95),
                    0 -1px 1px rgba(255,255,255,0.3),
                    0 0 10px rgba(215,181,109,0.7)
                  `,
                }}
              >
                {siteData.intro?.monogramText || 'H & L'}
              </span>
            </div>

            {/* Specular Highlight Glint */}
            <div className="absolute top-2.5 left-3 w-4 h-1.5 bg-white/45 rounded-full blur-[0.5px] transform -rotate-25 pointer-events-none" />

            {/* Idle Pulsing Ring */}
            {phase === 'idle' && (
              <div
                className="absolute -inset-2 rounded-full border border-[#D7B56D]/50 animate-ping opacity-25 pointer-events-none"
                style={{ animationDuration: '3s' }}
              />
            )}
          </button>
        </motion.div>
      </div>

      {/* Helper Interaction Text & Bottom Controls */}
      <div className="text-center mt-6 relative z-10">
        {phase === 'idle' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-center gap-2 text-sm sm:text-base font-sans-arabic text-[#D7B56D] font-medium tracking-wide"
          >
            <Sparkles className="w-4 h-4 text-[#D7B56D] animate-pulse" />
            <span className="animate-pulse">انقري على ختم الشمع لفتح الرسالة</span>
            <Sparkles className="w-4 h-4 text-[#D7B56D] animate-pulse" />
          </motion.div>
        )}

        {phase !== 'idle' && phase !== 'finished' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-center gap-2 text-xs sm:text-sm font-sans-arabic text-[#A49CA8]"
          >
            <span className="animate-pulse">
              {phase === 'writing_paragraphs' ||
              phase === 'writing_heart' ||
              phase === 'writing_signature'
                ? 'يتم كتابة الرسالة بحبر القلم الآن...'
                : 'جارٍ فتح الظرف بعناية...'}
            </span>
          </motion.div>
        )}

        {phase === 'finished' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-3"
          >
            <button
              type="button"
              onClick={handleResetToEnvelope}
              className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/[0.04] hover:bg-[#6E1835]/40 border border-white/10 hover:border-[#D7B56D]/40 text-xs sm:text-sm font-sans-arabic text-[#D7B56D] hover:text-white transition-all cursor-pointer shadow-md"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>إعادة طي الرسالة وإغلاق الظرف</span>
            </button>
            <div className="text-xs font-sans-arabic text-[#A49CA8] flex items-center gap-1">
              <ChevronDown className="w-3.5 h-3.5 text-[#D7B56D]" />
              <span>يمكنك التمرير داخل الورقة لقراءة الرسالة كاملة</span>
            </div>
          </motion.div>
        )}
      </div>
    </section>
  );
};
