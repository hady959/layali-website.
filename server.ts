import dotenv from 'dotenv';
dotenv.config();

import express, { Request, Response } from 'express';
import http from 'http';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { fileURLToPath } from 'url';
import multer from 'multer';
import { exec } from 'child_process';
import { promisify } from 'util';
import crypto from 'crypto';
import sharp from 'sharp';
import { createServer as createViteServer } from 'vite';
import { SqliteDataRepository } from './src/sqliteRepository';
import { PostgresDataRepository } from './src/postgresRepository';
import { isPostgresConfigured, initPostgresSchema } from './src/postgresDb';
import { isCloudStorageEnabled, uploadToCloudStorage, deleteFromCloudStorage, logStorageDiagnostics, checkStorageConnection, initializeStorage } from './src/cloudStorage';

// Optimize Sharp for low-RAM (512MB) cloud environments
sharp.concurrency(1);
sharp.cache(false);

const execAsync = promisify(exec);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Port and Environment configuration
const PORT = Number(process.env.PORT || 3000);
const isProduction = process.env.NODE_ENV === 'production' || !!process.env.RAILWAY_ENVIRONMENT_ID || !!process.env.RAILWAY_STATIC_URL || __filename.endsWith('server.js');
const PUBLIC_URL = (process.env.PUBLIC_URL || process.env.APP_URL || '').replace(/\/+$/, '');

const UPLOAD_ROOT = process.env.UPLOAD_DIR
  ? path.resolve(process.env.UPLOAD_DIR)
  : path.join(process.cwd(), 'uploads');

const IMAGES_DIR = path.join(UPLOAD_ROOT, 'images');
const VIDEOS_DIR = path.join(UPLOAD_ROOT, 'videos');
const AUDIO_DIR = path.join(UPLOAD_ROOT, 'audio');
const DATA_DIR = path.join(process.cwd(), 'data');
const BACKUPS_DIR = path.join(process.cwd(), 'backups');
const LOGS_DIR = path.join(process.cwd(), 'logs');

// Ensure writable directories exist in every environment.
// Free cloud hosts may use an ephemeral filesystem, but the directories must
// still exist so local-upload fallback does not fail at runtime.
if (true) {
  [IMAGES_DIR, VIDEOS_DIR, AUDIO_DIR, DATA_DIR, BACKUPS_DIR, LOGS_DIR].forEach((dir) => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });
}

function writeServerLog(message: string, isError: boolean = false) {
  const timestamp = new Date().toISOString();
  const formatted = `[${timestamp}] ${message}`;
  if (isError) {
    console.error(formatted);
  } else {
    console.log(formatted);
  }
}

writeServerLog(`Layali Server initializing on port ${PORT} (env: ${process.env.NODE_ENV || 'development'})...`);

// Database Initialization (PostgreSQL when configured, SQLite fallback)
const isCloudDb = isPostgresConfigured();

const isRailway = !!process.env.RAILWAY_ENVIRONMENT_ID || !!process.env.RAILWAY_STATIC_URL;

if (isProduction && !isCloudDb) {
  if (isRailway) {
    const errMsg = "FATAL ERROR: DATABASE_URL is missing. PostgreSQL is strictly required in production for data synchronization. SQLite fallback is disabled to prevent ephemeral data loss.";
    writeServerLog(errMsg, true);
    console.error(errMsg);
    process.exit(1);
  } else {
    console.warn("WARNING: Running in production without DATABASE_URL. Falling back to SQLite because this appears to be a preview environment (not Railway).");
  }
}

const dataRepository = isCloudDb ? new PostgresDataRepository() : new SqliteDataRepository();

if (isCloudDb) {
  writeServerLog('[Database] PostgreSQL Cloud Database configured.');
  initPostgresSchema()
    .then((success) => {
      if (success) {
        writeServerLog('[Database] PostgreSQL Schema ready.');
      } else {
        writeServerLog('[Database] PostgreSQL Schema init skipped/deferred.');
      }
    })
    .catch((err) => writeServerLog(`[Database] PostgreSQL initialization warning: ${err.message || err}`, true));
} else {
  writeServerLog('[Database] Local SQLite Database active (Fallback mode).');
}

