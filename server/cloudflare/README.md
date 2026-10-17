# Cloudflare API

واجهة API المشتركة للموقع ولوحة الإدارة. يخزّن D1 الطلبات والمحتوى وتاريخ التعديلات وبيانات الوسائط، وتستخدم إعدادات الإنتاج Supabase Storage للملفات وSupabase Auth للمصادقة وBrevo للبريد.

| المسار | المسؤولية |
| --- | --- |
| `src/index.js` | إنشاء API وتوجيه الطلبات العامة والإدارية والمهام المجدولة |
| `../../client/worker.js` | مدخل الموقع العام؛ يمنع `/api/admin/*` |
| `../../client/workers/admin-worker.js` | مدخل لوحة الإدارة وصفحات الدخول وحماية ملفاتها |
| `migrations/` | ترحيلات D1 |
| `tests/` | اختبارات الوحدات والتكامل وworkerd المحلي |
| `scripts/supabaseMediaTools.js` | فحص تخزين المعاينة ونسخ الملفات واستعادتها |

تفاصيل ملكية المكونات في [خريطة المعمارية](../../docs/current-architecture.md)، واستعمال اللوحة في [دليل الإدارة](../../docs/admin-dashboard.md)، وأوامر التحقق والنشر في [دليل الإصدار](../../docs/verification-and-release.md).

## التشغيل المحلي

تتطلب هذه الحزمة Node.js 22 أو أحدث. راجع [README الرئيسي](../../README.md) لمتطلبات تشغيل الواجهة أيضًا. نفّذ من `server/cloudflare/`:

```powershell
npm ci --include=optional
if (-not (Test-Path -LiteralPath .dev.vars)) {
    Copy-Item -LiteralPath .dev.vars.example -Destination .dev.vars
}
npx wrangler d1 migrations apply DB --local
npm run dev -- --port 5000
```

أدخل قيم التطوير في `.dev.vars` المستثنى من Git. المنفذ 5000 يطابق وكيل `/api` في Vite؛ شغّل واجهة `client/` في طرفية أخرى باستخدام `npm run dev`.

يستخدم `wrangler.jsonc` قاعدة D1 ومخزن R2 محليين داخل `.wrangler/`، دون معرّف قاعدة إنتاج. الطلبات إلى Turnstile أو Supabase أو Brevo تظل اتصالات حقيقية عند إعداد مفاتيحها؛ وضع `--local` لا يحاكي هذه الخدمات. استخدم حسابات وبيانات تطوير مناسبة. اختبارات الحزمة تعزل هذه الاتصالات.

الحزمة وحدها لا تقدّم صفحات `/auth/*` أو ملفات لوحة الإدارة؛ يتولى ذلك Worker الإدارة. تتطلب تجربة الدخول الكاملة أصل HTTPS مطابقًا لإعداد `ADMIN_ORIGIN` وملفات البناء وإعدادات المصادقة الموضحة في دليل الإدارة.

## الإعدادات

الأمثلة في [`.dev.vars.example`](.dev.vars.example). تحفظ الأسرار في بيئة التشغيل أو Cloudflare Secrets، ولا توضع في `VITE_*` أو المصدر.

| الإعداد | الاستخدام |
| --- | --- |
| `DB` | ربط D1 من إعداد Wrangler |
| `BOOKING_HMAC_KEY` | سر لا يقل عن 32 بايت UTF-8 لبصمات مكافحة تكرار الطلبات |
| `TURNSTILE_SECRET_KEY`، `TURNSTILE_ALLOWED_HOSTNAMES` | مفتاح التحقق وقائمة أسماء النطاقات المسموحة دون بروتوكول أو مسار |
| `PUBLIC_ORIGINS` | أصول إضافية مسموحة، مفصولة بفواصل؛ أصل API نفسه مسموح |
| `BOOKING_RATE_LIMITER` | محدد الحجز في Wrangler: 9 محاولات خلال 60 ثانية |
| `BREVO_API_KEY`، `BREVO_SENDER_EMAIL`، `BREVO_SENDER_NAME`، `BREVO_RECIPIENT_EMAIL` | إرسال إشعارات الطلبات؛ الردود الإدارية تستخدم المفتاح والمرسل |
| `ADMIN_ORIGIN`، `ADMIN_ALLOWED_SUB` | أصل الإدارة عبر HTTPS ومعرّف مستخدم Supabase Auth المسموح |
| `ADMIN_SESSION_KEY`، `ADMIN_CSRF_KEY` | مفتاح جلسة من 32 بايت بترميز base64url، وسر CSRF لا يقل عن 32 بايت UTF-8 |
| `SUPABASE_URL`، `SUPABASE_PUBLISHABLE_KEY` | مشروع Supabase وإعداد Auth العام |
| `ADMIN_RATE_LIMITER`، `ADMIN_REPLY_RATE_LIMITER`، `ADMIN_UPLOAD_RATE_LIMITER` | حدود الإدارة والردود والرفع: 120 و6 و6 خلال 60 ثانية |
| `ADMIN_LOGIN_RATE_LIMITER` | حد 5 محاولات خلال 60 ثانية على Worker الإدارة |
| `MEDIA_PROVIDER=supabase`، `SUPABASE_STORAGE_BUCKET`، `SUPABASE_SECRET_KEY` | التخزين المستخدم في إعدادات الإنتاج؛ المفتاح السري على الخادم فقط |
| `MEDIA_PROVIDER=r2`، `MEDIA`، `MEDIA_PUBLIC_BASE_URL` | محوّل R2 المحتفظ به للتطوير المحلي والاستخدام البديل؛ عنوان الملفات عبر HTTPS |

