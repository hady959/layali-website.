import initSqlJs, { Database } from 'sql.js';
import fs from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'layali.db');
const JSON_MIGRATION_FILE = path.join(DATA_DIR, 'siteData.json');

// Ensure data directory exists
fs.mkdirSync(DATA_DIR, { recursive: true });

let dbInstance: Database | null = null;

/**
 * Reset / reload database from disk
 */
export async function reloadDatabase(): Promise<Database> {
  dbInstance = null;
  return getDatabase();
}

/**
 * Initialize SQLite Database with schema and automatic migration
 */
export async function getDatabase(): Promise<Database> {
  if (dbInstance) {
    return dbInstance;
  }

  const SQL = await initSqlJs();

  if (fs.existsSync(DB_FILE)) {
    try {
      const fileBuffer = fs.readFileSync(DB_FILE);
      if (fileBuffer.length > 0) {
        dbInstance = new SQL.Database(fileBuffer);
      } else {
        dbInstance = new SQL.Database();
      }
    } catch (e) {
      console.error('Failed to load existing SQLite database file. Creating safety copy before recovery:', e);
      try {
        const corruptBackup = path.join(DATA_DIR, `layali-corrupt-backup-${Date.now()}.db`);
        fs.copyFileSync(DB_FILE, corruptBackup);
        console.log(`Saved corrupted database backup to: ${corruptBackup}`);
      } catch (_) {}
      dbInstance = new SQL.Database();
    }
  } else {
    dbInstance = new SQL.Database();
  }

  // Create core relational and metadata tables
  dbInstance.run(`
    CREATE TABLE IF NOT EXISTS site_settings (
      id TEXT PRIMARY KEY,
      data TEXT NOT NULL,
      updated_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS uploads (
      id TEXT PRIMARY KEY,
      filename TEXT NOT NULL,
      original_name TEXT,
      media_type TEXT NOT NULL,
      file_path TEXT NOT NULL,
      url TEXT NOT NULL,
      size_bytes INTEGER,
      mime_type TEXT,
      created_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS sections (
      section_id TEXT PRIMARY KEY,
      title TEXT,
      subtitle TEXT,
      config_json TEXT,
      updated_at INTEGER NOT NULL
    );
  `);

  // Run initial migration from siteData.json or default if empty
  await migrateFromJsonIfNeeded(dbInstance);

  saveDatabaseToFile();
  return dbInstance;
}

/**
 * Persist in-memory SQLite buffer safely to disk
 */
export function saveDatabaseToFile(): void {
  if (!dbInstance) return;
  try {
    const data = dbInstance.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(DB_FILE, buffer);
  } catch (err) {
    console.error('Failed to write SQLite database to disk:', err);
  }
}

/**
 * Migrate existing JSON file if present and site_settings is empty
 */