if (isCloudStorageEnabled()) {
  writeServerLog('[Storage] Supabase Cloud Storage configured.');
  initializeStorage().then(() => {
    checkStorageConnection().then((res) => {
      if (res.connected) {
        writeServerLog('[Storage] Supabase Storage connection verified successfully.');
      } else {
        writeServerLog(`[Storage] Supabase Storage connection check: ${res.error}`, true);
      }
    });
  });
} else {
  writeServerLog('[Storage] Local Disk Storage active.');
}
logStorageDiagnostics();

// Track FFmpeg Availability
let isFFmpegAvailable = false;
async function detectFFmpeg(): Promise<boolean> {
  try {
    const { stdout, stderr } = await execAsync('ffmpeg -version');
    const versionOutput = stdout || stderr || '';
    isFFmpegAvailable = versionOutput.toLowerCase().includes('ffmpeg version');
  } catch (_) {
    isFFmpegAvailable = false;
  }
  return isFFmpegAvailable;
}
detectFFmpeg().then((avail) => {
  writeServerLog(`[FFmpeg] Status: ${avail ? 'Available in PATH' : 'Not detected in PATH'}`);
});

// Express App Setup
const app = express();
const server = http.createServer(app);

// Memory storage for Multer: prevents writing to ephemeral container disk
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB max file limit to safeguard 512MB RAM
  },
});

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Prevent caching for all API endpoints to ensure mobile/desktop sync
app.use('/api', (req, res, next) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.setHeader('Surrogate-Control', 'no-store');
  next();
});

// Strict Security Barrier: Block direct access to internal sensitive paths
app.use((req, res, next) => {
  const rawUrl = req.originalUrl || req.url;
  const lowerUrl = rawUrl.toLowerCase().split('?')[0];
  const blockedPrefixes = ['/data', '/backups', '/logs', '/config', '/.env', '/.git'];

  for (const prefix of blockedPrefixes) {
    if (lowerUrl === prefix || lowerUrl.startsWith(`${prefix}/`)) {
      return res.status(403).json({ success: false, error: 'Forbidden: Direct access is restricted' });
    }
  }

  if (lowerUrl.includes('..')) {
    return res.status(403).json({ success: false, error: 'Forbidden: Invalid path' });
  }

  next();
});

// Static serving for local uploads fallback (in dev mode)
if (fs.existsSync(UPLOAD_ROOT)) {
  app.use(
    '/uploads',
    (req, res, next) => {
      const decodedPath = decodeURIComponent(req.path);
      const normalizedTarget = path.normalize(path.join(UPLOAD_ROOT, decodedPath));
      if (!normalizedTarget.startsWith(UPLOAD_ROOT)) {
        return res.status(403).send('Forbidden');
      }
      next();
    },
    express.static(UPLOAD_ROOT, {
      maxAge: '30d',
      immutable: true,
      setHeaders: (res) => {
        res.setHeader('Cache-Control', 'public, max-age=2592000, immutable');
      },
    })
  );
}

// -------------------------------------------------------------
// Real-Time Server-Sent Events (SSE) Hub for Instant Live Sync
// -------------------------------------------------------------
const sseClients = new Set<Response>();

export function broadcastRealtimeEvent(eventType: string, payload: any) {
  const message = `event: ${eventType}\ndata: ${JSON.stringify(payload)}\n\n`;
  for (const client of sseClients) {
    try {
      client.write(message);
    } catch (_) {
      sseClients.delete(client);
    }
  }
}

