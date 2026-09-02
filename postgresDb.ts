import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { defaultSiteData } from './data/siteData';

const { Pool } = pg;

let poolInstance: pg.Pool | null = null;
let isSchemaInitialized = false;

/**
 * Check if PostgreSQL connection URL is configured in environment variables
 */
export function isPostgresConfigured(): boolean {
  const url = process.env.DATABASE_URL || process.env.POSTGRES_URL;
  return Boolean(url && url.trim().length > 0);
}

/**
 * Get or create PostgreSQL Connection Pool
 */
export function getPostgresPool(): pg.Pool | null {
  if (!isPostgresConfigured()) {
    return null;
  }

  if (poolInstance) {
    return poolInstance;
  }

  const connectionString = (process.env.DATABASE_URL || process.env.POSTGRES_URL)!.trim();
  const isLocal = connectionString.includes('localhost') || connectionString.includes('127.0.0.1');

  poolInstance = new Pool({
    connectionString,
    ssl: isLocal ? false : { rejectUnauthorized: false },
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
  });

  poolInstance.on('error', (err) => {
    console.error('Unexpected PostgreSQL client error:', err);
  });

  return poolInstance;
}

/**
 * Initialize PostgreSQL Schema (Tables & Default Seed) automatically on boot
 */
export async function initPostgresSchema(): Promise<boolean> {
  const pool = getPostgresPool();
  if (!pool) {
    return false;
  }

  if (isSchemaInitialized) {
    return true;
  }

  try {
    const client = await pool.connect();
    try {
      // 1. Create Core Tables
      await client.query(`
        CREATE TABLE IF NOT EXISTS site_settings (
          id VARCHAR(64) PRIMARY KEY,
          data JSONB NOT NULL,
          updated_at BIGINT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS uploads (
          id VARCHAR(64) PRIMARY KEY,
          filename TEXT NOT NULL,
          original_name TEXT,
          media_type VARCHAR(32) NOT NULL,
          file_path TEXT NOT NULL,
          url TEXT NOT NULL,
          size_bytes BIGINT,
          mime_type VARCHAR(128),
          created_at BIGINT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS sections (
          section_id VARCHAR(64) PRIMARY KEY,
          title TEXT,
          subtitle TEXT,
          config_json JSONB,
          updated_at BIGINT NOT NULL
        );
      `);

      // 2. Check if site_settings already contains 'main' record
      const checkRes = await client.query("SELECT id FROM site_settings WHERE id = 'main' LIMIT 1");
      if (checkRes.rows.length === 0) {
        let initialData: any = defaultSiteData;

        try {
          // Attempt migration from Supabase Storage backup first
          const { isCloudStorageEnabled, getSupabaseClient } = await import('./cloudStorage');
          if (isCloudStorageEnabled()) {
            const supabase = getSupabaseClient();
            const bucket = (process.env.SUPABASE_BUCKET || 'layali-uploads').trim();
            if (supabase) {
              const { data, error } = await supabase.storage.from(bucket).download('db/siteData.json');
              if (!error && data) {
                const text = await data.text();
                const parsed = JSON.parse(text);
                if (parsed && typeof parsed === 'object') {
                  initialData = parsed;
                  console.log('[PostgreSQL-Migration] Successfully migrated data from Supabase SQLite backup.');
                }
              }
            }
          }
        } catch (e) {
          console.log('[PostgreSQL-Migration] No cloud backup found or failed to load.', e);
        }

        // Fallback to local JSON if cloud isn't available and data wasn't updated
        if (initialData === defaultSiteData) {
          const localJson = path.join(process.cwd(), 'data', 'siteData.json');
          if (fs.existsSync(localJson)) {
            try {
              const raw = fs.readFileSync(localJson, 'utf-8');
              initialData = JSON.parse(raw);
              console.log('[PostgreSQL-Migration] Migrated data from local siteData.json.');
            } catch (_) {}
          }
        }

        await client.query(
          "INSERT INTO site_settings (id, data, updated_at) VALUES ('main', $1, $2) ON CONFLICT (id) DO NOTHING",
          [JSON.stringify(initialData), Date.now()]
        );
        console.log('[PostgreSQL] Initialized site_settings with initial data');
      }

      isSchemaInitialized = true;
      console.log('[PostgreSQL] Schema verified and ready for cloud persistence');
      return true;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('[PostgreSQL] Failed to initialize database schema:', error);
    return false;
  }
}
