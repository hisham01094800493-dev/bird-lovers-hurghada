# تجهيز Bird Lovers Hurghada للنشر على Vercel وAiven

هذه النسخة مهيأة محليًا للنشر من مستودع GitHub: واجهة Vite تُنسخ إلى `public/` أثناء بناء Vercel، ويُصدّر خادم Express كـFunction، وقاعدة Drizzle/MySQL تتصل بـAiven مع TLS موثّق. **لم يُنشأ مشروع Vercel أو خدمة Aiven ولم يُنشر أي شيء بعد.**

## إعداد مشروع Vercel

من Vercel اختر **Add New → Project** ثم مستودع `hisham01094800493-dev/bird-lovers-hurghada`. استخدم إعدادات المشروع التالية:

| إعداد | قيمة المستودع |
|---|---|
| Framework Preset | Express |
| Root Directory | `./` |
| Node.js | `24.x` (المشروع يدعم 22–24) |
| Install Command | `pnpm install --frozen-lockfile` |
| Build Command | `pnpm build:vercel` |
| Output Directory | اتركه فارغًا / افتراضيًا |

ملف `vercel.json` يضبط preset وأوامر التثبيت والبناء. الأمر `build:vercel` يبني ملفات Vite ثم ينقلها إلى `public/` حتى يخدمها Vercel CDN، بينما يتعرّف Vercel على مدخل Express في `server.ts`. لا تضبط Output Directory إلى `dist/public` لأن ذلك سيعامل التطبيق كموقع ثابت ويغفل الخادم.

## إعداد قاعدة بيانات Aiven

أنشئ خدمة MySQL في Aiven، ثم من **Overview → Quick connect** انسخ عنوان الخادم والمنفذ والمستخدم وكلمة المرور واسم قاعدة البيانات. يمكن البدء بقاعدة `defaultdb`. من صفحة الخدمة نزّل شهادة CA الخاصة بالمشروع.

أضف متغيرات التشغيل في إعدادات Vercel، واستخدم **Production** على الأقل:

| المتغير | القيمة / المصدر |
|---|---|
| `DATABASE_URL` | عنوان MySQL من Aiven. عند بنائه يدويًا استخدم `mysql://USER:PERCENT_ENCODED_PASSWORD@HOST:PORT/defaultdb`، وشفر أحرف كلمة المرور الخاصة URL-encoding. لا ترسل القيمة في المحادثة. |
| `AIVEN_CA_CERT` | كامل محتوى شهادة Aiven بصيغة PEM؛ الكود يحوّل `\\n` إلى أسطر فعلية، ويشترط التحقق من الشهادة واسم المضيف. |
| `JWT_SECRET` | سر عشوائي طويل وفريد لتوقيع الجلسات. |
| `VITE_APP_ID` | معرف تطبيق OAuth الصحيح لهذا المشروع. |
| `OAUTH_SERVER_URL` | عنوان خادم OAuth الذي يستخدمه المشروع. |
| `VITE_OAUTH_PORTAL_URL` | عنوان بوابة OAuth للواجهة، إذا كان تدفق تسجيل الدخول يعتمد عليها. |
| `VITE_SITE_URL` | نطاق الإنتاج الفعلي مثل `https://bird-lovers-hurghada.vercel.app`. |
| `OWNER_OPEN_ID` | اختياري؛ هوية المالك التي تمنح صلاحية الإدارة إن كانت مطلوبة. |
| `CRON_SECRET` | سر مستقل لتأمين مهمة تنظيف المرفقات المجدولة. |
| `PRICE_REFRESH_SECRET` | سر endpoint تحديث مسودات الأسعار، ويجب أن يطابق GitHub Secret بالقيمة نفسها. |

**لا** تضع الأسرار في مستودع GitHub، أو في متغيرات بادئتها `VITE_`. متغيرات `VITE_` تُضمَّن في ملفات الواجهة، ويُفترض ألا تحتوي أسرارًا. بعد ضبط متغيرات `VITE_*` أعد البناء/النشر.

حقول OAuth (`VITE_APP_ID` و`OAUTH_SERVER_URL` و`VITE_OAUTH_PORTAL_URL`) مطلوبة إذا كنت تريد تفعيل تسجيل الدخول عبر Manus؛ أما `VITE_OAUTH_PORTAL_URL` فهو عنوان عام وليس سرًا. لا تُدخل هذه الإعدادات عشوائيًا: استخدم بيانات تطبيق OAuth الصحيح فقط.

## الصور والتخزين الدائم