غياب إعداد الحماية أو التخزين المطلوب يرفض العملية. غياب إعداد بريد الحجز يعيد `notificationStatus: "disabled"` بعد حفظ الطلب، ولا يلغي الحفظ. غياب إعداد الردود الإدارية يعيد 503.

إعدادا الإنتاج موجودان في `client/wrangler.jsonc` و`client/wrangler.admin.jsonc`. أما `wrangler.preview.jsonc` في هذه الحزمة فيشير إلى D1 وحاوية Supabase منفصلين للمعاينة، دون routes أو cron. لا تستبدل إعداد الإنتاج بإعداد التشغيل المحلي.

## الواجهات العامة

### `POST /api/booking`

يقبل `application/json` بحد 64 KiB:

- `name`، `email`، `projectDetails`: مطلوبة، بحدود 100 و255 و4000 وحدة UTF-16 بعد حذف الفراغات الطرفية.
- `turnstileToken`: رمز Turnstile صالح.
- `serviceKey`، `inquiryCategory`: يقبلان `null` للتوافق؛ القيم غير الفارغة تخضع للتحقق. يمكن أن تأتي الخدمة من الباقات المنشورة.

| الحالة | المعنى |
| --- | --- |
| 200 | حفظ الطلب؛ `success: true` مع `referenceId` و`notificationStatus` |
| 400 | بيانات أو تحقق Turnstile مرفوض |
| 409، `duplicate_submission` | طلب مطابق محفوظ سابقًا |
| 429، `rate_limited` أو `ip_blocked` | تجاوز حد الإرسال أو حظر مؤقت، مع `Retry-After` |
| 413 / 415 | تجاوز حجم الجسم / نوع محتوى غير مقبول |
| 503 | إعداد مطلوب أو خدمة معالجة غير متاحة |

يحفظ الخادم الطلب قبل محاولة البريد. حالات البريد `accepted` و`failed` و`disabled` و`timedOut` و`unknown` مستقلة عن نجاح الحفظ؛ قبول Brevo لا يثبت التسليم إلى صندوق الوارد.

تستخدم حماية التكرار بصمات HMAC للعنوان والرسالة. لا يُحفظ IP الخام أو رمز Turnstile داخل الطلب. يعتمد عنوان الشبكة على `CF-Connecting-IP` في بيئة Cloudflare، ولا يجوز الوثوق بهذه الترويسة من عميل مباشر عند نقل المعالج إلى خادم آخر.

### `GET /api/site`

يعيد مستندات `pricing` و`content` و`pages` المنشورة فقط؛ قاعدة بلا منشورات تعيد `{}`. يدعم `ETag` و304 مع تخزين مؤقت لمدة 30 ثانية. نشر محتوى جديد يبطل ذاكرة القارئ المحلي، وقد تظل نسخة لدى متصفح أو Worker آخر حتى انتهاء صلاحيتها.

## واجهات الإدارة

جميع المسارات التالية تبدأ بـ`/api/admin`. تتطلب جلسة الإدارة الموثقة، والكتابات تتطلب Origin مطابقًا ورمز `X-Admin-CSRF`. الردود الإدارية `no-store`.

