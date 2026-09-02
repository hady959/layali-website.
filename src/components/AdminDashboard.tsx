import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Save,
  Eye,
  RotateCcw,
  Lock,
  Sparkles,
  Image as ImageIcon,
  Calendar,
  Clock,
  Heart,
  BookOpen,
  Music,
  Plus,
  Trash2,
  CheckCircle2,
  Settings,
  Shield,
  Layers,
  ChevronRight,
  ExternalLink,
  Info,
  Upload,
  Play,
  Pause,
  Loader2,
  Volume2,
  FileAudio,
  Film,
  Video,
  DownloadCloud,
  HardDrive,
  Database,
} from 'lucide-react';
import { useSiteData } from '../context/SiteDataContext';
import { MemoryItem, TimelineMilestone } from '../types';
import { uploadImage, uploadVideo, uploadAudio, deleteMediaFile, triggerBackup } from '../services/mediaService';

// Helper removed

interface AdminDashboardProps {
  onPreviewSite: () => void;
  onLock: () => void;
}

type TabType = 'intro' | 'hero' | 'counter' | 'arrival' | 'gallery' | 'timeline' | 'letter' | 'security';

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  onPreviewSite,
  onLock,
}) => {
  const { siteData, setSiteData, resetSiteData, saveStatus, triggerSaveToast } = useSiteData();
  const [formData, setFormData] = useState(siteData);
  const [activeTab, setActiveTab] = useState<TabType>('intro');
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [isBackingUp, setIsBackingUp] = useState(false);

  // Upload and audio preview states
  const [videoUploadProgress, setVideoUploadProgress] = useState<{ [key: number]: number }>({});
  const [audioUploadProgress, setAudioUploadProgress] = useState<{ [key: number]: number }>({});
  const [bgAudioProgress, setBgAudioProgress] = useState<number | null>(null);
  const [activePreviewId, setActivePreviewId] = useState<string | null>(null);
  const previewAudioRef = useRef<HTMLAudioElement | null>(null);

  // Stop any active preview immediately and clean up
  const stopAllPreviews = () => {
    if (previewAudioRef.current) {
      previewAudioRef.current.pause();
      previewAudioRef.current.currentTime = 0;
      previewAudioRef.current.src = '';
      previewAudioRef.current = null;
    }
    setActivePreviewId(null);
  };

  // Stop preview audio on active tab change
  React.useEffect(() => {
    stopAllPreviews();
  }, [activeTab]);

  // Clean up all preview audio when AdminDashboard unmounts
  React.useEffect(() => {
    return () => {
      stopAllPreviews();
    };
  }, []);

  // Audio preview toggle
  const togglePreviewAudio = (id: string, url: string) => {
    if (!url) return;
    if (activePreviewId === id) {
      stopAllPreviews();
    } else {
      stopAllPreviews();
      const audio = new Audio(url);
      previewAudioRef.current = audio;
      audio.play().catch((e) => console.warn('Preview error:', e));
      audio.onended = () => {
        stopAllPreviews();
      };
      setActivePreviewId(id);
    }
  };

  // Image upload handler: uploads directly to Local Server Storage (auto WebP conversion & registration in SQLite)
  const handleImageFileUpload = async (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      triggerSaveToast('يرجى اختيار ملف صورة صالح');
      return;
    }

    try {
      // 1. Upload to Server Storage
      const res = await uploadImage(file);
      if (res.success && res.url) {
        handleMemoryChange(index, 'image', res.url);
        triggerSaveToast('تم رفع وحفظ الصورة بنجاح!');
        return;
      }
      triggerSaveToast(res.error || 'فشل رفع الصورة');
    } catch (err) {
      console.error('Image upload error:', err);
      triggerSaveToast('فشل الاتصال بالسيرفر أثناء رفع الصورة');
    }
  };

  const handleVideoFileUpload = async (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setVideoUploadProgress((prev) => ({ ...prev, [index]: 1 }));
    try {
      const res = await uploadVideo(file, (percent) => {
        setVideoUploadProgress((prev) => ({ ...prev, [index]: percent }));
      });
      if (res.success && res.url) {
        const updated = [...formData.memories.items];
        updated[index] = {
          ...updated[index],
          videoSrc: res.url,
          mediaType: 'video',
        };
        setFormData({
          ...formData,
          memories: { ...formData.memories, items: updated },
        });
        triggerSaveToast('تم رفع الفيديو بنجاح!');
      } else {
        triggerSaveToast(res.error || 'فشل رفع الفيديو');
      }
    } catch (err) {
      triggerSaveToast('حدث خطأ أثناء رفع الفيديو');
    } finally {
      setVideoUploadProgress((prev) => {
        const next = { ...prev };
        delete next[index];
        return next;
      });
    }
  };

  const handleRemoveMemoryVideo = async (index: number) => {
    const currentVideo = formData.memories.items[index]?.videoSrc;
    if (currentVideo) {
      deleteMediaFile(currentVideo);
    }
    const updated = [...formData.memories.items];
    updated[index] = {
      ...updated[index],
      videoSrc: '',
      mediaType: 'image',
    };
    setFormData({
      ...formData,
      memories: { ...formData.memories, items: updated },
    });
    triggerSaveToast('تم حذف ملف الفيديو');
  };

  const handleAudioFileUpload = async (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Stop active preview before uploading
    stopAllPreviews();

    setAudioUploadProgress((prev) => ({ ...prev, [index]: 1 }));
    try {
      const res = await uploadAudio(file, (percent) => {
        setAudioUploadProgress((prev) => ({ ...prev, [index]: percent }));
      });
      if (res.success && res.url) {
        const updated = [...formData.memories.items];
        updated[index] = {
          ...updated[index],
          audioSrc: res.url,
          audioTitle: file.name.replace(/\.[^/.]+$/, ''),
        };
        setFormData({
          ...formData,
          memories: { ...formData.memories, items: updated },
        });
        triggerSaveToast('تم رفع ومعالجة الصوت بنجاح!');
      } else {
        triggerSaveToast(res.error || 'فشل رفع الصوت');
      }
    } catch (err) {
      triggerSaveToast('حدث خطأ أثناء معالجة الصوت');
    } finally {
      setAudioUploadProgress((prev) => {
        const next = { ...prev };
        delete next[index];
        return next;
      });
    }
  };

  const handleRemoveMemoryAudio = async (index: number) => {
    stopAllPreviews();
    const currentAudio = formData.memories.items[index]?.audioSrc;
    if (currentAudio) {
      deleteMediaFile(currentAudio);
    }
    const updated = [...formData.memories.items];
    updated[index] = {
      ...updated[index],
      audioSrc: '',
      audioTitle: '',
    };
    setFormData({
      ...formData,
      memories: { ...formData.memories, items: updated },
    });
    triggerSaveToast('تم حذف المقطع الصوتي للذكرى');
  };

  const handleBgAudioFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Stop active preview before uploading
    stopAllPreviews();

    setBgAudioProgress(1);
    try {
      const res = await uploadAudio(file, (percent) => {
        setBgAudioProgress(percent);
      });
      if (res.success && res.url) {
        const newTrackTitle = file.name.replace(/\.[^/.]+$/, '');
        const updatedAudio = {
          ...formData.audio,
          audioSrc: res.url,
          trackTitle: newTrackTitle,
        };
        const updatedFormData = {
          ...formData,
          audio: updatedAudio,
        };
        setFormData(updatedFormData);
        setSiteData(updatedFormData);
        triggerSaveToast('تم رفع وحفظ الموسيقى الرئيسية بنجاح!');
      } else {
        triggerSaveToast(res.error || 'فشل رفع ملف الموسيقى');
      }
    } catch (err) {
      triggerSaveToast('حدث خطأ أثناء معالجة الموسيقى');
    } finally {
      setBgAudioProgress(null);
    }
  };

  const handleRemoveBgAudio = async () => {
    stopAllPreviews();
    const currentAudio = formData.audio.audioSrc;
    if (currentAudio) {
      deleteMediaFile(currentAudio);
    }
    const updatedAudio = {
      ...formData.audio,
      audioSrc: '',
      trackTitle: '',
    };
    const updatedFormData = {
      ...formData,
      audio: updatedAudio,
    };
    setFormData(updatedFormData);
    setSiteData(updatedFormData);
    triggerSaveToast('تم حذف الموسيقى الرئيسية نهائيًا');
  };

  const handlePreviewSiteClick = () => {
    stopAllPreviews();
    onPreviewSite();
  };

  const handleLockClick = () => {
    stopAllPreviews();
    onLock();
  };

  // Sync state if external reset occurs
  React.useEffect(() => {
    setFormData(siteData);
  }, [siteData]);

  const handleSave = () => {
    setSiteData(formData);
    triggerSaveToast('تم حفظ جميع التعديلات في الذاكرة بنجاح!');
  };

  const handleReset = () => {
    resetSiteData();
    setShowResetConfirm(false);
  };

  // Memory helpers
  const handleMemoryChange = (index: number, field: keyof MemoryItem, value: string) => {
    const updated = [...formData.memories.items];
    updated[index] = { ...updated[index], [field]: value };
    setFormData({
      ...formData,
      memories: { ...formData.memories, items: updated },
    });
  };

  const handleDisplayCountChange = (targetCount: number) => {
    const clamped = Math.max(1, Math.min(50, Math.round(targetCount || 1)));
    const currentItems = [...(formData.memories.items || [])];

    // If new count exceeds current items, generate new slots
    if (clamped > currentItems.length) {
      const itemsToAdd = clamped - currentItems.length;
      for (let i = 0; i < itemsToAdd; i++) {
        const newIdx = currentItems.length + 1;
        const sample = sampleImages[(newIdx - 1) % sampleImages.length];
        currentItems.push({
          id: `mem-${Date.now()}-${newIdx}`,
          title: `ذكرى ${newIdx}`,
          date: 'لحظة خاصة',
          image: sample.url,
          aspectRatio: (newIdx % 3 === 0 ? 'landscape' : newIdx % 2 === 0 ? 'square' : 'portrait') as any,
          caption: 'تفاصيل هذه الذكرى الجميلة بيننا...',
          location: 'مكان الذكرى',
        });
      }
    }

    const updatedFormData = {
      ...formData,
      memories: {
        ...formData.memories,
        displayCount: clamped,
        items: currentItems,
      },
    };

    setFormData(updatedFormData);
    setSiteData(updatedFormData);
    triggerSaveToast(`تم ضبط عدد الذكريات المعروضة إلى ${clamped} خانة`);
  };

  const handleAddMemorySlot = () => {
    const currentItems = [...(formData.memories.items || [])];
    const newIdx = currentItems.length + 1;
    const sample = sampleImages[(newIdx - 1) % sampleImages.length];
    currentItems.push({
      id: `mem-${Date.now()}-${newIdx}`,
      title: `ذكرى ${newIdx}`,
      date: 'لحظة خاصة',
      image: sample.url,
      aspectRatio: (newIdx % 3 === 0 ? 'landscape' : newIdx % 2 === 0 ? 'square' : 'portrait') as any,
      caption: 'تفاصيل هذه الذكرى الجميلة...',
      location: 'مكان الذكرى',
    });

    const newDisplayCount = Math.max(
      formData.memories.displayCount ?? currentItems.length - 1,
      currentItems.length
    );

    const updatedFormData = {
      ...formData,
      memories: {
        ...formData.memories,
        displayCount: newDisplayCount,
        items: currentItems,
      },
    };

    setFormData(updatedFormData);
    setSiteData(updatedFormData);
    triggerSaveToast('تمت إضافة خانة ذكرى جديدة بنجاح!');
  };

  const handleDeleteMemorySlot = (index: number) => {
    stopAllPreviews();
    const currentItems = [...(formData.memories.items || [])];
    const removedItem = currentItems[index];

    // Clean up media files if uploaded
    if (removedItem?.audioSrc) {
      deleteMediaFile(removedItem.audioSrc);
    }
    if (removedItem?.image) {
      deleteMediaFile(removedItem.image);
    }
    if (removedItem?.videoSrc) {
      deleteMediaFile(removedItem.videoSrc);
    }

    currentItems.splice(index, 1);
    const newDisplayCount = Math.min(
      formData.memories.displayCount ?? currentItems.length,
      Math.max(1, currentItems.length)
    );

    const updatedFormData = {
      ...formData,
      memories: {
        ...formData.memories,
        displayCount: newDisplayCount,
        items: currentItems,
      },
    };

    setFormData(updatedFormData);
    setSiteData(updatedFormData);
    triggerSaveToast('تم حذف خانة الذكرى نهائياً');
  };

  // Preset sample image library for quick selection
  const sampleImages = [
    { title: 'نجوم وسماء', url: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?q=80&w=1200&auto=format&fit=crop' },
    { title: 'ورد أحمر فاخر', url: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=1200&auto=format&fit=crop' },
    { title: 'أضواء ليلية دافئة', url: 'https://images.unsplash.com/photo-1507692049790-de58290a4334?q=80&w=1200&auto=format&fit=crop' },
    { title: 'رسائل قديمة وشموع', url: 'https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?q=80&w=1200&auto=format&fit=crop' },
    { title: 'قهوة وهدوء', url: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?q=80&w=1200&auto=format&fit=crop' },
    { title: 'أفق ساحر وغروب', url: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=1200&auto=format&fit=crop' },
    { title: 'أيادي متشابكة', url: 'https://images.unsplash.com/photo-1518199266791-5375a83190b7?q=80&w=1200&auto=format&fit=crop' },
    { title: 'قمر مضيء', url: 'https://images.unsplash.com/photo-1532693322450-2cb5c511067d?q=80&w=1200&auto=format&fit=crop' },
  ];

  // Timeline helpers
  const handleTimelineChange = (
    index: number,
    field: keyof TimelineMilestone,
    value: string | boolean
  ) => {
    const updated = [...formData.timeline.milestones];
    updated[index] = { ...updated[index], [field]: value };
    setFormData({
      ...formData,
      timeline: { ...formData.timeline, milestones: updated },
    });
  };

  const addTimelineNode = () => {
    const newNode: TimelineMilestone = {
      id: `t-${Date.now()}`,
      date: 'تاريخ جديد',
      title: 'محطة جديدة',
      description: 'أضيفي أو أضف تفاصيل هذه اللحظة المميزة هنا...',
      highlight: false,
    };
    setFormData({
      ...formData,
      timeline: {
        ...formData.timeline,
        milestones: [...formData.timeline.milestones, newNode],
      },
    });
  };

  const removeTimelineNode = (index: number) => {
    const updated = formData.timeline.milestones.filter((_, i) => i !== index);
    setFormData({
      ...formData,
      timeline: { ...formData.timeline, milestones: updated },
    });
  };

  // Paragraph helpers
  const handleParagraphChange = (index: number, value: string) => {
    const updated = [...formData.letter.paragraphs];
    updated[index] = value;
    setFormData({
      ...formData,
      letter: { ...formData.letter, paragraphs: updated },
    });
  };

  const addParagraph = () => {
    setFormData({
      ...formData,
      letter: {
        ...formData.letter,
        paragraphs: [...formData.letter.paragraphs, 'فقرة جديدة مفعمة بالمشاعر...'],
      },
    });
  };

  const handleIntroLineChange = (index: number, value: string) => {
    const lines = [...(formData.intro?.lines || [])];
    lines[index] = value;
    setFormData({
      ...formData,
      intro: {
        ...formData.intro,
        lines,
      },
    });
  };

  const addIntroLine = () => {
    const lines = [...(formData.intro?.lines || [])];
    lines.push('سطر شاعري جديد...');
    setFormData({
      ...formData,
      intro: {
        ...formData.intro,
        lines,
      },
    });
  };

  const removeIntroLine = (index: number) => {
    const lines = (formData.intro?.lines || []).filter((_, i) => i !== index);
    setFormData({
      ...formData,
      intro: {
        ...formData.intro,
        lines,
      },
    });
  };

  const removeParagraph = (index: number) => {
    const updated = formData.letter.paragraphs.filter((_, i) => i !== index);
    setFormData({
      ...formData,
      letter: { ...formData.letter, paragraphs: updated },
    });
  };

  return (
    <div className="relative min-h-screen bg-[#08080D] text-[#FFFFFF] font-sans-arabic antialiased pb-24">
      {/* Top Admin Header */}
      <header className="sticky top-0 z-50 bg-[#08080D]/95 backdrop-blur-xl border-b border-[#D7B56D]/20 px-6 py-4 shadow-2xl">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Title & Badge */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#6E1835]/40 border border-[#D7B56D]/40 flex items-center justify-center text-[#D7B56D] shadow-[0_0_15px_rgba(215,181,109,0.25)]">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold font-serif-arabic text-gold-gradient">
                  لوحة التحكم السرية (Secret CMS)
                </h1>
                <span className="text-[10px] font-display-en uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#D7B56D]/20 text-[#D7B56D] border border-[#D7B56D]/30 flex items-center gap-1">
                  <Database className="w-3 h-3" />
                  SQLITE SERVER
                </span>
              </div>
              <p className="text-xs text-[#A49CA8]/70">
                إدارة نصوص وتواريخ ووسائط الموقع فورياً مع الحفظ الدائم على السيرفر المحلي (SQLite)
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center flex-wrap gap-2.5">
            <button
              onClick={handleSave}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-[#D7B56D] to-[#B89248] text-[#08080D] font-bold text-xs hover:brightness-110 transition-all shadow-[0_0_20px_rgba(215,181,109,0.3)] cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>حفظ في السيرفر</span>
            </button>

            <button
              onClick={async () => {
                setIsBackingUp(true);
                const res = await triggerBackup();
                setIsBackingUp(false);
                if (res.success) {
                  triggerSaveToast('تم حفظ نسخة احتياطية من قاعدة البيانات بنجاح!');
                } else {
                  triggerSaveToast('فشل إنشاء النسخة الاحتياطية');
                }
              }}
              disabled={isBackingUp}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#6E1835]/40 hover:bg-[#6E1835]/70 text-[#E8A0B7] hover:text-white text-xs border border-[#D7B56D]/30 transition-all cursor-pointer shadow-sm"
              title="نسخ احتياطي فوري لقاعدة البيانات"
            >
              {isBackingUp ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-[#D7B56D]" />
              ) : (
                <DownloadCloud className="w-3.5 h-3.5 text-[#D7B56D]" />
              )}
              <span>نسخة احتياطية</span>
            </button>

            <button
              onClick={handlePreviewSiteClick}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#6E1835] hover:bg-[#8B2245] text-[#FFFFFF] font-medium text-xs border border-[#D7B56D]/30 transition-all cursor-pointer shadow-sm"
            >
              <Eye className="w-4 h-4 text-[#D7B56D]" />
              <span>معاينة الموقع كزائر</span>
            </button>

            <button
              onClick={() => setShowResetConfirm(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-[#A49CA8] hover:text-[#E8A0B7] text-xs border border-white/10 transition-all cursor-pointer"
              title="استعادة الإعدادات الأصلية"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>استعادة</span>
            </button>

            <button
              onClick={handleLockClick}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-[#A49CA8] hover:text-[#FFFFFF] text-xs border border-white/10 transition-all cursor-pointer"
              title="قفل لوحة التحكم"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>قفل</span>
            </button>
          </div>
        </div>
      </header>

      {/* Floating Save Toast */}
      <AnimatePresence>
        {saveStatus && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-20 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2.5 px-6 py-3 rounded-2xl bg-[#08080D]/95 border border-[#D7B56D] text-[#D7B56D] shadow-[0_10px_40px_rgba(0,0,0,0.8)] backdrop-blur-xl"
          >
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            <span className="text-sm font-medium">{saveStatus}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-8 border-b border-white/10 no-scrollbar">
          {[
            { id: 'intro', label: '1. شاشة البداية والختم السينمائي', icon: Sparkles },
            { id: 'hero', label: '2. الهيرو والأسماء', icon: Heart },
            { id: 'counter', label: '3. العداد وتاريخ البداية', icon: Calendar },
            { id: 'arrival', label: '4. يوم الإشراق (الوصول)', icon: Clock },
            { id: 'gallery', label: '5. معرض الذكريات والوسائط', icon: ImageIcon },
            { id: 'timeline', label: '6. محطات حكايتنا', icon: Layers },
            { id: 'letter', label: '7. رسالة من القلب', icon: BookOpen },
            { id: 'security', label: '8. كلمات السر والأمان والصوت', icon: Settings },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabType)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium text-xs transition-all whitespace-nowrap cursor-pointer ${
                  active
                    ? 'bg-gradient-to-r from-[#6E1835] to-[#8B2245] text-[#FFFFFF] border border-[#D7B56D]/50 shadow-[0_0_20px_rgba(110,24,53,0.4)]'
                    : 'bg-white/[0.02] text-[#A49CA8] border border-white/5 hover:border-white/20 hover:text-[#FFFFFF]'
                }`}
              >
                <Icon className={`w-4 h-4 ${active ? 'text-[#D7B56D]' : ''}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab 0: Cinematic Intro & Wax Seal */}
        {activeTab === 'intro' && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6 max-w-4xl"
          >
            {/* 1. Intro Poetic Lines */}
            <div className="p-6 md:p-8 rounded-2xl bg-white/[0.02] border border-white/10 shadow-xl space-y-6">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <h2 className="text-xl font-serif-arabic text-gold-gradient font-bold flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-[#D7B56D]" />
                  <span>الأسطر الشعرية المتتابعة لشاشة الدخول (Cinematic Lines)</span>
                </h2>
                <button
                  type="button"
                  onClick={addIntroLine}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#6E1835] hover:bg-[#8B2245] text-white text-xs font-bold border border-[#D7B56D]/40 transition-all cursor-pointer shadow-md"
                >
                  <Plus className="w-3.5 h-3.5 text-[#D7B56D]" />
                  <span>إضافة سطر جديد</span>
                </button>
              </div>

              <p className="text-xs text-[#A49CA8] leading-relaxed">
                هذه النصوص تظهر بتسلسل سينمائي هادئ مع كل نبضة ووهج بعد شاشة الباسورد لتأخذ الزائر في رحلة رومانسية ساحرة.
              </p>

              <div className="space-y-4">
                {(formData.intro?.lines || []).map((line, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-xl bg-white/[0.02] border border-white/5 space-y-2 hover:border-[#D7B56D]/30 transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[#D7B56D]">
                        السطر {idx + 1} {idx === 0 ? '(الافتتاحية - مثل: إلى ليالي...)' : ''}
                      </span>
                      {(formData.intro?.lines || []).length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeIntroLine(idx)}
                          className="text-red-400 hover:text-red-300 text-xs flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>حذف السطر</span>
                        </button>
                      )}
                    </div>
                    <input
                      type="text"
                      value={line}
                      onChange={(e) => handleIntroLineChange(idx, e.target.value)}
                      placeholder={`أدخل نص السطر ${idx + 1}...`}
                      className="w-full px-4 py-2.5 rounded-xl bg-[#08080D] border border-white/10 text-white text-sm focus:border-[#D7B56D] outline-none"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* 2. Wax Seal & Monogram Settings */}
            <div className="p-6 md:p-8 rounded-2xl bg-white/[0.02] border border-white/10 shadow-xl space-y-6">
              <h2 className="text-xl font-serif-arabic text-gold-gradient font-bold flex items-center gap-2">
                <Shield className="w-5 h-5 text-[#D7B56D]" />
                <span>إعدادات الختم الملكي الشمعي (Wax Seal & Monogram)</span>
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs text-[#A49CA8] mb-2 font-medium">
                    الحروف البارزة داخل الختم (Monogram Initials)
                  </label>
                  <input
                    type="text"
                    value={formData.intro?.monogramText ?? 'H & L'}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        intro: { ...formData.intro, monogramText: e.target.value },
                      })
                    }
                    placeholder="H & L"
                    className="w-full px-4 py-2.5 rounded-xl bg-[#08080D] border border-white/10 text-white font-mono font-bold text-center text-lg focus:border-[#D7B56D] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs text-[#A49CA8] mb-2 font-medium">
                    الكلمة السفلية للختم (Monogram Subtext)
                  </label>
                  <input
                    type="text"
                    value={formData.intro?.monogramSubtext ?? 'FOREVER'}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        intro: { ...formData.intro, monogramSubtext: e.target.value },
                      })
                    }
                    placeholder="FOREVER"
                    className="w-full px-4 py-2.5 rounded-xl bg-[#08080D] border border-white/10 text-white font-mono font-bold text-center text-sm focus:border-[#D7B56D] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs text-[#A49CA8] mb-2 font-medium">
                    شارة الختم العلوية (Seal Badge Text)
                  </label>
                  <input
                    type="text"
                    value={formData.intro?.badgeText ?? 'ختم العشق الأبدي'}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        intro: { ...formData.intro, badgeText: e.target.value },
                      })
                    }
                    placeholder="ختم العشق الأبدي"
                    className="w-full px-4 py-2.5 rounded-xl bg-[#08080D] border border-white/10 text-white text-sm focus:border-[#D7B56D] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs text-[#A49CA8] mb-2 font-medium">
                    عنوان مرحلة الختم والضغط (Stamping Title)
                  </label>
                  <input
                    type="text"
                    value={formData.intro?.stampingTitle ?? 'رسالة خاصة واستثنائية'}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        intro: { ...formData.intro, stampingTitle: e.target.value },
                      })
                    }
                    placeholder="رسالة خاصة واستثنائية"
                    className="w-full px-4 py-2.5 rounded-xl bg-[#08080D] border border-white/10 text-white text-sm focus:border-[#D7B56D] outline-none"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs text-[#A49CA8] mb-2 font-medium">
                    النص الفرعي لمرحلة الختم (Stamping Subtitle)
                  </label>
                  <input
                    type="text"
                    value={formData.intro?.stampingSubtitle ?? 'خُتِمت بكل تفاصيلها من أجلكِ'}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        intro: { ...formData.intro, stampingSubtitle: e.target.value },
                      })
                    }
                    placeholder="خُتِمت بكل تفاصيلها من أجلكِ"
                    className="w-full px-4 py-2.5 rounded-xl bg-[#08080D] border border-white/10 text-white text-sm focus:border-[#D7B56D] outline-none"
                  />
                </div>
              </div>
            </div>

            {/* 3. Entrance Button & Portal Ready Text */}
            <div className="p-6 md:p-8 rounded-2xl bg-white/[0.02] border border-white/10 shadow-xl space-y-6">
              <h2 className="text-xl font-serif-arabic text-gold-gradient font-bold flex items-center gap-2">
                <Heart className="w-5 h-5 text-[#D7B56D]" />
                <span>زر الدخول ونهاية الشاشة السينمائية (CTA & Portal Ready)</span>
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs text-[#A49CA8] mb-2 font-medium">
                    عنوان الترحيب النهائي (Welcome Title)
                  </label>
                  <input
                    type="text"
                    value={formData.intro?.welcomeTitle ?? 'مرحباً بكِ في عالمنا'}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        intro: { ...formData.intro, welcomeTitle: e.target.value },
                      })
                    }
                    placeholder="مرحباً بكِ في عالمنا"
                    className="w-full px-4 py-2.5 rounded-xl bg-[#08080D] border border-white/10 text-white text-sm focus:border-[#D7B56D] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs text-[#A49CA8] mb-2 font-medium">
                    نص زر الدخول إلى الموقع (Enter Button Text)
                  </label>
                  <input
                    type="text"
                    value={formData.intro?.buttonText ?? 'ادخلي إلى عالمنا'}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        intro: { ...formData.intro, buttonText: e.target.value },
                      })
                    }
                    placeholder="ادخلي إلى عالمنا"
                    className="w-full px-4 py-2.5 rounded-xl bg-[#08080D] border border-white/10 text-white font-bold text-sm focus:border-[#D7B56D] outline-none"
                  />
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Tab 1: Hero & Names */}
        {activeTab === 'hero' && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6 max-w-4xl"
          >
            <div className="p-6 md:p-8 rounded-2xl bg-white/[0.02] border border-white/10 shadow-xl space-y-6">
              <h2 className="text-xl font-serif-arabic text-gold-gradient font-bold flex items-center gap-2">
                <Heart className="w-5 h-5 text-[#D7B56D]" />
                <span>بيانات الاسم وقسم البداية (Hero Section)</span>
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs text-[#A49CA8] mb-2 font-medium">
                    اسم الحبيبة (المستلمة بالعربية)
                  </label>
                  <input
                    type="text"
                    value={formData.recipient.name}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        recipient: { ...formData.recipient, name: e.target.value },
                      })
                    }
                    className="w-full px-4 py-3 rounded-xl bg-[#08080D] border border-white/10 focus:border-[#D7B56D] text-lg font-bold font-serif-arabic text-[#FFFFFF] outline-none transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs text-[#A49CA8] mb-2 font-medium">
                    اسم الحبيبة بالإنجليزية (English Subtitle)
                  </label>
                  <input
                    type="text"
                    value={formData.recipient.englishName}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        recipient: { ...formData.recipient, englishName: e.target.value },
                      })
                    }
                    className="w-full px-4 py-3 rounded-xl bg-[#08080D] border border-white/10 focus:border-[#D7B56D] text-base font-display-en text-[#D7B56D] outline-none transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs text-[#A49CA8] mb-2 font-medium">
                    اسم المرسل (بالعربية)
                  </label>
                  <input
                    type="text"
                    value={formData.sender.name}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        sender: { ...formData.sender, name: e.target.value },
                      })
                    }
                    className="w-full px-4 py-3 rounded-xl bg-[#08080D] border border-white/10 focus:border-[#D7B56D] text-base text-[#FFFFFF] outline-none transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs text-[#A49CA8] mb-2 font-medium">
                    توقيع الرسالة
                  </label>
                  <input
                    type="text"
                    value={formData.sender.signature}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        sender: { ...formData.sender, signature: e.target.value },
                      })
                    }
                    className="w-full px-4 py-3 rounded-xl bg-[#08080D] border border-white/10 focus:border-[#D7B56D] text-base text-[#D7B56D] outline-none transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-[#A49CA8] mb-2 font-medium">
                  السطر التعبيري في الهيرو (Hero Subtitle)
                </label>
                <textarea
                  rows={2}
                  value={formData.relationship.heroSubtitle}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      relationship: {
                        ...formData.relationship,
                        heroSubtitle: e.target.value,
                      },
                    })
                  }
                  className="w-full px-4 py-3 rounded-xl bg-[#08080D] border border-white/10 focus:border-[#D7B56D] text-base text-[#FFFFFF] outline-none transition-colors leading-relaxed"
                />
              </div>
            </div>
          </motion.div>
        )}

        {/* Tab 2: Relationship Counter */}
        {activeTab === 'counter' && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6 max-w-4xl"
          >
            <div className="p-6 md:p-8 rounded-2xl bg-white/[0.02] border border-white/10 shadow-xl space-y-6">
              <h2 className="text-xl font-serif-arabic text-gold-gradient font-bold flex items-center gap-2">
                <Calendar className="w-5 h-5 text-[#D7B56D]" />
                <span>تاريخ بداية العلاقة والعداد اللحظي</span>
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs text-[#A49CA8] mb-2 font-medium">
                    تاريخ ووقت البداية (ISO Date string: YYYY-MM-DDTHH:mm:ss)
                  </label>
                  <input
                    type="text"
                    value={formData.relationship.startDate}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        relationship: {
                          ...formData.relationship,
                          startDate: e.target.value,
                        },
                      })
                    }
                    placeholder="2026-08-16T00:00:00"
                    className="w-full px-4 py-3 rounded-xl bg-[#08080D] border border-white/10 focus:border-[#D7B56D] text-base font-display-en text-[#D7B56D] outline-none transition-colors"
                  />
                  <span className="text-[11px] text-[#A49CA8]/60 mt-1 block">
                    يُحسب العداد اللحظي بناءً على هذا التاريخ بدقة الثواني.
                  </span>
                </div>

                <div>
                  <label className="block text-xs text-[#A49CA8] mb-2 font-medium">
                    النص المعروض لتاريخ البداية (Display Text)
                  </label>
                  <input
                    type="text"
                    value={formData.relationship.startDateDisplay}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        relationship: {
                          ...formData.relationship,
                          startDateDisplay: e.target.value,
                        },
                      })
                    }
                    placeholder="16 أغسطس 2026"
                    className="w-full px-4 py-3 rounded-xl bg-[#08080D] border border-white/10 focus:border-[#D7B56D] text-base text-[#FFFFFF] outline-none transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-[#A49CA8] mb-2 font-medium">
                  عنوان قسم العداد
                </label>
                <input
                  type="text"
                  value={formData.relationship.counterTitle}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      relationship: {
                        ...formData.relationship,
                        counterTitle: e.target.value,
                      },
                    })
                  }
                  className="w-full px-4 py-3 rounded-xl bg-[#08080D] border border-white/10 focus:border-[#D7B56D] text-base text-[#FFFFFF] outline-none transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs text-[#A49CA8] mb-2 font-medium">
                  العبارة أسفل العداد
                </label>
                <input
                  type="text"
                  value={formData.relationship.counterSubtitle}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      relationship: {
                        ...formData.relationship,
                        counterSubtitle: e.target.value,
                      },
                    })
                  }
                  className="w-full px-4 py-3 rounded-xl bg-[#08080D] border border-white/10 focus:border-[#D7B56D] text-base text-[#FFFFFF] outline-none transition-colors"
                />
              </div>
            </div>
          </motion.div>
        )}

        {/* Tab 3: The Arrival Section */}
        {activeTab === 'arrival' && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6 max-w-4xl"
          >
            <div className="p-6 md:p-8 rounded-2xl bg-white/[0.02] border border-white/10 shadow-xl space-y-6">
              <h2 className="text-xl font-serif-arabic text-gold-gradient font-bold flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-[#D7B56D]" />
                <span>قسم يوم الإشراق / الحضور (The Arrival Section)</span>
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs text-[#A49CA8] mb-2 font-medium">
                    عنوان القسم
                  </label>
                  <input
                    type="text"
                    value={formData.recipient.arrivalTitle}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        recipient: {
                          ...formData.recipient,
                          arrivalTitle: e.target.value,
                        },
                      })
                    }
                    placeholder="يوم أشرقت فيه حياتي"
                    className="w-full px-4 py-3 rounded-xl bg-[#08080D] border border-white/10 focus:border-[#D7B56D] text-base text-[#FFFFFF] outline-none transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs text-[#A49CA8] mb-2 font-medium">
                    التاريخ المميز المعروض (Display Format)
                  </label>
                  <input
                    type="text"
                    value={formData.recipient.arrivalDisplay}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        recipient: {
                          ...formData.recipient,
                          arrivalDisplay: e.target.value,
                        },
                      })
                    }
                    placeholder="22 / 06 / 2008"
                    className="w-full px-4 py-3 rounded-xl bg-[#08080D] border border-white/10 focus:border-[#D7B56D] text-base font-display-en text-[#D7B56D] outline-none transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-[#A49CA8] mb-2 font-medium">
                  النص العاطفي المكتوب
                </label>
                <textarea
                  rows={4}
                  value={formData.recipient.arrivalNote}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      recipient: {
                        ...formData.recipient,
                        arrivalNote: e.target.value,
                      },
                    })
                  }
                  className="w-full px-4 py-3 rounded-xl bg-[#08080D] border border-white/10 focus:border-[#D7B56D] text-base text-[#FFFFFF] outline-none transition-colors leading-relaxed"
                />
              </div>
            </div>
          </motion.div>
        )}

        {/* Tab 4: Memories Gallery */}
        {activeTab === 'gallery' && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Gallery Info & Dynamic Count Controls */}
            <div className="p-6 rounded-2xl bg-gradient-to-r from-[#6E1835]/30 via-white/[0.02] to-[#08080D] border border-[#D7B56D]/30 space-y-5">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div>
                  <h3 className="text-base font-serif-arabic font-bold text-white flex items-center gap-2">
                    <ImageIcon className="w-5 h-5 text-[#D7B56D]" />
                    <span>التحكم في عدد خانات الذكريات / الصور المعروضة</span>
                  </h3>
                  <p className="text-xs text-[#A49CA8] mt-1">
                    حدد عدد الخانات التي تظهر للزائر في المعرض. عند تقليل العدد، يتم الاحتفاظ ببيانات الصور بأمان ولا تُحذف.
                  </p>
                </div>

                {/* Counter Stepper */}
                <div className="flex items-center gap-3 self-start lg:self-center">
                  <span className="text-xs font-medium text-[#D7B56D]">العدد الظاهر:</span>
                  <div className="flex items-center bg-[#08080D] border border-[#D7B56D]/40 rounded-xl p-1 shadow-inner">
                    <button
                      type="button"
                      onClick={() =>
                        handleDisplayCountChange(
                          (formData.memories.displayCount ?? formData.memories.items.length) - 1
                        )
                      }
                      className="w-8 h-8 rounded-lg bg-white/[0.05] hover:bg-[#6E1835] text-white flex items-center justify-center font-bold text-sm transition-colors cursor-pointer"
                      title="تقليل خانة واحدة"
                    >
                      -
                    </button>
                    <input
                      type="number"
                      min={1}
                      max={50}
                      value={formData.memories.displayCount ?? formData.memories.items.length}
                      onChange={(e) => handleDisplayCountChange(parseInt(e.target.value) || 1)}
                      className="w-12 text-center bg-transparent text-white font-bold text-sm outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        handleDisplayCountChange(
                          (formData.memories.displayCount ?? formData.memories.items.length) + 1
                        )
                      }
                      className="w-8 h-8 rounded-lg bg-white/[0.05] hover:bg-[#6E1835] text-white flex items-center justify-center font-bold text-sm transition-colors cursor-pointer"
                      title="زيادة خانة واحدة"
                    >
                      +
                    </button>
                  </div>

                  {/* Add Slot Button */}
                  <button
                    type="button"
                    onClick={handleAddMemorySlot}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#6E1835] hover:bg-[#8B2245] text-white text-xs font-bold border border-[#D7B56D]/40 transition-all cursor-pointer shadow-md"
                  >
                    <Plus className="w-4 h-4 text-[#D7B56D]" />
                    <span>إضافة خانة جديدة</span>
                  </button>
                </div>
              </div>

              {/* Quick Preset Buttons */}
              <div className="flex items-center gap-2 flex-wrap pt-2 border-t border-white/5">
                <span className="text-xs text-[#A49CA8]">اختيار سريع للعدد:</span>
                {[4, 6, 8, 10, 12, 16].map((cnt) => {
                  const currentCount =
                    formData.memories.displayCount ?? formData.memories.items.length;
                  const isSelected = currentCount === cnt;
                  return (
                    <button
                      key={cnt}
                      type="button"
                      onClick={() => handleDisplayCountChange(cnt)}
                      className={`px-3 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-[#D7B56D] text-[#08080D] font-bold shadow-md'
                          : 'bg-white/[0.04] text-[#A49CA8] hover:text-white hover:bg-white/[0.08] border border-white/10'
                      }`}
                    >
                      {cnt} صور
                    </button>
                  );
                })}

                <span className="mr-auto text-[11px] text-[#D7B56D]/80">
                  إجمالي الخانات المخزنة: {formData.memories.items.length} (المعروض: {formData.memories.displayCount ?? formData.memories.items.length})
                </span>
              </div>
            </div>

            {/* Gallery Title Settings */}
            <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/10 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-[#A49CA8] mb-2 font-medium">
                  عنوان المعرض
                </label>
                <input
                  type="text"
                  value={formData.memories.title}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      memories: { ...formData.memories, title: e.target.value },
                    })
                  }
                  className="w-full px-4 py-2.5 rounded-xl bg-[#08080D] border border-white/10 focus:border-[#D7B56D] text-sm text-[#FFFFFF] outline-none"
                />
              </div>
              <div>
                <label className="block text-xs text-[#A49CA8] mb-2 font-medium">
                  الوصف الفرعي للمعرض
                </label>
                <input
                  type="text"
                  value={formData.memories.subtitle}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      memories: { ...formData.memories, subtitle: e.target.value },
                    })
                  }
                  className="w-full px-4 py-2.5 rounded-xl bg-[#08080D] border border-white/10 focus:border-[#D7B56D] text-sm text-[#FFFFFF] outline-none"
                />
              </div>
            </div>

            {/* The Gallery Items */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {formData.memories.items.map((item, idx) => {
                const activeCount =
                  formData.memories.displayCount ?? formData.memories.items.length;
                const isVisibleInGallery = idx < activeCount;

                return (
                  <div
                    key={item.id || idx}
                    className={`p-5 rounded-2xl transition-all flex flex-col justify-between space-y-4 ${
                      isVisibleInGallery
                        ? 'bg-white/[0.02] border border-white/10 hover:border-[#D7B56D]/40'
                        : 'bg-black/40 border border-dashed border-white/10 opacity-75 hover:opacity-100'
                    }`}
                  >
                    <div className="space-y-4">
                      {/* Header with index badge & Visibility Status */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-display-en uppercase tracking-wider text-[#D7B56D] font-bold">
                            صورة رقم {idx + 1}
                          </span>
                          {isVisibleInGallery ? (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
                              ظاهرة بالمعرض
                            </span>
                          ) : (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-[#A49CA8] border border-white/10 font-medium">
                              مخفية (محفوظة)
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-[#A49CA8]/60 uppercase">
                            {item.aspectRatio}
                          </span>
                          {formData.memories.items.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleDeleteMemorySlot(idx)}
                              className="text-red-400/70 hover:text-red-300 transition-colors p-1"
                              title="حذف هذه الخانة نهائياً"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Media Type Switcher & Aspect Ratio */}
                      <div className="flex items-center justify-between gap-2 p-1.5 rounded-xl bg-black/40 border border-white/10">
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => {
                              handleMemoryChange(idx, 'mediaType', 'image');
                            }}
                            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-sans-arabic transition-all cursor-pointer ${
                              item.mediaType !== 'video'
                                ? 'bg-[#6E1835] text-white font-bold shadow'
                                : 'text-[#A49CA8] hover:text-white'
                            }`}
                          >
                            <ImageIcon className="w-3.5 h-3.5" />
                            <span>صورة</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              handleMemoryChange(idx, 'mediaType', 'video');
                            }}
                            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-sans-arabic transition-all cursor-pointer ${
                              item.mediaType === 'video'
                                ? 'bg-[#6E1835] text-[#D7B56D] font-bold shadow'
                                : 'text-[#A49CA8] hover:text-white'
                            }`}
                          >
                            <Film className="w-3.5 h-3.5" />
                            <span>فيديو</span>
                          </button>
                        </div>

                        {/* Aspect Ratio Selector */}
                        <select
                          value={item.aspectRatio || 'square'}
                          onChange={(e) => handleMemoryChange(idx, 'aspectRatio', e.target.value as any)}
                          className="bg-[#08080D] text-[11px] text-[#D7B56D] px-2 py-1 rounded-lg border border-white/10 outline-none"
                        >
                          <option value="square">مربع (Square)</option>
                          <option value="portrait">طولي (Portrait)</option>
                          <option value="landscape">عرضي (Landscape)</option>
                        </select>
                      </div>

                      {/* Visual Preview Box (Image or Video) */}
                      <div className="relative h-44 w-full rounded-xl overflow-hidden bg-[#08080D] border border-white/10 group">
                        {item.mediaType === 'video' && item.videoSrc ? (
                          <video
                            src={item.videoSrc}
                            poster={item.image}
                            controls={false}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <img
                            src={item.image}
                            alt={item.title}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                            referrerPolicy="no-referrer"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = sampleImages[0].url;
                            }}
                          />
                        )}

                        <div className="absolute inset-0 bg-gradient-to-t from-[#08080D] via-transparent to-transparent opacity-60 pointer-events-none" />

                        {item.mediaType === 'video' && (
                          <div className="absolute top-2 left-2 z-10 px-2 py-0.5 rounded-full bg-[#6E1835]/90 border border-[#D7B56D]/40 text-[10px] font-sans-arabic text-[#D7B56D] flex items-center gap-1">
                            <Film className="w-3 h-3" />
                            <span>فيديو</span>
                          </div>
                        )}

                        <div className="absolute bottom-2 right-2 text-xs font-bold text-white drop-shadow z-10">
                          {item.title}
                        </div>

                        {/* Quick Overlay Upload Button */}
                        {item.mediaType === 'video' ? (
                          <label className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center cursor-pointer text-white text-xs gap-1.5 backdrop-blur-[2px] z-20">
                            <Video className="w-5 h-5 text-[#D7B56D]" />
                            <span className="font-bold">رفع فيديو من جهازك</span>
                            <input
                              type="file"
                              accept="video/mp4,video/webm,video/quicktime"
                              onChange={(e) => handleVideoFileUpload(idx, e)}
                              className="hidden"
                            />
                          </label>
                        ) : (
                          <label className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center cursor-pointer text-white text-xs gap-1.5 backdrop-blur-[2px] z-20">
                            <Upload className="w-5 h-5 text-[#D7B56D]" />
                            <span className="font-bold">رفع صورة من الجهاز</span>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => handleImageFileUpload(idx, e)}
                              className="hidden"
                            />
                          </label>
                        )}
                      </div>

                      {/* Video Upload Progress Bar */}
                      {videoUploadProgress[idx] !== undefined && (
                        <div className="space-y-1">
                          <div className="flex justify-between text-[10px] text-[#D7B56D]">
                            <span className="flex items-center gap-1">
                              <Loader2 className="w-3 h-3 animate-spin text-[#D7B56D]" />
                              جاري رفع ملف الفيديو...
                            </span>
                            <span>{videoUploadProgress[idx]}%</span>
                          </div>
                          <div className="w-full bg-white/10 rounded-full h-1.5 overflow-hidden">
                            <div
                              className="bg-[#D7B56D] h-full transition-all duration-300"
                              style={{ width: `${videoUploadProgress[idx]}%` }}
                            />
                          </div>
                        </div>
                      )}

                      {/* Dedicated Upload Button Depending on Media Type */}
                      {item.mediaType === 'video' ? (
                        <div className="space-y-2">
                          <label className="flex items-center justify-center gap-2 w-full py-2 px-3 rounded-lg bg-[#6E1835]/40 hover:bg-[#6E1835]/70 text-xs font-bold text-[#D7B56D] border border-[#D7B56D]/40 transition-all cursor-pointer">
                            <Film className="w-3.5 h-3.5 text-[#D7B56D]" />
                            <span>اختيار فيديو من جهازك (MP4 / WebM)</span>
                            <input
                              type="file"
                              accept="video/mp4,video/webm,video/quicktime"
                              onChange={(e) => handleVideoFileUpload(idx, e)}
                              className="hidden"
                            />
                          </label>
                          {item.videoSrc && (
                            <div className="flex items-center justify-between text-[10px] text-[#A49CA8] bg-black/40 px-2.5 py-1.5 rounded-lg border border-white/5">
                              <span className="truncate max-w-[200px] dir-ltr text-left font-mono">{item.videoSrc}</span>
                              <button
                                type="button"
                                onClick={() => handleRemoveMemoryVideo(idx)}
                                className="text-red-400 hover:text-red-300 font-sans-arabic cursor-pointer shrink-0 mr-2"
                              >
                                إزالة الفيديو
                              </button>
                            </div>
                          )}
                        </div>
                      ) : (
                        <label className="flex items-center justify-center gap-2 w-full py-2 px-3 rounded-lg bg-[#6E1835]/30 hover:bg-[#6E1835]/60 text-xs font-bold text-[#E8A0B7] border border-[#E8A0B7]/30 transition-all cursor-pointer">
                          <Upload className="w-3.5 h-3.5 text-[#D7B56D]" />
                          <span>اختيار صورة من جهازك</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleImageFileUpload(idx, e)}
                            className="hidden"
                          />
                        </label>
                      )}

                      {/* Title */}
                      <div>
                        <label className="block text-[11px] text-[#A49CA8] mb-1">
                          عنوان الذكرى
                        </label>
                        <input
                          type="text"
                          value={item.title}
                          onChange={(e) => handleMemoryChange(idx, 'title', e.target.value)}
                          className="w-full px-3 py-2 rounded-lg bg-[#08080D] border border-white/10 text-xs text-white outline-none focus:border-[#D7B56D]"
                        />
                      </div>

                      {/* Date / Tag */}
                      <div>
                        <label className="block text-[11px] text-[#A49CA8] mb-1">
                          التاريخ أو المناسبة
                        </label>
                        <input
                          type="text"
                          value={item.date}
                          onChange={(e) => handleMemoryChange(idx, 'date', e.target.value)}
                          className="w-full px-3 py-2 rounded-lg bg-[#08080D] border border-white/10 text-xs text-white outline-none focus:border-[#D7B56D]"
                        />
                      </div>

                      {/* Image / Poster URL */}
                      <div>
                        <label className="block text-[11px] text-[#A49CA8] mb-1">
                          {item.mediaType === 'video' ? 'صورة الغلاف / البوستر (Poster Image)' : 'رابط الصورة (أو المسار المرفوع)'}
                        </label>
                        <input
                          type="text"
                          value={item.image}
                          onChange={(e) => handleMemoryChange(idx, 'image', e.target.value)}
                          className="w-full px-3 py-2 rounded-lg bg-[#08080D] border border-white/10 text-[11px] text-[#D7B56D] font-mono outline-none focus:border-[#D7B56D]"
                        />
                      </div>

                      {/* Video URL if video */}
                      {item.mediaType === 'video' && (
                        <div>
                          <label className="block text-[11px] text-[#A49CA8] mb-1">
                            رابط ملف الفيديو (Direct Video URL)
                          </label>
                          <input
                            type="text"
                            value={item.videoSrc || ''}
                            onChange={(e) => handleMemoryChange(idx, 'videoSrc', e.target.value)}
                            placeholder="/uploads/video-xxxx.mp4 أو رابط خارجي"
                            className="w-full px-3 py-2 rounded-lg bg-[#08080D] border border-white/10 text-[11px] text-[#D7B56D] font-mono outline-none focus:border-[#D7B56D]"
                          />
                        </div>
                      )}

                      {/* Caption */}
                      <div>
                        <label className="block text-[11px] text-[#A49CA8] mb-1">
                          الشرح والوصف الرومانسي
                        </label>
                        <textarea
                          rows={2}
                          value={item.caption}
                          onChange={(e) => handleMemoryChange(idx, 'caption', e.target.value)}
                          className="w-full px-3 py-2 rounded-lg bg-[#08080D] border border-white/10 text-xs text-white outline-none focus:border-[#D7B56D]"
                        />
                      </div>

                      {/* MEMORY-SPECIFIC AUDIO SECTION (For non-video items) */}
                      {item.mediaType !== 'video' && (
                        <div className="p-3.5 rounded-xl bg-[#08080D]/70 border border-[#D7B56D]/20 space-y-2.5">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold text-[#D7B56D] flex items-center gap-1.5">
                              <Music className="w-3.5 h-3.5 text-[#D7B56D]" />
                              <span>الصوت الخاص بالصورة (يعمل عند فتحها):</span>
                            </span>
                            {item.audioSrc && (
                              <button
                                type="button"
                                onClick={() => handleRemoveMemoryAudio(idx)}
                                className="text-[10px] text-red-400/80 hover:text-red-300 flex items-center gap-1 cursor-pointer"
                              >
                                <Trash2 className="w-3 h-3" />
                                <span>حذف الصوت</span>
                              </button>
                            )}
                          </div>

                          {/* If audio exists */}
                          {item.audioSrc ? (
                            <div className="space-y-2">
                              <div className="flex items-center justify-between gap-2 p-2 rounded-lg bg-white/[0.03] border border-white/5">
                                <button
                                  type="button"
                                  onClick={() => togglePreviewAudio(`mem-${idx}`, item.audioSrc!)}
                                  className="w-7 h-7 rounded-full bg-[#6E1835] text-[#D7B56D] flex items-center justify-center cursor-pointer hover:scale-105 transition-transform shrink-0"
                                  title="استماع للتجربة"
                                >
                                  {activePreviewId === `mem-${idx}` ? (
                                    <Pause className="w-3.5 h-3.5" />
                                  ) : (
                                    <Play className="w-3.5 h-3.5 translate-x-0.5" />
                                  )}
                                </button>
                                <div className="flex-1 truncate text-right">
                                  <span className="text-[11px] text-white truncate block">
                                    {item.audioTitle || 'ملف صوتي مرفوع'}
                                  </span>
                                  <span className="text-[9px] text-[#A49CA8] font-mono truncate block">
                                    {item.audioSrc}
                                  </span>
                                </div>
                              </div>

                              {/* Re-upload audio option */}
                              <label className="block text-center text-[10px] text-[#D7B56D] hover:underline cursor-pointer">
                                استبدال الملف الصوتي
                                <input
                                  type="file"
                                  accept="audio/*"
                                  onChange={(e) => handleAudioFileUpload(idx, e)}
                                  className="hidden"
                                />
                              </label>
                            </div>
                          ) : (
                            /* Upload New Audio */
                            <div className="space-y-2">
                              <label className="flex items-center justify-center gap-2 w-full py-2 px-3 rounded-lg bg-white/[0.04] hover:bg-[#6E1835]/30 text-xs text-[#FFFFFF] border border-white/10 hover:border-[#D7B56D]/40 transition-all cursor-pointer">
                                <Upload className="w-3.5 h-3.5 text-[#D7B56D]" />
                                <span>رفع تسجيل/صوت لهذه الذكرى</span>
                                <input
                                  type="file"
                                  accept="audio/*"
                                  onChange={(e) => handleAudioFileUpload(idx, e)}
                                  className="hidden"
                                />
                              </label>
                              <p className="text-[9px] text-[#A49CA8]/70 text-center">
                                يقبل MP3, WAV, M4A, AAC ويتم تحويله تلقائيًا
                              </p>
                            </div>
                          )}

                          {/* Audio Upload Progress */}
                          {audioUploadProgress[idx] !== undefined && (
                            <div className="space-y-1 pt-1">
                              <div className="flex justify-between text-[10px] text-[#E8A0B7]">
                                <span className="flex items-center gap-1">
                                  <Loader2 className="w-3 h-3 animate-spin text-[#D7B56D]" />
                                  جاري رفع ومعالجة وتحويل الصوت...
                                </span>
                                <span>{audioUploadProgress[idx]}%</span>
                              </div>
                              <div className="w-full bg-white/10 rounded-full h-1.5 overflow-hidden">
                                <div
                                  className="bg-[#E8A0B7] h-full transition-all duration-300"
                                  style={{ width: `${audioUploadProgress[idx]}%` }}
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                  </div>

                  {/* Preset quick selection picker */}
                  <div className="pt-2 border-t border-white/5">
                    <span className="text-[10px] text-[#A49CA8]/60 block mb-1.5">
                      اختيار سريع لصورة بديلة:
                    </span>
                    <div className="flex gap-1.5 flex-wrap">
                      {sampleImages.slice(0, 4).map((sample, sIdx) => (
                        <button
                          key={sIdx}
                          type="button"
                          onClick={() => handleMemoryChange(idx, 'image', sample.url)}
                          className="text-[10px] px-2 py-0.5 rounded bg-white/[0.04] hover:bg-[#6E1835]/40 text-[#D7B56D] border border-white/5 cursor-pointer"
                        >
                          {sample.title}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}

        {/* Tab 5: Story Timeline */}
        {activeTab === 'timeline' && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6 max-w-4xl"
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-serif-arabic text-gold-gradient font-bold">
                  محطات حكايتنا (Story Timeline Nodes)
                </h2>
                <p className="text-xs text-[#A49CA8]">
                  أضف وعدّل اللحظات والمواقف الفارقة التي شكلت حكايتكم
                </p>
              </div>
              <button
                onClick={addTimelineNode}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#6E1835] hover:bg-[#8B2245] text-white text-xs font-bold border border-[#D7B56D]/30 transition-all cursor-pointer shadow-md"
              >
                <Plus className="w-4 h-4 text-[#D7B56D]" />
                <span>إضافة محطة جديدة</span>
              </button>
            </div>

            <div className="space-y-4">
              {formData.timeline.milestones.map((node, idx) => (
                <div
                  key={node.id || idx}
                  className="p-6 rounded-2xl bg-white/[0.02] border border-white/10 space-y-4 relative group"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#D7B56D] font-serif-arabic">
                      محطة #{idx + 1}
                    </span>
                    <button
                      onClick={() => removeTimelineNode(idx)}
                      className="text-[#E8A0B7]/60 hover:text-red-400 p-1.5 rounded-lg hover:bg-red-500/10 transition-colors cursor-pointer"
                      title="حذف المحطة"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-[#A49CA8] mb-1">
                        عنوان المحطة
                      </label>
                      <input
                        type="text"
                        value={node.title}
                        onChange={(e) => handleTimelineChange(idx, 'title', e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-[#08080D] border border-white/10 text-sm text-white outline-none focus:border-[#D7B56D]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs text-[#A49CA8] mb-1">
                        تاريخ المحطة
                      </label>
                      <input
                        type="text"
                        value={node.date}
                        onChange={(e) => handleTimelineChange(idx, 'date', e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-[#08080D] border border-white/10 text-sm text-white outline-none focus:border-[#D7B56D]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs text-[#A49CA8] mb-1">
                      تفاصيل ووصف المحطة
                    </label>
                    <textarea
                      rows={3}
                      value={node.description}
                      onChange={(e) => handleTimelineChange(idx, 'description', e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-[#08080D] border border-white/10 text-sm text-white outline-none focus:border-[#D7B56D] leading-relaxed"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id={`highlight-${idx}`}
                      checked={!!node.highlight}
                      onChange={(e) => handleTimelineChange(idx, 'highlight', e.target.checked)}
                      className="w-4 h-4 rounded bg-[#08080D] border-white/20 accent-[#D7B56D] cursor-pointer"
                    />
                    <label
                      htmlFor={`highlight-${idx}`}
                      className="text-xs text-[#A49CA8] cursor-pointer"
                    >
                      تمييز هذه المحطة بلون وردي مذهب (Highlight Card)
                    </label>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Tab 6: The Love Letter */}
        {activeTab === 'letter' && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6 max-w-4xl"
          >
            <div className="p-6 md:p-8 rounded-2xl bg-white/[0.02] border border-white/10 shadow-xl space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-serif-arabic text-gold-gradient font-bold flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-[#D7B56D]" />
                  <span>رسالة من القلب (The Love Letter)</span>
                </h2>
                <button
                  onClick={addParagraph}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#6E1835] text-white text-xs hover:bg-[#8B2245] transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>إضافة فقرة</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-[#A49CA8] mb-1">
                    عنوان الرسالة
                  </label>
                  <input
                    type="text"
                    value={formData.letter.title}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        letter: { ...formData.letter, title: e.target.value },
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-[#08080D] border border-white/10 text-sm text-white outline-none focus:border-[#D7B56D]"
                  />
                </div>
                <div>
                  <label className="block text-xs text-[#A49CA8] mb-1">
                    الوصف الفرعي
                  </label>
                  <input
                    type="text"
                    value={formData.letter.subtitle}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        letter: { ...formData.letter, subtitle: e.target.value },
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-[#08080D] border border-white/10 text-sm text-white outline-none focus:border-[#D7B56D]"
                  />
                </div>
              </div>

              {/* Paragraphs */}
              <div className="space-y-4">
                <label className="block text-xs text-[#A49CA8] font-bold">
                  فقرات الرسالة:
                </label>
                {formData.letter.paragraphs.map((para, pIdx) => (
                  <div key={pIdx} className="space-y-1">
                    <div className="flex items-center justify-between text-xs text-[#D7B56D]">
                      <span>الفقرة #{pIdx + 1}</span>
                      {formData.letter.paragraphs.length > 1 && (
                        <button
                          onClick={() => removeParagraph(pIdx)}
                          className="text-[#E8A0B7]/60 hover:text-red-400 text-[11px] cursor-pointer"
                        >
                          حذف
                        </button>
                      )}
                    </div>
                    <textarea
                      rows={3}
                      value={para}
                      onChange={(e) => handleParagraphChange(pIdx, e.target.value)}
                      className="w-full px-4 py-3 rounded-xl bg-[#08080D] border border-white/10 text-base font-serif-arabic text-white outline-none focus:border-[#D7B56D] leading-relaxed"
                    />
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-white/10">
                <div>
                  <label className="block text-xs text-[#A49CA8] mb-1">
                    جملة الختام
                  </label>
                  <input
                    type="text"
                    value={formData.letter.closing}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        letter: { ...formData.letter, closing: e.target.value },
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-[#08080D] border border-white/10 text-sm text-white outline-none focus:border-[#D7B56D]"
                  />
                </div>

                <div>
                  <label className="block text-xs text-[#A49CA8] mb-1">
                    توقيع الرسالة
                  </label>
                  <input
                    type="text"
                    value={formData.letter.signature}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        letter: { ...formData.letter, signature: e.target.value },
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-[#08080D] border border-white/10 text-sm text-[#D7B56D] outline-none focus:border-[#D7B56D]"
                  />
                </div>

                <div>
                  <label className="block text-xs text-[#A49CA8] mb-1">
                    تاريخ الرسالة
                  </label>
                  <input
                    type="text"
                    value={formData.letter.date}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        letter: { ...formData.letter, date: e.target.value },
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-[#08080D] border border-white/10 text-sm text-[#A49CA8] outline-none focus:border-[#D7B56D]"
                  />
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Tab 7: Security & Music Settings */}
        {activeTab === 'security' && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6 max-w-4xl"
          >
            {/* Passwords */}
            <div className="p-6 md:p-8 rounded-2xl bg-white/[0.02] border border-white/10 shadow-xl space-y-6">
              <h2 className="text-xl font-serif-arabic text-gold-gradient font-bold flex items-center gap-2">
                <Shield className="w-5 h-5 text-[#D7B56D]" />
                <span>إعدادات بوابات الدخول وكلمات المرور</span>
              </h2>

              {/* Main Visitor Password */}
              <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 space-y-3">
                <span className="text-sm font-bold text-[#D7B56D] block">
                  1. كلمة مرور الدخول للزائر (ليالي):
                </span>
                <div className="grid grid-cols-3 gap-3 max-w-md">
                  <div>
                    <label className="block text-[11px] text-[#A49CA8] mb-1">اليوم</label>
                    <input
                      type="text"
                      value={formData.security.passDay}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          security: { ...formData.security, passDay: e.target.value },
                        })
                      }
                      className="w-full text-center py-2 rounded-lg bg-[#08080D] border border-white/10 text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-[#A49CA8] mb-1">الشهر</label>
                    <input
                      type="text"
                      value={formData.security.passMonth}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          security: { ...formData.security, passMonth: e.target.value },
                        })
                      }
                      className="w-full text-center py-2 rounded-lg bg-[#08080D] border border-white/10 text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-[#A49CA8] mb-1">السنة</label>
                    <input
                      type="text"
                      value={formData.security.passYear}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          security: { ...formData.security, passYear: e.target.value },
                        })
                      }
                      className="w-full text-center py-2 rounded-lg bg-[#08080D] border border-white/10 text-white font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Secret Admin Password */}
              <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 space-y-3">
                <span className="text-sm font-bold text-[#E8A0B7] block">
                  2. كلمة مرور لوحة التحكم السرية (Admin Password):
                </span>
                <div className="grid grid-cols-3 gap-3 max-w-md">
                  <div>
                    <label className="block text-[11px] text-[#A49CA8] mb-1">اليوم</label>
                    <input
                      type="text"
                      value={formData.security.adminPassDay}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          security: {
                            ...formData.security,
                            adminPassDay: e.target.value,
                          },
                        })
                      }
                      className="w-full text-center py-2 rounded-lg bg-[#08080D] border border-white/10 text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-[#A49CA8] mb-1">الشهر</label>
                    <input
                      type="text"
                      value={formData.security.adminPassMonth}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          security: {
                            ...formData.security,
                            adminPassMonth: e.target.value,
                          },
                        })
                      }
                      className="w-full text-center py-2 rounded-lg bg-[#08080D] border border-white/10 text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-[#A49CA8] mb-1">السنة</label>
                    <input
                      type="text"
                      value={formData.security.adminPassYear}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          security: {
                            ...formData.security,
                            adminPassYear: e.target.value,
                          },
                        })
                      }
                      className="w-full text-center py-2 rounded-lg bg-[#08080D] border border-white/10 text-white font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Password Gate Custom Texts */}
              <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 space-y-4">
                <span className="text-sm font-bold text-[#D7B56D] block">
                  3. نصوص وتوجيهات شاشة القفل (Password Gate Texts):
                </span>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-[#A49CA8] mb-1.5 font-medium">
                      عنوان شاشة القفل الرئيسية (Gate Title)
                    </label>
                    <input
                      type="text"
                      value={formData.security.gateTitle}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          security: { ...formData.security, gateTitle: e.target.value },
                        })
                      }
                      placeholder="هذا المكان لكِ وحدكِ"
                      className="w-full px-3 py-2.5 rounded-xl bg-[#08080D] border border-white/10 text-sm text-white focus:border-[#D7B56D] outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-[#A49CA8] mb-1.5 font-medium">
                      النص الفرعي للتوجيه (Gate Subtitle)
                    </label>
                    <input
                      type="text"
                      value={formData.security.gateSubtitle}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          security: { ...formData.security, gateSubtitle: e.target.value },
                        })
                      }
                      placeholder="أدخلي التاريخ الذي بدأ فيه كل شيء"
                      className="w-full px-3 py-2.5 rounded-xl bg-[#08080D] border border-white/10 text-sm text-white focus:border-[#D7B56D] outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-[#A49CA8] mb-1.5 font-medium">
                      رسالة الخطأ عند إدخال تاريخ خاطئ (Error Message)
                    </label>
                    <input
                      type="text"
                      value={formData.security.errorMessage}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          security: { ...formData.security, errorMessage: e.target.value },
                        })
                      }
                      placeholder="مممم... جربي تفتكري اليوم اللي بدأ فيه كل شيء."
                      className="w-full px-3 py-2.5 rounded-xl bg-[#08080D] border border-white/10 text-sm text-red-300 focus:border-[#D7B56D] outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-[#A49CA8] mb-1.5 font-medium">
                      رسالة التلميح (Hint Message)
                    </label>
                    <input
                      type="text"
                      value={formData.security.hintMessage}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          security: { ...formData.security, hintMessage: e.target.value },
                        })
                      }
                      placeholder="تاريخ اليوم الذي غيّر مجرى كل الحكايات..."
                      className="w-full px-3 py-2.5 rounded-xl bg-[#08080D] border border-white/10 text-sm text-[#D7B56D] focus:border-[#D7B56D] outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Music Settings */}
            <div className="p-6 md:p-8 rounded-2xl bg-white/[0.02] border border-white/10 shadow-xl space-y-6">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <h2 className="text-xl font-serif-arabic text-gold-gradient font-bold flex items-center gap-2">
                  <Music className="w-5 h-5 text-[#D7B56D]" />
                  <span>إعدادات الموسيقى الرئيسية وتشغيلها التلقائي الدائري (Main Music & Auto Loop)</span>
                </h2>

                <div className="flex items-center gap-2">
                  <span className="text-[11px] px-2.5 py-1 rounded-full bg-[#D7B56D]/15 text-[#D7B56D] border border-[#D7B56D]/30 font-bold flex items-center gap-1">
                    <RotateCcw className="w-3 h-3 animate-spin" style={{ animationDuration: '6s' }} />
                    إعادة تشغيل لا نهائية (Infinite Loop)
                  </span>

                  {/* Status Badge */}
                  {formData.audio.audioSrc ? (
                    <span className="text-xs px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
                      موسيقى مفعّلة
                    </span>
                  ) : (
                    <span className="text-xs px-3 py-1 rounded-full bg-white/5 text-[#A49CA8] border border-white/10 font-medium">
                      لا يوجد صوت مفعّل (الموقع صامت)
                    </span>
                  )}
                </div>
              </div>

              {/* Current Main Audio Status & Actions */}
              {formData.audio.audioSrc ? (
                <div className="p-4 rounded-xl bg-white/[0.03] border border-[#D7B56D]/30 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="text-sm font-bold text-white flex items-center gap-2">
                        <Music className="w-4 h-4 text-[#D7B56D]" />
                        <span>{formData.audio.trackTitle || 'الموسيقى الرئيسية'}</span>
                      </div>
                      <div className="text-[11px] font-mono text-[#A49CA8] mt-0.5 break-all">
                        {formData.audio.audioSrc}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      {/* Preview Button */}
                      <button
                        type="button"
                        onClick={() => togglePreviewAudio('bg-audio', formData.audio.audioSrc)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#6E1835] hover:bg-[#8B2245] text-white text-xs font-bold border border-[#D7B56D]/30 transition-all cursor-pointer shadow-md"
                      >
                        {activePreviewId === 'bg-audio' ? (
                          <>
                            <Pause className="w-3.5 h-3.5 text-[#D7B56D]" />
                            <span>إيقاف المعاينة</span>
                          </>
                        ) : (
                          <>
                            <Play className="w-3.5 h-3.5 text-[#D7B56D]" />
                            <span>معاينة الصوت</span>
                          </>
                        )}
                      </button>

                      {/* Replace Button */}
                      <label className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.06] hover:bg-white/[0.1] text-white text-xs border border-white/20 transition-all cursor-pointer">
                        <Upload className="w-3.5 h-3.5 text-[#D7B56D]" />
                        <span>استبدال</span>
                        <input
                          type="file"
                          accept="audio/*"
                          onChange={handleBgAudioFileUpload}
                          className="hidden"
                        />
                      </label>

                      {/* Delete Button */}
                      <button
                        type="button"
                        onClick={handleRemoveBgAudio}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs border border-red-500/30 transition-all cursor-pointer"
                        title="حذف الموسيقى الرئيسية نهائياً"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>حذف الموسيقى</span>
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-5 rounded-xl bg-white/[0.02] border border-dashed border-white/15 text-center space-y-3">
                  <div className="w-10 h-10 rounded-full bg-white/5 mx-auto flex items-center justify-center text-[#A49CA8]">
                    <Music className="w-5 h-5" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-white">لا توجد موسيقى رئيسية مرفوعة حاليًا</p>
                    <p className="text-xs text-[#A49CA8]">
                      الموقع لا يحتوي على أي موسيقى افتراضية ويعمل بصمت تام حتى ترفع ملفًا خاصًا بك.
                    </p>
                  </div>

                  <label className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#6E1835] to-[#8B2245] hover:brightness-110 text-white text-xs font-bold border border-[#D7B56D]/40 transition-all cursor-pointer shadow-lg">
                    <Upload className="w-4 h-4 text-[#D7B56D]" />
                    <span>رفع موسيقى رئيسية من جهازك</span>
                    <input
                      type="file"
                      accept="audio/*"
                      onChange={handleBgAudioFileUpload}
                      className="hidden"
                    />
                  </label>
                </div>
              )}

              {/* Background Audio Upload Progress */}
              {bgAudioProgress !== null && (
                <div className="space-y-1 p-3 rounded-xl bg-[#6E1835]/20 border border-[#D7B56D]/30">
                  <div className="flex justify-between text-xs text-[#D7B56D]">
                    <span className="flex items-center gap-1.5">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      جاري رفع ومعالجة الموسيقى الرئيسية عبر السيرفر...
                    </span>
                    <span>{bgAudioProgress}%</span>
                  </div>
                  <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-[#D7B56D] h-full transition-all duration-300"
                      style={{ width: `${bgAudioProgress}%` }}
                    />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block text-xs text-[#A49CA8] mb-1">
                    عنوان المسار الصوتي (Track Title)
                  </label>
                  <input
                    type="text"
                    value={formData.audio.trackTitle}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        audio: { ...formData.audio, trackTitle: e.target.value },
                      })
                    }
                    placeholder="اسم الأغنية أو المقطع..."
                    className="w-full px-3 py-2 rounded-xl bg-[#08080D] border border-white/10 text-sm text-white outline-none focus:border-[#D7B56D]"
                  />
                </div>

                <div>
                  <label className="block text-xs text-[#A49CA8] mb-1">
                    مسار ملف الصوت المباشر (Audio Source URL)
                  </label>
                  <input
                    type="text"
                    value={formData.audio.audioSrc}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        audio: { ...formData.audio, audioSrc: e.target.value },
                      })
                    }
                    placeholder="فارغ في حال عدم وجود صوت"
                    className="w-full px-3 py-2 rounded-xl bg-[#08080D] border border-white/10 text-sm font-mono text-[#D7B56D] outline-none focus:border-[#D7B56D]"
                  />
                </div>
              </div>

              {/* Local Server Self-Hosted Storage Info Card */}
              <div className="p-4 rounded-xl bg-[#121019] border border-[#D7B56D]/30 space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-[#D7B56D]">
                  <HardDrive className="w-4 h-4" />
                  <span>معلومات السيرفر المحلي والتخزين (Self-Hosted Windows Storage)</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-[11px] text-[#A49CA8]">
                  <div className="p-2.5 rounded-lg bg-[#08080D] border border-white/5 space-y-1">
                    <span className="text-[#D7B56D] font-bold block">قاعدة البيانات:</span>
                    <span>SQLite (data/layali.db)</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-[#08080D] border border-white/5 space-y-1">
                    <span className="text-[#D7B56D] font-bold block">مجلد الوسائط:</span>
                    <span>uploads/ (images, videos, audio)</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-[#08080D] border border-white/5 space-y-1">
                    <span className="text-[#D7B56D] font-bold block">مزامنة فورية:</span>
                    <span>WebSocket Real-Time Sync</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Reset Confirmation Modal */}
      <AnimatePresence>
        {showResetConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md px-4"
          >
            <div className="max-w-md w-full p-6 rounded-2xl bg-[#121019] border border-[#D7B56D]/40 text-center space-y-4 shadow-2xl">
              <div className="w-12 h-12 rounded-full bg-red-500/20 border border-red-500/40 mx-auto flex items-center justify-center text-red-400">
                <RotateCcw className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold font-serif-arabic text-white">
                استعادة الإعدادات الأصلية؟
              </h3>
              <p className="text-xs text-[#A49CA8] leading-relaxed">
                هل أنت متأكد من رغبتك في استعادة جميع النصوص والتواريخ والصور الافتراضية؟ سيتم استبدال التعديلات ومزامنة الإعدادات الافتراضية مع السيرفر المحلي (SQLite).
              </p>
              <div className="flex items-center justify-center gap-3 pt-2">
                <button
                  onClick={handleReset}
                  className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-medium text-xs cursor-pointer shadow-md"
                >
                  نعم، استعادة الافتراضي
                </button>
                <button
                  onClick={() => setShowResetConfirm(false)}
                  className="px-5 py-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-white text-xs cursor-pointer"
                >
                  إلغاء
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