// SSE Connection Endpoint (GET /api/events)
app.get('/api/events', (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders();

  // Send immediate connection acknowledgment
  res.write(`event: connected\ndata: ${JSON.stringify({ status: 'connected', timestamp: Date.now() })}\n\n`);

  sseClients.add(res);

  // Keep-alive heartbeat ping every 25 seconds
  const pingInterval = setInterval(() => {
    try {
      res.write(': ping\n\n');
    } catch (_) {
      clearInterval(pingInterval);
      sseClients.delete(res);
    }
  }, 25000);

  req.on('close', () => {
    clearInterval(pingInterval);
    sseClients.delete(res);
  });
});

// -------------------------------------------------------------
// Health Check Endpoint (GET /api/health)
// -------------------------------------------------------------
app.get('/api/health', async (req: Request, res: Response) => {
  let dbStatus = 'online';
  let totalMediaCount = 0;
  try {
    const uploads = await dataRepository.getUploads();
    totalMediaCount = uploads.length;
  } catch (err) {
    dbStatus = 'degraded';
  }

  const isCloudStorage = isCloudStorageEnabled();

  return res.json({
    status: 'online',
    app: 'Layali',
    storage: {
      configured: isCloudStorage,
      client: isCloudStorage ? 'supabase' : 'local',
      bucket: process.env.SUPABASE_BUCKET || 'layali-uploads',
    },
    database: {
      status: dbStatus,
      type: isCloudDb ? 'postgresql' : 'sqlite',
    },
    connectedClients: sseClients.size,
    ffmpeg: isFFmpegAvailable ? 'available' : 'not-detected-in-path',
    uptime: Math.floor(process.uptime()),
    totalMediaCount,
    timestamp: Date.now(),
  });
});

// -------------------------------------------------------------
// API: Image Upload with Sharp (Memory & CPU Optimized)
// -------------------------------------------------------------
app.post('/api/upload/image', upload.single('image'), async (req: Request, res: Response) => {
  try {
    if (!req.file || !req.file.buffer) {
      return res.status(400).json({ success: false, error: 'لم يتم استلام أي ملف صورة' });
    }

    const finalFilename = `${crypto.randomUUID()}.webp`;
    const uploadId = `upl-${Date.now()}-${crypto.randomUUID().slice(0, 8)}`;

    // Memory-efficient Sharp processing: downscale oversized images to max 1920px & convert to WebP (effort: 2)
    const webpBuffer = await sharp(req.file.buffer)
      .rotate()
      .resize({ width: 1920, height: 1920, fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 80, effort: 2 })
      .toBuffer();

    if (isCloudStorageEnabled() || isProduction) {
      const cloudRes = await uploadToCloudStorage({
        fileBuffer: webpBuffer,
        filename: finalFilename,
        mimeType: 'image/webp',
        folder: 'images',
      });

      if (!cloudRes.success || !cloudRes.url) {
        return res.status(500).json({
          success: false,
          error: cloudRes.error || 'فشل رفع الصورة إلى التخزين السحابي',
        });
      }

      const publicUrl = cloudRes.url;

      await dataRepository.recordUpload({
        id: uploadId,
        filename: finalFilename,
        originalName: req.file.originalname,
        mediaType: 'image',
        filePath: cloudRes.path,
        url: publicUrl,
        sizeBytes: webpBuffer.length,
        mimeType: 'image/webp',
      });

      broadcastRealtimeEvent('media-uploaded', {
        id: uploadId,
        url: publicUrl,
        filename: finalFilename,
        mediaType: 'image',
      });

      return res.json({
        success: true,
        id: uploadId,
        url: publicUrl,
        filename: finalFilename,
        originalName: req.file.originalname,
        format: 'webp',
        size: webpBuffer.length,
      });
    } else {
      // Local Disk Storage fallback (dev only)
      const finalPath = path.join(IMAGES_DIR, finalFilename);
      await fs.promises.writeFile(finalPath, webpBuffer);
      const publicUrl = `/uploads/images/${finalFilename}`;

      await dataRepository.recordUpload({
        id: uploadId,
        filename: finalFilename,
        originalName: req.file.originalname,
        mediaType: 'image',
        filePath: finalPath,
        url: publicUrl,
        sizeBytes: webpBuffer.length,
        mimeType: 'image/webp',
      });

      broadcastRealtimeEvent('media-uploaded', {
        id: uploadId,
        url: publicUrl,
        filename: finalFilename,
        mediaType: 'image',
      });

      return res.json({
        success: true,
        id: uploadId,
        url: publicUrl,
        filename: finalFilename,
        originalName: req.file.originalname,
        format: 'webp',
        size: webpBuffer.length,
      });
    }
  } catch (error: any) {
    writeServerLog(`Image upload error: ${error.message || error}`, true);
    return res.status(500).json({
      success: false,
      error: error.message || 'فشل ضغط وتحويل الصورة إلى WebP',
    });
  }
});

