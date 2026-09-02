import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';

export interface FloatingHeartParticle {
  id: string | number;
  startX: number;
  startY: number;
  targetX: number;
  targetY: number;
  wobbleX: number[];
  size: number;
  rotate: number;
  targetRotate: number;
  duration: number;
  delay: number;
  scale: number;
  type: 'heart_ruby' | 'heart_gold' | 'heart_rose' | 'heart_crimson' | 'star_gold' | 'sparkle_glow';
  opacity: number;
}

interface EnvelopeHeartsBurstProps {
  particles: FloatingHeartParticle[];
  onParticleComplete?: (id: string | number) => void;
}

export const EnvelopeHeartsBurst: React.FC<EnvelopeHeartsBurstProps> = ({
  particles,
  onParticleComplete,
}) => {
  return (
    <div className="absolute inset-0 pointer-events-none z-50 overflow-visible">
      {/* SVG Definitions for Luxury Shimmering Gradients */}
      <svg width="0" height="0" className="absolute invisible">
        <defs>
          {/* Ruby Velvet Gradient */}
          <linearGradient id="heartRubyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FB7185" />
            <stop offset="35%" stopColor="#E11D48" />
            <stop offset="80%" stopColor="#9F1239" />
            <stop offset="100%" stopColor="#4C0519" />
          </linearGradient>

          {/* 24K Royal Gold Gradient */}
          <linearGradient id="heartGoldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFFBEB" />
            <stop offset="25%" stopColor="#FDE047" />
            <stop offset="65%" stopColor="#D7B56D" />
            <stop offset="100%" stopColor="#B45309" />
          </linearGradient>

          {/* Rose Glow Gradient */}
          <linearGradient id="heartRoseGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFE4E6" />
            <stop offset="30%" stopColor="#FDA4AF" />
            <stop offset="70%" stopColor="#F43F5E" />
            <stop offset="100%" stopColor="#BE123C" />
          </linearGradient>

          {/* Crimson Passion Gradient */}
          <linearGradient id="heartCrimsonGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#F43F5E" />
            <stop offset="50%" stopColor="#881337" />
            <stop offset="100%" stopColor="#350614" />
          </linearGradient>

          {/* Golden Star Glow */}
          <radialGradient id="starGoldGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="40%" stopColor="#FDE047" />
            <stop offset="80%" stopColor="#D7B56D" />
            <stop offset="100%" stopColor="transparent" />
          </radialGradient>
        </defs>
      </svg>

      <AnimatePresence>
        {particles.map((p) => {
          const isStar = p.type === 'star_gold';
          const isSparkle = p.type === 'sparkle_glow';

          let fillUrl = 'url(#heartRubyGrad)';
          let filterGlow = 'drop-shadow(0 0 12px rgba(225, 29, 72, 0.75))';

          if (p.type === 'heart_gold') {
            fillUrl = 'url(#heartGoldGrad)';
            filterGlow = 'drop-shadow(0 0 14px rgba(215, 181, 109, 0.9))';
          } else if (p.type === 'heart_rose') {
            fillUrl = 'url(#heartRoseGrad)';
            filterGlow = 'drop-shadow(0 0 10px rgba(244, 63, 94, 0.8))';
          } else if (p.type === 'heart_crimson') {
            fillUrl = 'url(#heartCrimsonGrad)';
            filterGlow = 'drop-shadow(0 0 14px rgba(136, 19, 55, 0.85))';
          } else if (isStar) {
            fillUrl = 'url(#starGoldGlow)';
            filterGlow = 'drop-shadow(0 0 16px rgba(253, 224, 71, 0.95))';
          }

          return (
            <motion.div
              key={p.id}
              initial={{
                x: p.startX,
                y: p.startY,
                opacity: 0,
                scale: 0.1,
                rotate: p.rotate,
              }}
              animate={{
                x: p.wobbleX,
                y: p.targetY,
                opacity: [0, p.opacity, p.opacity, 0],
                scale: [0.1, p.scale * 1.15, p.scale, p.scale * 0.7],
                rotate: p.targetRotate,
              }}
              exit={{ opacity: 0, scale: 0 }}
              transition={{
                duration: p.duration,
                delay: p.delay,
                ease: [0.16, 1, 0.3, 1], // Natural buoyant easing
                times: [0, 0.15, 0.7, 1],
              }}
              onAnimationComplete={() => {
                if (onParticleComplete) {
                  onParticleComplete(p.id);
                }
              }}
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                width: p.size,
                height: p.size,
                pointerEvents: 'none',
                filter: filterGlow,
              }}
            >
              {isStar ? (
                /* 4-Pointed Celestial Star */
                <svg
                  viewBox="0 0 24 24"
                  className="w-full h-full overflow-visible"
                  fill="url(#starGoldGlow)"
                >
                  <path d="M12 0 L14.5 9.5 L24 12 L14.5 14.5 L12 24 L9.5 14.5 L0 12 L9.5 9.5 Z" />
                </svg>
              ) : isSparkle ? (
                /* Radiant Glowing Sparkle Disc */
                <div
                  className="w-full h-full rounded-full bg-gradient-to-r from-white via-[#FDE047] to-[#D7B56D]"
                  style={{
                    boxShadow: '0 0 16px 4px rgba(215, 181, 109, 0.9), 0 0 24px 8px rgba(225, 29, 72, 0.5)',
                  }}
                />
              ) : (
                /* Organic Symmetrical 3D Love Heart */
                <svg
                  viewBox="0 0 32 32"
                  className="w-full h-full overflow-visible"
                  style={{ transform: 'scale(1.05)' }}
                >
                  {/* Subtle Inner Rim Stroke */}
                  <path
                    d="M16 28.5 C15.5 28.5 4 19.5 2 13 C0 6.5 6 1.5 12 4.5 C14 5.5 15.5 8 16 9 C16.5 8 18 5.5 20 4.5 C26 1.5 32 6.5 30 13 C28 19.5 16.5 28.5 16 28.5 Z"
                    fill={fillUrl}
                    stroke="rgba(255, 255, 255, 0.4)"
                    strokeWidth="0.75"
                  />
                  {/* Specular Highlight on Left Heart Crest */}
                  <path
                    d="M 8 7 C 6 8.5 5.5 12 6.5 14 C 6.5 14 6 11 8.5 8.5 C 10 7 12 7 12 7 C 12 7 10 6 8 7 Z"
                    fill="rgba(255, 255, 255, 0.55)"
                  />
                </svg>
              )}
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};
