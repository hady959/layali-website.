import { createClient, SupabaseClient } from '@supabase/supabase-js';

let supabaseClient: SupabaseClient | null = null;
const BUCKET_NAME = (process.env.SUPABASE_BUCKET || 'layali-uploads').trim();

/**
 * Retrieves the server-side Supabase administrative key.
 * Prioritizes SUPABASE_SERVICE_ROLE_KEY (standard HS256 JWT with service_role role required by Supabase Storage),
 * and supports SUPABASE_SECRET_KEY if configured in environment.
 * Never uses publishable or anon keys for server operations.
 */
export function getSupabaseBackendKey(): string | null {
  const serviceRoleKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();
  const secretKey = (process.env.SUPABASE_SECRET_KEY || '').trim();

  if (serviceRoleKey.length > 0) {
    return serviceRoleKey;
  }
  if (secretKey.length > 0) {
    return secretKey;
  }
  return null;
}

/**
 * Check if Supabase Cloud Storage is configured with backend credentials.
 */
export function isCloudStorageEnabled(): boolean {
  const url = (process.env.SUPABASE_URL || '').trim();
  const key = getSupabaseBackendKey();
  return Boolean(url && key && url.length > 0 && key.length > 0);
}

/**
 * Initialize single, official server-side Supabase client.
 * Strictly isolated to server-side operations (Node.js runtime).
 * React / browser code NEVER imports or accesses this client.
 */
export function getSupabaseClient(): SupabaseClient | null {
  if (!isCloudStorageEnabled()) {
    return null;
  }

  if (supabaseClient) {
    return supabaseClient;
  }

  const url = process.env.SUPABASE_URL!.trim();
  const key = getSupabaseBackendKey()!;

  supabaseClient = createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });

  return supabaseClient;
}

/**
 * Safe server-side connection and bucket check without mutating data.
 * Checks URL, server key, and performs a read-only list query on the bucket.
 */
export async function checkStorageConnection(): Promise<{
  connected: boolean;
  bucketExists: boolean;
  error?: string;
}> {
  const url = (process.env.SUPABASE_URL || '').trim();
  const key = getSupabaseBackendKey();

  if (!url || !key) {
    return {
      connected: false,
      bucketExists: false,
      error: 'SUPABASE_URL أو مفتاح السيرفر غير متوفر في متغيرات البيئة',
    };
  }

  const client = getSupabaseClient();
  if (!client) {
    return {
      connected: false,
      bucketExists: false,
      error: 'تعذر إنشاء عميل Supabase على السيرفر',
    };
  }

  try {
    // Perform non-destructive read test on the target bucket
    const { error } = await client.storage.from(BUCKET_NAME).list('', { limit: 1 });

    if (error) {
      const safeError = {
        name: error.name,
        message: error.message,
        status: (error as any).status || (error as any).statusCode,
      };
      console.error('[CloudStorage] Connection check failed:', JSON.stringify(safeError));
      return {
        connected: false,
        bucketExists: false,
        error: error.message,
      };
    }

    return {
      connected: true,
      bucketExists: true,
    };
  } catch (err: any) {
    console.error('[CloudStorage] Connection check exception:', err?.message || err);
    return {
      connected: false,
      bucketExists: false,
      error: err?.message || 'خطأ أثناء فحص اتصال التخزين السحابي',
    };
  }
}

export async function initializeStorage(): Promise<void> {
  const url = (process.env.SUPABASE_URL || '').trim();
  const key = getSupabaseBackendKey();
  
  if (!url || !key) {
    console.warn('[CloudStorage] Skipping initialization: SUPABASE_URL or Server Key is missing.');
    return;
  }

  const client = getSupabaseClient();
  if (!client) return;

  try {
    const { data: buckets, error: listError } = await client.storage.listBuckets();
    if (listError) {
      console.error('[CloudStorage] Failed to list buckets:', listError.message);
      return;
    }

    const bucketExists = buckets.some((b) => b.name === BUCKET_NAME);
    if (!bucketExists) {
      console.log(`[CloudStorage] Bucket '${BUCKET_NAME}' does not exist. Creating it...`);
      const { error: createError } = await client.storage.createBucket(BUCKET_NAME, {
        public: true,
        allowedMimeTypes: [
          'image/jpeg', 'image/png', 'image/webp', 'image/gif', 
          'video/mp4', 'video/webm', 'video/quicktime', 
          'audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg'
        ],
      });
      
      if (createError) {
        console.error(`[CloudStorage] Failed to create bucket '${BUCKET_NAME}':`, createError.message);
      } else {
        console.log(`[CloudStorage] Successfully created public bucket '${BUCKET_NAME}'.`);
      }
    } else {
      console.log(`[CloudStorage] Bucket '${BUCKET_NAME}' exists. Ensuring it is public...`);
      await client.storage.updateBucket(BUCKET_NAME, {
        public: true
      });
    }
  } catch (error: any) {
    console.error('[CloudStorage] Exception during initializeStorage:', error?.message);
  }
}