| المسار | الطريقة | الوظيفة |
| --- | --- | --- |
| `/session` | GET | قراءة الجلسة وإصدار رمز CSRF |
| `/inquiries`، `/inquiries/{id}` | GET | قائمة الطلبات المرشحة وتفاصيل الطلب |
| `/inquiries/{id}/status`، `/inquiries/{id}/notes` | PATCH | تعديل مشروط بـ`expectedUpdatedAtUtc` |
| `/inquiries/{id}/replies` | GET / POST | تاريخ الردود وإرسال رد بمعرّف `operationId` ثابت |
| `/inquiries/export`، `/inquiries/import` | POST | تصدير أو استيراد حتى 100 طلب |
| `/documents/{key}` | GET / PUT | قراءة أو حفظ مسودة؛ المفتاح `pricing` أو `content` أو `pages` |
| `/documents/{key}/publish` | POST | نشر المسودة أو استعادة المنشور السابق بـ`restorePrevious` |
| `/documents/{key}/history` | GET | سجل النسخ مع ترقيم |
| `/documents/{key}/restore` | POST | استعادة نسخة محددة إلى المسودة |
| `/backup/documents` | GET | تصدير المسودات والمنشورات الحالية |
| `/media` | GET | مكتبة الوسائط |
| `/media/{uploadId}` | POST | رفع ملف binary بمعرّف UUID ثابت |
| `/media/{id}/archive` | POST | أرشفة ملف غير مستخدم في المسودات والمنشورات الحالية |

تستخدم تعديلات المستندات `expectedRevision` لمنع الكتابة فوق تعديل أحدث. التعارض يعيد 409. استيراد الطلبات يضيف المفقود دون إرسال بريد، وإعادة الرد بنفس `operationId` تقرأ العملية الموجودة ولا تنشئ رسالة أخرى.

الرفع يقبل PNG وJPEG وWebP وPDF حتى 10 MiB مع فحص توقيع الملف. الأرشفة تخفي العنصر وتحتفظ بالملف لحماية سجل المحتوى. روابط Supabase التي ينشئها المحوّل عامة؛ يجب أن تتوافق سياسة حاوية الإنتاج مع نشر هذه الملفات. لا يتراجع إعداد Supabase الناقص تلقائيًا إلى R2.

## النسخ والمهام المجدولة

تصدير مستندات اللوحة لا يشمل تاريخها الكامل أو الطلبات أو بايتات الوسائط. النسخة الكاملة تحتاج تصدير D1 ونسخ ملفات التخزين، مع إيقاف الكتابات خلال أخذ النسخة لضمان اتساقها.

تستخدم اختبارات استعادة D1 الأداة `tests/helpers/exportLocalDatabase.py` لتصدير قاعدة محلية مغلقة مع الحفاظ على أرقام Int64. هذه أداة اختبار وليست إجراء نسخ للإنتاج؛ يجب التحقق من دقة التصدير والاستعادة في البيئة المستهدفة.

توفر `scripts/supabaseMediaTools.js` الأوامر `probe` و`backup` و`restore`. يجب أن تطابق قيم المشروع والحاوية في الخيارات متغيرات البيئة. مثال صيغة الأمر:

```text
node scripts/supabaseMediaTools.js backup --project-ref PROJECT_REF --bucket BUCKET_NAME --directory PRIVATE_NEW_BACKUP_DIRECTORY
```

يتطلب نسخ حاوية عامة الخيار `--public-read` صراحة. الاستعادة تقبل وجهة أخرى فارغة وخاصة، وتتحقق من البصمات والبيانات الوصفية. الأداة لا تصدّر D1 ولا تعيد كتابة عناوين الملفات داخل المحتوى عند تغيير الحاوية. `probe` يكتب ملفات اختبار ويحتاج كذلك `SUPABASE_PUBLISHABLE_KEY`؛ استخدمه في المعاينة فقط. تبقى النسخ والأدلة خارج Git ومجلدات الموقع العامة.

يجدول Worker الموقع تنظيف بصمات الحجز المنتهية كل 6 ساعات، واستدعاء `project_heartbeat` في Supabase كل 3 ساعات. تعريف RPC في [`supabase/project_heartbeat.sql`](supabase/project_heartbeat.sql). يتطلب الاستدعاء إعداد Supabase وسره على Worker؛ لا يقرأ D1 ولا يضمن منع إيقاف مشروع Supabase بسبب سياسة الخمول. لا تعمل مهام cron تلقائيًا بمرور الوقت في `wrangler dev`.

## التحقق

من هذا المجلد:

```powershell
npm test
npm run build
```

`npm run build` ينفّذ `wrangler deploy --dry-run --outdir dist`؛ لا ينشر ولا يطبّق ترحيلات بعيدة. الاختبارات تستخدم موارد محلية وخدمات خارجية معزولة، وتحتاج بعض اختبارات الاستعادة Python كما هو موضح في دليل الإصدار. نجاحها لا يثبت إعداد حسابات الإنتاج أو وصول البريد أو أداء الاستضافة تحت الحمل.