// -------------------------------------------------------------
// API: Video Upload (.mp4, .webm, .mov)
// -------------------------------------------------------------
app.post('/api/upload/video', upload.single('video'), async (req: Request, res: Response) => {
  try {
    if (!req.file || !req.file.buffer) {
      return res.status(400).json({ success: false, error: 'لم يتم استلام أي ملف فيديو' });
    }

    const ext = path.extname(req.file.originalname).toLowerCase() || '.mp4';
    const validVideoExts = ['.mp4', '.webm', '.mov', '.mkv', '.m4v', '.avi'];
    if (!validVideoExts.includes(ext)) {
      return res.status(400).json({
        success: false,
        error: 'صيغة الفيديو غير مدعومة. الصيغ المسموحة: MP4, WebM, MOV',
      });
    }

    const finalFilename = `${crypto.randomUUID()}${ext}`;
    const uploadId = `upl-${Date.now()}-${crypto.randomUUID().slice(0, 8)}`;
    const mimeType = `video/${ext.replace('.', '')}`;

    if (isCloudStorageEnabled() || isProduction) {
      const cloudRes = await uploadToCloudStorage({
        fileBuffer: req.file.buffer,
        filename: finalFilename,
        mimeType,
        folder: 'videos',
      });

      if (!cloudRes.success || !cloudRes.url) {
        return res.status(500).json({
          success: false,
          error: cloudRes.error || 'فشل رفع الفيديو إلى التخزين السحابي',
        });
      }

      const publicUrl = cloudRes.url;

      await dataRepository.recordUpload({
        id: uploadId,
        filename: finalFilename,
        originalName: req.file.originalname,
        mediaType: 'video',
        filePath: cloudRes.path,
        url: publicUrl,
        sizeBytes: req.file.buffer.length,
        mimeType,
      });

      broadcastRealtimeEvent('media-uploaded', {
        id: uploadId,
        url: publicUrl,
        filename: finalFilename,
        mediaType: 'video',
      });

      return res.json({
        success: true,
        id: uploadId,
        url: publicUrl,
        filename: finalFilename,
        originalName: req.file.originalname,
        mediaType: 'video',
        size: req.file.buffer.length,
      });
    } else {
      const finalPath = path.join(VIDEOS_DIR, finalFilename);
      await fs.promises.writeFile(finalPath, req.file.buffer);
      const publicUrl = `/uploads/videos/${finalFilename}`;

      await dataRepository.recordUpload({
        id: uploadId,
        filename: finalFilename,
        originalName: req.file.originalname,
        mediaType: 'video',
        filePath: finalPath,
        url: publicUrl,
        sizeBytes: req.file.buffer.length,
        mimeType,
      });

      broadcastRealtimeEvent('media-uploaded', {
        id: uploadId,
        url: publicUrl,
        filename: finalFilename,
        mediaType: 'video',
      });

      return res.json({
        success: true,
        id: uploadId,
        url: publicUrl,
        filename: finalFilename,
        originalName: req.file.originalname,
        mediaType: 'video',
        size: req.file.buffer.length,
      });
    }
  } catch (error: any) {
    writeServerLog(`Video upload error: ${error.message || error}`, true);
    return res.status(500).json({
      success: false,
      error: error.message || 'فشل رفع وحفظ الفيديو',
    });
  }
});

