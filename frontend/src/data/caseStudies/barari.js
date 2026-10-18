// The file was created by Ahmed Al-Makhatreh.

// codeguard:components:start
// codeguard:defines: barariData
import { getProjectCard as projectCardBySlug } from '../projectCards';

export const barariData = {
  slug: 'barari-game',
  title: {
    ar: 'براري — Barari',
    en: 'Barari',
  },
  subtitle: {
    ar: 'لعبة تصويب مستوحاة من الصحراء العربية، قيد التطوير باستخدام Unreal Engine 5',
    en: 'A desert-inspired shooter game in development with Unreal Engine 5',
  },
  category: {
    ar: 'لعبة تصويب',
    en: 'Shooter game',
  },
  status: {
    ar: 'قيد التطوير',
    en: 'In development',
  },
  confirmedRole: {
    ar: 'تصميم آليات اللعب الأساسية، برمجة أنظمة الحركة والتصويب بـ C++، وتوجيه الهوية البصرية.',
    en: 'Designing core gameplay, programming movement and aiming systems in C++, and directing the visual identity.',
  },
  timeline: '2025 - 2026',
  verifiedStack: ['Unreal Engine 5', 'C++'],
  repoUrl: 'https://github.com/AhmadMakatrh/Barari',
  mediaDescription: {
    ar: 'تصور بصري لاتجاه اللعبة؛ الصورة ليست من داخل اللعبة.',
    en: 'A visual concept for the game, not an in-game capture.',
  },
  screenshots: projectCardBySlug('barari-game').media.items,

  overview: {
    ar: 'مشروع لعبة تصويب (Third-Person Shooter) قيد التطوير باستخدام Unreal Engine 5 و C++، تستلهم بيئاتها من الصحراء والقرى العربية مع التخطيط لدمج القتال بالمركبات.',
    en: 'A Third-Person Shooter in development with Unreal Engine 5 and C++, with environments inspired by deserts and Arab villages and plans to integrate vehicle combat.',
  },

  problem: {
    ar: 'تحويل الهوية البصرية للعبة إلى نموذج لعب أولي (Prototype) مستقر يختبر سلاسة الحركة والتصويب والفيزياء قبل التوسع في تصميم الخرائط والمركبات.',
    en: 'Turn the game’s visual identity into a stable Prototype to test fluid movement, aiming, and physics before expanding map and vehicle design.',
  },

  constraintsTitle: {
    ar: 'متطلبات المرحلة الحالية',
    en: 'Current stage requirements',
  },

  constraints: {
    ar: [
      'ضبط وتخصيص نظام حركة الشخصية والتصويب (Locomotion & Combat) فوق نواة المحرك.',
      'بناء الأنظمة الأساسية باستخدام C++ لضمان الأداء وسهولة التوسع مستقبلاً.',
      'تهيئة البنية البرمجية لدمج نظام القتال بالمركبات وتوسيع البيئات.',
    ],
    en: [
      'Tune and customize character movement and aiming (Locomotion & Combat) on top of the engine foundation.',
      'Build core systems in C++ for performance and future extensibility.',
      'Prepare the software architecture to integrate vehicle combat and expand the environments.',
    ],
  },

  architecture: {
    title: {
      ar: 'حالة النموذج الأولي',
      en: 'Prototype status',
    },
    narrative: {
      ar: 'يركز النموذج الحالي على تأسيس نواة اللعب (Core Gameplay Foundation) بالانطلاق من قوالب Unreal Engine 5 القياسية لمنظور الشخص الثالث، وتخصيص آليات الحركة والقفز والاشتباك لتكون الأساس الذي تُبنى عليه ميزات "براري" الخاصة.',
      en: 'The current prototype focuses on a Core Gameplay Foundation built from Unreal Engine 5’s standard third-person templates, customizing movement, jumping, and combat as the basis for Barari’s own features.',
    },
  },

  technicalTakeaways: {
    title: {
      ar: 'خطة تطوير النموذج',
      en: 'Prototype development plan',
    },
    points: {
      ar: [
        'تأسيس نواة الحركة والقتال: ضبط استجابة الكاميرا وحركة الشخصية والتصويب لتناسب طبيعة المواجهات المفتوحة.',
        'بناء الأنظمة الخاصة بـ C++: تطوير آليات اللعب المخصصة لبراري وتوثيقها بمشاهد فعلية من داخل المحرك عند اكتمال كل ميزة.',
        'نظام المركبات والبيئات: إدراج القتال بالمركبات وتصميم القرى الصحراوية ضمن المرحلة التالية بعد استقرار نموذج اللعب الأساسي.',
      ],
      en: [
        'Movement and combat foundation: Tune camera response, character movement, and aiming for open encounters.',
        'Custom systems in C++: Develop Barari-specific gameplay and document each completed feature with footage captured in the engine.',
        'Vehicles and environments: Introduce vehicle combat and desert village design in the next stage after the core gameplay prototype is stable.',
      ],
    },
  },
};
// codeguard:components:end
