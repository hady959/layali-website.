import React from 'react';
import { motion } from 'motion/react';
import { Star, Sparkles, Sun } from 'lucide-react';
import { useSiteData } from '../context/SiteDataContext';

export const ArrivalSection: React.FC = () => {
  const { siteData } = useSiteData();

  return (
    <section
      id="arrival-section"
      className="relative py-16 sm:py-24 px-4 sm:px-6 max-w-4xl mx-auto text-center"
    >
      {/* Background Soft Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[340px] sm:w-[450px] h-[340px] sm:h-[450px] bg-gradient-to-br from-[#D7B56D]/10 via-[#6E1835]/15 to-transparent rounded-full blur-3xl pointer-events-none" />

      {/* Main Glassmorphism Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 30 }}
        whileInView={{ opacity: 1, scale: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 p-6 sm:p-10 md:p-14 rounded-3xl bg-white/[0.03] backdrop-blur-md border border-white/10 shadow-2xl overflow-hidden"
      >
        {/* Subtle decorative top and bottom lines */}
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-[#D7B56D]/50 to-transparent" />
        <div className="absolute bottom-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-[#E8A0B7]/30 to-transparent" />

        {/* Floating Stars & Celestial Motif */}
        <div className="flex items-center justify-center gap-2.5 sm:gap-3 mb-5 sm:mb-6">
          <Star className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#D7B56D]/60 animate-pulse" />
          <div className="w-8 sm:w-12 h-px bg-[#D7B56D]/40" />
          <div className="p-1.5 sm:p-2 rounded-full bg-[#6E1835]/30 border border-[#D7B56D]/30">
            <Sun className="w-4 h-4 sm:w-5 sm:h-5 text-[#D7B56D]" />
          </div>
          <div className="w-8 sm:w-12 h-px bg-[#D7B56D]/40" />
          <Star className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#D7B56D]/60 animate-pulse" />
        </div>

        {/* Title: يوم الميلاد */}
        <h2 className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-serif-arabic text-gold-gradient-artistic font-bold mb-5 sm:mb-6 gold-glow leading-tight">
          {siteData.recipient.arrivalTitle || 'يوم الميلاد'}
        </h2>

        {/* Meaningful Date Box */}
        <div className="my-6 sm:my-8 inline-block max-w-full">
          <div className="px-6 sm:px-12 py-3.5 sm:py-5 rounded-2xl bg-white/[0.02] border border-[#D7B56D]/35 shadow-[0_0_35px_rgba(215,181,109,0.2)]">
            <span
              id="arrival-date-display"
              className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-light font-display-en text-[#D7B56D] tracking-widest gold-glow select-none tabular-nums"
            >
              {siteData.recipient.arrivalDisplay || '22 / 06 / 2008'}
            </span>
          </div>
        </div>

        {/* Emotional Text: في اليوم ده، حضر أجمل كائن لدنياي... */}
        <p className="text-base sm:text-xl md:text-2xl font-serif-arabic text-[#FFFFFF]/95 max-w-2xl mx-auto leading-relaxed font-light mt-3 sm:mt-4">
          {siteData.recipient.arrivalNote ||
            'في اليوم ده، حضر أجمل كائن لدنياي... ولم أكن أعلم أن هذا التاريخ سيتحول لأرق وأعز التفاصيل في حياتي.'}
        </p>

        {/* Subtle Bottom Accent Badge */}
        <div className="mt-6 sm:mt-8 pt-5 sm:pt-6 border-t border-white/10 flex items-center justify-center gap-2 text-[10px] sm:text-xs font-display-en text-[#E8A0B7]/70 tracking-widest uppercase">
          <Sparkles className="w-3 sm:w-3.5 h-3 sm:h-3.5 text-[#D7B56D]" />
          <span>The Day The World Became Brighter</span>
          <Sparkles className="w-3 sm:w-3.5 h-3 sm:h-3.5 text-[#D7B56D]" />
        </div>
      </motion.div>
    </section>
  );
};

// Re-export for backward compatibility
export const BirthdaySection = ArrivalSection;