// -------------------------------------------------------------
// API: Audio Upload (Optimized Transcoding & Direct Cloud Upload)
// -------------------------------------------------------------
app.post('/api/upload/audio', upload.single('audio'), async (req: Request, res: Response) => {
  let tempInPath: string | null = null;
  let tempOutPath: string | null = null;

  try {
    if (!req.file || !req.file.buffer) {
      return res.status(400).json({ success: false, error: 'لم يتم استلام أي ملف صوتي' });
    }

    const uploadId = `upl-${Date.now()}-${crypto.randomUUID().slice(0, 8)}`;
    let audioBuffer = req.file.buffer;
    let finalExt = path.extname(req.file.originalname).toLowerCase() || '.mp3';
    let finalMimeType = req.file.mimetype || 'audio/mpeg';
    let isTranscoded = false;

    const ffmpegReady = await detectFFmpeg();
    if (ffmpegReady) {
      const tmpDir = os.tmpdir();
      tempInPath = path.join(tmpDir, `in-${crypto.randomUUID()}${finalExt}`);
      tempOutPath = path.join(tmpDir, `out-${crypto.randomUUID()}.mp3`);

      await fs.promises.writeFile(tempInPath, req.file.buffer);

      // Low-resource FFmpeg command: single thread, 128k bitrate, 44.1kHz
      const ffmpegCommand = `ffmpeg -y -threads 1 -i "${tempInPath}" -vn -ar 44100 -ac 2 -b:a 128k -c:a libmp3lame "${tempOutPath}"`;
      try {
        await execAsync(ffmpegCommand);
        if (fs.existsSync(tempOutPath)) {
          audioBuffer = await fs.promises.readFile(tempOutPath);
          finalExt = '.mp3';
          finalMimeType = 'audio/mpeg';
          isTranscoded = true;
        }
      } catch (ffErr) {
        writeServerLog(`FFmpeg audio transcoding fallback: ${ffErr}`, false);
      }
    }

    const finalFilename = `${crypto.randomUUID()}${finalExt}`;

    if (isCloudStorageEnabled() || isProduction) {
      const cloudRes = await uploadToCloudStorage({
        fileBuffer: audioBuffer,
        filename: finalFilename,
        mimeType: finalMimeType,
        folder: 'audio',
      });

      if (!cloudRes.success || !cloudRes.url) {
        return res.status(500).json({
          success: false,
          error: cloudRes.error || 'فشل رفع المقطع الصوتي إلى التخزين السحابي',
        });
      }

      const publicUrl = cloudRes.url;

      await dataRepository.recordUpload({
        id: uploadId,
        filename: finalFilename,
        originalName: req.file.originalname,
        mediaType: 'audio',
        filePath: cloudRes.path,
        url: publicUrl,
        sizeBytes: audioBuffer.length,
        mimeType: finalMimeType,
      });

      broadcastRealtimeEvent('media-uploaded', {
        id: uploadId,
        url: publicUrl,
        filename: finalFilename,
        mediaType: 'audio',
      });

      return res.json({
        success: true,
        id: uploadId,
        url: publicUrl,
        filename: finalFilename,
        originalName: req.file.originalname,
        format: finalExt.replace('.', ''),
        size: audioBuffer.length,
      });
    } else {
      const finalPath = path.join(AUDIO_DIR, finalFilename);
      await fs.promises.writeFile(finalPath, audioBuffer);
      const publicUrl = `/uploads/audio/${finalFilename}`;

      await dataRepository.recordUpload({
        id: uploadId,
        filename: finalFilename,
        originalName: req.file.originalname,
        mediaType: 'audio',
        filePath: finalPath,
        url: publicUrl,
        sizeBytes: audioBuffer.length,
        mimeType: finalMimeType,
      });

      broadcastRealtimeEvent('media-uploaded', {
        id: uploadId,
        url: publicUrl,
        filename: finalFilename,
        mediaType: 'audio',
      });

      return res.json({
        success: true,
        id: uploadId,
        url: publicUrl,
        filename: finalFilename,
        originalName: req.file.originalname,
        format: finalExt.replace('.', ''),
        size: audioBuffer.length,
      });
    }
  } catch (error: any) {
    writeServerLog(`Audio upload error: ${error.message || error}`, true);
    return res.status(500).json({
      success: false,
      error: error.message || 'فشل رفع أو معالجة الصوت',
    });
  } finally {
    if (tempInPath && fs.existsSync(tempInPath)) {
      try { fs.unlinkSync(tempInPath); } catch (_) {}
    }
    if (tempOutPath && fs.existsSync(tempOutPath)) {
      try { fs.unlinkSync(tempOutPath); } catch (_) {}
    }
  }
});

