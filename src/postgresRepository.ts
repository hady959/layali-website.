import { IDataRepository } from './repository';
import { getPostgresPool, initPostgresSchema } from './postgresDb';
import { defaultSiteData } from './data/siteData';
import crypto from 'crypto';

const AUTH_SECRET = process.env.AUTH_SECRET || 'layali_romantic_secret_key_2026';

export class PostgresDataRepository implements IDataRepository {
  private async ensureInitialized() {
    await initPostgresSchema();
  }

  async getSiteData(): Promise<any | null> {
    try {
      await this.ensureInitialized();
      const pool = getPostgresPool();
      if (!pool) return defaultSiteData;

      const result = await pool.query("SELECT data FROM site_settings WHERE id = 'main' LIMIT 1");
      if (result.rows.length > 0) {
        const rowData = result.rows[0].data;
        return typeof rowData === 'string' ? JSON.parse(rowData) : rowData;
      }
      return defaultSiteData;
    } catch (err) {
      console.error('PostgresDataRepository: Failed to get site data:', err);
      return defaultSiteData;
    }
  }

  async saveSiteData(data: any): Promise<boolean> {
    try {
      await this.ensureInitialized();
      const pool = getPostgresPool();
      if (!pool) return false;

      const jsonStr = JSON.stringify(data);
      const updatedAt = Date.now();

      await pool.query(
        `INSERT INTO site_settings (id, data, updated_at) 
         VALUES ('main', $1, $2)
         ON CONFLICT (id) 
         DO UPDATE SET data = EXCLUDED.data, updated_at = EXCLUDED.updated_at`,
        [jsonStr, updatedAt]
      );
      return true;
    } catch (err) {
      console.error('PostgresDataRepository: Failed to save site data:', err);
      return false;
    }
  }

  async recordUpload(upload: {
    id: string;
    filename: string;
    originalName?: string;
    mediaType: string;
    filePath: string;
    url: string;
    sizeBytes?: number;
    mimeType?: string;
  }): Promise<boolean> {
    try {
      await this.ensureInitialized();
      const pool = getPostgresPool();
      if (!pool) return false;

      await pool.query(
        `INSERT INTO uploads (id, filename, original_name, media_type, file_path, url, size_bytes, mime_type, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         ON CONFLICT (id)
         DO UPDATE SET filename = EXCLUDED.filename, url = EXCLUDED.url, size_bytes = EXCLUDED.size_bytes`,
        [
          upload.id,
          upload.filename,
          upload.originalName || '',
          upload.mediaType,
          upload.filePath,
          upload.url,
          upload.sizeBytes || 0,
          upload.mimeType || '',
          Date.now(),
        ]
      );
      return true;
    } catch (err) {
      console.error('PostgresDataRepository: Failed to record upload in Postgres:', err);
      return false;
    }
  }

  async getUploads(mediaType?: string): Promise<any[]> {
    try {
      await this.ensureInitialized();
      const pool = getPostgresPool();
      if (!pool) return [];

      let query = 'SELECT * FROM uploads ORDER BY created_at DESC';
      let params: any[] = [];

      if (mediaType) {
        query = 'SELECT * FROM uploads WHERE media_type = $1 ORDER BY created_at DESC';
        params = [mediaType];
      }

      const result = await pool.query(query, params);
      return result.rows.map((row) => ({
        id: row.id,
        filename: row.filename,
        original_name: row.original_name,
        media_type: row.media_type,
        file_path: row.file_path,
        url: row.url,
        size_bytes: Number(row.size_bytes || 0),
        mime_type: row.mime_type,
        created_at: Number(row.created_at),
      }));
    } catch (err) {
      console.error('PostgresDataRepository: Failed to get uploads:', err);
      return [];
    }
  }

  async deleteUploadRecord(urlOrFilename: string): Promise<boolean> {
    try {
      await this.ensureInitialized();
      const pool = getPostgresPool();
      if (!pool) return false;

      await pool.query('DELETE FROM uploads WHERE url = $1 OR filename = $1', [urlOrFilename]);
      return true;
    } catch (err) {
      console.error('PostgresDataRepository: Failed to delete upload record from Postgres:', err);
      return false;
    }
  }

  async verifyPassword(
    day: string | number,
    month: string | number,
    year: string | number
  ): Promise<{ success: boolean; role?: 'main' | 'admin'; token?: string; error?: string }> {
    let siteData = defaultSiteData;
    try {
      siteData = (await this.getSiteData()) || defaultSiteData;
    } catch (_) {
      siteData = defaultSiteData;
    }
    const security = siteData.security || defaultSiteData.security;

    const cleanDay = parseInt(String(day), 10);
    const cleanMonth = parseInt(String(month), 10);
    const cleanYear = parseInt(String(year), 10);

    const expectedMainDay = parseInt(process.env.PASS_DAY || security.passDay || '16', 10);
    const expectedMainMonth = parseInt(process.env.PASS_MONTH || security.passMonth || '8', 10);
    const expectedMainYear = parseInt(process.env.PASS_YEAR || security.passYear || '2026', 10);

    const expectedAdminDay = parseInt(process.env.ADMIN_PASS_DAY || security.adminPassDay || '11', 10);
    const expectedAdminMonth = parseInt(process.env.ADMIN_PASS_MONTH || security.adminPassMonth || '1', 10);
    const expectedAdminYear = parseInt(process.env.ADMIN_PASS_YEAR || security.adminPassYear || '1111', 10);

    if (
      cleanDay === expectedMainDay &&
      cleanMonth === expectedMainMonth &&
      cleanYear === expectedMainYear
    ) {
      const token = crypto
        .createHmac('sha256', AUTH_SECRET)
        .update(`user-main-${Date.now()}-${cleanDay}-${cleanMonth}-${cleanYear}`)
        .digest('hex');

      return { success: true, role: 'main', token };
    }

    if (
      cleanDay === expectedAdminDay &&
      cleanMonth === expectedAdminMonth &&
      cleanYear === expectedAdminYear
    ) {
      const token = crypto
        .createHmac('sha256', AUTH_SECRET)
        .update(`user-admin-${Date.now()}-${cleanDay}-${cleanMonth}-${cleanYear}`)
        .digest('hex');

      return { success: true, role: 'admin', token };
    }

    return {
      success: false,
      error: security.errorMessage || 'تاريخ غير صحيح... جربي تفتكري اليوم اللي بدأ فيه كل شيء.',
    };
  }
}
