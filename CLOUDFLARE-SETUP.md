# 🌐 دليل إعداد واستخدام Cloudflare Tunnel للوصول العالمي
# Cloudflare Tunnel Setup Guide for Layali

يمكّنك هذا الدليل من ربط مشروع **LAYALI** بنفق سحابي آمن ومشفر عبر **Cloudflare Tunnel** للوصول إلى الموقع من **أي جهاز ومن أي دولة في العالم** عبر رابط HTTPS عام وثابت، مع بقاء كافة ملفات الوسائط وقاعدة البيانات مخزنة حصرياً على قرص حاسوبك المحلي.

---

## 🏛️ بنية الاتصال والأمان (Architecture)

```
[ زائر من أي دولة في العالم / هاتف أو كمبيوتر ]
                   │
                   ▼ (HTTPS مشفر)
        [ شبكة Cloudflare العالمية ]
                   │
                   ▼ (نفق سحابي آمن مشفر بدون فتح منافذ)
       [ Cloudflare Tunnel (cloudflared) ]
                   │
                   ▼ (اتصال محلي)
      [ جهازك الشخصي Windows (localhost:3000) ]
                   │
    ┌──────────────┴──────────────┐
    ▼                             ▼
[ قاعدة بيانات SQLite ]    [ مجلد uploads/ للصور والصوت ]
(data/layali.db)          (uploads/images, audio, videos)
```

### ✨ مميزات هذا الأسلوب:
1. **أمان تام:** لا حاجة لفتح منافذ في الراوتر (No Port Forwarding) ولا فتح المنفذ 3000 في جدار الحماية للإنترنت.
2. **شهادة SSL مجانية وتلقائية:** اتصال دائم وآمن ببروتوكول `https://`.
3. **ثبات وسرعة:** حماية متقدمة من هجمات DDoS وتسريع تحميل الصور والملفات عبر شبكة التوزيع السحابي (CDN).
4. **تخزين محلي 100%:** جميع الصور، المقاطع الصوتية، الفيديوهات، وقاعدة بيانات `layali.db` تظل على جهازك ولا تُرفع لأي سيرفر سحابي خارجي.

---

## 🚀 الطريقة الأولى: رابط دائم بنطاق خاص (Custom Domain - مستحسن)

إذا كان لديك نطاق خاص (مثل `layali.yourdomain.com`):

### الخطوة 1: تثبيت أداة `cloudflared.exe`
يقوم ملف `START-LAYALI-PUBLIC.bat` بتحميل الأداة تلقائياً عند أول تشغيل، أو يمكنك تحميلها يدوياً:
- حمّل ملف `cloudflared-windows-amd64.exe` من: [Cloudflare Releases](https://github.com/cloudflare/cloudflared/releases/latest)
- أعد تسمية الملف إلى `cloudflared.exe` وضعه مباشرة داخل مجلد المشروع الرئيسي `C:\Layali\cloudflared.exe`.

### الخطوة 2: إنشاء النفق في لوحة Cloudflare
1. سجّل الدخول إلى حسابك في [Cloudflare Dashboard](https://dash.cloudflare.com/).
2. انتقل إلى القائمة الجانبية: **Zero Trust** -> **Networks** -> **Tunnels**.
3. اضغط على **Add a tunnel** (أو **Create Tunnel**).
4. اختر نوع الموصل: **Cloudflared**.
5. اكتب اسماً للنفق، مثلاً: `layali-tunnel`.
6. ستظهر لك صفحة تحتوي على أمر التثبيت؛ انسخ رمز الـ **Token** فقط (وهو الرمز الطويل الذي يبدأ بـ `eyJh...`).

### الخطوة 3: إعداد المسار العام (Public Hostname)
في نفس صفحة إعداد النفق:
1. اضغط على تبويب **Public Hostname** ثم **Add a public hostname**.
2. حدد النطاق الفرعي والنطاق (مثال: Subdomain: `layali` ، Domain: `yourdomain.com`).
3. في حقل **Service**:
   - **Type:** اختر `HTTP`
   - **URL:** اكتب `localhost:3000`
4. اضغط **Save Tunnel**.

### الخطوة 4: وضع الإعدادات في ملف `.env`
افتح ملف `.env` في مجلد المشروع (أو أنشئه من `.env.example`) وضع الرمز والرابط:
```env
PORT=3000
NODE_ENV=production
PUBLIC_URL=https://layali.yourdomain.com
TUNNEL_TOKEN=eyJhbGciOi...ضع_الرمز_هنا
```

### الخطوة 5: التشغيل
اضغط مرتين على:
👉 `START-LAYALI-PUBLIC.bat`

سيعمل الموقع وسيرتبط تلقائياً برابطك العالمي `https://layali.yourdomain.com` ويفتح في المتصفح!

---

## ⚡ الطريقة الثانية: النفق السريع المجاني الفوري (Quick Tunnel - بدون نطاق)

إذا لم يكن لديك دومين أو حساب Cloudflare وتريد رابطاً عالمياً فورياً:

1. تأكد من وجود `cloudflared.exe` في مجلد المشروع (سيحمله المشروع تلقائياً).
2. اضغط مرتين على:
   👉 `START-LAYALI-PUBLIC.bat`
3. سيقوم المشروع بإنشاء رابط عشوائي مجاني وفوري مثل:
   `https://random-romantic-words.trycloudflare.com`
4. انسخ هذا الرابط وشاركه مع أي شخص حول العالم لفتح الموقع مباشرة.

---

## 🔄 التشغيل التلقائي مع بدء تشغيل الكمبيوتر

لجعل السيرفر ونفق Cloudflare يعملان معاً في الخلفية تلقائياً عند تشغيل جهازك:
1. اضغط مرتين على:
   👉 `INSTALL-AUTO-START.bat`
2. وافق على صلاحيات المسؤول (Run as Administrator).
3. سيسجل الويندوز مهمة مجدولة تشغل السيرفر والنفق في الخلفية (بدون نوافذ منبثقة) فور تسجيل دخولك.

لإلغاء التشغيل التلقائي:
👉 `UNINSTALL-AUTO-START.bat`

---

## 🛠️ استكشاف الأخطاء وحالة النظام

- لمعرفة حالة السيرفر والرابط العام الحالي:
  👉 `SHOW-LAYALI-STATUS.bat`
- لإيقاف السيرفر والنفق معاً:
  👉 `STOP-LAYALI.bat`
- لإعادة التشغيل:
  👉 `RESTART-LAYALI.bat`
- سجلات تشغيل النفق تجدها في:
  `logs/tunnel.log` و `logs/tunnel-error.log`
- سجلات السيرفر تجدها في:
  `logs/server.log` و `logs/server-error.log`