// -------------------------------------------------------------
// API: Unified Uploads List
// -------------------------------------------------------------
app.get('/api/uploads', async (req: Request, res: Response) => {
  try {
    const type = req.query.type as string | undefined;
    const uploads = await dataRepository.getUploads(type);
    return res.json({ success: true, uploads });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: 'تعذر جلب قائمة الملفات' });
  }
});

// -------------------------------------------------------------
// API: Delete uploaded media file safely (Supports Cloud & Local)
// -------------------------------------------------------------
app.delete('/api/media', async (req: Request, res: Response) => {
  try {
    const { url } = req.body;
    if (!url || typeof url !== 'string') {
      return res.status(400).json({ success: false, error: 'مسار ملف غير صالح' });
    }

    if (url.startsWith('http://') || url.startsWith('https://')) {
      // Cloud Storage deletion
      await deleteFromCloudStorage(url);
    } else if (url.startsWith('/uploads/')) {
      // Local Disk deletion
      const relativePath = url.replace(/^\/uploads\//, '');
      const safeTarget = path.normalize(path.join(UPLOAD_ROOT, relativePath));

      if (safeTarget.startsWith(UPLOAD_ROOT) && fs.existsSync(safeTarget)) {
        await fs.promises.unlink(safeTarget);
      }
    }

    await dataRepository.deleteUploadRecord(url);

    broadcastRealtimeEvent('media-deleted', { url });

    return res.json({ success: true, message: 'تم حذف الملف بنجاح' });
  } catch (error: any) {
    writeServerLog(`Delete media error: ${error.message || error}`, true);
    return res.status(500).json({ success: false, error: error.message || 'فشل حذف الملف' });
  }
});

// -------------------------------------------------------------
// API: Secure Password Verification
// -------------------------------------------------------------
app.post('/api/verify-password', async (req: Request, res: Response) => {
  try {
    const { day, month, year } = req.body;
    if (!day || !month || !year) {
      return res.status(400).json({
        success: false,
        error: 'يرجى إدخال اليوم والشهر والسنة بالكامل',
      });
    }

    const result = await dataRepository.verifyPassword(day, month, year);
    return res.json(result);
  } catch (error: any) {
    writeServerLog(`Verify password error: ${error.message || error}`, true);
    return res.status(500).json({
      success: false,
      error: 'حدث خطأ في الخادم أثناء التحقق من كلمة السر',
    });
  }
});

// -------------------------------------------------------------
// API: Persistent Site Data (GET & POST)
// -------------------------------------------------------------
app.get('/api/site-data', async (req: Request, res: Response) => {
  try {
    const data = await dataRepository.getSiteData();
    return res.json({ success: true, data });
  } catch (error: any) {
    writeServerLog(`Error reading site data: ${error.message || error}`, true);
    return res.status(500).json({ success: false, error: 'تعذر قراءة بيانات الموقع' });
  }
});

app.post('/api/site-data', async (req: Request, res: Response) => {
  try {
    const siteData = req.body;
    if (!siteData || typeof siteData !== 'object') {
      return res.status(400).json({ success: false, error: 'بيانات غير صالحة' });
    }

    // Deep validation to prevent local/blob/base64 URLs from entering production database
    if (isProduction) {
      const jsonString = JSON.stringify(siteData);
      const invalidUrlRegex = /"(blob:|data:image|http:\/\/localhost|http:\/\/127\.0\.0\.1|file:\/\/)[^"]*"/i;
      if (invalidUrlRegex.test(jsonString)) {
        writeServerLog('Rejected site-data save due to invalid media URLs (blob/base64/localhost).', true);
        return res.status(400).json({ 
          success: false, 
          error: 'لا يمكن حفظ البيانات. يرجى الانتظار حتى يكتمل رفع جميع الصور أو الملفات الصوتية.' 
        });
      }
    }

    const saved = await dataRepository.saveSiteData(siteData);
    if (saved) {
      // Instant broadcast to all connected devices without refresh
      broadcastRealtimeEvent('site-data-updated', siteData);
      return res.json({ success: true, message: 'تم حفظ بيانات الموقع بنجاح' });
    } else {
      return res.status(500).json({ success: false, error: 'تعذر حفظ بيانات الموقع' });
    }
  } catch (error: any) {
    writeServerLog(`Error saving site data: ${error.message || error}`, true);
    return res.status(500).json({ success: false, error: 'تعذر حفظ بيانات الموقع' });
  }
});

