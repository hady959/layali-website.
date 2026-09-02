import { SiteData } from '../types';

export interface UploadProgressCallback {
  (percentage: number): void;
}

export interface UploadImageResult {
  success: boolean;
  id?: string;
  url: string;
  filename?: string;
  format?: string;
  error?: string;
}

export interface UploadVideoResult {
  success: boolean;
  id?: string;
  url: string;
  filename?: string;
  mediaType?: 'video';
  error?: string;
}

export interface UploadAudioResult {
  success: boolean;
  id?: string;
  url: string;
  filename?: string;
  error?: string;
}

export interface VerifyPasswordResult {
  success: boolean;
  role?: 'main' | 'admin';
  token?: string;
  error?: string;
}

/**
 * Upload an image file to the local server storage (auto-compressed to WebP)
 */
export const uploadImage = (
  file: File,
  onProgress?: UploadProgressCallback
): Promise<UploadImageResult> => {
  return new Promise((resolve) => {
    const formData = new FormData();
    formData.append('image', file);

    const xhr = new XMLHttpRequest();
    xhr.open('POST', '/api/upload/image');

    if (xhr.upload && onProgress) {
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const percentComplete = Math.round((event.loaded / event.total) * 100);
          onProgress(percentComplete);
        }
      };
    }

    xhr.onload = () => {
      try {
        const response = JSON.parse(xhr.responseText);
        if (xhr.status >= 200 && xhr.status < 300 && response.success) {
          resolve(response);
        } else {
          resolve({
            success: false,
            url: '',
            error: response.error || `خطأ في رفع الصورة (${xhr.status})`,
          });
        }
      } catch (err) {
        resolve({
          success: false,
          url: '',
          error: 'استجابة غير صالحة من السيرفر',
        });
      }
    };

    xhr.onerror = () => {
      resolve({
        success: false,
        url: '',
        error: 'فشل الاتصال بالسيرفر المحلي أثناء رفع الصورة',
      });
    };

    xhr.send(formData);
  });
};

/**
 * Upload a video file (.mp4, .webm, .mov) to the local server storage
 */
export const uploadVideo = (
  file: File,
  onProgress?: UploadProgressCallback
): Promise<UploadVideoResult> => {
  return new Promise((resolve) => {
    const formData = new FormData();
    formData.append('video', file);

    const xhr = new XMLHttpRequest();
    xhr.open('POST', '/api/upload/video');

    if (xhr.upload && onProgress) {
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const percentComplete = Math.round((event.loaded / event.total) * 100);
          onProgress(percentComplete);
        }
      };
    }

    xhr.onload = () => {
      try {
        const response = JSON.parse(xhr.responseText);
        if (xhr.status >= 200 && xhr.status < 300 && response.success) {
          resolve(response);
        } else {
          resolve({
            success: false,
            url: '',
            error: response.error || `خطأ في رفع الفيديو (${xhr.status})`,
          });
        }
      } catch (err) {
        resolve({
          success: false,
          url: '',
          error: 'استجابة غير صالحة من السيرفر أثناء رفع الفيديو',
        });
      }
    };

    xhr.onerror = () => {
      resolve({
        success: false,
        url: '',
        error: 'فشل الاتصال بالسيرفر أثناء رفع الفيديو',
      });
    };

    xhr.send(formData);
  });
};

/**
 * Upload any audio file to the local server for auto-transcoding into web-compatible MP3
 */
export const uploadAudio = (
  file: File,
  onProgress?: UploadProgressCallback
): Promise<UploadAudioResult> => {
  return new Promise((resolve) => {
    const formData = new FormData();
    formData.append('audio', file);

    const xhr = new XMLHttpRequest();
    xhr.open('POST', '/api/upload/audio');

    if (xhr.upload && onProgress) {
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const percentComplete = Math.round((event.loaded / event.total) * 100);
          onProgress(percentComplete);
        }
      };
    }

    xhr.onload = () => {
      try {
        const response = JSON.parse(xhr.responseText);
        if (xhr.status >= 200 && xhr.status < 300 && response.success) {
          resolve(response);
        } else {
          resolve({
            success: false,
            url: '',
            error: response.error || `خطأ في معالجة الصوت (${xhr.status})`,
          });
        }
      } catch (err) {
        resolve({
          success: false,
          url: '',
          error: 'استجابة غير صالحة من السيرفر',
        });
      }
    };

    xhr.onerror = () => {
      resolve({
        success: false,
        url: '',
        error: 'فشل الاتصال بالسيرفر أثناء رفع الصوت',
      });
    };

    xhr.send(formData);
  });
};

