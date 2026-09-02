import React from 'react';
import { motion } from 'motion/react';

interface FountainPenProps {
  x: number;
  y: number;
  isWriting: boolean;
  isVisible: boolean;
}

export const FountainPen: React.FC<FountainPenProps> = ({
  x,
  y,
  isWriting,
  isVisible,
}) => {
  if (!isVisible) return null;

  return (
    <motion.div
      className="absolute pointer-events-none z-50 transition-all duration-75 ease-out"
      style={{
        left: `${x}px`,
        top: `${y}px`,
        width: '48px',
        height: '160px',
        // The nib point (24px, 155px) is pinned precisely at (x, y) on the paper
        marginLeft: '-24px',
        marginTop: '-155px',
        transformOrigin: '24px 155px',
      }}
      initial={{ opacity: 0, scale: 0.8, y: -40, rotate: -20 }}
      animate={{
        opacity: 1,
        scale: 1,
        // The body tilts naturally at ~-35deg with delicate micro-pressure while writing
        rotate: isWriting ? [-33, -36, -32, -34] : -34,
        y: isWriting ? [0, -1.5, 0.5, 0] : 0,
      }}
      exit={{ opacity: 0, scale: 0.8, y: -60, rotate: -15 }}
      transition={{
        rotate: { duration: 0.16, repeat: isWriting ? Infinity : 0, ease: 'easeInOut' },
        y: { duration: 0.14, repeat: isWriting ? Infinity : 0, ease: 'easeInOut' },
      }}
    >
      {/* 1. True Contact Shadow Under Pen Nib Point */}
      <motion.div
        animate={{
          scale: isWriting ? [1, 1.3, 0.9, 1] : 1,
          opacity: isWriting ? [0.7, 0.9, 0.7] : 0.65,
        }}
        transition={{ duration: 0.16, repeat: Infinity }}
        className="absolute bottom-[3px] left-[20px] w-2.5 h-1.5 rounded-full bg-black/80 blur-[1px] pointer-events-none"
      />

      {/* 2. Soft Projected Shadow of Pen Barrel */}
      <div
        className="absolute top-10 -right-8 w-6 h-28 rounded-full bg-black/35 blur-[8px] pointer-events-none origin-bottom-left"
        style={{ transform: 'rotate(-40deg)' }}
      />

      {/* 3. The 3D Fountain Pen (Crafted SVG with Pure Gold Nib, Rhodium Inlay & Burgundy Lacquer) */}
      <div className="relative w-full h-full filter drop-shadow(0 12px 20px rgba(0,0,0,0.75))">
        <svg
          viewBox="0 0 48 160"
          className="w-full h-full overflow-visible"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            {/* 18K Solid Gold Nib Gradients */}
            <linearGradient id="solidGoldNib" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#A87926" />
              <stop offset="25%" stopColor="#E5B853" />
              <stop offset="50%" stopColor="#FFF2B8" />
              <stop offset="75%" stopColor="#D4A038" />
              <stop offset="100%" stopColor="#754E0F" />
            </linearGradient>

            <linearGradient id="rhodiumTwoTone" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#CBD5E1" />
              <stop offset="50%" stopColor="#FFFFFF" />
              <stop offset="100%" stopColor="#64748B" />
            </linearGradient>

            <linearGradient id="goldTrims" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#8C5C15" />
              <stop offset="35%" stopColor="#FDE047" />
              <stop offset="70%" stopColor="#CA8A04" />
              <stop offset="100%" stopColor="#583508" />
            </linearGradient>

            {/* Deep Maroon & Black Piano Lacquer Barrel */}
            <linearGradient id="lacquerBarrel" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#1A020B" />
              <stop offset="20%" stopColor="#480D21" />
              <stop offset="50%" stopColor="#7B173B" />
              <stop offset="80%" stopColor="#2D0614" />
              <stop offset="100%" stopColor="#0B0105" />
            </linearGradient>

            {/* Precision Grip Section */}
            <linearGradient id="matteGrip" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#111827" />
              <stop offset="45%" stopColor="#374151" />
              <stop offset="80%" stopColor="#1F2937" />
              <stop offset="100%" stopColor="#030712" />
            </linearGradient>
          </defs>

          {/* Pen Barrel Body */}
          <path
            d="M 17,2 L 31,2 C 34,2 35,4 35,8 L 33,70 C 33,73 31,75 28,75 L 20,75 C 17,75 15,73 15,70 L 13,8 C 13,4 14,2 17,2 Z"
            fill="url(#lacquerBarrel)"
          />
          {/* Specular Cylindrical Reflection Highlight */}
          <path
            d="M 21,4 L 24,4 L 23,72 L 21,72 Z"
            fill="white"
            opacity="0.38"
          />

          {/* Gold Center Band */}
          <rect
            x="14"
            y="72"
            width="20"
            height="6"
            rx="1"
            fill="url(#goldTrims)"
            stroke="#583508"
            strokeWidth="0.5"
          />
          <line x1="14" y1="75" x2="34" y2="75" stroke="#FFF" strokeWidth="0.6" opacity="0.6" />

          {/* Ergonomic Section Grip */}
          <path
            d="M 16,78 L 32,78 L 30,112 C 30,114 28,116 26,116 L 22,116 C 20,116 18,114 18,112 Z"
            fill="url(#matteGrip)"
          />

          {/* Gold Nib Collar Ring */}
          <rect
            x="18"
            y="115"
            width="12"
            height="3.5"
            rx="0.6"
            fill="url(#goldTrims)"
          />

          {/* 18K Solid Gold Nib Wings */}
          <path
            d="M 19,118 L 29,118 L 30.5,130 C 30.5,140 25.8,153 24,155 C 22.2,153 17.5,140 17.5,130 Z"
            fill="url(#solidGoldNib)"
            stroke="#754E0F"
            strokeWidth="0.6"
          />

          {/* Rhodium Inlay Design */}
          <path
            d="M 21,121 L 27,121 L 28,130 C 28,138 25,147 24,150 C 23,147 20,138 20,130 Z"
            fill="url(#rhodiumTwoTone)"
            opacity="0.88"
          />

          {/* Breather Hole */}
          <circle cx="24" cy="134" r="1.3" fill="#2B0512" stroke="#63132B" strokeWidth="0.4" />

          {/* Ink Nib Slit & Tines */}
          <line x1="24" y1="135.3" x2="24" y2="155" stroke="#180208" strokeWidth="0.75" />

          {/* Tines Specular Glimmer */}
          <line x1="23.2" y1="120" x2="23.2" y2="149" stroke="white" strokeWidth="0.5" opacity="0.65" />

          {/* Nib Tip Contact Point Indicator (Liquid ink bead) */}
          <circle
            cx="24"
            cy="154.5"
            r="1"
            fill="#D7B56D"
            opacity={isWriting ? 0.9 : 0.4}
          />
        </svg>
      </div>
    </motion.div>
  );
};
