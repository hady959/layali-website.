import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { SiteData } from '../types';
import { defaultSiteData } from '../data/siteData';
import { fetchServerSiteData, saveServerSiteData } from '../services/mediaService';

const LOCAL_STORAGE_KEY = 'layali_site_data_v2';

interface SiteDataContextType {
  siteData: SiteData;
  updateSiteData: (updater: (prev: SiteData) => SiteData) => void;
  setSiteData: (newData: SiteData) => void;
  resetSiteData: () => void;
  saveStatus: string | null;
  triggerSaveToast: (msg?: string) => void;
  isOnline: boolean;
}

const SiteDataContext = createContext<SiteDataContextType | undefined>(undefined);

export const SiteDataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [siteData, setSiteDataState] = useState<SiteData>(defaultSiteData);

  const [saveStatus, setSaveStatus] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const isSelfSavingRef = useRef<boolean>(false);

  // 1. Initial fetch from server
  const loadInitialData = () => {
    fetchServerSiteData().then((serverData) => {
      if (serverData) {
        setSiteDataState((prev) => ({
          ...defaultSiteData,
          ...prev,
          ...serverData,
        }));
        // Clean up old invalid cache from clients
        try {
          localStorage.removeItem(LOCAL_STORAGE_KEY);
        } catch (_) {}
      }
    });
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  // 2. Real-Time Live Sync Subscription (Server-Sent Events)
  useEffect(() => {
    let eventSource: EventSource | null = null;
    let reconnectTimer: any = null;

    function connectSSE() {
      try {
        eventSource = new EventSource('/api/events');

        eventSource.onopen = () => {
          setIsOnline(true);
          // Always re-sync data on connection to catch any missed updates while disconnected
          loadInitialData();
        };

        // Listen for live site data updates from Admin or other devices
        eventSource.addEventListener('site-data-updated', (event: MessageEvent) => {
          try {
            const incomingData = JSON.parse(event.data);
            if (incomingData && typeof incomingData === 'object') {
              // If this tab was the one saving, ignore to preserve fast optimistic state
              if (isSelfSavingRef.current) return;

              setSiteDataState((prev) => ({
                ...defaultSiteData,
                ...prev,
                ...incomingData,
              }));
            }
          } catch (err) {
            console.warn('[RealtimeSync] Error parsing incoming site data:', err);
          }
        });

        eventSource.onerror = () => {
          setIsOnline(false);
          if (eventSource) {
            eventSource.close();
            eventSource = null;
          }
          // Exponential backoff / retry after 3 seconds
          if (!reconnectTimer) {
            reconnectTimer = setTimeout(() => {
              reconnectTimer = null;
              connectSSE();
            }, 3000);
          }
        };
      } catch (err) {
        console.warn('[RealtimeSync] Could not initialize EventSource:', err);
      }
    }

    connectSSE();

    return () => {
      if (reconnectTimer) clearTimeout(reconnectTimer);
      if (eventSource) {
        eventSource.close();
        eventSource = null;
      }
    };
  }, []);

  const updateSiteData = (updater: (prev: SiteData) => SiteData) => {
    setSiteDataState((prev) => {
      const updated = updater(prev);
      isSelfSavingRef.current = true;
      saveServerSiteData(updated).finally(() => {
        setTimeout(() => {
          isSelfSavingRef.current = false;
        }, 300);
      });
      return updated;
    });
  };

  const setSiteData = (newData: SiteData) => {
    setSiteDataState(newData);
    isSelfSavingRef.current = true;
    saveServerSiteData(newData).finally(() => {
      setTimeout(() => {
        isSelfSavingRef.current = false;
      }, 300);
    });
  };

  const resetSiteData = () => {
    setSiteDataState(defaultSiteData);
    isSelfSavingRef.current = true;
    saveServerSiteData(defaultSiteData).finally(() => {
      setTimeout(() => {
        isSelfSavingRef.current = false;
      }, 300);
    });
    triggerSaveToast('تمت استعادة الإعدادات الأصلية ومزامنتها على السيرفر');
  };

  const triggerSaveToast = (msg: string = 'تم حفظ التعديلات بنجاح!') => {
    setSaveStatus(msg);
    setTimeout(() => {
      setSaveStatus(null);
    }, 3500);
  };

  return (
    <SiteDataContext.Provider
      value={{
        siteData,
        updateSiteData,
        setSiteData,
        resetSiteData,
        saveStatus,
        triggerSaveToast,
        isOnline,
      }}
    >
      {children}
    </SiteDataContext.Provider>
  );
};

export const useSiteData = (): SiteDataContextType => {
  const context = useContext(SiteDataContext);
  if (!context) {
    throw new Error('useSiteData must be used within a SiteDataProvider');
  }
  return context;
};