/**
 * Delete media from server / cloud storage safely
 */
export const deleteMediaFile = async (url: string): Promise<boolean> => {
  try {
    if (!url) return true;
    const response = await fetch('/api/media', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url }),
    });
    const result = await response.json();
    return result.success;
  } catch (err) {
    console.warn('Failed to delete old media file:', err);
    return false;
  }
};

/**
 * Fetch all registered uploads from SQLite database
 */
export const fetchUploads = async (type?: string): Promise<any[]> => {
  try {
    const query = type ? `?type=${encodeURIComponent(type)}` : '';
    const res = await fetch(`/api/uploads${query}`);
    const json = await res.json();
    return json.success ? json.uploads : [];
  } catch (err) {
    console.warn('Failed to fetch uploads list:', err);
    return [];
  }
};

/**
 * Create a full SQLite database, configuration, and media uploads backup
 */
export const triggerBackup = async (): Promise<{ success: boolean; backupFolder?: string; message?: string }> => {
  try {
    const res = await fetch('/api/backup', { method: 'POST' });
    return await res.json();
  } catch (err) {
    return { success: false, message: 'فشل طلب النسخ الاحتياطي' };
  }
};

/**
 * Fetch list of all available backups on disk
 */
export const fetchBackupsList = async (): Promise<any[]> => {
  try {
    const res = await fetch('/api/backups');
    const json = await res.json();
    return json.success ? json.backups : [];
  } catch (err) {
    console.warn('Failed to fetch backups list:', err);
    return [];
  }
};

/**
 * Restore from a selected backup
 */
export const restoreFromBackup = async (backupName: string): Promise<{ success: boolean; message?: string; error?: string }> => {
  try {
    const res = await fetch('/api/restore', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ backupName }),
    });
    return await res.json();
  } catch (err: any) {
    return { success: false, error: err.message || 'فشل الاتصال بالسيرفر لاستعادة النسخة' };
  }
};

/**
 * Check local server health and service statuses
 */
export const fetchServerHealth = async (): Promise<any> => {
  try {
    const res = await fetch('/api/health');
    return await res.json();
  } catch (err) {
    return { success: false, status: 'offline' };
  }
};

/**
 * Inspect storage integrity and orphan files
 */
export const fetchSystemIntegrity = async (): Promise<any> => {
  try {
    const res = await fetch('/api/system/integrity');
    return await res.json();
  } catch (err) {
    return { success: false, error: 'تعذر فحص السلامة' };
  }
};

/**
 * Verify authentication credentials against the secure server-side endpoint
 */
export const verifyServerPassword = async (
  day: string | number,
  month: string | number,
  year: string | number
): Promise<VerifyPasswordResult> => {
  try {
    const res = await fetch('/api/verify-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ day, month, year }),
    });
    const json = await res.json();
    return json;
  } catch (err) {
    console.warn('Server password check failed, fallback needed:', err);
    return {
      success: false,
      error: 'فشل الاتصال بخادم التحقق',
    };
  }
};

/**
 * Fetch persistent SiteData from SQLite server
 */
export const fetchServerSiteData = async (): Promise<SiteData | null> => {
  try {
    const res = await fetch(`/api/site-data?_t=${Date.now()}`, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
    if (!res.ok) return null;
    const json = await res.json();
    if (json.success && json.data) {
      return json.data as SiteData;
    }
    return null;
  } catch (err) {
    console.warn('Could not fetch server site data:', err);
    return null;
  }
};

/**
 * Save SiteData to SQLite server for persistence across devices and restarts
 */
export const saveServerSiteData = async (siteData: SiteData): Promise<boolean> => {
  try {
    const res = await fetch('/api/site-data', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(siteData),
    });
    const json = await res.json();
    return !!json.success;
  } catch (err) {
    console.error('Failed to save site data to server:', err);
    return false;
  }
};
