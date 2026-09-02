import React, { useState } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'motion/react';
import { Image as ImageIcon, Maximize2, Music, Film, Play } from 'lucide-react';
import { useSiteData } from '../context/SiteDataContext';
import { useAudio } from '../context/AudioContext';
import { MemoryItem } from '../types';
import { LightboxModal } from './LightboxModal';

interface MemoryCardProps {
  item: MemoryItem;
  idx: number;
  aspectClass: string;
  onOpen: (item: MemoryItem) => void;
}

const MemoryCard: React.FC<MemoryCardProps> = ({ item, idx, aspectClass, onOpen }) => {
  const isVideoItem = item.mediaType === 'video' || Boolean(item.videoSrc);

  // Motion values to track normalized mouse coordinates relative to center (-0.5 to 0.5)
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  // Physics spring for organic and smooth 3D tilting
  const springConfig = { damping: 20, stiffness: 220, mass: 0.5 };
  
  // Calculate subtle rotation angles based on cursor position
  const rotateXRaw = useTransform(mouseY, [-0.5, 0.5], [7.5, -7.5]);
  const rotateYRaw = useTransform(mouseX, [-0.5, 0.5], [-7.5, 7.5]);

  const rotateX = useSpring(rotateXRaw, springConfig);
  const rotateY = useSpring(rotateYRaw, springConfig);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    if (!rect.width || !rect.height) return;

    const xPct = (e.clientX - rect.left) / rect.width - 0.5;
    const yPct = (e.clientY - rect.top) / rect.height - 0.5;

    mouseX.set(xPct);
    mouseY.set(yPct);
  };

  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
  };

  return (
    <div className="break-inside-avoid" style={{ perspective: 1000 }}>
      <motion.div
        initial={{ opacity: 0, y: 25 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, delay: 0.07 * (idx % 6) }}
        style={{
          rotateX,
          rotateY,
          transformStyle: 'preserve-3d',
        }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onClick={() => onOpen(item)}
        className="group relative rounded-2xl overflow-hidden glass-panel border border-[#D7B56D]/25 shadow-lg cursor-pointer transition-colors duration-500 hover:border-[#D7B56D]/70 hover:shadow-[0_12px_40px_rgba(110,24,53,0.45)] select-none"
      >
        {/* Inner aspect ratio image/video poster container */}
        <div className={`relative w-full ${aspectClass} overflow-hidden bg-[#08080D]`}>
          <img
            src={item.image}
            alt={item.title}
            referrerPolicy="no-referrer"
            loading="lazy"
            className="w-full h-full object-cover transition-all duration-700 group-hover:scale-105 group-hover:brightness-110"
          />

          {/* Dark Gradient Overlay for readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#08080D] via-[#08080D]/40 to-transparent opacity-85 group-hover:opacity-65 transition-opacity duration-500" />

          {/* Top date badge */}
          <div className="absolute top-3 right-3 sm:top-4 sm:right-4 z-10 px-2.5 sm:px-3 py-1 rounded-full bg-[#08080D]/85 border border-[#D7B56D]/35 text-[11px] sm:text-xs font-sans-arabic text-[#D7B56D] backdrop-blur-md shadow-md">
            {item.date}
          </div>

          {/* Video Indicator Badge */}
          {isVideoItem && (
            <div className="absolute top-3 left-12 sm:top-4 sm:left-14 z-10 px-2.5 py-1 rounded-full bg-[#6E1835]/90 border border-[#D7B56D]/50 text-[10px] sm:text-[11px] font-sans-arabic text-[#D7B56D] backdrop-blur-md flex items-center gap-1.5 shadow-md">
              <Film className="w-3 h-3 text-[#D7B56D]" />
              <span>فيديو</span>
            </div>
          )}

          {/* Audio badge if image memory has dedicated audio */}
          {!isVideoItem && item.audioSrc && (
            <div className="absolute top-3 left-12 sm:top-4 sm:left-14 z-10 px-2.5 py-1 rounded-full bg-[#6E1835]/90 border border-[#E8A0B7]/40 text-[10px] sm:text-[11px] font-sans-arabic text-[#E8A0B7] backdrop-blur-md flex items-center gap-1.5 shadow-md">
              <Music className="w-3 h-3 text-[#D7B56D]" />
              <span>صوت</span>
            </div>
          )}

          {/* Video Center Play Cue Button */}
          {isVideoItem && (
            <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-[#6E1835]/80 border border-[#D7B56D] flex items-center justify-center text-[#D7B56D] shadow-[0_0_25px_rgba(215,181,109,0.4)] group-hover:scale-115 transition-transform duration-300">
                <Play className="w-6 h-6 sm:w-7 sm:h-7 text-[#D7B56D] translate-x-0.5" />
              </div>
            </div>
          )}

          {/* Expand icon on hover / tap */}
          <div className="absolute top-3 left-3 sm:top-4 sm:left-4 z-10 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#08080D]/70 border border-white/20 flex items-center justify-center text-white/80 opacity-0 group-hover:opacity-100 transition-opacity duration-300 backdrop-blur-md">
            <Maximize2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#D7B56D]" />
          </div>

          {/* Bottom Caption Overlay */}
          <div className="absolute bottom-0 inset-x-0 p-4 sm:p-5 z-10 text-right transform transition-transform duration-300">
            <h3 className="text-base sm:text-lg font-serif-arabic font-bold text-[#FFFFFF] group-hover:text-gold-gradient transition-colors mb-1 leading-snug">
              {item.title}
            </h3>
            {item.caption && (
              <p className="text-xs sm:text-sm font-sans-arabic text-[#A49CA8] line-clamp-2 group-hover:text-[#FFFFFF]/95 transition-colors leading-relaxed">
                {item.caption}
              </p>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export const MemoriesGallery: React.FC = () => {
  const { siteData } = useSiteData();
  const { playMemoryAudio, stopMemoryAudio, isMemoryAudioPlaying } = useAudio();
  const [selectedMemory, setSelectedMemory] = useState<MemoryItem | null>(null);

  // Dynamic gallery items limited to configured displayCount
  const allItems = siteData.memories.items || [];
  const displayCount = siteData.memories.displayCount ?? allItems.length ?? 6;
  const visibleItems = allItems.slice(0, displayCount);

  // Open memory in lightbox and optionally trigger audio safely without blocking rendering
  const handleOpenMemory = (item: MemoryItem) => {
    setSelectedMemory(item);
    if (item.audioSrc && item.mediaType !== 'video') {
      try {
        playMemoryAudio(item.audioSrc);
      } catch (err) {
        console.warn('Memory audio playback error, continuing lightbox display:', err);
      }
    } else {
      stopMemoryAudio();
    }
  };

  // Close lightbox and stop memory audio
  const handleCloseLightbox = () => {
    setSelectedMemory(null);
    stopMemoryAudio();
  };

  // Switch memory in lightbox and handle optional audio transition safely
  const handleSwitchMemory = (targetItem: MemoryItem) => {
    setSelectedMemory(targetItem);
    if (targetItem.audioSrc && targetItem.mediaType !== 'video') {
      try {
        playMemoryAudio(targetItem.audioSrc);
      } catch (err) {
        console.warn('Memory audio switch error:', err);
      }
    } else {
      stopMemoryAudio();
    }
  };

  // Helper to get tailored aspect-ratio class based on item property for the masonry grid
  const getAspectRatioClass = (ratio?: string) => {
    switch (ratio) {
      case 'portrait':
        return 'aspect-[3/4] sm:aspect-[4/5]';
      case 'landscape':
        return 'aspect-[16/10] sm:aspect-[16/9]';
      case 'square':
      default:
        return 'aspect-square';
    }
  };

  return (
    <section id="memories-section" className="relative py-16 sm:py-24 px-4 sm:px-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="text-center mb-12 sm:mb-16">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="inline-flex items-center justify-center w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-[#6E1835]/30 border border-[#D7B56D]/30 mb-4 shadow-[0_0_20px_rgba(215,181,109,0.15)]"
        >
          <ImageIcon className="w-4 h-4 sm:w-5 sm:h-5 text-[#D7B56D]" />
        </motion.div>

        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="text-2xl sm:text-4xl md:text-5xl font-serif-arabic text-gold-gradient-artistic font-bold mb-3 sm:mb-4 gold-glow leading-snug"
        >
          {siteData.memories.title || 'مقتطفات وذكريات'}
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="text-sm sm:text-base md:text-lg font-serif-arabic text-[#A49CA8] max-w-xl mx-auto px-2"
        >
          {siteData.memories.subtitle}
        </motion.p>
      </div>

      {/* Intelligent Responsive Masonry Gallery that respects item.aspectRatio */}
      <div className="columns-1 sm:columns-2 lg:columns-3 gap-5 sm:gap-6 space-y-5 sm:space-y-6">
        {visibleItems.map((item, idx) => {
          const aspectClass = getAspectRatioClass(item.aspectRatio);

          return (
            <MemoryCard
              key={item.id || idx}
              item={item}
              idx={idx}
              aspectClass={aspectClass}
              onOpen={handleOpenMemory}
            />
          );
        })}
      </div>

      {/* Render Lightbox via React Portal directly into document.body */}
      <LightboxModal
        memory={selectedMemory}
        items={visibleItems}
        isOpen={selectedMemory !== null}
        onClose={handleCloseLightbox}
        onSelectMemory={handleSwitchMemory}
        isAudioPlaying={isMemoryAudioPlaying}
      />
    </section>
  );
};
