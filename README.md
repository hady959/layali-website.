# 🌸 LAYALI — A Story Worth Remembering
### دليل التشغيل السحابي على Railway والاستضافة العالمية الدائمة

---

## ☁️ 1. النشر السحابي على Railway (Railway Cloud Deployment)

المشروع مُهيأ بالكامل ليعمل على سحابة **Railway** بشكل مستقل ودائم 24/7 دون الحاجة لبقاء حاسوبك الشخصي مشغلاً.

### خطوات الرفع والنشر في 3 خطوات بسيطة:

1. **إنشاء مشروع جديد على Railway:**
   * افتح [Railway.app](https://railway.app) وسجّل الدخول.
   * اضغط على **New Project** واختر **Deploy from GitHub repo** (أو ارفع المشروع مباشرة عبر Railway CLI).

2. **إضافة قاعدة بيانات PostgreSQL (نقرة واحدة):**
   * في لوحة تحكم مشروعك على Railway، اضغط على **+ New** ثم اختر **Database -> Add PostgreSQL**.
   * سيقوم Railway تلقائياً بتعيين متغير البيئة `DATABASE_URL` للمشروع لربطه بقاعدة البيانات السحابية الدائمة.

3. **إعداد التخزين السحابي للوسائط (Supabase Storage):**
   * افتح [Supabase.com](https://supabase.com) وأنشئ مشروعاً مجانياً.
   * في لوحة تحكم Supabase، اذهب إلى **Storage** وتأكد من وجود Bucket باسم `layali-uploads` واجعله **Public**.
   * انسخ الـ `Project URL` والـ `anon / service_role key` وضعها في متغيرات بيئة Railway (Variables):
     ```env
     SUPABASE_URL=https://your-project.supabase.co
     SUPABASE_KEY=your-supabase-key
     SUPABASE_BUCKET=layali-uploads
     ```

4. **نقل البيانات القديمة إلى السحابة (إن رغبت بنقل ملفاتك الحالية):**
   * لتمرير قاعدة البيانات المحلية السابقة `data/layali.db` وجميع ملفات `uploads/` إلى السحابة بنقرة واحدة بدون تكرار، شغّل محلياً:
     ```bash
     npm run migrate:cloud
     ```

---

## ⚙️ أوامر الإنتاج والبناء (Production Commands)

```bash
# تثبيت الحزم
npm install

# بناء ملفات الواجهة والسيرفر
npm run build

# تشغيل السيرفر في وضع الإنتاج
npm start

# هجرة البيانات إلى قاعدة البيانات والتخزين السحابي
npm run migrate:cloud
```

---

## 🗂️ هيكل التخزين والبيانات في الوضعين (Cloud vs Local)

* **الوضع السحابي (Railway / Cloud Mode):**
  * قاعدة البيانات: **PostgreSQL** عبر `DATABASE_URL`
  * وسائط الصور والموسيقى والفيديوهات: **Supabase Cloud Storage** عبر `SUPABASE_URL` و `SUPABASE_KEY`
  * التزامن الحي: **WebSockets** مدمج يعمل تلقائياً عبر جميع الشاشات.

* **الوضع المحلي على Windows (Local Mode):**
  * قاعدة البيانات: `data/layali.db` (SQLite)
  * وسائط الصور والموسيقى: `uploads/`
  * النفق العالمي: `START-LAYALI-PUBLIC.bat` (Cloudflare Tunnel)

---

## 🗂️ هيكل المجلدات والتخزين داخل المشروع (Folder Architecture)

عند وضع المشروع في مجلد واحد (مثلاً `C:\Layali\`):

```text
C:\Layali\
├── START-LAYALI.bat            # تشغيل السيرفر محلياً على الكمبيوتر (localhost:3000)
├── START-LAYALI-PUBLIC.bat     # تشغيل السيرفر مع نفق Cloudflare للوصول العالمي عبر الإنترنت
├── SHOW-LAYALI-STATUS.bat      # عرض حالة السيرفر والرابط المحلي والرابط العام
├── STOP-LAYALI.bat             # إيقاف السيرفر ونفق Cloudflare بأمان
├── RESTART-LAYALI.bat          # إعادة تشغيل السيرفر والنفق
├── INSTALL-AUTO-START.bat      # تثبيت التشغيل التلقائي مع بدء تشغيل Windows
├── UNINSTALL-AUTO-START.bat    # إلغاء التشغيل التلقائي
├── backup-now.bat              # أخذ نسخة احتياطية فورية شاملة
├── RESTORE-LAYALI.bat          # معالج استعادة نسخة احتياطية سابقة
├── CLOUDFLARE-SETUP.md         # دليل إعداد دومين خاص على Cloudflare
│
├── data\                       # قاعدة بيانات SQLite الدائمة
│   └── layali.db               # (بيانات الموقع، سجلات الوسائط، الإعدادات)
├── uploads\                    # كافة الوسائط المرفوعة فعلياً على القرص
│   ├── images\                 # الصور (مضغوطة تلقائياً إلى WebP)
│   ├── audio\                  # المقاطع الصوتية (محولة إلى MP3 عالية الجودة)
│   ├── videos\                 # الفيديوهات المرفوعة
│   └── temp\                   # مجلد مؤقت للمعالجة يُنظف تلقائياً
├── backups\                    # النسخ الاحتياطية المؤرشفة
├── logs\                       # سجلات التشغيل والأخطاء (server.log, tunnel.log)
├── dist\                       # ملفات الـ Production المبنية المجمعة
└── config\                     # ملفات الإعدادات والرموز
```

---

## 🚀 1. التشغيل والوصول عبر الإنترنت (Global Internet Access)

لتشغيل السيرفر وإتاحته من **أي دولة في العالم عبر الإنترنت**:

👉 **اضغط مرتين على:**
```bat
START-LAYALI-PUBLIC.bat
```

### ماذا يفعل هذا الملف تلقائياً؟
1. يتحقق من Node.js والاعتماديات وملفات البناء `dist/`.
2. يشغل سيرفر ليالي الإنتاجي في الخلفية على `http://localhost:3000`.
3. يتحقق من وجود أداة `cloudflared.exe` (ويحملها تلقائياً إذا لم تكن موجودة).
4. يفتح نفقاً مشفراً عبر **Cloudflare Tunnel** (سواء بدومين خاص أو كنفق سريع مجاني).
5. يعرض الرابط العام `https://...` ويفتحه في المتصفح تلقائياً.

---

## 💻 2. التشغيل المحلي فقط (Local Access Only)

إذا كنت ترغب بتشغيل الموقع محلياً على جهازك فقط:

👉 **اضغط مرتين على:**
```bat
START-LAYALI.bat
```
* الرابط المحلي الدائم: `http://localhost:3000`
* لن يفتح نسخة ثانية إذا كان السيرفر يعمل بالفعل.

---

## 📊 3. فحص حالة السيرفر والرابط العام (Check Status)

لمعرفة حالة السيرفر والرابط العام ورابط الإدارة المحلية وعدد الملفات:

👉 **اضغط مرتين على:**
```bat
SHOW-LAYALI-STATUS.bat
```

---

## 🔄 4. التشغيل التلقائي مع إقلاع الويندوز (Windows Auto-Start)

لتشغيل السيرفر ونفق Cloudflare في الخلفية تلقائياً فور تشغيل الكمبيوتر:

👉 **اضغط مرتين على:**
```bat
INSTALL-AUTO-START.bat
```
*(وافق على صلاحيات المسؤول عند طلبها)*.

لإلغاء التشغيل التلقائي لاحقاً:
👉 **اضغط مرتين على:**
```bat
UNINSTALL-AUTO-START.bat
```

---

## 💾 5. التخزين الدائم والنسخ الاحتياطي (Data Persistence & Backups)

### أين توجد بياناتي وملفاتي؟
* **قاعدة البيانات:** `data/layali.db`
* **الصور:** `uploads/images/`
* **الموسيقى:** `uploads/audio/`
* **الفيديوهات:** `uploads/videos/`

### ماذا يحدث عند إغلاق الكمبيوتر أو انقطاع الكهرباء؟
* لا يتم مسح أي ملف، وقاعدة بيانات `layali.db` تحفظ التعديلات لحظياً.
* عند تشغيل الجهاز مجدداً، يعود كل شيء كما كان تماماً وتظهر جميع الصور والأغاني والتعديلات السابقة.

### أخذ نسخة احتياطية فورية:
👉 اضغط مرتين على `backup-now.bat` لإنشاء أرشيف كامل يتضمن قاعدة البيانات وجميع ملفات `uploads/` داخل مجلد `backups/`.

### استعادة نسخة احتياطية:
👉 اضغط مرتين على `RESTORE-LAYALI.bat` واتبع التعليمات لاسترجاع البيانات والوسائط من أي نسخة سابقة بأمان تام.

---

## 🌐 6. ربط نطاق خاص دائم (Custom Domain Setup)

لربط دومينك الخاص (مثل `https://layali.yourdomain.com`)، راجع الدليل التفصيلي في:
📄 **`CLOUDFLARE-SETUP.md`**

---

## 🛑 7. إيقاف وإعادة تشغيل السيرفر

* لإيقاف السيرفر والنفق معاً:
  👉 `STOP-LAYALI.bat`
* لإعادة التشغيل:
  👉 `RESTART-LAYALI.bat`

---

## 🔧 8. استكشاف الأخطاء وحلها (Troubleshooting)

| المشكلة | السبب المحتمل | الحل |
| :--- | :--- | :--- |
| `Node.js is not installed` | عدم تثبيت Node.js | قم بتحميل وتثبيت Node.js LTS من [nodejs.org](https://nodejs.org/). |
| `LAYALI SERVER FAILED TO START` | خطأ في البناء أو المنفذ | افتح `logs/server-error.log` لقراءة سبب الخطأ بدقة. |
| `FFmpeg missing` | عدم وجود FFmpeg في PATH | حمّل FFmpeg وأضف مجلد `bin` الخاص به لمتغيرات البيئة PATH لمعالجة الصوت. |
| الرابط العام لا يفتح من الهاتف | توقف نفق Cloudflare | شغّل `START-LAYALI-PUBLIC.bat` وتأكد من اتصال الإنترنت. |
