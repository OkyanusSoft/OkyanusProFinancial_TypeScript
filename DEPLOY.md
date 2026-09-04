# 📘 دليل النشر والتثبيت — النظام المالي المتكامل والشامل
### نظام محاسبي مالي إداري إنتاجي يتكيف مع جميع الأنشطة التجارية v3.0 | أوكيانوس سوفت — Okyanus Soft

دليل عملي كامل لتشغيل النظام (الواجهة الأمامية + الخادم المركزي + قاعدة MySQL) على:
- **الجزء الأول**: سيرفر محلي — Windows 11 / 10 (الشبكة الداخلية للمنشأة — نقاط بيع، حسابات، إدارة)
- **الجزء الثاني**: سيرفر خارجي — استضافة cPanel (إدارة مركزية لعدة فروع وأنشطة)

> 💡 **قاعدة ذهبية**: الخادم المركزي (Backend) هو قلب المزامنة اللحظية — كل كاشير/محاسب/مدير يتصل به، وما يُدخله أي جهاز يظهر للبقية خلال ثوانٍ. لذلك يُثبَّت الخادم أولاً ثم الواجهة.
>
> 🧩 ينطبق هذا الدليل على النظام بأي نشاط مفعَّل (سوبر ماركت، مطاعم، مستشفيات، مصانع، مقاولات… 21 نظاماً متخصصاً) — خطوات التثبيت واحدة، وتفعيل النشاط يتم من داخل النظام عبر شاشة «تفعيل الأنظمة والأنشطة» برقم سري المالك.

---

## 📋 قبل البدء — قائمة الجاهزية

| البند | المطلوب | للتحقق |
|---|---|---|
| Node.js | الإصدار 18 فأعلى (يُفضَّل LTS 20) | `node -v` |
| MySQL | الإصدار 8.0 فأعلى | `mysql --version` |
| منفذ الخادم | 4000 (قابل للتغيير) | `netstat -ano \| findstr 4000` |
| منفذ MySQL | 3306 | افتراضي |
| صلاحيات | Administrator على ويندوز / cPanel مع «Setup Node.js App» | — |
| ملفات النظام | مجلدا المشروع: الجذر (الواجهة) + `server/` (الخادم) | — |

---

# الجزء الأول: السيرفر المحلي — Windows 11 / 10

## 1) تثبيت Node.js

1. نزّل Node.js LTS من <https://nodejs.org> واختر **Windows Installer (.msi) 64-bit**.
2. ثبّته بالافتراضي (يُضاف إلى PATH تلقائياً).
3. افتح **PowerShell كمسؤول** وتحقق:

```powershell
node -v        # v20.x.x
npm -v         # 10.x.x
```

## 2) تثبيت MySQL 8

1. نزّل **MySQL Installer** من <https://dev.mysql.com/downloads/installer/> واختر `mysql-installer-community`.
2. اختر **Server only** (أو Full إن أردت Workbench للعرض).
3. عند الإعداد:
   - Type: **Development Machine**
   - Authentication: **Use Strong Password Encryption**
   - ضع كلمة مرور جذر قوية واكتبها في مكان آمن.
4. تحقق أن الخدمة تعمل:

```powershell
Get-Service MySQL80        # الحالة يجب أن تكون Running
mysql -u root -p -e "SELECT VERSION();"
```

## 3) إنشاء قاعدة البيانات والمستخدم

افتح **MySQL 8.0 Command Line Client** ونفّذ:

```sql
-- قاعدة البيانات بترميز عربي كامل
CREATE DATABASE okyanus_ifs
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

-- مستخدم خاص بالنظام (لا تستخدم root للتطبيق)
CREATE USER 'erp_admin'@'localhost' IDENTIFIED BY 'Okyanus@2026!';
GRANT ALL PRIVILEGES ON okyanus_ifs.* TO 'erp_admin'@'localhost';

-- للسماح لأجهزة الشبكة المحلية بالاتصال عبر IP السيرفر:
CREATE USER 'erp_admin'@'192.168.1.%' IDENTIFIED BY 'Okyanus@2026!';
GRANT ALL PRIVILEGES ON okyanus_ifs.* TO 'erp_admin'@'192.168.1.%';

FLUSH PRIVILEGES;
```