async function migrateFromJsonIfNeeded(db: Database) {
  try {
    const stmt = db.prepare("SELECT data FROM site_settings WHERE id = 'main'");
    const hasData = stmt.step();
    stmt.free();

    if (!hasData) {
      let initialData: any = null;

      // 1. Try reading siteData.json if exists
      if (fs.existsSync(JSON_MIGRATION_FILE)) {
        try {
          const raw = fs.readFileSync(JSON_MIGRATION_FILE, 'utf-8');
          initialData = JSON.parse(raw);
          console.log('Migrating existing siteData.json into SQLite...');
        } catch (e) {
          console.warn('Could not parse siteData.json for migration:', e);
        }
      }

      // 2. If still empty, seed with standard defaults
      if (!initialData) {
        initialData = {
          recipient: {
            name: 'ليالي',
            englishName: 'Layali',
            arrivalDate: '2008-06-22',
            arrivalDisplay: '22 / 06 / 2008',
            arrivalTitle: 'يوم أشرقت فيه حياتي',
            arrivalNote: 'في اليوم ده، حضر أجمل كائن لدنياي... ولم أكن أعلم أن هذا التاريخ سيتحول لأرق وأعز التفاصيل في حياتي.'
          },
          sender: {
            name: 'هادي',
            englishName: 'Hadi',
            signature: '— هادي'
          },
          relationship: {
            startDate: '2026-08-16T00:00:00',
            startDateDisplay: '16 أغسطس 2026',
            heroSubtitle: 'من يوم 16 أغسطس 2026... بقى للتاريخ معنى مختلف.',
            counterTitle: 'منذ اليوم الذي بدأ فيه كل شيء...',
            counterSubtitle: 'وكل ثانية جاية... لسه بنكتبها مع بعض.'
          },
          security: {
            passDay: '16',
            passMonth: '8',
            passYear: '2026',
            adminPassDay: '11',
            adminPassMonth: '1',
            adminPassYear: '1111',
            gateTitle: 'هذا المكان لكِ وحدكِ',
            gateSubtitle: 'أدخلي التاريخ الذي بدأ فيه كل شيء',
            errorMessage: 'مممم... جربي تفتكري اليوم اللي بدأ فيه كل شيء.',
            hintMessage: 'تاريخ اليوم الذي غيّر مجرى كل الحكايات (يوم 16 من شهر 8 عام 2026)'
          },
          intro: {
            lines: [
              'إلى ليالي...',
              'صنعت لكِ مكانًا صغيرًا...',
              'يسع كل شيء لا أعرف كيف أقوله.'
            ],
            buttonText: 'ادخلي إلى عالمنا',
            badgeText: 'ختم العشق الأبدي',
            stampingTitle: 'رسالة خاصة واستثنائية',
            stampingSubtitle: 'خُتِمت بكل تفاصيلها من أجلكِ',
            monogramText: 'H & L',
            monogramSubtext: 'FOREVER',
            welcomeTitle: 'مرحباً بكِ في عالمنا'
          },
          memories: {
            title: 'مقتطفات وذكريات',
            subtitle: 'كل لقطة وكل تفصيلة تحمل بين طياتها أثرك الهادئ الجميل',
            displayCount: 6,
            items: []
          },
          timeline: {
            title: 'محطات حكايتنا',
            subtitle: 'خط زمني يحكي كيف أصبح للوقت طعم آخر',
            milestones: []
          },
          letter: {
            title: 'رسالة من القلب',
            subtitle: 'كلمات خُطّت بكل صدق وعفوية',
            paragraphs: [
              'ليالي، أنا مش عارف أقول الكلام ده بطريقة مثالية، بس يمكن مش لازم يكون مثالي... المهم يكون حقيقي.',
              'من يوم 16 أغسطس 2026، بدأت حكاية جديدة تماماً بالنسبة لي. حكاية علمتني إن الصدف الجميلة ممكن تغيّر إحساسنا بكل التفاصيل اللي حوالينا، وأنا مبسوط وممتن جداً إن أول صفحة فيها كانت باسمك.',
              'وجودكِ في حياتي أصبح النور الهادئ اللي بيطمن، والصوت اللي بيهدي أي قلق، والاسم اللي لما بيخطر على بالي بيبتسم قلبي قبلي.',
              'أتمنى لكِ في كل لحظة قادمة سعادة تشبه نقاء قلبك، وراحة تسع روحك الجميلة، وتفضلي دايماً الشخص اللي بينوّر كل مكان يمر فيه.'
            ],
            closing: 'كل سنة وإنتِ طيبة، وكل ثانية وإنتِ أجمل صدفة في عمري.',
            signature: '— هادي',
            date: '16 أغسطس 2026 وما بعدها'
          },
          audio: {
            trackTitle: '',
            artist: '',
            defaultVolume: 0.65,
            audioSrc: ''
          }
        };
      }

      db.run("INSERT OR REPLACE INTO site_settings (id, data, updated_at) VALUES ('main', ?, ?)", [
        JSON.stringify(initialData),
        Date.now()
      ]);
    }
  } catch (err) {
    console.error('Migration error:', err);
  }
}