Vercel لا يوفر قرصًا دائمًا لملفات التطبيق، ولذلك يلزم مخزن ملفات S3-compatible إذا أردت أن تستمر صور الإعلانات والملفات بعد انتهاء الـFunction. اضبط `S3_ENDPOINT` و`S3_BUCKET` و`S3_ACCESS_KEY_ID` و`S3_SECRET_ACCESS_KEY` و`S3_REGION`؛ ويمكن وضع رابط CDN في `S3_PUBLIC_URL`. مثال ملف المتغيرات الوهمي في `.env.example` للمرجعية فقط، وليس جاهزًا للاستخدام.

يقبل Vercel Functions طلبات بحجم محدود؛ المشروع يسمح برفع صور أكبر أو صور متعددة مشفرة بـBase64. هذه النسخة تضبط محلل JSON على 4 MB على Vercel وتمنع الحفظ المؤقت، لكن طلب رفع صورة/مجموعة صور قد يتجاوز حد المنصة. الحل الكامل لهذه الخاصية هو رفع مباشر من المتصفح إلى مخزن S3 باستخدام روابط مؤقتة موقّعة، ولم يُنفذ في هذه الجولة؛ اختبر تدفقات الإعلان والصورة الرمزية والمحادثات، أو اطلب تنفيذ الرفع المباشر قبل إطلاق الاستخدام العام.

## قاعدة البيانات والبيانات الحالية

بعد إنشاء قاعدة Aiven وإضافة `DATABASE_URL` و`AIVEN_CA_CERT` في بيئة آمنة، شغّل مرة واحدة:

```bash
pnpm install --frozen-lockfile
pnpm db:migrate
```

الأمر يطبّق ملفات Drizzle الملتزم بها. **لا** ينقل بيانات Railway الموجودة تلقائيًا؛ إن أردت الحفاظ على المستخدمين والإعلانات، خذ تفريغًا من قاعدة Railway واستعده في Aiven قبل تغيير حركة الموقع. لا تستخدم `drizzle-kit push --force` على الإنتاج.

## المهام المجدولة وتسجيل الدخول

ملف `vercel.json` يسجل تنظيفًا يوميًا للمرفقات المنتهية عند 04:00 UTC، والمسار يتحقق من `CRON_SECRET`. تحديث مسودات الأسعار الأسبوعي ما زال يستخدم Railway كقيمة احتياطية. عند التحويل، أضف متغير GitHub Actions `APP_BASE_URL` بعنوان Vercel، وأضف GitHub Secret `PRICE_REFRESH_SECRET` المطابق لقيمة Vercel.

المشروع يحتفظ بتكامل Manus OAuth الموجود. إعدادات Manus/OAuth لا تنتقل تلقائيًا من الاستضافة القديمة؛ يلزم أن تكون لديك قيم صحيحة ومصرح بها. أضف عنوان الرجوع إلى OAuth provider:

```text
https://<نطاق-فيرسيل>/api/oauth/callback
```

والتحقق من تسجيل الدخول والكوكيز الآمنة ودور المالك مطلوب قبل توجيه المستخدمين إلى الموقع الجديد.

## فحوصات أُجريت محليًا

نجح `pnpm check`، ونجحت الاختبارات الخمسة (16 اختبارًا)، ونُفذ بناء Vercel محليًا. أظهر البناء تحذيرًا بأن متغيري Umami `VITE_ANALYTICS_ENDPOINT` و`VITE_ANALYTICS_WEBSITE_ID` غير معرّفين؛ أداة تجهيز Vercel تحذف سكربت التحليلات عند عدم توفيرهما. يمكن ضبطهما إذا كانت التحليلات مطلوبة.

## تنبيهات الخطط

Aiven Free MySQL محدود بـ1 GB ذاكرة و1 GB تخزين وعلى عقدة واحدة، ولا يتضمن SLA بنسبة 99.99%. وخطة Vercel Hobby مخصصة للاستخدام الشخصي غير التجاري فقط وفق سياسة Vercel؛ بما أن الموقع سوق/مجتمع قد يُستخدم تجاريًا، تحقّق من ملاءمة خطتك قبل النشر الفعلي.

## المراجع الرسمية

- [تطبيقات Express على Vercel](https://vercel.com/docs/frameworks/backend/express)، بما في ذلك تصدير التطبيق وخدمة الملفات من `public/`.
- [إعداد `vercel.json` ومهام Cron](https://vercel.com/docs/project-configuration/vercel-json) و[طريقة عمل Vercel Cron والتوقيت UTC](https://vercel.com/docs/cron-jobs).
- [قيود Aiven MySQL المجاني](https://aiven.io/docs/products/mysql/concepts/mysql-free-tier).
- [شروط Vercel الرسمية وخطة Hobby](https://vercel.com/legal/terms#4-hobby-plan).
