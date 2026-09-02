import React, { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { SiteDataProvider } from './context/SiteDataContext';
import { AudioProvider } from './context/AudioContext';
import { ParticleBackground } from './components/ParticleBackground';
import { CinematicIntro } from './components/CinematicIntro';
import { PasswordGate } from './components/PasswordGate';
import { AdminDashboard } from './components/AdminDashboard';
import { HeaderNav } from './components/HeaderNav';
import { HeroSection } from './components/HeroSection';
import { RelationshipCounter } from './components/RelationshipCounter';
import { ArrivalSection } from './components/ArrivalSection';
import { MemoriesGallery } from './components/MemoriesGallery';
import { StoryTimeline } from './components/StoryTimeline';
import { LoveLetter } from './components/LoveLetter';
import { AudioPlayer } from './components/AudioPlayer';
import { Footer } from './components/Footer';

import { useAudio } from './context/AudioContext';

function AppContent() {
  const { stopAllAudio } = useAudio();
  // Application Phase: 'intro' | 'gate' | 'unlocked' | 'admin'
  const [appPhase, setAppPhase] = useState<'intro' | 'gate' | 'unlocked' | 'admin'>('gate');
  const [autoPlayAudio, setAutoPlayAudio] = useState(false);

  const handleEnterFromIntro = () => {
    setAppPhase('unlocked');
    setAutoPlayAudio(true);
  };

  const handleUnlockMain = () => {
    setAppPhase('intro');
  };

  const handleUnlockAdmin = () => {
    stopAllAudio();
    setAutoPlayAudio(false);
    setAppPhase('admin');
  };

  const handleLock = () => {
    stopAllAudio();
    setAutoPlayAudio(false);
    setAppPhase('gate');
  };

  const handleRestartIntro = () => {
    stopAllAudio();
    setAutoPlayAudio(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setAppPhase('intro');
  };

  const handlePreviewSiteFromAdmin = () => {
    stopAllAudio();
    setAppPhase('unlocked');
  };

  return (
    <div className="relative min-h-screen bg-[#08080D] text-[#FFFFFF] font-sans antialiased selection:bg-[#6E1835] selection:text-[#D7B56D] overflow-x-hidden">
      {/* Artistic Flair Radial Dot Grid Texture */}
      <div className="fixed inset-0 artistic-dot-grid opacity-20 pointer-events-none z-0" />

      {/* Atmospheric Ambient Blur Spheres */}
      <div className="fixed top-[-100px] left-[-100px] w-[500px] h-[500px] bg-[#6E1835] rounded-full blur-[140px] opacity-25 pointer-events-none z-0" />
      <div className="fixed bottom-[-100px] right-[-100px] w-[600px] h-[600px] bg-[#D7B56D] rounded-full blur-[180px] opacity-10 pointer-events-none z-0" />

      {/* Floating Gold & Rose Stardust Background Canvas */}
      <ParticleBackground />

      {/* Cinematic Phase Transitions */}
      <AnimatePresence mode="wait">
        {appPhase === 'intro' && (
          <CinematicIntro key="intro-view" onEnter={handleEnterFromIntro} />
        )}

        {appPhase === 'gate' && (
          <PasswordGate
            key="gate-view"
            onUnlockMain={handleUnlockMain}
            onUnlockAdmin={handleUnlockAdmin}
          />
        )}

        {appPhase === 'admin' && (
          <motion.div
            key="admin-view"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.5 }}
            className="relative z-30"
          >
            <AdminDashboard
              onPreviewSite={handlePreviewSiteFromAdmin}
              onLock={handleLock}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Romantic Website (Rendered when unlocked) */}
      {appPhase === 'unlocked' && (
        <>
          <motion.div
            key="main-content"
            initial={{ opacity: 0, filter: 'blur(10px)' }}
            animate={{ opacity: 1, filter: 'blur(0px)' }}
            transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
            className="relative z-10 flex flex-col min-h-screen"
          >
            {/* Header Navigation */}
            <HeaderNav onLock={handleLock} />

            <main className="flex-1">
              {/* 1. Hero Section */}
              <HeroSection />

              {/* 2. Live Relationship Counter */}
              <RelationshipCounter />

              {/* 3. The Arrival Section (Not a Birthday: "يوم أشرقت فيه حياتي") */}
              <ArrivalSection />

              {/* 4. Memories Gallery (6 Dynamic Images + Lightbox) */}
              <MemoriesGallery />

              {/* 5. Our Story Timeline */}
              <StoryTimeline />

              {/* 6. The Love Letter */}
              <LoveLetter />
            </main>

            {/* Footer */}
            <Footer onRestartIntro={handleRestartIntro} />
          </motion.div>

          {/* Floating Audio Controller (Fixed to Viewport - outside transformed containers) */}
          <AudioPlayer autoStart={autoPlayAudio} />
        </>
      )}
    </div>
  );
}

export default function App() {
  return (
    <SiteDataProvider>
      <AudioProvider>
        <AppContent />
      </AudioProvider>
    </SiteDataProvider>
  );
}
