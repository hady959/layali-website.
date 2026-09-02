import React from 'react';
import { motion } from 'motion/react';
import { Sparkles, ChevronDown } from 'lucide-react';
import { useSiteData } from '../context/SiteDataContext';

export const HeroSection: React.FC = () => {
  const { siteData } = useSiteData();

  return (
    <section
      id="hero-section"
      className="relative min-h-[92dvh] sm:min-h-screen flex flex-col items-center justify-center text-center px-4 sm:px-6 pt-24 pb-20 sm:pb-16 overflow-hidden select-none"
    >
      {/* Cinematic Aura Layers */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[340px] sm:w-[550px] md:w-[750px] h-[340px] sm:h-[550px] md:h-[750px] bg-gradient-to-tr from-[#6E1835]/30 via-[#D7B56D]/15 to-transparent rounded-full blur-3xl pointer-events-none animate-pulse-glow" />
      <div className="absolute top-1/4 right-1/4 w-48 sm:w-72 h-48 sm:h-72 bg-[#E8A0B7]/10 rounded-full blur-2xl pointer-events-none" />

      {/* Decorative Brand Eyebrow with Artistic Lines */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.2 }}
        className="inline-flex items-center gap-2.5 sm:gap-3 px-4 sm:px-5 py-1.5 sm:py-2 rounded-full bg-white/[0.03] border border-[#D7B56D]/30 text-[10px] sm:text-[11px] text-[#D7B56D] font-display-en tracking-widest uppercase mb-6 sm:mb-8 shadow-inner backdrop-blur-md"
      >
        <span className="w-3 sm:w-4 h-[1px] bg-[#D7B56D]/70" />
        <Sparkles className="w-3 sm:w-3.5 h-3 sm:h-3.5 text-[#D7B56D]" />
        <span>A Story Worth Remembering</span>
        <Sparkles className="w-3 sm:w-3.5 h-3 sm:h-3.5 text-[#D7B56D]" />
        <span className="w-3 sm:w-4 h-[1px] bg-[#D7B56D]/70" />
      </motion.div>

      {/* Huge Glowing Typography: ليالي */}
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 25 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 1.1, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="relative mb-4 sm:mb-6 max-w-full"
      >
        <h1
          id="hero-name-title"
          className="text-5xl sm:text-7xl md:text-8xl lg:text-9xl xl:text-[9.5rem] font-serif-arabic font-bold text-gold-gradient-artistic tracking-tight select-none leading-[1.1] sm:leading-none gold-glow px-2 whitespace-nowrap"
        >
          {siteData.recipient.name}
        </h1>
        {/* Artistic Accent Divider */}
        <div className="w-32 sm:w-48 h-[1px] bg-gradient-to-r from-transparent via-[#D7B56D] to-transparent mx-auto mt-3 sm:mt-4" />

        {/* English subtitle echo */}
        <span className="block text-[11px] sm:text-xs md:text-sm font-display-en tracking-[0.35em] text-[#A49CA8]/60 uppercase mt-2 sm:mt-3">
          {siteData.recipient.englishName}
        </span>
      </motion.div>

      {/* Subtitle text */}
      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.9, delay: 0.7 }}
        className="text-base sm:text-xl md:text-2xl lg:text-3xl font-serif-arabic text-[#FFFFFF]/95 max-w-xl md:max-w-2xl mx-auto leading-relaxed font-light mb-6 sm:mb-8 px-4"
      >
        {siteData.relationship.heroSubtitle}
      </motion.p>

      {/* Signature */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.9 }}
        className="inline-flex items-center gap-2.5 sm:gap-3 text-sm sm:text-base md:text-lg font-serif-arabic text-rose-gradient tracking-wide mb-8 sm:mb-12"
      >
        <span className="w-8 sm:w-10 h-px bg-gradient-to-l from-[#E8A0B7]/60 to-transparent" />
        <span className="font-semibold">{siteData.sender.signature}</span>
        <span className="w-8 sm:w-10 h-px bg-gradient-to-r from-[#E8A0B7]/60 to-transparent" />
      </motion.div>

      {/* Scroll Down Indicator */}
      <motion.a
        href="#counter-section"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 1.2 }}
        className="relative sm:absolute bottom-2 sm:bottom-6 flex flex-col items-center gap-1.5 text-[#A49CA8]/70 hover:text-[#D7B56D] transition-colors cursor-pointer group"
      >
        <span className="text-[11px] sm:text-xs font-sans-arabic tracking-wider">اكتشفي المزيد</span>
        <motion.div
          animate={{ y: [0, 5, 0] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
        >
          <ChevronDown className="w-4 h-4 sm:w-5 sm:h-5 text-[#D7B56D]/70 group-hover:text-[#D7B56D]" />
        </motion.div>
      </motion.a>
    </section>
  );
};

