// The file was created by Ahmed Al-Makhatreh.
// codeguard:components:start
// codeguard:defines: projectCards, getProjectCard

export const projectCards = [
  {
    slug: 'tammivo',
    name: 'TAMMIVO',
    featured: true,
    description: { ar: 'منصة لمعالجة الملفات والوسائط؛ طوّرت وظائف في الواجهة الخلفية وأضفت ميزات FFmpeg.', en: 'A file and media tools platform where I developed backend features and added FFmpeg capabilities.' },
    media: {
      mode: 'slideshow',
      items: [
        { src: '/images/projects/tammivo-website.png', srcEn: '/images/projects/tammivo-website-en.png', caption: { ar: 'واجهة موقع تاميفو', en: 'TAMMIVO website' } },
        { src: '/images/projects/tammivo-dashboard.png', caption: { ar: 'لوحة تحكم تاميفو', en: 'TAMMIVO dashboard' } },
      ],
    },
  },
  {
    slug: 'elpha-tales',
    name: 'Elpha Tales',
    featured: false,
    description: { ar: 'اكتشف قصصًا عربية متنوعة، واختر تصنيفاتك المفضلة لتجد حكايتك التالية.', en: 'Explore Arabic stories across diverse categories and find your next favorite read.' },
    media: {
      mode: 'single',
      items: [{ src: '/images/projects/elpha-tales-showcase-ar.png', srcEn: '/images/projects/elpha-tales-showcase-en.png', caption: { ar: 'صورة تعريفية لتطبيق Elpha Tales', en: 'Elpha Tales promotional banner' } }],
    },
  },
  {
    slug: 'elpha-reader',
    name: 'Elpha Reader',
    featured: false,
    description: { ar: 'نظّم مكتبتك الرقمية، واجمع كتبك في مجموعات، واستمتع بقراءة ملفات PDF بسهولة.', en: 'Organize your digital library, group your books, and enjoy reading PDFs with ease.' },
    media: {
      mode: 'slideshow',
      items: [
        { src: '/images/projects/elpha-reader-showcase.png', srcEn: '/images/projects/elpha-reader-showcase-en.png', caption: { ar: 'عرض لواجهات Elpha Reader', en: 'Elpha Reader interface showcase' } },
        { src: '/images/projects/elpha-reader-library-phone.png', caption: { ar: 'المكتبة بأغلفة كتب تجريبية', en: 'Library with sample book covers' } },
        { src: '/images/projects/elpha-reader-book-details.png', caption: { ar: 'تفاصيل كتاب هندسة البرمجيات', en: 'Software engineering book details' } },
        { src: '/images/projects/elpha-reader-collections-light.png', caption: { ar: 'المجموعات بالمظهر الفاتح', en: 'Collections in light mode' } },
        { src: '/images/projects/elpha-reader-collections-dark.png', caption: { ar: 'المجموعات بالمظهر الداكن', en: 'Collections in dark mode' } },
      ],
    },
  },
  {
    slug: 'crisis-fund',
    name: 'Crisis Fund',
    featured: true,
    inDevelopment: true,
    description: { ar: 'منصة أعمل على تطويرها لتنظيم مساهمات أفراد العائلة والمساعدات عند الأزمات.', en: 'A platform I am developing to organize family contributions and assistance during crises.' },
    media: {
      mode: 'slideshow',
      items: [
        { src: '/images/projects/crisis-fund-beta-home.png', caption: { ar: 'الصفحة التعريفية لصندوق الأزمات العائلي — واجهة تجريبية', en: 'Family crisis fund landing page — beta interface' } },
        { src: '/images/projects/crisis-fund-beta-dashboard.png', caption: { ar: 'لوحة الحساب التجريبي: التحصيل والصرف والحوكمة — بيانات تجريبية', en: 'Demo account dashboard: collections, disbursements, and governance — demo data' } },
      ],
    },
  },
  {
    slug: 'barari-game',
    name: 'Barari',
    featured: false,
    inDevelopment: true,
    description: { ar: 'نموذج لعبة تصويب أعمل على تطويره باستخدام Unreal Engine 5 وC++، ببيئات مستوحاة من الصحراء.', en: 'A shooter game prototype I am developing with Unreal Engine 5 and C++, set in desert-inspired environments.' },
    media: {
      mode: 'single',
      items: [{ src: '/images/projects/barari-battle-royale.png', caption: { ar: 'تصور بصري للعبة براري', en: 'Visual concept for Barari' } }],
    },
  },
];
const projectCardsRef = projectCards;

export function getProjectCard(slug) {
  return projectCardsRef.find((project) => project.slug === slug);
}
// codeguard:components:end
