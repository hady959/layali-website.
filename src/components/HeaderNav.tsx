import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Lock, Menu, X, Sparkles, Clock, Sun, Image as ImageIcon, Calendar, Feather, Home } from 'lucide-react';
import { useSiteData } from '../context/SiteDataContext';

interface HeaderNavProps {
  onLock: () => void;
}

export const HeaderNav: React.FC<HeaderNavProps> = ({ onLock }) => {
  const { siteData } = useSiteData();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 30);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { href: '#hero-section', label: 'الرئيسية', icon: Home },
    { href: '#counter-section', label: 'العداد', icon: Clock },
    { href: '#arrival-section', label: 'يوم الإشراق', icon: Sun },
    { href: '#memories-section', label: 'الذكريات', icon: ImageIcon },
    { href: '#timeline-section', label: 'حكايتنا', icon: Calendar },
    { href: '#letter-section', label: 'الرسالة', icon: Feather },
  ];

  const handleLinkClick = () => {
    setMobileMenuOpen(false);
  };

  return (
    <>
      <motion.header
        id="main-header"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className={`fixed top-0 inset-x-0 z-30 transition-all duration-500 px-4 sm:px-6 py-3.5 sm:py-4 ${
          scrolled
            ? 'bg-[#08080D]/90 backdrop-blur-xl border-b border-[#D7B56D]/15 shadow-2xl'
            : 'bg-transparent'
        }`}
        style={{
          paddingTop: 'max(12px, env(safe-area-inset-top, 12px))',
          paddingLeft: 'max(16px, env(safe-area-inset-left, 16px))',
          paddingRight: 'max(16px, env(safe-area-inset-right, 16px))',
        }}
      >
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          {/* Brand Monogram & Name */}
          <a
            href="#hero-section"
            className="flex items-center gap-2.5 sm:gap-3 text-[#FFFFFF] hover:text-[#D7B56D] transition-colors group select-none"
          >
            <div className="w-8 h-8 sm:w-9 sm:h-9 border border-[#D7B56D]/40 flex items-center justify-center rounded-full group-hover:border-[#D7B56D] transition-all bg-white/[0.03] shadow-[0_0_12px_rgba(215,181,109,0.15)]">
              <div className="w-2 h-2 bg-[#D7B56D] rounded-full shadow-[0_0_8px_#D7B56D]" />
            </div>
            <div className="flex flex-col text-right">
              <span className="font-serif-arabic font-bold text-base sm:text-lg text-gold-gradient leading-tight">
                {siteData.recipient.name}
              </span>
              <span className="text-[8px] sm:text-[9px] font-display-en tracking-[0.25em] text-[#A49CA8]/60 uppercase -mt-0.5">
                ARCHIVE
              </span>
            </div>
          </a>

          {/* Desktop Quick Anchor Navigation */}
          <nav className="hidden md:flex items-center gap-6 lg:gap-8 text-sm font-sans-arabic text-[#A49CA8] px-6 py-2 rounded-full bg-white/[0.03] border border-white/10 backdrop-blur-md shadow-sm">
            {navLinks.slice(1).map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="hover:text-[#D7B56D] transition-colors py-0.5"
              >
                {link.label}
              </a>
            ))}
          </nav>

          {/* Action Buttons: Lock & Mobile Menu Toggle */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Lock / Relock action */}
            <button
              onClick={onLock}
              className="flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-1.5 rounded-full bg-white/[0.04] border border-[#D7B56D]/30 text-xs font-sans-arabic text-[#A49CA8] hover:text-[#D7B56D] hover:border-[#D7B56D]/60 hover:bg-[#6E1835]/30 transition-all cursor-pointer shadow-sm active:scale-95"
              title="قفل المكان"
            >
              <Lock className="w-3.5 h-3.5 text-[#D7B56D]" />
              <span className="text-[11px] sm:text-xs">قفل</span>
            </button>

            {/* Mobile Hamburger Toggle Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden flex items-center justify-center w-9 h-9 rounded-full bg-white/[0.04] border border-[#D7B56D]/30 text-[#D7B56D] hover:bg-[#6E1835]/30 transition-all cursor-pointer active:scale-95"
              aria-label={mobileMenuOpen ? 'إغلاق القائمة' : 'فتح القائمة'}
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </motion.header>

      {/* Mobile Navigation Drawer / Dropdown */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-25 md:hidden bg-black/80 backdrop-blur-xl flex flex-col justify-start pt-20 px-6 pb-8"
            onClick={() => setMobileMenuOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, y: -15, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -15, scale: 0.98 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm mx-auto rounded-3xl bg-[#08080D]/95 border border-[#D7B56D]/30 p-6 shadow-2xl flex flex-col space-y-4"
              dir="rtl"
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#D7B56D]" />
                  <span className="font-serif-arabic text-base font-bold text-gold-gradient">
                    أقسام المكان
                  </span>
                </div>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1 rounded-full text-[#A49CA8] hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="grid grid-cols-1 gap-2 py-2">
                {navLinks.map((link) => {
                  const Icon = link.icon;
                  return (
                    <a
                      key={link.href}
                      href={link.href}
                      onClick={handleLinkClick}
                      className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-white/[0.03] hover:bg-[#6E1835]/40 border border-white/5 hover:border-[#D7B56D]/40 text-sm font-sans-arabic text-[#FFFFFF]/90 hover:text-[#D7B56D] transition-all"
                    >
                      <div className="w-8 h-8 rounded-xl bg-[#6E1835]/30 flex items-center justify-center text-[#D7B56D]">
                        <Icon className="w-4 h-4" />
                      </div>
                      <span className="font-medium text-base">{link.label}</span>
                    </a>
                  );
                })}
              </div>

              {/* Quick Lock in Mobile Menu */}
              <div className="pt-3 border-t border-white/10 flex justify-between items-center">
                <span className="text-xs text-[#A49CA8] font-sans-arabic">الخصوصية والأمان:</span>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onLock();
                  }}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#6E1835]/40 hover:bg-[#6E1835]/80 border border-[#D7B56D]/30 text-xs font-sans-arabic text-[#D7B56D] transition-colors"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>قفل المكان فوراً</span>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

