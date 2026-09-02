import React from 'react';
import { ArrowUp, RotateCcw } from 'lucide-react';
import { useSiteData } from '../context/SiteDataContext';

interface FooterProps {
  onRestartIntro: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onRestartIntro }) => {
  const { siteData } = useSiteData();

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer id="main-footer" className="relative py-16 px-6 border-t border-white/10 bg-[#08080D]/90 backdrop-blur-md">
      <div className="max-w-4xl mx-auto flex flex-col items-center text-center space-y-6">
        {/* Monogram Crest */}
        <div className="flex items-center gap-3">
          <span className="w-12 h-px bg-gradient-to-l from-[#D7B56D]/40 to-transparent" />
          <div className="w-10 h-10 rounded-full bg-white/[0.02] border border-[#D7B56D]/40 flex items-center justify-center text-xs font-display-en font-bold text-gold-gradient shadow-md">
            H&L
          </div>
          <span className="w-12 h-px bg-gradient-to-r from-[#D7B56D]/40 to-transparent" />
        </div>

        {/* Handcrafted Message */}
        <p className="text-base sm:text-lg font-serif-arabic text-[#FFFFFF]/80">
          صُنع بكل حب وتقدير من{' '}
          <span className="text-gold-gradient font-bold">{siteData.sender.name}</span>{' '}
          إلى{' '}
          <span className="text-rose-gradient font-bold">{siteData.recipient.name}</span>
        </p>

        {/* Artistic Metadata Badges */}
        <div className="flex flex-wrap items-center justify-center gap-6 text-[10px] text-white/30 uppercase tracking-[0.2em] font-display-en pt-2">
          <span>PRIVACY: PERSONAL MEMORY</span>
          <span className="w-1 h-1 rounded-full bg-[#D7B56D]/40" />
          <span>AUTH: {siteData.sender.englishName}</span>
          <span className="w-1 h-1 rounded-full bg-[#D7B56D]/40" />
          <span>RECIPIENT: {siteData.recipient.englishName}</span>
        </div>

        <p className="text-[10px] font-display-en text-[#A49CA8]/40 tracking-[0.25em] uppercase">
          © 2026 — MADE WITH LOVE FOR HER
        </p>

        {/* Actions row */}
        <div className="flex items-center gap-4 pt-2">
          <button
            onClick={onRestartIntro}
            className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-white/[0.03] border border-[#D7B56D]/20 text-xs font-sans-arabic text-[#A49CA8] hover:text-[#D7B56D] hover:border-[#D7B56D]/50 hover:bg-white/[0.06] transition-all cursor-pointer shadow-sm"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>إعادة تشغيل المقدمة</span>
          </button>

          <button
            onClick={scrollToTop}
            className="w-9 h-9 rounded-full bg-white/[0.03] border border-[#D7B56D]/20 flex items-center justify-center text-[#A49CA8] hover:text-[#D7B56D] hover:border-[#D7B56D]/50 hover:bg-white/[0.06] transition-all cursor-pointer shadow-sm"
            title="الرجوع للأعلى"
          >
            <ArrowUp className="w-4 h-4" />
          </button>
        </div>
      </div>
    </footer>
  );
};
