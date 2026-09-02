import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Clock, Sparkles } from 'lucide-react';
import { useSiteData } from '../context/SiteDataContext';

interface TimeElapsed {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

export const RelationshipCounter: React.FC = () => {
  const { siteData } = useSiteData();
  const [time, setTime] = useState<TimeElapsed>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  useEffect(() => {
    const parseDate = (str: string) => {
      const parsed = new Date(str).getTime();
      return isNaN(parsed) ? new Date('2026-08-16T00:00:00').getTime() : parsed;
    };

    const updateTimer = () => {
      const startDate = parseDate(siteData.relationship.startDate);
      const now = new Date().getTime();
      const difference = Math.max(0, now - startDate);

      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((difference / (1000 * 60)) % 60);
      const seconds = Math.floor((difference / 1000) % 60);

      setTime({ days, hours, minutes, seconds });
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [siteData.relationship.startDate]);

  const timeBlocks = [
    { label: 'أيام', value: time.days, id: 'days-counter' },
    { label: 'ساعات', value: time.hours, id: 'hours-counter' },
    { label: 'دقائق', value: time.minutes, id: 'minutes-counter' },
    { label: 'ثوانٍ', value: time.seconds, id: 'seconds-counter' },
  ];

  return (
    <section
      id="counter-section"
      className="relative py-16 sm:py-24 px-4 sm:px-6 max-w-5xl mx-auto text-center"
    >
      {/* Decorative center icon */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="inline-flex items-center justify-center w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-[#6E1835]/30 border border-[#D7B56D]/30 mb-4 sm:mb-6 shadow-[0_0_20px_rgba(215,181,109,0.15)]"
      >
        <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-[#D7B56D]" />
      </motion.div>

      {/* Section Title */}
      <motion.h2
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.7 }}
        className="text-2xl sm:text-4xl md:text-5xl font-serif-arabic text-gold-gradient font-bold mb-3 sm:mb-4 gold-glow leading-snug"
      >
        {siteData.relationship.counterTitle || 'منذ اليوم الذي بدأ فيه كل شيء...'}
      </motion.h2>

      {/* Relationship Start Date Display */}
      <motion.p
        initial={{ opacity: 0, y: 15 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.7, delay: 0.1 }}
        className="text-xs sm:text-sm md:text-base font-display-en text-[#E8A0B7]/80 tracking-widest uppercase mb-8 sm:mb-12"
      >
        {siteData.relationship.startDateDisplay || '16 أغسطس 2026'}
      </motion.p>

      {/* Counter Grid: 2x2 on Mobile, 4 columns on Desktop */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6 mb-8 sm:mb-12">
        {timeBlocks.map((block, idx) => (
          <motion.div
            key={block.label}
            id={block.id}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 * idx }}
            className="group relative p-4 sm:p-6 md:p-8 rounded-2xl bg-white/[0.03] backdrop-blur-md border border-white/10 shadow-xl overflow-hidden hover:border-[#D7B56D]/50 hover:bg-white/[0.05] transition-all text-center flex flex-col items-center justify-center min-w-0"
          >
            {/* Top subtle highlight */}
            <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-[#D7B56D]/40 to-transparent" />

            {/* Large number */}
            <div className="relative z-10 text-3xl sm:text-5xl md:text-6xl font-light font-display-en text-[#D7B56D] group-hover:scale-105 transition-transform tracking-tight mb-1 sm:mb-2 tabular-nums">
              {String(block.value).padStart(2, '0')}
            </div>

            {/* Label in clear Arabic */}
            <div className="relative z-10 text-xs sm:text-sm font-sans-arabic font-medium text-[#A49CA8] group-hover:text-[#E8A0B7] transition-colors">
              {block.label}
            </div>

            {/* Ambient hover glow */}
            <div className="absolute inset-0 bg-[#D7B56D]/5 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
          </motion.div>
        ))}
      </div>

      {/* Counter Subtitle with Live Pulse */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.7, delay: 0.4 }}
        className="inline-flex items-center gap-2.5 sm:gap-3 text-xs sm:text-sm md:text-base font-serif-arabic text-rose-gradient px-4 sm:px-6 py-2 sm:py-2.5 rounded-full bg-[#6E1835]/20 border border-[#6E1835]/50 backdrop-blur-md shadow-sm max-w-full"
      >
        <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse shadow-[0_0_8px_#34d399] shrink-0" />
        <span className="truncate">{siteData.relationship.counterSubtitle || 'وكل ثانية جاية... لسه بنكتبها مع بعض.'}</span>
        <Sparkles className="w-3.5 h-3.5 text-[#D7B56D] shrink-0" />
      </motion.div>
    </section>
  );
};

