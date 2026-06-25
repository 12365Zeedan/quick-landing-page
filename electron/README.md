# PharmLedger Desktop (Electron)

تطبيق سطح المكتب لـ PharmLedger. يحمّل النسخة المنشورة من التطبيق عبر الإنترنت
ويتحول تلقائياً لوضع عدم الاتصال لو النت مقطوع. كل البيانات محفوظة محلياً.

## مكان البيانات على جهازك

- **Windows:** `%APPDATA%\PharmLedger\pharmledger-data\`
- **macOS:** `~/Library/Application Support/PharmLedger/pharmledger-data/`
- **Linux:** `~/.config/PharmLedger/pharmledger-data/`

تقدر تفتح المجلد مباشرة من داخل التطبيق من صفحة **النسخ الاحتياطي** (`/backup`).

## البناء (Build) — يتطلب Node.js على جهازك

```bash
# 1) تثبيت اعتماديات Electron (مرة واحدة)
npm install --save-dev electron @electron/packager

# 2) بناء وحزم التطبيق لويندوز
npm run electron:pack:win

# 3) بناء وحزم التطبيق لماك
npm run electron:pack:mac

# 4) تشغيل التطبيق في وضع التطوير
npm run electron:dev
```

الناتج بيكون في مجلد `electron-release/`. على ويندوز هتلاقي `PharmLedger.exe`
جوّا `electron-release/PharmLedger-win32-x64/`.

## كيف يعمل

1. **أونلاين:** يحمّل التطبيق من `https://project--<id>.lovable.app` فيشتغل بأحدث
   نسخة، والمصادقة والمنظمات وكل البيانات السحابية تشتغل عادي.
2. **أوفلاين:** يعرض صفحة "غير متصل". لكن لو فتحت التطبيق وأنت أونلاين الأول
   ثم قطع النت، الـ Electron cache بيخزّن آخر نسخة وبتقدر تشتغل عليها،
   والبيانات اللي بتدخلها بتتحفظ في IndexedDB + ملفات JSON محلية على جهازك.
3. **مزامنة:** لما النت يرجع، البيانات السحابية (مصادقة + منظمات) بتتزامن تلقائي.
   لمزامنة كاملة لجميع البيانات (مشتريات، مصروفات، مخزون…) المرحلة 3+4 من الخطة
   اللي حتُنفَّذ لاحقاً ستحوّل كل الجداول لـ Lovable Cloud مع محرك Push/Pull.

## تغيير عنوان التطبيق

عدّل `ONLINE_URL` في `electron/main.cjs` لو نشرت التطبيق على دومين مخصص.