> ⚠️ استبدل `192.168.1.%` بنطاق شبكتك الفعلية (اعرفها بأمر `ipconfig`).

## 4) تثبيت الخادم المركزي (Backend)

```powershell
cd C:\okyanus-ifs\server

# 1. إنشاء ملف البيئة من القالب
copy .env.example .env

# 2. تثبيت الحزم
npm install

# 3. تعديل .env — راجع جدول المتغيرات أدناه
notepad .env

# 4. بناء الجداول (يُنفَّذ مرة واحدة، ويعيد ترميم الناقص تلقائياً)
npm run migrate

# 5. التحقق من حالة الهجرات
npm run migrate:status

# 6. تشغيل الخادم
npm start
```

النتيجة المتوقعة في الطرفية:

```
✔ Migrations OK — 5/5
● OkyanusIFS API على http://localhost:4000
● WebSocket Hub على ws://localhost:4000/ws
```

اختبر سريعاً من متصفح أي جهاز: `http://localhost:4000/health`

## 5) تثبيت الواجهة الأمامية (Frontend)

```powershell
cd C:\okyanus-ifs

npm install
npm run build
npm run preview -- --port 5173 --host
```

أو للتطوير الحي: `npm run dev`

## 6) ربط أجهزة المنشأة (الكاشير والمحاسب والمدير)

الآن كل جهاز في الشبكة يفتح المتصفح على:

```
http://192.168.1.10:5173          ← عنوان IP السيرفر المحلي
```

- **جهاز الكاشير** → يدخل بحساب الكاشير ويعمل على نقاط البيع بالنمط المتكيف مع النشاط (متاجر تجزئة/سوبر ماركت، أو مطاعم وطاولات عند تفعيل نظام المطاعم).
- **جهاز المحاسب** → يرى فواتير الكاشير **لحظياً** في المبيعات والقيود.
- **جهاز المدير** → شاشة «مراقبة النشاط» تعرض بثاً حياً لكل العمليات والأجهزة.

كل متصفح يحصل على **هوية جهاز** تلقائية — سمِّ الأجهزة من:
`إدارة النظام ← الإعدادات العامة ← النسخ الاحتياطي ← هوية هذا الجهاز`
(مثال: «كاشير الصالة 1»، «جهاز الحسابات»، «جهاز المدير العام»).

## 7) تشغيل تلقائي مع الويندوز (خدمة دائمة)

استخدم **NSSM** لتحويل الخادم إلى خدمة ويندوز لا تتوقف:

```powershell
# نزّل NSSM من https://nssm.cc ثم:
nssm install OkyanusIFS-Server "C:\Program Files\nodejs\node.exe" "C:\okyanus-ifs\server\src\index.js"
nssm set OkyanusIFS-Server AppDirectory "C:\okyanus-ifs\server"
nssm set OkyanusIFS-Server Start SERVICE_AUTO_START
nssm start OkyanusIFS-Server
```

## 8) فتح منفذي النظام في جدار الحماية

```powershell
netsh advfirewall firewall add rule name="OkyanusIFS API 4000" dir=in action=allow protocol=TCP localport=4000
netsh advfirewall firewall add rule name="OkyanusIFS Web 5173" dir=in action=allow protocol=TCP localport=5173
netsh advfirewall firewall add rule name="MySQL 3306 LAN" dir=in action=allow protocol=TCP localport=3306 remoteip=localsubnet
```

---

# الجزء الثاني: السيرفر الخارجي — cPanel

مناسب لإدارة **عدة فروع** من مكان واحد: قاعدة بيانات مركزية على الاستضافة، وكل فرع يعمل من متصفحه.

## 1) متطلبات الاستضافة

| الميزة | الحد الأدنى |
|---|---|
| لوحة تحكم | cPanel مع **Setup Node.js App** |
| Node.js | 18+ (تُختار من اللوحة) |
| MySQL | 8.0 أو MariaDB 10.6+ |
| الذاكرة | 1 GB RAM فأعلى |
| SSL | مفعّل (AutoSSL) — ضروري لعمل WebSocket الآمن `wss` |

## 2) إنشاء قاعدة البيانات في cPanel

