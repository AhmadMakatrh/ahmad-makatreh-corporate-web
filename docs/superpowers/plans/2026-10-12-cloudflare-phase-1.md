# Cloudflare Phase 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. التنفيذ المباشر في الجلسة هو الأسلوب السابق المعتمد؛ لا تفويض جديد أو commits تلقائية.

**Goal:** تشغيل استقبال الطلبات والحفظ ومنع التكرار وإشعارات Brevo على Workers مع D1 محلي حقيقي، والمحافظة على عقد الواجهة الحالية.

**Architecture:** يضاف خادم JavaScript داخل `server/cloudflare/`؛ يبقى خادم .NET مرجعًا للسلوك والعقود. المرحلة الحالية معزولة عن Worker الإنتاج والتوجيه الحالي، وتنتج API قابلًا للاختبار قبل ربط الحسابات. يُدمج الخادم مع Worker الموقع الواحد بعد اكتمال بقية مراحل الإدارة والتكافؤ، وفق التصميم المعتمد.

**Tech Stack:** JavaScript ESM وJSDoc، Web Crypto، Cloudflare Workers/D1، Brevo HTTPS، Node.js 24 الموجود، Wrangler `4.149.0` كأداة تطوير، و`ipaddr.js` `2.5.0` لتطبيع IP؛ لا إطار خادم إضافي أو حزم React جديدة.

**Spec:** `docs/superpowers/specs/2026-10-12-cloudflare-integration-design.md` — معتمد بتاريخ 2026-10-12.

## Global Constraints

- تبقى `client/src/admin/`، الواجهة واللغتان، المصدر السابق والتغييرات غير المحفوظة في Git.
- جميع خانات النموذج ترسل في HTTP واحد. لا طلبات أثناء الكتابة، polling، حفظ تلقائي أو إعادة إرسال بريد تلقائية.
- التطابق: الاسم والبريد والسبب والتفاصيل بعد trimming الحالي، من IP نفسه، خلال 30 دقيقة. الباقة ورمز Turnstile ليسا جزءًا من التطابق.
- الإرسال الأصلي يحفظ مرة؛ الإعادات الأربع التالية ترد بالتكرار؛ الإعادة الخامسة، أي المحاولة السادسة، تبدأ حظر IP كاملًا 30 دقيقة. الطلب أثناء الحظر لا يمدد نهايته.
- الحفظ ومنع التكرار والحظر ذري، ولا يحفظ IP الخام؛ HMAC بمفتاح لا يقل عن 32 بايت UTF-8.
- نجاح الحفظ منفصل عن البريد؛ لا حذف للطلب عند فشل الإشعار، ولا ادعاء تسليم للبريد بمجرد قبول Brevo.
- الحفاظ على حقول JSON والحالات والرسائل الموجودة؛ null للسبب والباقة يبقى مقبولًا وفق العقد السابق.
- لا إنشاء موارد أو تبديل الإنتاج أو DNS قبل معرفة الحسابات ومرحلة النسخة المختبرة. لا أسرار في المصدر أو `VITE_*`؛ لا تفعيل فوترة دون اختيار المالك.

## Review Focus

1. عشرون إرسالًا مطابقًا متزامنًا: سجل واحد ومحاولة بريد واحدة؛ اختبار المهمة 4 ثم اختبار HTTP في المهمة 6.
2. رسائل A ثم B ثم A من IP نفسه: تغيير المحتوى مؤقتًا لا يمحو عداد A؛ المهمة 4. هذه تحقق المتطلب المعتمد، وتختلف عن صف الحارس القديم الذي يحتفظ بآخر رسالة فقط.
3. حفظ ناجح ثم انقطاع جواب Brevo أو تحديث نتيجته: لا إعادة إرسال أو حذف، والنتيجة غير المؤكدة `unknown`؛ المهمتان 5 و6.
4. JSON غير صالح، أنواع خاطئة، نص عربي أو Unicode على حدود الطول، وIP مفقود أو مزور: رفض قبل الحفظ، دون كشف بيانات أو مفاتيح؛ المهمتان 3 و6.
5. مستند منشور عربي يتجاوز حجم صف D1 أو chunks ناقصة: إعادة تجميع صحيحة أو فشل واضح، دون كشف مسودة؛ المهمة 2.