/**
 * Log startup diagnostics safely without revealing any secrets.
 */
export function logStorageDiagnostics(): void {
  const url = (process.env.SUPABASE_URL || '').trim();
  const serviceRoleKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();
  const secretKey = (process.env.SUPABASE_SECRET_KEY || '').trim();
  const isKeyConfigured = Boolean(serviceRoleKey.length > 0 || secretKey.length > 0);
  const client = getSupabaseClient();

  console.log(`[CloudStorage] URL configured: ${Boolean(url.length > 0)}`);
  console.log(`[CloudStorage] Server key configured: ${isKeyConfigured}`);
  console.log(`[CloudStorage] Key type detected: ${serviceRoleKey.length > 0 ? 'SUPABASE_SERVICE_ROLE_KEY' : secretKey.length > 0 ? 'SUPABASE_SECRET_KEY' : 'none'}`);
  console.log(`[CloudStorage] Bucket target: ${BUCKET_NAME}`);
  console.log(`[CloudStorage] Client initialized: ${Boolean(client !== null)}`);
}

/**
 * Upload a media buffer directly to Supabase Cloud Storage.
 * Generates an immutable public URL for universal access across all devices.
 */
export async function uploadToCloudStorage(options: {
  fileBuffer: Buffer;
  filename: string;
  mimeType: string;
  folder: 'images' | 'audio' | 'videos';
}): Promise<{ success: boolean; url: string; path: string; error?: string }> {
  const url = (process.env.SUPABASE_URL || '').trim();
  const key = getSupabaseBackendKey();

  if (!url || !key) {
    return {
      success: false,
      url: '',
      path: '',
      error: 'لم يتم تكوين إعدادات Supabase Storage على السيرفر',
    };
  }

  const storagePath = `${options.folder}/${options.filename}`;
  const client = getSupabaseClient();

  if (!client) {
    return {
      success: false,
      url: '',
      path: storagePath,
      error: 'تعذر تهيئة اتصال Supabase Storage على السيرفر',
    };
  }

  try {
    const { error: uploadError } = await client.storage
      .from(BUCKET_NAME)
      .upload(storagePath, options.fileBuffer, {
        contentType: options.mimeType,
        upsert: true,
        cacheControl: '31536000', // 1 year immutable CDN cache
      });

    if (uploadError) {
      // Safe error logging without sensitive secrets
      const safeError = {
        name: uploadError.name,
        message: uploadError.message,
        status: (uploadError as any).status || (uploadError as any).statusCode,
        code: (uploadError as any).code,
      };
      console.error(`[CloudStorage] Upload failed for '${BUCKET_NAME}/${storagePath}':`, JSON.stringify(safeError));

      return {
        success: false,
        url: '',
        path: storagePath,
        error: `فشل الرفع إلى Supabase Storage (${uploadError.message})`,
      };
    }

    const { data: urlData } = client.storage.from(BUCKET_NAME).getPublicUrl(storagePath);
    const publicUrl =
      urlData?.publicUrl ||
      `${url.replace(/\/$/, '')}/storage/v1/object/public/${BUCKET_NAME}/${storagePath}`;

    return {
      success: true,
      url: publicUrl,
      path: storagePath,
    };
  } catch (err: any) {
    const safeError = {
      name: err?.name || 'Error',
      message: err?.message || 'Unexpected error',
      code: err?.code,
    };
    console.error(`[CloudStorage] Exception during upload for '${storagePath}':`, JSON.stringify(safeError));
    return {
      success: false,
      url: '',
      path: storagePath,
      error: `فشل الرفع إلى Supabase Storage (${err?.message || 'خطأ غير متوقع'})`,
    };
  }
}

/**
 * Delete a media file from Supabase Cloud Storage.
 */
export async function deleteFromCloudStorage(urlOrPath: string): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client || !urlOrPath) return false;

  let cleanPath = urlOrPath;

  if (urlOrPath.startsWith('http://') || urlOrPath.startsWith('https://')) {
    const match = urlOrPath.match(new RegExp(`${BUCKET_NAME}/(.+)$`));
    if (match && match[1]) {
      cleanPath = match[1];
    } else {
      const parts = urlOrPath.split('/');
      cleanPath = `${parts[parts.length - 2]}/${parts[parts.length - 1]}`;
    }
  }

  try {
    const { error } = await client.storage.from(BUCKET_NAME).remove([cleanPath]);
    if (error) {
      console.error(`[CloudStorage] Delete failed for '${cleanPath}':`, error.message);
      return false;
    }
    return true;
  } catch (err: any) {
    console.error(`[CloudStorage] Exception deleting '${cleanPath}':`, err?.message || err);
    return false;
  }
}
