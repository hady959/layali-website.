import React from 'react';
import { motion } from 'motion/react';
import { Sparkles, Calendar, Infinity as InfinityIcon } from 'lucide-react';
import { useSiteData } from '../context/SiteDataContext';

export const StoryTimeline: React.FC = () => {
  const { siteData } = useSiteData();
  const milestones = siteData.timeline.milestones || [];

  return (
    <section id="timeline-section" className="relative py-16 sm:py-24 px-4 sm:px-6 max-w-4xl mx-auto">
      {/* Section Header */}
      <div className="text-center mb-12 sm:mb-20">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="inline-flex items-center justify-center w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-[#6E1835]/30 border border-[#D7B56D]/30 mb-4 shadow-[0_0_20px_rgba(215,181,109,0.15)]"
        >
          <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-[#D7B56D]" />
        </motion.div>

        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="text-2xl sm:text-4xl md:text-5xl font-serif-arabic text-gold-gradient-artistic font-bold mb-3 sm:mb-4 gold-glow leading-snug"
        >
          {siteData.timeline.title || 'محطات حكايتنا'}
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="text-sm sm:text-base md:text-lg font-serif-arabic text-[#A49CA8] max-w-xl mx-auto px-2"
        >
          {siteData.timeline.subtitle}
        </motion.p>
      </div>

      {/* Vertical Glowing Timeline */}
      <div className="relative">
        {/* The Vertical Line: Placed on right side for mobile, centered for desktop */}
        <div className="absolute top-4 bottom-4 right-4 sm:right-6 md:right-1/2 md:translate-x-1/2 w-0.5 bg-gradient-to-b from-[#D7B56D] via-[#6E1835] to-[#D7B56D] shadow-[0_0_12px_rgba(215,181,109,0.4)]" />

        <div className="space-y-8 sm:space-y-12 md:space-y-16">
          {milestones.map((milestone, idx) => {
            const isEven = idx % 2 === 0;

            return (
              <motion.div
                key={milestone.id || idx}
                initial={{ opacity: 0, y: 25 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.6, delay: 0.08 * idx }}
                className={`relative flex flex-col md:flex-row items-start ${
                  isEven ? 'md:flex-row-reverse' : ''
                } gap-4 sm:gap-6 md:gap-12`}
              >
                {/* Glowing Node Marker */}
                <div className="absolute right-4 sm:right-6 md:right-1/2 md:translate-x-1/2 translate-x-1/2 -translate-y-1 z-20 flex items-center justify-center">
                  <div
                    className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center transition-transform hover:scale-110 ${
                      milestone.highlight
                        ? 'bg-gradient-to-br from-[#D7B56D] to-[#6E1835] text-[#08080D] shadow-[0_0_20px_rgba(215,181,109,0.6)]'
                        : 'bg-[#121019] border-2 border-[#D7B56D]/50 text-[#D7B56D]'
                    }`}
                  >
                    {milestone.isLast ? (
                      <InfinityIcon className="w-4 h-4" />
                    ) : milestone.highlight ? (
                      <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    ) : (
                      <div className="w-2.5 h-2.5 rounded-full bg-[#D7B56D]" />
                    )}
                  </div>
                </div>

                {/* Content Card */}
                <div className="w-full pr-12 sm:pr-14 md:pr-0 md:w-[calc(50%-2.5rem)] text-right">
                  <div
                    className={`p-5 sm:p-7 md:p-8 rounded-2xl transition-all duration-300 ${
                      milestone.highlight
                        ? 'bg-gradient-to-br from-[#6E1835]/30 to-white/[0.03] backdrop-blur-md border border-[#D7B56D]/40 shadow-[0_8px_30px_rgba(110,24,53,0.3)]'
                        : 'bg-white/[0.03] backdrop-blur-md border border-white/10 hover:border-[#D7B56D]/40 shadow-lg'
                    }`}
                  >
                    {/* Date Badge */}
                    <div
                      className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-sans-arabic font-medium mb-3 ${
                        milestone.highlight
                          ? 'bg-[#D7B56D]/20 text-[#D7B56D] border border-[#D7B56D]/30'
                          : 'bg-white/[0.04] text-[#A49CA8] border border-white/10'
                      }`}
                    >
                      <span>{milestone.date}</span>
                    </div>

                    {/* Milestone Title */}
                    <h3 className="text-lg sm:text-xl md:text-2xl font-serif-arabic font-bold text-[#FFFFFF] mb-2 sm:mb-3 leading-snug">
                      {milestone.title}
                    </h3>

                    {/* Description */}
                    <p className="text-xs sm:text-sm md:text-base font-serif-arabic text-[#FFFFFF]/85 leading-relaxed font-light">
                      {milestone.description}
                    </p>

                    {/* To Be Continued Tag */}
                    {milestone.isLast && (
                      <div className="mt-4 pt-3.5 border-t border-[#D7B56D]/20 flex items-center justify-between text-[11px] sm:text-xs font-display-en text-[#D7B56D]">
                        <span className="tracking-widest">TO BE CONTINUED</span>
                        <Sparkles className="w-3.5 h-3.5 animate-pulse" />
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

