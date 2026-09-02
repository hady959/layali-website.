import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Heart, Sparkles, ChevronLeft, Volume2, VolumeX } from 'lucide-react';
import { useSiteData } from '../context/SiteDataContext';
import { useAudio } from '../context/AudioContext';
import { letterAudio } from '../utils/letterAudio';

interface CinematicIntroProps {
  onEnter: () => void;
}

export const CinematicIntro: React.FC<CinematicIntroProps> = ({ onEnter }) => {
  const { siteData } = useSiteData();
  const { playBgAudio, hasMainAudio } = useAudio();

  // Intro Stages:
  // 0: 'descend_press' -> Seal descends gently, stamps into place with physical 3D compression
  // 1: 'glow_radiate'  -> Golden energy pulse radiates out from the pressed center
  // 2: 'poetic_reveal' -> Grand Apple/Tech-keynote typography transitions
  // 3: 'portal_ready'  -> Final portal button ready with laser sweep
  const [phase, setPhase] = useState<'descend_press' | 'glow_radiate' | 'poetic_reveal' | 'portal_ready'>('descend_press');

  const [activePoemIndex, setActivePoemIndex] = useState(0);
  const [isExiting, setIsExiting] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const recipientName = siteData.recipient?.name || 'ليالي';
  const senderName = siteData.sender?.name || 'هادي';
  const relationshipDate = siteData.relationship?.startDateDisplay || '١٦ أغسطس ٢٠٢٦';

  const poeticLines = siteData.intro?.lines?.length
    ? siteData.intro.lines
    : [
        `إلى ${recipientName}...`,
        'صنعتُ لكِ هذا المكان ليكون أصدق ما كُتِب...',
        'وليبقى شاهداً على أجمل صدفة أضاءت كل حياتي.',
      ];

  // Timeline choreography
  useEffect(() => {
    // Opening subtle chime
    letterAudio.playMagicSparkleChime();

    // Seal physically presses into place
    const t1 = setTimeout(() => {
      setPhase('glow_radiate');
      letterAudio.playPaperRustle();
    }, 1200);

    // Poetic lines reveal
    const t2 = setTimeout(() => {
      setPhase('poetic_reveal');
    }, 2800);

    // Line 2
    const t3 = setTimeout(() => {
      setActivePoemIndex(1);
      letterAudio.playMagicSparkleChime();
    }, 6200);

    // Line 3
    const t4 = setTimeout(() => {
      setActivePoemIndex(2);
      letterAudio.playMagicSparkleChime();
    }, 9800);

    // Enter Portal Ready
    const t5 = setTimeout(() => {
      setPhase('portal_ready');
    }, 13200);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
      clearTimeout(t5);
    };
  }, []);

  // Ambient floating dust & romantic gold sparks canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    const particles = Array.from({ length: 40 }).map(() => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.6,
      vy: -Math.random() * 0.7 - 0.2,
      size: Math.random() * 2.5 + 0.8,
      alpha: Math.random() * 0.7 + 0.2,
      color: Math.random() > 0.4 ? '215, 181, 109' : '225, 29, 72',
    }));

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;

        if (p.y < -10) {
          p.y = height + 10;
          p.x = Math.random() * width;
        }
        if (p.x < -10) p.x = width + 10;
        if (p.x > width + 10) p.x = -10;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${p.color}, ${p.alpha})`;
        ctx.shadowBlur = p.size * 3;
        ctx.shadowColor = `rgba(${p.color}, 0.5)`;
        ctx.fill();
        ctx.shadowBlur = 0;
      });

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animId);
    };
  }, []);

  const handleEnterClick = async () => {
    if (isExiting) return;
    setIsExiting(true);
    letterAudio.playCompletionChime();

    if (hasMainAudio) {
      try {
        await playBgAudio();
      } catch {
        // Safe fallback
      }
    }

    setTimeout(() => {
      onEnter();
    }, 750);
  };

  return (
    <motion.div
      id="cinematic-ultra-entrance"
      initial={{ opacity: 0 }}
      animate={{
        opacity: isExiting ? 0 : 1,
        scale: isExiting ? 1.12 : 1,
        filter: isExiting ? 'blur(16px)' : 'blur(0px)',
      }}
      exit={{ opacity: 0, scale: 1.15, filter: 'blur(20px)' }}
      transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      className="fixed inset-0 z-50 flex flex-col items-center justify-between bg-[#050308] text-[#FFFFFF] select-none overflow-hidden"
    >
      {/* Background Interactive Sparkle Canvas */}
      <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none z-0" />

      {/* Cinematic Studio Lighting Gradients */}
      <div className="absolute inset-0 bg-radial from-[#751433]/30 via-[#06030A]/90 to-[#020104] pointer-events-none z-0" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] sm:w-[950px] h-[650px] sm:h-[950px] bg-radial from-[#A82850]/20 via-[#D7B56D]/10 to-transparent blur-[120px] pointer-events-none animate-pulse-glow" />

      {/* TOP HEADER: Brand Monogram & Controls */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.9, delay: 0.2 }}
        className="relative z-20 flex items-center justify-between w-full max-w-4xl px-6 pt-6 sm:pt-8"
      >
        <div className="flex items-center gap-2 text-xs font-serif-arabic text-[#D7B56D]/80">
          <Heart className="w-3.5 h-3.5 text-[#E11D48] fill-[#E11D48] animate-pulse" />
          <span className="tracking-wider">{relationshipDate}</span>
        </div>

        <div className="flex items-center gap-3">
          <div className="h-px w-8 bg-gradient-to-l from-[#D7B56D]/50 to-transparent" />
          <span className="text-xs font-display-en tracking-[0.3em] text-gold-gradient font-bold uppercase">
            H &amp; L
          </span>
          <div className="h-px w-8 bg-gradient-to-r from-[#D7B56D]/50 to-transparent" />
        </div>

        <button
          type="button"
          onClick={() => {
            const next = !soundEnabled;
            setSoundEnabled(next);
            letterAudio.setMuted(!next);
          }}
          className="p-2 rounded-full bg-white/[0.04] border border-white/10 hover:border-[#D7B56D]/50 text-[#D7B56D] transition-all cursor-pointer shadow-sm hover:scale-105 active:scale-95"
          title={soundEnabled ? 'كتم المؤثرات' : 'تشغيل المؤثرات'}
        >
          {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4 text-zinc-500" />}
        </button>
      </motion.div>

      {/* MAIN CINEMATIC HERO ARENA */}
      <div className="relative z-10 flex flex-col items-center justify-center my-auto w-full max-w-3xl px-4 text-center">
        
        {/* ========================================================================= */}
        {/* 1. EXACT ROYAL WAX SEAL (MATCHING ENVELOPE DESIGN - ENLARGED & PRESSED)    */}
        {/* ========================================================================= */}
        <div className="relative flex items-center justify-center mb-8 sm:mb-10">
          
          {/* Expanding Energy Waves (Apple Keynote style) */}
          <motion.div
            animate={{
              scale: [1, 1.45, 1.9],
              opacity: [0.55, 0.2, 0],
            }}
            transition={{
              duration: 3.2,
              repeat: Infinity,
              ease: 'easeOut',
            }}
            className="absolute w-44 h-44 sm:w-56 sm:h-56 rounded-full border border-[#D7B56D]/40 pointer-events-none"
          />

          <motion.div
            animate={{
              scale: [1, 1.25, 1.6],
              opacity: [0.65, 0.25, 0],
            }}
            transition={{
              duration: 3.2,
              repeat: Infinity,
              delay: 0.7,
              ease: 'easeOut',
            }}
            className="absolute w-44 h-44 sm:w-56 sm:h-56 rounded-full border border-[#A82850]/40 pointer-events-none"
          />

          {/* Envelope Corner Shadows / Background Flaps hint */}
          <div className="absolute w-60 sm:w-72 h-36 pointer-events-none -z-10 opacity-30">
            <div
              className="absolute inset-0"
              style={{
                clipPath: 'polygon(0 0, 50% 50%, 100% 0, 100% 100%, 0 100%)',
                background: 'linear-gradient(180deg, #7E1B3E 0%, #4A0E23 100%)',
                filter: 'blur(10px)',
              }}
            />
          </div>

          {/* THE PHYSICAL ROYAL SEAL (Scale enlarged to 140px-160px for intro) */}
          <motion.div
            initial={{ scale: 0.4, opacity: 0, y: -40, rotateX: 30 }}
            animate={{
              scale: phase === 'descend_press' ? [0.4, 1.15, 1] : 1,
              opacity: 1,
              y: 0,
              rotateX: 0,
            }}
            transition={{
              duration: 1.1,
              ease: [0.22, 1, 0.36, 1],
            }}
            className="relative w-36 h-36 sm:w-44 sm:h-44 rounded-full flex items-center justify-center select-none"
            style={{
              // Pure circular contour
              borderRadius: '9999px',
              // Exact royal wine/burgundy radial gradient
              background: 'radial-gradient(circle at 35% 35%, #A82850 0%, #751433 55%, #42071A 100%)',
              // Realistic multi-depth 3D shadow & gold ambient rim glow
              boxShadow: `
                0 20px 50px rgba(0,0,0,0.95),
                inset 0 6px 10px rgba(255,255,255,0.45),
                inset 0 -10px 20px rgba(0,0,0,0.95),
                0 0 35px rgba(215,181,109,0.55),
                0 0 15px rgba(168,40,80,0.4)
              `,
              border: '3.5px solid #D7B56D',
            }}
          >
            {/* 1. UPPER-LEFT CURVED GLASS / WAX SPECULAR SHEEN (Identical to reference image) */}
            <div
              className="absolute top-2 left-3 w-12 sm:w-16 h-7 sm:h-9 rounded-full pointer-events-none opacity-80"
              style={{
                background: 'linear-gradient(135deg, rgba(255,255,255,0.75) 0%, rgba(255,255,255,0.15) 60%, transparent 100%)',
                transform: 'rotate(-28deg)',
                filter: 'blur(1.5px)',
              }}
            />

            {/* 2. INNER CONCENTRIC GOLDEN STITCHED / BEADED PERIMETER RING */}
            <div className="absolute inset-1.5 sm:inset-2 rounded-full border border-white/25 pointer-events-none opacity-70" />

            {/* 3. PRESSED / SUNKEN DEPRESSED CENTER (Depicting the physical matrix stamp pressure) */}
            <motion.div
              initial={{ scale: 0.92 }}
              animate={{
                scale: phase === 'descend_press' ? [0.92, 1.03, 1] : 1,
              }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="absolute inset-3 sm:inset-3.5 rounded-full flex flex-col items-center justify-center bg-black/50"
              style={{
                // Sunken pressed shadow inside the circle
                boxShadow: `
                  inset 0 8px 18px rgba(0,0,0,0.98),
                  inset 0 -4px 10px rgba(255,255,255,0.1),
                  0 1px 2px rgba(255,255,255,0.2)
                `,
                border: '1.5px dashed rgba(215, 181, 109, 0.9)',
              }}
            >
              {/* Inner subtle gradient */}
              <div className="absolute inset-0 rounded-full bg-gradient-to-b from-black/40 via-transparent to-black/60 pointer-events-none" />

              {/* EMBOSSED GOLDEN "H & L" MONOGRAM */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, delay: 0.5 }}
                className="relative z-10 flex flex-col items-center justify-center text-center px-1 shrink-0 w-full"
              >
                <span
                  className="font-display-en font-bold text-2xl sm:text-4xl tracking-widest text-gold-gradient select-none leading-none whitespace-nowrap block"
                  style={{
                    filter: 'drop-shadow(0 2px 5px rgba(0,0,0,0.95)) drop-shadow(0 0 8px rgba(215,181,109,0.6))',
                    letterSpacing: '0.08em',
                  }}
                >
                  {siteData.intro?.monogramText || 'H & L'}
                </span>
                
                <span className="text-[8px] sm:text-[9px] font-sans font-bold tracking-[0.3em] text-[#D7B56D]/90 uppercase mt-1 sm:mt-1.5 leading-none whitespace-nowrap block">
                  {siteData.intro?.monogramSubtext || 'FOREVER'}
                </span>
              </motion.div>
            </motion.div>

            {/* Subtle bottom wax drip edge */}
            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-4 h-2 bg-[#751433] rounded-b-full border-b border-[#D7B56D]/70 opacity-90 filter drop-shadow(0 3px 6px rgba(0,0,0,0.9))" />
          </motion.div>
        </div>

        {/* ========================================================================= */}
        {/* 2. DYNAMIC CINEMATIC TYPOGRAPHY WITH MULTI-LAYER TRANSITIONS              */}
        {/* ========================================================================= */}
        <div className="min-h-[150px] sm:min-h-[180px] flex items-center justify-center w-full px-2">
          <AnimatePresence mode="wait">
            {(phase === 'descend_press' || phase === 'glow_radiate') && (
              <motion.div
                key="phase-intro"
                initial={{ opacity: 0, y: 15, filter: 'blur(8px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                exit={{ opacity: 0, y: -15, filter: 'blur(8px)' }}
                transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                className="flex flex-col items-center gap-2 max-w-lg"
              >
                <span className="px-3.5 py-1 rounded-full text-[11px] font-sans-arabic text-[#D7B56D] bg-[#D7B56D]/10 border border-[#D7B56D]/30 tracking-widest uppercase">
                  {siteData.intro?.badgeText || 'ختم العشق الأبدي'}
                </span>
                <h1 className="text-2xl sm:text-4xl md:text-5xl font-serif-arabic text-gold-gradient font-bold gold-glow leading-tight">
                  {siteData.intro?.stampingTitle || 'رسالة خاصة واستثنائية'}
                </h1>
                <p className="text-xs sm:text-sm text-[#A49CA8]/75 font-sans-arabic">
                  {siteData.intro?.stampingSubtitle || 'خُتِمت بكل تفاصيلها من أجلكِ'}
                </p>
              </motion.div>
            )}

            {phase === 'poetic_reveal' && activePoemIndex === 0 && (
              <motion.div
                key="poem-0"
                initial={{ opacity: 0, y: 20, filter: 'blur(10px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                exit={{ opacity: 0, y: -20, filter: 'blur(10px)' }}
                transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
                className="flex flex-col items-center gap-3"
              >
                <span className="text-xs uppercase tracking-[0.3em] font-sans-arabic text-[#D7B56D]/80">
                  إهداء خاص
                </span>
                <h2 className="text-4xl sm:text-6xl md:text-7xl font-serif-arabic text-gold-gradient font-bold gold-glow leading-tight">
                  {poeticLines[0]}
                </h2>
                <div className="w-16 h-0.5 bg-gradient-to-r from-transparent via-[#D7B56D]/80 to-transparent mt-2" />
              </motion.div>
            )}

            {phase === 'poetic_reveal' && activePoemIndex === 1 && (
              <motion.div
                key="poem-1"
                initial={{ opacity: 0, y: 20, filter: 'blur(10px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                exit={{ opacity: 0, y: -20, filter: 'blur(10px)' }}
                transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
                className="flex flex-col items-center gap-3 max-w-xl"
              >
                <p className="text-2xl sm:text-4xl md:text-5xl font-serif-arabic text-[#FFFFFF] leading-relaxed font-normal text-rose-gradient">
                  {poeticLines[1]}
                </p>
                <span className="text-xs text-[#D7B56D]/80 font-sans-arabic">
                  بكل حب، تفصيلة تلو الأخرى
                </span>
              </motion.div>
            )}

            {phase === 'poetic_reveal' && activePoemIndex === 2 && (
              <motion.div
                key="poem-2"
                initial={{ opacity: 0, y: 20, filter: 'blur(10px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                exit={{ opacity: 0, y: -20, filter: 'blur(10px)' }}
                transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
                className="flex flex-col items-center gap-3 max-w-xl"
              >
                <p className="text-2xl sm:text-3xl md:text-4xl font-serif-arabic text-[#FFFFFF] leading-relaxed font-medium">
                  {poeticLines[2]}
                </p>
                <p className="text-xs sm:text-sm text-[#D7B56D] font-sans-arabic">
                  من {senderName} إلى {recipientName}
                </p>
              </motion.div>
            )}

            {phase === 'portal_ready' && (
              <motion.div
                key="portal-cta"
                initial={{ opacity: 0, scale: 0.9, filter: 'blur(10px)' }}
                animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
                transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
                className="flex flex-col items-center gap-6 max-w-lg"
              >
                <p className="text-2xl sm:text-3xl md:text-4xl font-serif-arabic text-gold-gradient font-semibold">
                  {siteData.intro?.welcomeTitle || 'مرحباً بكِ في عالمنا'}
                </p>

                {/* Ultra High-End Interactive Enter Portal Button */}
                <motion.button
                  id="intro-ultra-enter-button"
                  onClick={handleEnterClick}
                  whileHover={{
                    scale: 1.06,
                    boxShadow: '0 0 50px rgba(215, 181, 109, 0.6), 0 0 30px rgba(168, 40, 80, 0.8)',
                  }}
                  whileTap={{ scale: 0.96 }}
                  className="group relative inline-flex items-center gap-4 px-10 py-4.5 rounded-full bg-gradient-to-r from-[#6E1835] via-[#A01A42] to-[#6E1835] text-white font-sans-arabic text-lg sm:text-xl font-bold border-2 border-[#D7B56D]/70 shadow-[0_10px_40px_rgba(110,24,53,0.9),0_0_35px_rgba(215,181,109,0.35)] cursor-pointer overflow-hidden transition-all"
                >
                  {/* Gloss laser light sweep */}
                  <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 pointer-events-none" />

                  <Heart className="w-5 h-5 text-[#FB7185] fill-[#FB7185] animate-pulse" />
                  <span className="text-white drop-shadow-lg">
                    {siteData.intro?.buttonText || 'ادخلي إلى عالمنا'}
                  </span>
                  <ChevronLeft className="w-5 h-5 text-[#D7B56D] group-hover:-translate-x-2 transition-transform duration-300" />
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Dynamic Timeline Step Navigation Dots */}
        <div className="flex items-center justify-center gap-2 mt-6 sm:mt-8 z-20">
          {[0, 1, 2].map((idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => {
                setPhase('poetic_reveal');
                setActivePoemIndex(idx);
              }}
              className={`h-1.5 rounded-full transition-all duration-500 cursor-pointer ${
                activePoemIndex === idx && phase === 'poetic_reveal'
                  ? 'w-8 bg-gradient-to-r from-[#D7B56D] to-[#FB7185]'
                  : 'w-2 bg-white/20 hover:bg-white/40'
              }`}
              title={`الفقرة ${idx + 1}`}
            />
          ))}
        </div>
      </div>

      {/* FOOTER BAR: Fast-forward skip option */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.5 }}
        className="relative z-20 flex items-center justify-between w-full max-w-lg px-6 pb-6 sm:pb-8"
        style={{
          marginBottom: 'env(safe-area-inset-bottom, 0px)',
        }}
      >
        <span className="text-xs text-[#A49CA8]/60 font-sans-arabic">
          تجربة خُصصت لأجلكِ
        </span>

        <button
          type="button"
          onClick={handleEnterClick}
          className="text-xs text-[#A49CA8]/80 hover:text-[#D7B56D] transition-colors py-1.5 px-4 rounded-full font-sans-arabic bg-white/[0.04] border border-white/10 hover:border-[#D7B56D]/40 cursor-pointer active:scale-95 flex items-center gap-1.5"
        >
          <Sparkles className="w-3.5 h-3.5 text-[#D7B56D]" />
          <span>تخطي والدخول فوراً</span>
        </button>
      </motion.div>
    </motion.div>
  );
};
