// The file was created by Ahmed Al-Makhatreh.

// codeguard:components:start
// codeguard:defines: projectContributions
import { getProjectCard as projectCardBySlug } from './projectCards';

export const projectContributions = [
  {
    slug: 'tammivo',
    title: { ar: 'TAMMIVO — تاميفو', en: 'TAMMIVO' },
    summary: { ar: 'منصة أدوات رقمية لمعالجة الملفات والوسائط عبر المتصفح.', en: 'A browser-based platform for file and media tools.' },
    role: { ar: 'تطوير خدمات الواجهة الخلفية، بناء أدوات معالجة الوسائط، وتحصين أمان الخادم.', en: 'Developing backend services, building media-processing tools, and hardening server security.' },
    contributions: {
      ar: ['تطوير وتحديث منطق الخادم لدعم أدوات معالجة الملفات وتحسين سرعة استجابتها.', 'دمج محرك FFmpeg لإضافة وظائف معالجة وتحويل ملفات الوسائط مباشرة عبر المتصفح.', 'ضبط ترويسات وسياسات الأمان، مما رفع تقييم MDN HTTP Observatory من F إلى A+ وتحقيق درجة A في ImmuniWeb.'],
      en: ['Developing and updating server logic to support file-processing tools and improve response times.', 'Integrating FFmpeg to add media-processing and conversion tools accessible directly through the browser.', 'Configuring security headers and policies, raising the MDN HTTP Observatory grade from F to A+ and achieving an A in ImmuniWeb.'],
    },
    result: { ar: 'سجّل الموقع درجة A في فحص ImmuniWeb بتاريخ 28 سبتمبر 2026. تقيس هذه الدرجة جوانب محددة من الحماية.', en: 'The site received an A in an ImmuniWeb test on September 28, 2026. The grade covers specific security checks.' },
    url: 'https://tammivo.com',
    linkLabel: { ar: 'زيارة تاميفو', en: 'Visit TAMMIVO' },
    media: projectCardBySlug('tammivo').media,
  },
  {
    slug: 'elpha-tales',
    title: { ar: 'Elpha Tales — حكايات ألفا', en: 'Elpha Tales' },
    summary: { ar: 'تطبيق لقراءة القصص العربية، منشور على Google Play.', en: 'An Arabic story-reading app published on Google Play.' },
    role: { ar: 'شاركت في نحو 80% من تطوير التطبيق، وتولّيت إعادة تصميم واجهته بالكامل.', en: 'I contributed to approximately 80% of the app’s development and redesigned its entire interface.' },
    contributions: {
      ar: ['إعادة تصميم واجهات التطبيق بالكامل مع دعم المظهرين الفاتح والداكن لتقديم تجربة قراءة وتصفح سلسة.', 'إعادة بناء هيكلية وعلاقات قاعدة البيانات لمعالجة الاختناقات السابقة وتحسين كفاءة استرجاع البيانات.', 'تطوير منطق الخدمات الخلفية (API) وتعزيز آليات الحماية لضمان استقرار التطبيق وأمان حسابات المستخدمين.'],
      en: ['Redesigning the full app interface with light and dark modes for a smooth reading and browsing experience.', 'Rebuilding the database structure and relationships to address existing bottlenecks and improve data retrieval efficiency.', 'Developing backend API logic and strengthening protection mechanisms to maintain application stability and user account security.'],
    },
    media: {
      mode: 'slideshow',
      items: [
        { src: '/images/projects/elpha-tales-home.png', caption: { ar: 'الصفحة الرئيسية لتطبيق Elpha Tales', en: 'Elpha Tales home screen' } },
        { src: '/images/projects/elpha-tales-story-categories.png', caption: { ar: 'تصنيفات القصص', en: 'Story categories' } },
        { src: '/images/projects/elpha-tales-latest-stories.png', caption: { ar: 'أحدث القصص والأكثر قراءة', en: 'Latest and most-read stories' } },
        { src: '/images/projects/elpha-tales-story-light.png', caption: { ar: 'تفاصيل قصة بالمظهر الفاتح', en: 'Story details in light mode' } },
        { src: '/images/projects/elpha-tales-story-dark.png', caption: { ar: 'تفاصيل قصة بالمظهر الداكن', en: 'Story details in dark mode' } },
        { src: '/images/projects/elpha-tales-story-dark-alternate.png', caption: { ar: 'تفاصيل القصة بمظهر داكن بديل', en: 'Alternate dark story details' } },
        { src: '/images/projects/elpha-tales-sign-in.png', caption: { ar: 'خيارات تسجيل الدخول', en: 'Sign-in options' } },
        { src: '/images/projects/elpha-tales-profile.png', caption: { ar: 'صفحة الحساب الشخصي', en: 'Profile screen' } },
        ...projectCardBySlug('elpha-tales').media.items,
      ],
    },
    url: 'https://play.google.com/store/apps/details?id=com.omarelpha.app',
    linkLabel: { ar: 'عرض التطبيق على Google Play', en: 'View on Google Play' },
  },
  {
    slug: 'elpha-reader',
    title: { ar: 'Elpha Reader — قارئ ألفا', en: 'Elpha Reader' },
    summary: { ar: 'تطبيق لتنظيم مكتبة الكتب وقراءة ملفات PDF.', en: 'An app for organizing a book library and reading PDF files.' },
    role: { ar: 'شاركت في نحو 70% من تطوير التطبيق، بما يشمل الواجهة وقاعدة البيانات والواجهة الخلفية.', en: 'I contributed to approximately 70% of the app’s development, across its interface, database, and backend logic.' },
    contributions: {
      ar: ['إعادة تصميم واجهات التطبيق بالكامل مع دعم المظهرين الفاتح والداكن لتقديم تجربة قراءة وتصفح سلسة.', 'إعادة بناء هيكلية وعلاقات قاعدة البيانات لمعالجة الاختناقات السابقة وتحسين كفاءة استرجاع البيانات.', 'تطوير منطق الخدمات الخلفية (API) وتعزيز آليات الحماية لضمان استقرار التطبيق وأمان حسابات المستخدمين.'],
      en: ['Redesigning the full app interface with light and dark modes for a smooth reading and browsing experience.', 'Rebuilding the database structure and relationships to address existing bottlenecks and improve data retrieval efficiency.', 'Developing backend API logic and strengthening protection mechanisms to maintain application stability and user account security.'],
    },
    media: projectCardBySlug('elpha-reader').media,
    url: 'https://play.google.com/store/apps/details?id=com.elpha.reader',
    linkLabel: { ar: 'عرض التطبيق على Google Play', en: 'View on Google Play' },
  },
];
// codeguard:components:end
