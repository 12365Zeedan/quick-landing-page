# خطة: تطبيق سطح مكتب يشتغل أونلاين/أوفلاين مع مزامنة

## نظرة عامة
حالياً التطبيق ويب فقط، ومعظم بياناته (مشتريات، إيرادات، مصروفات، مخزون، موظفين، مناوبات، موردين) محفوظة في `localStorage` لكل مؤسسة، وLovable Cloud مستخدم فقط للمصادقة والمنظمات. عشان نحقق طلبك محتاجين 3 طبقات جديدة:

1. **قشرة Electron** — تحوّل الويب لتطبيق .exe
2. **مخزن ملفات محلي** — يستبدل localStorage بملفات JSON على القرص قابلة للنسخ
3. **محرك مزامنة** — يرفع/ينزّل البيانات مع Lovable Cloud لما النت يرجع

---

## المرحلة 1 — قشرة Electron (.exe)

- إضافة `electron` و `@electron/packager` كـ devDependencies
- إنشاء `electron/main.cjs` بـ `BrowserWindow` آمنة (`contextIsolation: true`, `nodeIntegration: false`)
- إنشاء `electron/preload.cjs` يكشف API محدود للتطبيق:
  - `readDataFile(name)`, `writeDataFile(name, data)`, `listBackups()`, `exportBackup(path)`
- ضبط `vite.config.ts` بـ `base: './'` لما نبني للـ Electron
- إنشاء script `bun run electron:pack` يبني Vite ثم يحزم بـ `@electron/packager`
- مخرج: ملف `PharmLedger-win32-x64.zip` فيه `PharmLedger.exe`

## المرحلة 2 — مخزن ملفات محلي

- إنشاء `src/lib/local-store.ts` بواجهة موحّدة:
  - في Electron → تكتب JSON في `app.getPath('userData')/pharmledger/<orgId>/<table>.json`
  - في المتصفح → fallback لـ IndexedDB (وليس localStorage عشان السعة)
- إعادة كتابة `useOrgStorage` بحيث تستخدم `local-store` بدل `localStorage` مباشرة
- كل تغيير يكتب صف في `pending_changes.json` (سجل التغييرات اللي لسه ما اتزامنتش)
- زر "تصدير نسخة احتياطية" في الإعدادات يفتح حوار حفظ ويصدّر مجلد البيانات كـ .zip
- زر "استيراد نسخة احتياطية" لاسترجاع الملفات

## المرحلة 3 — جداول Lovable Cloud + RLS

إنشاء جداول للبيانات اللي حالياً في localStorage، كلها مرتبطة بـ `organization_id` ومحمية بـ RLS عبر `is_org_member`:
- `app_revenue`, `app_expenses`, `app_purchases`
- `app_inventory_products`, `app_inventory_operations`
- `app_staff`, `app_shifts`
- `app_suppliers`
- كل جدول فيه `client_id` (uuid من الجهاز) + `updated_at` + `deleted_at` (soft delete) عشان المزامنة

## المرحلة 4 — محرك المزامنة

- `src/lib/sync-engine.ts`:
  - **Push**: يرفع `pending_changes` للسيرفر عبر server functions، يحل التعارضات بـ Last-Write-Wins على `updated_at`
  - **Pull**: ينزل التغييرات الأحدث من السيرفر بعد آخر `last_sync_at` ويحدث الملفات المحلية
  - يشتغل تلقائي كل 30 ثانية لما النت متاح + عند الإقلاع + يدوي بزر "مزامنة الآن"
- مؤشر حالة في الـ topbar: 🟢 متزامن / 🟡 جاري المزامنة / 🔴 أوفلاين (عدد التغييرات المعلقة)
- استخدام `navigator.onLine` + ping للسيرفر للكشف عن الاتصال

## المرحلة 5 — توثيق للمستخدم

- README صغير في الـ .zip:
  - كيفية التشغيل (double-click PharmLedger.exe)
  - مكان ملفات البيانات على الجهاز
  - كيفية النسخ الاحتياطي اليدوي
  - كيفية فتح نفس الحساب من المتصفح والمزامنة

---

## تفاصيل تقنية

- **سبب اختيار JSON بدل SQLite**: SQLite يحتاج native binaries (better-sqlite3) ويصعّب الحزم على ويندوز من بيئة Linux. JSON أبسط، قابل للقراءة، وأسهل للنسخ/الاستيراد، ومناسب لحجم بيانات الصيدلية.
- **حل التعارضات**: Last-Write-Wins على مستوى الصف باستخدام `updated_at`. للسجلات اللي اتعدّلت في الجهازين، السيرفر يفوز لو فرق التوقيت > 5 ثواني، والمحلي يفوز لو أقل (تعديل المستخدم الأخير).
- **الحذف**: soft delete بـ `deleted_at` عشان المزامنة تنشر الحذف للأجهزة التانية.
- **الأمان**: ملفات البيانات بتتحفظ في مسار المستخدم على ويندوز (`%APPDATA%\pharmledger\`). مش مشفّرة بشكل افتراضي — لو محتاج تشفير قوللي.

## حدود ومحاذير

- بناء .exe لويندوز من بيئة Lovable السحابية ممكن، لكن **التوقيع الرقمي للملف (code signing)** يحتاج شهادة تشترها أنت ونوقع بيها على جهازك. بدون توقيع، Windows Defender ممكن يحذّر أول مرة.
- المزامنة Last-Write-Wins بسيطة — لو محتاج merge ذكي (مثلاً جمع كميات مخزون من جهازين في نفس اللحظة) ده يحتاج CRDTs وهيضاعف التعقيد.
- المرحلة 3 (هجرة كل البيانات لجداول Lovable Cloud) هي الأطول وفيها مايجريشن SQL كبير. لو عايز نبدأ بالـ Electron فقط ونأجل المزامنة، قوللي.

## ترتيب التنفيذ المقترح
أبدأ بالمرحلة 1 + 2 (Electron + مخزن ملفات محلي يشتغل أوفلاين فوراً)، توافق وتجرّب، بعدين نكمل 3 + 4 (المزامنة) في رسالة منفصلة عشان كل مرحلة تتختبر لوحدها.

**هل أبدأ بالمرحلة 1+2 الأول، ولا تحب أنفّذ كل المراحل دفعة واحدة؟**