1. cPanel ← **MySQL Databases** ← أنشئ قاعدة باسم `okyanus_ifs`.
2. أنشئ مستخدماً `erp_admin` بكلمة مرور قوية (16+ حرفاً).
3. اربط المستخدم بالقاعدة بصلاحيات **ALL PRIVILEGES**.
4. دوّن اسم القاعدة كاملاً — cPanel يضيف بادئة، مثال: `cpuser_okyanus_ifs`.

## 3) رفع الخادم المركزي

1. ارفع مجلد `server/` إلى `/home/cpuser/okyanus-server/` عبر **File Manager** أو FTP.
2. cPanel ← **Setup Node.js App** ← **Create Application**:
   - Node.js version: **20.x**
   - Application mode: **Production**
   - Application root: `okyanus-server`
   - Application URL: `api.okyanus-ifs.com` (سجل فرعي DNS من نوع A)
   - Application startup file: `src/index.js`
3. داخل إعدادات التطبيق أضف **Environment Variables** (أو أنشئ ملف `.env` داخل المجلد) — نفس الجدول أدناه مع قيم cPanel:

```ini
DB_HOST=localhost
DB_USER=cpuser_erpadmin
DB_PASS=كلمة-المرور-القوية
DB_NAME=cpuser_okyanus_ifs
```

4. افتح **Run NPM Install** من لوحة التطبيق، ثم ادخل **Terminal** (SSH) الخاص بالتطبيق ونفّذ:

```bash
cd ~/okyanus-server
npm run migrate
# أعد تشغيل التطبيق من زر Restart في Setup Node.js App
```

5. تحقق: `https://api.okyanus-ifs.com/health`

## 4) نشر الواجهة الأمامية

```powershell
# على جهازك — بناء نسخة الإنتاج
cd C:\okyanus-ifs
npm install
npm run build          # ينتج مجلد dist/
```

1. ارفع **محتويات** مجلد `dist/` إلى `public_html/` (أو مجلد السجل الفرعي `app.okyanus-ifs.com`).
2. أنشئ ملف `.htaccess` داخل المجلد لدعم توجيه التطبيق (SPA):

```apache
RewriteEngine On
RewriteBase /
RewriteRule ^index\.html$ - [L]
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule . /index.html [L]

# أمان أساسي
<IfModule mod_headers.c>
  Header set X-Content-Type-Options "nosniff"
  Header set X-Frame-Options "SAMEORIGIN"
</IfModule>
```

3. فعّل **AutoSSL** من cPanel ← SSL/TLS Status ليصبح الموقع `https`.

> 💡 **ملاحظة المزامنة**: النسخة المنشورة تعمل فوراً بمحرك المزامنة المدمج (حفظ مركزي في كل جهاز + بث لحظي بين نوافذه). لربطها بالخادم المركزي عبر WebSocket الآمن، استخدم العنوان `wss://api.okyanus-ifs.com/ws` في إعدادات «واجهة الربط API» داخل النظام.

## 5) النسخ الاحتياطي المجدول (Cron)

cPanel ← **Cron Jobs** ← أضف:

```bash
# نسخة كاملة يومياً 02:00 صباحاً مع ضغط
0 2 * * * mysqldump -u cpuser_erpadmin -p'كلمة-المرور' cpuser_okyanus_ifs | gzip > /home/cpuser/backups/ifs_full_$(date +\%F).sql.gz

# حذف النسخ الأقدم من 30 يوماً
30 2 * * * find /home/cpuser/backups -name "ifs_full_*" -mtime +30 -delete
```

أو من داخل النظام نفسه: `إدارة النظام ← الإعدادات ← قاعدة البيانات ← النسخ الاحتياطي` (جدولة + تنزيل + استعادة تبثّ الجيل لكل الأجهزة).

---

# 🔧 جدول متغيرات البيئة الكامل (.env)

## الخادم المركزي — server/.env