// -------------------------------------------------------------
// API: Cloud & JSON Backup Export
// -------------------------------------------------------------
app.get('/api/backup/export', async (req: Request, res: Response) => {
  try {
    const siteData = await dataRepository.getSiteData();
    const uploads = await dataRepository.getUploads();
    return res.json({
      success: true,
      app: 'Layali',
      exportedAt: new Date().toISOString(),
      siteData,
      uploads,
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: 'تعذر تصدير النسخة السحابية' });
  }
});

// -------------------------------------------------------------
// Graceful Shutdown Handlers
// -------------------------------------------------------------
let isShuttingDown = false;
async function handleGracefulShutdown(signal: string) {
  if (isShuttingDown) return;
  isShuttingDown = true;
  writeServerLog(`Received ${signal}. Shutting down cleanly...`);

  server.close(() => {
    writeServerLog('HTTP Server closed. Process exiting.');
    process.exit(0);
  });

  setTimeout(() => {
    writeServerLog('Forced shutdown timeout. Exiting.', true);
    process.exit(0);
  }, 3000).unref();
}

process.on('SIGINT', () => handleGracefulShutdown('SIGINT'));
process.on('SIGTERM', () => handleGracefulShutdown('SIGTERM'));

// -------------------------------------------------------------
// Vite Integration for Dev & Production
// -------------------------------------------------------------
async function startServer() {
  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true, host: '0.0.0.0', port: PORT },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Robust resolution of dist directory whether running from root or from dist/server.js
    const candidatePaths = [
      path.join(__dirname, 'dist'),
      path.join(process.cwd(), 'dist'),
      __dirname, // In case server.js is inside dist/
    ];

    const distPath = candidatePaths.find((p) => fs.existsSync(path.join(p, 'index.html'))) || path.join(process.cwd(), 'dist');
    writeServerLog(`[Production] Serving static files from: ${distPath}`);

    // Serve static assets with proper caching (immutable for hashed assets, no-cache for HTML)
    app.use(express.static(distPath, { 
      index: false,
      setHeaders: (res, pathStr) => {
        if (pathStr.endsWith('.html')) {
          res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        } else {
          res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
        }
      }
    }));

    // Fallback 404 for unhandled API requests
    app.all('/api/*', (req: Request, res: Response) => {
      res.status(404).json({ success: false, error: 'API route not found' });
    });

    // Standard Express SPA fallback route for React Router
    app.get('*', (req: Request, res: Response) => {
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      const indexPath = path.join(distPath, 'index.html');
      if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
      } else {
        res.status(404).send('Application build not found (index.html missing)');
      }
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    writeServerLog(`LAYALI Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