## قرار معتمد مع الخطة بتاريخ 2026-10-12

الخادم الحالي يسمح بثلاث محاولات كل 20 ثانية. محدد Workers المدمج يدعم 10 أو 60 ثانية فقط. المقترح هنا **9 محاولات كل 60 ثانية لكل IP في موقع Cloudflare**؛ معدل متوسط مماثل مع سماح بدفعة أكبر، وهو تقريب محلي وليس حدًا عالميًا دقيقًا. لا يحتاج قراءة أو كتابة D1. حظر التكرار نصف ساعة يبقى دقيقًا داخل معاملة D1. اعتماد الخطة يشمل هذا التغيير؛ إن رفضه المالك يبقى القرار مفتوحًا ويُعرض بديل قبل تنفيذ المحدد، ولا تتغير الحماية بصمت. [توثيق Cloudflare](https://developers.cloudflare.com/workers/runtime-apis/bindings/rate-limit/).

## الملفات والعقود المشتركة

تُنشأ الملفات المذكورة في كل مهمة بعد التحقق من عدم وجودها. لا تعديل ملفات العميل أو .NET في المرحلة الأولى.

- `BookingInput`: `{ name, email, projectDetails, turnstileToken, serviceKey, inquiryCategory }`؛ أول ثلاثة نصوص، البقية `string|null`.
- `Inquiry`: `{ id, referenceId, name, email, projectDetails, serviceKey, inquiryCategory, status, createdAtUtc, updatedAtUtc }`؛ UUID، تواريخ ISO UTC، والحالة `New`.
- `SubmissionOutcome`: `{ disposition: 'stored'|'duplicate'|'blocked', retryAfterSeconds?: number }`.
- `NotificationStatus`: `'accepted'|'failed'|'disabled'|'timedOut'|'unknown'`؛ يستعمل الحفظ `timedOut` كما في .NET، والاستجابة `timedOut`.
- `PublishedSnapshot`: `{ json: string, etag: string, documents: Record<string, object> }`.
- تكتب تعريفات JSDoc في الوحدة المالكة وتستوردها الأنواع التابعة؛ لا طبقات factories/repositories عامة.
- مرجع النصوص والعقود: `BookingRequest.cs` و`BookingResponse.cs` و`BookingEndpoints.cs` و`BookingApplicationService.cs` و`SubmitBookingValidator.cs` و`InquiryCategories.cs` و`ServicePackages.cs` و`BookingAbuseHasher.cs`، في مجلدات `server/src/` الموجودة.

---

### Task 1: أدوات محلية وترحيل D1 قابل للاختبار

**Files:** إنشاء `server/cloudflare/package.json` و`package-lock.json` و`wrangler.jsonc` و`.dev.vars.example` و`migrations/0001_public_api.sql` و`tests/wrangler.test.jsonc` و`tests/helpers/d1.js` و`tests/schema.test.js`. تعديل `.gitignore` بإضافة استثناءات بيانات وأسرار `server/cloudflare/` فقط.

**Interfaces:** `openTestDatabase(): Promise<{ db: D1Database, dispose(): Promise<void> }>` في مساعد الاختبار، و`applyInitialMigration(db): Promise<void>`؛ لا يستورد المنتج أدوات Wrangler أو مساعد الاختبار.

- [x] اكتب `schema.test.js`: قاعدة فارغة، unique للمرجع، CHECK للقيم والطول، FK/PK، وإعادة الترحيل عبر نظام migrations لا تمحو سجلًا موجودًا. اختبر rollback لـ`D1.batch` بعبارتين ثانيتهما تفشل.
- [x] ثبّت Wrangler فقط كأداة تطوير في المشروع الجديد بواسطة `npm install --include=optional`؛ شغّل `node --test tests/schema.test.js` من `server/cloudflare/`. يجب أن تفشل الاختبارات أولًا لغياب الترحيل، لا لمشكلة تثبيت مهملة.
- [x] نفذ الترحيل: `inquiries` بكل حقول الطلب والملاحظات ونتيجة الإشعار الحالية؛ `booking_submission_guards` بمفتاح مركب `(ip_hash,payload_hash)` وعداد ووقت بداية/انتهاء وID للمحاولة الأصلية؛ `booking_ip_blocks` بمفتاح IP ونهاية حظر؛ indexes للانتهاء فقط لأن التنظيف يستعملها. لا تعديل بيانات PostgreSQL.
- [x] أضف أساس المنشور: `site_documents` مفتاحه أحد `pricing/content/pages` مع `published_body_id` nullable؛ `site_document_chunks` بمفتاح `(body_id,part_number)`، وBLOB أقصاه 524288 بايت. لا تخزن مسودة ومنشورًا وتاريخًا في صف ضخم واحد. D1 يحد الصف إلى 2 MB، بينما حد المصدر الحالي 1500000 وحدة UTF-16 وقد يتجاوز ذلك بالـUTF-8. تضيف المرحلة 3 حقول المسودات والمراجعات بترحيل إضافي. [حدود D1](https://developers.cloudflare.com/d1/platform/limits/).
- [x] اضبط Wrangler محليًا دون account/database IDs أو routes أو نطاق إنتاج: binding `DB`، compatibility date `2026-09-05` المدعوم من runtime المثبت (قرار التنفيذ موثق)، واسم محلي منفصل. الاختبارات تستعمل `getPlatformProxy({ configPath: testConfig, persist: false, remoteBindings: false })` وتغلق `dispose()` دائمًا؛ لا تحمل `.dev.vars` الحقيقية.
- [x] اجعل scripts: `test: node --test tests/*.test.js`، `dev: wrangler dev --local`، `build: wrangler deploy --dry-run --outdir dist`. مثال الأسرار أسماء فارغة فقط؛ `.wrangler/` و`.dev.vars*` الحقيقية مستثناة، مع إبقاء المثال قابلًا للحفظ.
- [x] شغّل اختبار schema وتحقق من نجاحه ومن `git check-ignore` للأسرار وبيانات D1؛ راجع diff لهذه المهمة وسجل النتيجة دون commit.

### Task 2: قراءة المحتوى المنشور دون قراءات متكررة

**Files:** إنشاء `server/cloudflare/src/publishedSite.js` و`tests/publishedSite.test.js`.

**Interfaces:** `createSiteReader({ now = Date.now } = {}): { read(db): Promise<PublishedSnapshot>, invalidate(): void }`؛ تستعمل المهمة 3 و6 نفس reader singleton، وتستعمل مرحلة النشر التالية `invalidate()`.

- [x] اكتب اختبارات: قاعدة فارغة تنتج `{}`؛ 100 قراءة متزامنة تولد SELECT واحدًا؛ القراءة داخل 30 ثانية لا تصل إلى D1؛ انتهاء المدة يعيد القراءة مرة؛ إبطال أثناء قراءة جارية لا يعيد تخزين نسخة قديمة.
- [x] أضف اختبارات العربية الممتدة عبر حدود chunks، ترتيبها، فقد جزء/JSON فاسد، وعدم وجود مسودات في النتيجة. اختبر ETag ثابتًا لنفس المحتوى ومتغيرًا عند تغييره.
- [x] شغّل `node --test tests/publishedSite.test.js` وتأكد أنه يفشل لغياب التنفيذ.
- [x] نفذ SELECT مهيأ واحدًا للمنشور في المفاتيح الثلاثة، joins مرتبة و`LIMIT 31` مع التحقق من عدم تجاوز 10 chunks لكل مستند أو فقد تسلسل. جمع UTF-8 ثم decode/parse؛ فساد البيانات خطأ، ولا يحول إلى `{}`. حافظ على أقصى 1500000 وحدة UTF-16 للمستند؛ 10 chunks تكفي للتمثيل UTF-8.
- [x] نفذ cache داخل isolate لمدة 30000 ms، واشتراك القراءات في promise واحدة، وgeneration للإبطال، وSHA-256 ETag للاجمالي. لا Cache API إضافي في هذه المرحلة؛ أي isolate جديد يقرأ مرة، وليس cache عالميًا مضمونًا.
- [x] شغّل الاختبارات وراجع الحدود وعدد SELECTs، وسجل النتيجة.

### Task 3: التحقق وبصمات التكرار والمرجع

**Files:** إنشاء `server/cloudflare/src/bookingValidation.js` و`src/bookingCrypto.js` و`tests/bookingValidation.test.js` و`tests/bookingCrypto.test.js`. إضافة `ipaddr.js` `2.5.0` للمشروع الجديد بعد تأكيد غياب بديل حالي يوفر parse كاملًا؛ لا نقل الحزمة إلى العميل.

**Interfaces:** `validateBooking(value, { allowPublishedService = false } = {}): { input: BookingInput|null, errors: string[] }`؛ `isKnownService(key): boolean`؛ `getCategoryDetails(key): { tag:string,label:string }|null`؛ `getServiceName(key): string|null`. `hashBookingIdentity(key, clientIp, input): Promise<{ ipHash:string,payloadHash:string }>`؛ `createInquiry(input, nowMs): Inquiry`.

- [x] اكتب الاختبارات بأسماء `rejectsWrongTypesAndInvalidJsonShape` و`preservesArabicAndBoundaryLengths` و`allowsLegacyNullCategory` و`rejectsUnknownCategoriesAndServices`؛ أطوال trimmed هي 100/255/4000، البريد بالنمط الحالي، والسبب والباقة من المفاتيح الموجودة.
- [x] اختبر تغيير كل حقل من الحقول الأربعة يغير بصمة الرسالة، ولا يغيرها تغيير الباقة أو Turnstile. اختبر `192.0.2.1` و`::ffff:192.0.2.1` لهما بصمة IP واحدة، والصيغ المختصرة/الموسعة لـIPv6 واحدة؛ IP فاسد أو zone/CIDR مرفوض، ومفتاح أقل من 32 بايت مرفوض.
- [x] شغّل `node --test tests/bookingValidation.test.js tests/bookingCrypto.test.js` لتأكيد الفشل قبل التنفيذ.
- [x] انقل القيود والخرائط والنصوص المحددة من .NET؛ لا lowercasing للأسماء والبريد أو Unicode normalization غير موجود. نفذ IP إلى 16 بايت IPv6 mapped باستخدام المكتبة؛ HMAC-SHA256 بالنطاقين `booking-ip-v1` و`booking-payload-v1` وفاصل صفر وطول big-endian 32-bit لكل حقل كما في المصدر. اختبر vectors مستقلة مشتقة من الترميز المحدد، لا من استدعاء الدالة نفسها.
- [x] أنشئ UUID بـ`crypto.randomUUID()` ومرجع `REQ-yyyyMMdd-XXXXXX` بعشوائية Web Crypto وأبجدية المصدر `23456789ABCDEFGHJKLMNPQRSTUVWXYZ`؛ لا `Math.random`.
- [x] شغّل الاختبارات وحدد في السجل حفظ التوافق UTF-8 وnull والهوية؛ راجع diff.

### Task 4: حفظ ذري وحظر وتنظيف محدود

**Files:** إنشاء `server/cloudflare/src/inquiries.js` و`tests/inquiries.test.js`.

**Interfaces:** `storeInquiry(db, inquiry, ipHash, payloadHash, nowMs): Promise<SubmissionOutcome>`؛ `recordNotification(db, inquiryId, status, attemptedAtUtc): Promise<void>`؛ `cleanupAbuse(db, nowMs): Promise<{ guardsDeleted:number,blocksDeleted:number }>`.

- [x] اكتب اختبارات D1 حقيقية: الإرسال الأول stored، الأربع التالية duplicate، السادس blocked مع 1800 ثانية، الرسالة المختلفة أثناء الحظر blocked، وعدم تمديد الحظر. عند نهاية الحظر يبدأ طلب جديد، وعند 30 دقيقة تنتهي نافذة التطابق.
- [x] أضف اختبار A/B/A، و20 كتابة متزامنة: صف inquiry واحد فقط؛ ومحاولة تصادم referenceId تفشل المعاملة فلا يزيد العداد ولا يوجد حفظ جزئي. اختبر SQL injection كنص محفوظ، وIP مختلف يسمح بطلب مستقل.
- [x] شغّل `node --test tests/inquiries.test.js` لتأكيد الفشل.
- [x] نفذ `storeInquiry` باستدعاء `D1.batch` واحد ومعاملة تضم أربع عبارات مهيأة: upsert حارس الرسالة إن لم يكن IP محظورًا، upsert حظر عند وصول عداد 6، insert inquiry فقط إن كان ID حارس المحاولة الأولى يطابق ID الحالي ولم يوجد حظر، وSELECT نتيجة التصنيف. نافذة ثابتة من الإرسال الأول، والحظر يبدأ من الإعادة الخامسة. لا SELECT سابق أو INSERT منفصل خارج المعاملة. [ضمان batch](https://developers.cloudflare.com/d1/worker-api/d1-database/).
- [x] لا تعِد batch بعد نتيجة شبكة غير مؤكدة. تصادم unique للمرجع المثبت فقط يسمح بتوليد مرجع آخر والمحاولة بحد إجمالي ثلاث محاولات؛ إعادة المحاولة في المنسق بالمهمة 6، لا إعادة إرسال بريد.
- [x] نفذ تسجيل حالة الإشعار بتحديث واحد؛ والتنظيف DELETE محدود إلى 1000 حارس و1000 حظر في تشغيل cron واحد كل 6 ساعات مع indexes الانتهاء. لا تنظيف في كل طلب ولا حلقة غير محدودة، واختبر أن المحذوف منتهٍ فقط وأن الفائض ينتظر التشغيل التالي.
- [x] شغّل الاختبارات، وراجع counts/rollback والتزامن وdiff وسجل عدد العبارات الحقيقي.

### Task 5: Turnstile وإشعار Brevo بمهل وحدود واضحة

**Files:** إنشاء `server/cloudflare/src/turnstile.js` و`src/email.js` و`tests/turnstile.test.js` و`tests/email.test.js`.

**Interfaces:** `verifyTurnstile({ token, clientIp, secret, allowedHostnames }, fetcher = fetch): Promise<{ valid:boolean,error:string|null }>`؛ `sendInquiryNotification(inquiry, { apiKey,senderEmail,senderName,recipientEmail }, fetcher = fetch): Promise<NotificationStatus>`؛ تستعمل `getCategoryDetails/getServiceName` من المهمة 3.

- [x] اكتب اختبارات رفض token/secret/hostname المفقود أو الخاطئ، نجاح Siteverify فقط، والرد غير الصالح/timeout. outgoing HTTP stubs داخل الاختبارات فقط؛ لا bypass أو بيانات وهمية في المنتج.
- [x] اختبر Brevo 201 مع `messageId` => accepted؛ 429/خطأ معروف => failed؛ مهلة => timedOut؛ جواب مبهم => unknown؛ إعداد البريد الغائب => disabled. اختبر وسوم السبب العربية وReply-To وبقاء نص العميل plaintext وعدم التسرب إلى logs أو headers الاستجابة.
- [x] شغّل `node --test tests/turnstile.test.js tests/email.test.js` لتأكيد الفشل.
- [x] نفذ Siteverify إلى عنوان HTTPS الرسمي الثابت، مهلة 3000 ms ورفض fail-closed؛ remoteip من عنوان Cloudflare الموثوق وhostname من القائمة المضبوطة. لا قبول token بمجرد وجوده. لا retry تلقائي للرمز المستعمل مرة واحدة.
- [x] نفذ Brevo إلى `https://api.brevo.com/v3/smtp/email` فقط، مهلة 5000 ms و`api-key` في الطلب الخارجي وحده، sender متحقق/to وReply-To من النموذج؛ العنوان/body من صياغة `MailKitNotificationService.cs` مع وسم السبب. لا redirect أو retry تلقائي عند فشل/مهلة؛ لا الاعتماد على idempotency غير مثبت لهذا endpoint. [Brevo API](https://developers.brevo.com/docs/send-a-transactional-email).
- [x] شغّل الاختبارات وراجع كل فشل وإخفاء الأسرار؛ قبول Brevo لا يثبت الوصول إلى صندوق الوارد.

### Task 6: ربط HTTP كاملًا وحصر عمليات قاعدة البيانات

**Files:** إنشاء `server/cloudflare/src/booking.js` و`src/index.js` و`tests/bookingApi.test.js`، وإكمال `wrangler.jsonc` المحلي من المهمة 1.

**Interfaces:** `createBookingHandler({ fetcher = fetch, now = Date.now, siteReader }): (request,env)=>Promise<Response>` يستهلك مهام 2–5؛ `createApi({ fetcher = fetch, now = Date.now } = {}): { fetch(request,env,ctx):Promise<Response>, scheduled(controller,env,ctx):Promise<void> }`. تصدير singleton افتراضي في `index.js`؛ DI للاختبارات لا يستطيع العميل تفعيله من URL/header/body.

- [x] اكتب اختبارات HTTP بالعقود الحالية: 200 وnotificationStatus، 400 للتحقق، 409/code duplicate_submission، 429/code ip_blocked مع Retry-After، و429/code rate_limited؛ GET `/api/site` مع ETag/304. اختبر طرق خاطئة، JSON خاطئ، جسم فوق 65536 بايت، origins غير مسموحة، وheaders مزورة لـIP.
- [x] اختبر السلسلة كاملة بـD1 محلي وstubs خارجية فقط: 20 POST متزامنًا يحفظ واحدًا ويرسل إشعارًا واحدًا؛ database failure لا يرسل؛ بريد فاشل يبقي الطلب؛ تحديث نتيجة البريد الفاشل يرد نجاح حفظ مع `unknown`؛ انقطاع الرد ثم إعادة POST لا يرسل مرة أخرى.
- [x] شغّل `node --test tests/bookingApi.test.js` لتأكيد الفشل.
- [x] نفذ POST: body محدود وتحقيق أنواع أساسية، IP من `CF-Connecting-IP` الذي تحدده Cloudflare، HMAC ومحدد عام، Siteverify، والتحقق من باقة منشورة غير مخفية فقط عند serviceKey غير معروف. ثم batch وحالات duplicate/blocked، ثم البريد للـstored فقط، ثم تحديث النتيجة. سجل خطأ تشغيلي مختصر دون body/IP/token؛ لا تسقط خطأ التخزين أو تحفظ دون حماية.
- [x] نفذ إعداد missing DB/HMAC/Turnstile/rate-binding كفشل تهيئة واضح؛ لا permissive fallback. في الطلب القادم من Workers يكون header Cloudflare هو الموثوق، أما الاختبارات المحلية فتحقنه داخل harness؛ لا تفسر X-Forwarded-For أو IP داخل JSON. لا تجعل خادم Node عام يقبل هذا header من الإنترنت.
- [x] بعد اعتماد القرار الموضح أعلى الخطة، أضف binding `BOOKING_RATE_LIMITER` بحد 9/60، مفتاحه IP hash. رقم namespace محلي موجب، يفحص عدم التعارض داخل الحساب قبل النشر. هذا المحدد تقريبي؛ اختبر منع الـAPI عند فشله بلا D1 أو Brevo. يختبر binding الحقيقي في runtime محلي منفصل لأن proxy D1 لا يثبت سلوك rate limiter.
- [x] نفذ CORS لمسارات public فقط بأصول صريحة من الإعدادات، ولا wildcard؛ في الإنتاج يكون الموقع/API من الأصل نفسه. OPTIONS لا يصل إلى D1. مسارات الإدارة غير المنقولة ترد 404 في هذا Worker المعزول، دون تعطيل الإدارة الحالية على الإنتاج. cron يستدعي التنظيف المحدود من المهمة 4.
- [x] شغّل الاختبارات وسجل budget بالقياس: إرسال known/null service = batch واحد + update واحد؛ تكرار = batch واحد ولا بريد؛ رفض validation/rate/Turnstile = صفر D1، باستثناء تحقق باقة منشورة بعد التحقق الأساسي؛ باقة مخصصة cold قد تضيف SELECT منشورًا واحدًا. warm `/api/site` وOPTIONS = صفر D1. هذه جولات binding؛ العبارات والصفوف المفحوصة/المكتوبة ليست العدد نفسه.

### Task 7: مراجعة المرحلة وتوثيق التشغيل والاستئناف

**Files:** إنشاء `server/cloudflare/README.md`؛ تعديل `docs/cloudflare-integration-progress.md` فقط لتسجيل المنفذ والاختبارات والحدود؛ تحديث checkboxes هذه الخطة.

**Interfaces:** لا عقد منتج جديد؛ دليل تشغيل commands وbindings والأسرار وحالات HTTP وموازنة الطلبات كما نُفذت بالفعل.

- [x] شغّل `npm test` و`npm run build` من `server/cloudflare/`. اختبر تشغيل `npm run dev` المحلي وبناء Worker الفعلي؛ dry-run لا ينشر. local emulation لا يثبت CPU Free أو سلوك شبكة الإنتاج.
- [x] شغّل `node --test tests/admin.test.js` و`npm run lint` و`npm run build` من `client/`؛ اختبار عقود العميل كما هي، دون تغيير اختبار لإخفاء فشل. بناء محلي هنا تحقق مطلوب، لا نشر سحابي.
- [ ] اختبر network بالواجهة المعزولة عندما يتاح Turnstile test key أو الحساب: لا POST أثناء الكتابة أو اختيار سبب، وPOST واحد عند الإرسال. قياس المهلة الحالية للعميل 10 ثوانٍ تحت بطء D1/Brevo؛ إن أظهرت الحاجة لتعديلها، وثق القياس قبل أقل تعديل مطلوب ولا تستبدلها بإعادة محاولة تلقائية.
- [x] راجع `git status --short` وdiff الملفات المحددة وكل ملف جديد، واختبار عدم حفظ أسرار/PII أو logs مؤقتة. لا تعِد التغييرات السابقة، ولا commit/push.
- [x] حدّث سجل الاستئناف بنقطة دقيقة، نتائج الأوامر، budget المقاس، أي اختبار لم يعمل، والحسابات المنتظرة. لا تعلن الربط الفعلي أو جاهزية كل الإدارة بعد مرحلة 1 فقط.

**نتيجة المراجعة المحلية:** 36 اختبار Workers و14 اختبار إدارة عميل ناجحة، وبناء الاثنين ناجح. أصلح اختبار RED→GREEN مركب تجاوز 10 ثوانٍ: محاولة البريد وتسجيل نتيجتها الآن ضمن باقي ميزانية 9 ثوانٍ، مع بقاء سقفي 5/3 ثوانٍ، و`unknown` عند نفادها. حفظ D1 الجاري لا يمكن إلغاؤه؛ لا ضمان زمني للإنتاج. أصلح اختلاف whitespace في Unicode للمحافظة على عقد .NET. اختبار المتصفح أعلاه مشروط بتوفر إعداد Turnstile والربط؛ يبقى مفتوحًا لمرحلة النسخة المعزولة، ولا يدل على تحقق إنتاج كامل.

## المراحل التالية محفوظة حتى لا تضيع

كل مرحلة لاحقة لها خطة صغيرة مبنية على مصدر .NET الفعلي، دون إعادة تصميم واجهة الإدارة. هذا ليس إسقاطًا لميزات الاتفاق.

| المرحلة | النتيجة المطلوبة | شرط القبول |
| --- | --- | --- |
| 2 | Access JWT/allowlist وCSRF، inbox/filter/cursor، تغيير الحالة، الملاحظات، الردود، CSV/JSON واستيراد | رد واحد رغم إعادة الإرسال، طلبات GET مشتركة، لا استعلام جلسة أو polling، رفض الهوية/Origin غير المسموح |
| 3 | الأسعار والعروض وإنشاء/إخفاء الباقات، المحتوى باللغتين، قوالب الصفحات وترتيب أقسامها، مسودة/نشر/revision/history/restore/backup | chunks متوافقة مع حدود D1، تعارض حفظ لا يمحو تعديلًا، لا نشر مسودة أو cache حساس؛ بحث الطلبات لا يخالف حد LIKE 50 بايت |
| 4 | R2 والرفع ومكتبة الوسائط والأرشفة والنسخ والاستعادة | فحص التوقيع/النوع/10 MiB، حماية التكرار، أرشفة لا تكسر المراجع، استعادة على موارد معزولة |
| 5 | الحسابات والأسرار وAccess/DNS والمعاينة، دمج API داخل Worker الموقع الحالي واختيار نفس الأصل | اختبار بريد المالك، عقود كل الإدارة، ترحيل/نسخة بيانات إن وجدت، قياس CPU/rows/requests، موافقة نشر الإنتاج النهائية |

التصميم والخطة وحد 9/60 اعتمدها المالك بتاريخ 2026-10-12. التنفيذ المحلي جارٍ؛ أسئلة حساب Cloudflare وBrevo وبريد الاستقبال/دخول الإدارة ما زالت معلقة، والموارد الخارجية تعتمد عليها. الاختبارات المؤجلة وحدود التحقق موثقة في سجل الاستئناف.