| المتغير | مثال | الشرح |
|---|---|---|
| `PORT` | `4000` | منفذ API و WebSocket |
| `WS_PATH` | `/ws` | مسار قناة البث اللحظي |
| `DB_HOST` | `localhost` | عنوان خادم MySQL |
| `DB_PORT` | `3306` | منفذ MySQL |
| `DB_USER` | `erp_admin` | مستخدم قاعدة البيانات |
| `DB_PASS` | `Okyanus@2026!` | كلمة المرور — لا تضعها في الكود أبداً |
| `DB_NAME` | `okyanus_ifs` | اسم القاعدة (`cpuser_okyanus_ifs` في cPanel) |
| `DB_POOL_LIMIT` | `40` | حجم حزمة الاتصالات — يكفي 100+ مستخدم متزامن |
| `DB_QUEUE_LIMIT` | `200` | طابور الانتظار عند ذروة الضغط |
| `JWT_SECRET` | `سلسلة-عشوائية-64-حرفاً` | سر توقيع رموز الدخول — ولّده بأمر `openssl rand -hex 32` |
| `JWT_EXPIRES` | `8h` | مدة صلاحية رمز الدخول |
| `MASTER_PIN_HASH` | `$2a$10$…` | تجزئة الرقم السري لصاحب النظام (شاشة تفعيل الأنظمة) |
| `RATE_LIMIT_PER_MIN` | `240` | حد الطلبات لكل جهاز في الدقيقة (حماية من الإغراق) |
| `DEVICE_STALE_MS` | `15000` | بعد هذه المدة بلا نبض يُعتبر الجهاز خاملاً |

## الواجهة الأمامية — .env (اختياري للربط المركزي)

| المتغير | مثال | الشرح |
|---|---|---|
| `VITE_API_URL` | `https://api.okyanus-ifs.com` | عنوان الخادم المركزي |
| `VITE_WS_URL` | `wss://api.okyanus-ifs.com/ws` | قناة البث اللحظي الآمنة |

---

# ✅ قائمة التحقق قبل التسليم

- [ ] `npm run migrate:status` يعرض 5/5 هجرات منفَّذة
- [ ] `/health` يعيد حالة connected
- [ ] تسجيل الدخول يعمل من جهازين مختلفين معاً
- [ ] فاتورة من جهاز الكاشير تظهر في جهاز المحاسب خلال ثوانٍ
- [ ] شاشة «مراقبة النشاط» تعرض الأجهزة المتصلة بأسمائها
- [ ] حذف سجل من جهاز → يختفي من بقية الأجهزة (Tombstones)
- [ ] نسخة احتياطية JSON تُنزَّل وتُستعاد بنجاح مع ارتفاع الجيل
- [ ] النسخة الخارجية تعمل عبر `https` و`wss` بدون تحذيرات شهادة
- [ ] جدولة النسخ الاحتياطي الليلي مفعّلة
- [ ] تسمية أجهزة المنشأة مكتملة (كاشير/حسابات/مدير)

---

# 🛟 حل المشكلات الشائعة

| المشكلة | السبب | الحل |
|---|---|---|
| `EADDRINUSE: 4000` | المنفذ مشغول | `netstat -ano \| findstr 4000` ثم أوقف العملية أو غيّر `PORT` |
| `ER_ACCESS_DENIED` | بيانات MySQL خاطئة | راجع `DB_USER`/`DB_PASS` وتأكد من `FLUSH PRIVILEGES` |
| `ER_NOT_SUPPORTED_AUTH` | نمط مصادقة قديم | `ALTER USER 'erp_admin'@'localhost' IDENTIFIED WITH mysql_native_password BY '...';` |
| الصفحة تفتح لكن API لا يستجيب | جدار الحماية | نفّذ أوامر `netsh` في الخطوة 8 |
| الأجهزة لا ترى بعضها لحظياً | WebSocket محجوب | تأكد أن البروكسي/كلاودفلير يسمح بترقية WebSocket، واستخدم `wss` مع https |
| الخط العربي يظهر مربعات | ترميز القاعدة | تأكد `utf8mb4_unicode_ci` عند إنشاء القاعدة |
| cPanel: التطبيق يتوقف | انتهاء مهلة العملية | فعّل Always-On من إعدادات Node App وأعد التشغيل |
| أخطاء CORS | نطاق الواجهة غير مسموح | أضف نطاقك في إعدادات CORS بالخادم (يفترضها الخادم من `VITE_API_URL`) |

---

# 📞 الدعم الفني

**شركة أوكيانوس سوفت — Okyanus Soft**
🌐 <https://okyanussoft.online/> — ☎ **781 183 050** — السجل التجاري: 2019004571

*جميع الحقوق محفوظة لدى شركة أوكيانوس سوفت © 2026 — النظام المالي المتكامل v3.0*
