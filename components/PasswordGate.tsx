import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Lock, Sparkles, KeyRound, HelpCircle, ArrowLeft, ShieldAlert, Loader2 } from 'lucide-react';
import { useSiteData } from '../context/SiteDataContext';
import { verifyServerPassword } from '../services/mediaService';

interface PasswordGateProps {
  onUnlockMain: () => void;
  onUnlockAdmin: () => void;
}

export const PasswordGate: React.FC<PasswordGateProps> = ({
  onUnlockMain,
  onUnlockAdmin,
}) => {
  const { siteData } = useSiteData();
  const [day, setDay] = useState('');
  const [month, setMonth] = useState('');
  const [year, setYear] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isUnlocking, setIsUnlocking] = useState<'main' | 'admin' | 'checking' | false>(false);
  const [showHint, setShowHint] = useState(false);
  const [shake, setShake] = useState(false);

  const dayRef = useRef<HTMLInputElement>(null);
  const monthRef = useRef<HTMLInputElement>(null);
  const yearRef = useRef<HTMLInputElement>(null);
  const checkingRef = useRef(false);

  useEffect(() => {
    // Auto-focus day field on mount
    dayRef.current?.focus();
  }, []);

  const checkAndUnlock = async (d: string, m: string, y: string) => {
    if (checkingRef.current) return false;
    const cleanDay = parseInt(d, 10);
    const cleanMonth = parseInt(m, 10);
    const cleanYear = parseInt(y, 10);

    if (isNaN(cleanDay) || isNaN(cleanMonth) || isNaN(cleanYear) || y.length < 4) {
      return false;
    }

    checkingRef.current = true;
    setIsUnlocking('checking');

    try {
      // 1. First attempt secure server-side verification
      const res = await verifyServerPassword(cleanDay, cleanMonth, cleanYear);

      if (res.success && res.role) {
        if (res.token) {
          sessionStorage.setItem('layali_auth_token', res.token);
        }

        if (res.role === 'admin') {
          setIsUnlocking('admin');
          setTimeout(() => {
            onUnlockAdmin();
            checkingRef.current = false;
          }, 500);
          return true;
        } else {
          setIsUnlocking('main');
          setTimeout(() => {
            onUnlockMain();
            checkingRef.current = false;
          }, 500);
          return true;
        }
      }

      // 2. Client fallback in case server response is false / unreachable
      const expectedMainDay = parseInt(siteData.security.passDay || '16', 10);
      const expectedMainMonth = parseInt(siteData.security.passMonth || '8', 10);
      const expectedMainYear = parseInt(siteData.security.passYear || '2026', 10);

      const expectedAdminDay = parseInt(siteData.security.adminPassDay || '11', 10);
      const expectedAdminMonth = parseInt(siteData.security.adminPassMonth || '1', 10);
      const expectedAdminYear = parseInt(siteData.security.adminPassYear || '1111', 10);

      if (
        cleanDay === expectedMainDay &&
        cleanMonth === expectedMainMonth &&
        cleanYear === expectedMainYear
      ) {
        setIsUnlocking('main');
        setTimeout(() => {
          onUnlockMain();
          checkingRef.current = false;
        }, 500);
        return true;
      }

      if (
        cleanDay === expectedAdminDay &&
        cleanMonth === expectedAdminMonth &&
        cleanYear === expectedAdminYear
      ) {
        setIsUnlocking('admin');
        setTimeout(() => {
          onUnlockAdmin();
          checkingRef.current = false;
        }, 500);
        return true;
      }

      // Invalid
      setIsUnlocking(false);
      checkingRef.current = false;
      return false;
    } catch (e) {
      setIsUnlocking(false);
      checkingRef.current = false;
      return false;
    }
  };

  const handleDayChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, '').slice(0, 2);
    setDay(val);
    setError(null);
    if (val.length === 2) {
      monthRef.current?.focus();
    }
    if (val.length > 0 && month.length > 0 && year.length === 4) {
      checkAndUnlock(val, month, year);
    }
  };

  const handleMonthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, '').slice(0, 2);
    setMonth(val);
    setError(null);

    // Auto-advance if single digit >= 2 or two digits
    if (val.length === 2 || (val.length === 1 && parseInt(val, 10) >= 2)) {
      yearRef.current?.focus();
    }
    if (day.length > 0 && val.length > 0 && year.length === 4) {
      checkAndUnlock(day, val, year);
    }
  };

  const triggerErrorShake = () => {
    setError(
      siteData.security.errorMessage || 'تاريخ غير صحيح... جربي تفتكري اليوم اللي بدأ فيه كل شيء.'
    );
    setShake(true);
    setTimeout(() => {
      setShake(false);
      setDay('');
      setMonth('');
      setYear('');
      dayRef.current?.focus();
    }, 600);
  };

  const handleYearChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, '').slice(0, 4);
    setYear(val);
    setError(null);

    // Instant unlock when 4 digits of year are typed
    if (val.length === 4) {
      const unlocked = await checkAndUnlock(day, month, val);
      if (!unlocked && day.length > 0 && month.length > 0) {
        triggerErrorShake();
      }
    }
  };

  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    field: 'day' | 'month' | 'year'
  ) => {
    if (e.key === 'Backspace') {
      if (field === 'year' && !year) {
        monthRef.current?.focus();
      } else if (field === 'month' && !month) {
        dayRef.current?.focus();
      }
    }
    if (e.key === 'Enter') {
      handleSubmit();
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    const unlocked = await checkAndUnlock(day, month, year);
    if (unlocked) return;

    triggerErrorShake();
  };

  return (
    <motion.div
      id="password-gate"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{
        opacity: isUnlocking === 'main' || isUnlocking === 'admin' ? 0 : 1,
        scale: isUnlocking === 'main' || isUnlocking === 'admin' ? 1.05 : 1,
        filter: isUnlocking === 'main' || isUnlocking === 'admin' ? 'blur(16px)' : 'blur(0px)',
      }}
      exit={{ opacity: 0, scale: 1.05, filter: 'blur(16px)' }}
      transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      className="fixed inset-0 z-40 flex items-center justify-center bg-[#08080D]/90 backdrop-blur-xl px-4 py-8"
    >
      {/* Ambient background glows */}
      <div className="absolute w-[500px] h-[500px] rounded-full bg-[#6E1835]/25 blur-3xl pointer-events-none" />
      <div className="absolute w-[350px] h-[350px] rounded-full bg-[#D7B56D]/15 blur-2xl pointer-events-none translate-x-20 translate-y-20" />

      <motion.div
        animate={shake ? { x: [-8, 8, -6, 6, -3, 3, 0] } : {}}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-md p-6 sm:p-8 md:p-10 rounded-2xl glass-panel border border-[#D7B56D]/25 shadow-2xl text-center"
      >
        {/* Top Lock Badge */}
        <div className="inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-gradient-to-br from-[#6E1835]/40 to-[#121019] border border-[#D7B56D]/30 mb-5 sm:mb-6 shadow-[0_0_20px_rgba(215,181,109,0.2)]">
          <Lock className="w-6 h-6 sm:w-7 sm:h-7 text-[#D7B56D]" />
        </div>

        {/* Title & Subtitle */}
        <h2 className="text-xl sm:text-2xl md:text-3xl font-serif-arabic text-gold-gradient font-bold mb-2 sm:mb-3 tracking-wide">
          {siteData.security.gateTitle}
        </h2>
        <p className="text-xs sm:text-sm md:text-base text-[#A49CA8] mb-6 sm:mb-8 font-sans-arabic font-light leading-relaxed">
          {siteData.security.gateSubtitle}
        </p>

        {/* 3 Auto-tabbing input fields */}
        <form onSubmit={handleSubmit} className="space-y-5 sm:space-y-6">
          <div className="flex flex-col items-center gap-2">
            <div className="flex items-center justify-center gap-2 sm:gap-3 dir-ltr" dir="ltr">
              {/* Day Input Box */}
              <div className="flex flex-col items-center gap-1.5">
                <input
                  id="pass-day-input"
                  ref={dayRef}
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={2}
                  value={day}
                  onChange={handleDayChange}
                  onKeyDown={(e) => handleKeyDown(e, 'day')}
                  autoComplete="off"
                  className="w-14 h-13 sm:w-16 sm:h-14 md:w-20 md:h-16 text-center text-xl sm:text-2xl font-bold tracking-wider rounded-xl bg-[#08080D]/90 border border-[#D7B56D]/40 focus:border-[#D7B56D] focus:ring-2 focus:ring-[#D7B56D]/30 text-[#FFFFFF] transition-all outline-none shadow-inner"
                />
                <span className="text-[11px] sm:text-xs text-[#A49CA8]/70 font-sans-arabic">يوم</span>
              </div>

              <span className="text-xl sm:text-2xl text-[#D7B56D]/50 font-serif pb-4">/</span>

              {/* Month Input Box */}
              <div className="flex flex-col items-center gap-1.5">
                <input
                  id="pass-month-input"
                  ref={monthRef}
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={2}
                  value={month}
                  onChange={handleMonthChange}
                  onKeyDown={(e) => handleKeyDown(e, 'month')}
                  autoComplete="off"
                  className="w-14 h-13 sm:w-16 sm:h-14 md:w-20 md:h-16 text-center text-xl sm:text-2xl font-bold tracking-wider rounded-xl bg-[#08080D]/90 border border-[#D7B56D]/40 focus:border-[#D7B56D] focus:ring-2 focus:ring-[#D7B56D]/30 text-[#FFFFFF] transition-all outline-none shadow-inner"
                />
                <span className="text-[11px] sm:text-xs text-[#A49CA8]/70 font-sans-arabic">شهر</span>
              </div>

              <span className="text-xl sm:text-2xl text-[#D7B56D]/50 font-serif pb-4">/</span>

              {/* Year Input Box */}
              <div className="flex flex-col items-center gap-1.5">
                <input
                  id="pass-year-input"
                  ref={yearRef}
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={4}
                  value={year}
                  onChange={handleYearChange}
                  onKeyDown={(e) => handleKeyDown(e, 'year')}
                  autoComplete="off"
                  className="w-20 h-13 sm:w-24 sm:h-14 md:w-28 md:h-16 text-center text-xl sm:text-2xl font-bold tracking-wider rounded-xl bg-[#08080D]/90 border border-[#D7B56D]/40 focus:border-[#D7B56D] focus:ring-2 focus:ring-[#D7B56D]/30 text-[#FFFFFF] transition-all outline-none shadow-inner"
                />
                <span className="text-[11px] sm:text-xs text-[#A49CA8]/70 font-sans-arabic">سنة</span>
              </div>
            </div>
          </div>

          {/* Soft Error Message */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="text-sm text-[#E8A0B7] bg-[#6E1835]/30 border border-[#E8A0B7]/30 py-2 px-4 rounded-lg font-sans-arabic leading-relaxed flex items-center justify-center gap-2"
              >
                <ShieldAlert className="w-4 h-4 text-[#E8A0B7]" />
                <span>{error}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Action Button */}
          <button
            id="password-submit-btn"
            type="submit"
            disabled={isUnlocking !== false}
            className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-[#6E1835] via-[#8B2245] to-[#6E1835] text-[#FFFFFF] font-sans-arabic text-base font-semibold border border-[#D7B56D]/40 shadow-[0_4px_20px_rgba(110,24,53,0.6)] hover:shadow-[0_4px_30px_rgba(215,181,109,0.3)] transition-all cursor-pointer flex items-center justify-center gap-2 group disabled:opacity-50"
          >
            {isUnlocking === 'checking' ? (
              <>
                <Loader2 className="w-5 h-5 text-[#D7B56D] animate-spin" />
                <span>جاري التحقق الآمن من الخادم...</span>
              </>
            ) : isUnlocking === 'admin' ? (
              <>
                <Sparkles className="w-5 h-5 text-[#D7B56D] animate-spin" />
                <span>فتح لوحة التحكم السرية (Editor)...</span>
              </>
            ) : isUnlocking === 'main' ? (
              <>
                <Sparkles className="w-5 h-5 text-[#D7B56D] animate-spin" />
                <span>جاري فتح المكان الخاص بكِ...</span>
              </>
            ) : (
              <>
                <KeyRound className="w-5 h-5 text-[#D7B56D] group-hover:rotate-12 transition-transform" />
                <span className="text-[#FFFFFF]">تأكيد الدخول</span>
                <ArrowLeft className="w-4 h-4 text-[#D7B56D] group-hover:-translate-x-1 transition-transform" />
              </>
            )}
          </button>
        </form>

        {/* Subtle Hint Accordion */}
        <div className="mt-6 pt-4 border-t border-[#A49CA8]/10 flex flex-col items-center">
          <button
            onClick={() => setShowHint(!showHint)}
            className="text-xs text-[#A49CA8]/60 hover:text-[#D7B56D] transition-colors flex items-center gap-1.5 font-sans-arabic cursor-pointer py-1"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>{showHint ? 'إخفاء التلميح' : 'محتاجة تلميح؟'}</span>
          </button>
          <AnimatePresence>
            {showHint && (
              <motion.p
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="text-xs text-[#D7B56D]/80 mt-2 font-sans-arabic leading-relaxed bg-[#121019]/60 px-3 py-2 rounded-lg border border-[#D7B56D]/15"
              >
                {siteData.security.hintMessage}
              </motion.p>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  );
};
