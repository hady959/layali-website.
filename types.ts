export interface MemoryItem {
  id: string;
  title: string;
  date: string;
  image: string; // Thumbnail or primary image URL
  mediaType?: 'image' | 'video';
  videoSrc?: string; // Video URL (.mp4, .webm)
  aspectRatio: 'square' | 'portrait' | 'landscape';
  caption: string;
  location?: string;
  audioSrc?: string;
  audioTitle?: string;
  audioDuration?: number;
}

export interface TimelineMilestone {
  id: string;
  date: string;
  title: string;
  description: string;
  highlight?: boolean;
  isLast?: boolean;
}

export interface SiteData {
  recipient: {
    name: string;
    englishName: string;
    arrivalDate: string; // YYYY-MM-DD
    arrivalDisplay: string;
    arrivalTitle: string;
    arrivalNote: string;
  };
  sender: {
    name: string;
    englishName: string;
    signature: string;
  };
  relationship: {
    startDate: string; // ISO format e.g. "2026-08-16T00:00:00"
    startDateDisplay: string;
    heroSubtitle: string;
    counterTitle: string;
    counterSubtitle: string;
  };
  security: {
    passDay: string;
    passMonth: string;
    passYear: string;
    adminPassDay: string;
    adminPassMonth: string;
    adminPassYear: string;
    gateTitle: string;
    gateSubtitle: string;
    errorMessage: string;
    hintMessage: string;
  };
  intro: {
    lines: string[];
    buttonText: string;
    badgeText?: string;
    stampingTitle?: string;
    stampingSubtitle?: string;
    monogramText?: string;
    monogramSubtext?: string;
    welcomeTitle?: string;
  };
  memories: {
    title: string;
    subtitle: string;
    displayCount?: number;
    items: MemoryItem[];
  };
  timeline: {
    title: string;
    subtitle: string;
    milestones: TimelineMilestone[];
  };
  letter: {
    title: string;
    subtitle: string;
    paragraphs: string[];
    closing: string;
    signature: string;
    date: string;
  };
  audio: {
    trackTitle: string;
    artist: string;
    defaultVolume: number;
    audioSrc: string;
  };
}
