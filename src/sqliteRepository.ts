import { IDataRepository } from './repository';
import { getDatabase, saveDatabaseToFile } from './db';
import crypto from 'crypto';
import { isCloudStorageEnabled, getSupabaseClient } from './cloudStorage';

const AUTH_SECRET = process.env.AUTH_SECRET || 'layali_romantic_secret_key_2026';

export class SqliteDataRepository implements IDataRepository {
  async getSiteData(): Promise<any | null> {
    try {

      const db = await getDatabase();
      const stmt = db.prepare("SELECT data FROM site_settings WHERE id = 'main'");
      if (stmt.step()) {
        const row = stmt.getAsObject();
        stmt.free();
        return JSON.parse(row.data as string);
      }
      stmt.free();
      return null;
    } catch (err) {
      console.error('SqliteDataRepository: Failed to get site data:', err);
      return null;
    }
  }

  async saveSiteData(data: any): Promise<boolean> {
    try {
      const db = await getDatabase();
      db.run("INSERT OR REPLACE INTO site_settings (id, data, updated_at) VALUES ('main', ?, ?)", [
        JSON.stringify(data),
        Date.now(),
      ]);
      saveDatabaseToFile();

      return true;
    } catch (err) {
      console.error('SqliteDataRepository: Failed to save site data:', err);
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
      const db = await getDatabase();
      db.run(
        `INSERT OR REPLACE INTO uploads 
        (id, filename, original_name, media_type, file_path, url, size_bytes, mime_type, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
      saveDatabaseToFile();
      return true;
    } catch (err) {
      console.error('SqliteDataRepository: Failed to record upload:', err);
      return false;
    }
  }

  async getUploads(mediaType?: string): Promise<any[]> {
    try {
      const db = await getDatabase();
      let sql = 'SELECT * FROM uploads ORDER BY created_at DESC';
      let params: any[] = [];

      if (mediaType) {
        sql = 'SELECT * FROM uploads WHERE media_type = ? ORDER BY created_at DESC';
        params = [mediaType];
      }

      const stmt = db.prepare(sql);
      if (params.length > 0) stmt.bind(params);

      const rows: any[] = [];
      while (stmt.step()) {
        rows.push(stmt.getAsObject());
      }
      stmt.free();
      return rows;
    } catch (err) {
      console.error('SqliteDataRepository: Failed to get uploads:', err);
      return [];
    }
  }

  async deleteUploadRecord(urlOrFilename: string): Promise<boolean> {
    try {
      const db = await getDatabase();
      db.run('DELETE FROM uploads WHERE url = ? OR filename = ?', [urlOrFilename, urlOrFilename]);
      saveDatabaseToFile();
      return true;
    } catch (err) {
      console.error('SqliteDataRepository: Failed to delete upload record:', err);
      return false;
    }
  }

  async verifyPassword(
    day: string | number,
    month: string | number,
    year: string | number
  ): Promise<{ success: boolean; role?: 'main' | 'admin'; token?: string; error?: string }> {
    const siteData = (await this.getSiteData()) || {};
    const security = siteData.security || {};

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
