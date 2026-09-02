export interface IDataRepository {
  getSiteData(): Promise<any | null>;
  saveSiteData(data: any): Promise<boolean>;
  recordUpload?(upload: {
    id: string;
    filename: string;
    originalName?: string;
    mediaType: string;
    filePath: string;
    url: string;
    sizeBytes?: number;
    mimeType?: string;
  }): Promise<boolean>;
  getUploads?(mediaType?: string): Promise<any[]>;
  deleteUploadRecord?(urlOrFilename: string): Promise<boolean>;
  verifyPassword(
    day: string | number,
    month: string | number,
    year: string | number
  ): Promise<{ success: boolean; role?: 'main' | 'admin'; token?: string; error?: string }>;
}
