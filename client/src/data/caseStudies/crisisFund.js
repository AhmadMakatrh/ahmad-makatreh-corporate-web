// The file was created by Ahmed Al-Makhatreh.

// codeguard:components:start
// codeguard:defines: crisisFundData
import { getProjectCard as projectCardBySlug } from '../projectCards';

export const crisisFundData = {
  slug: 'crisis-fund',
  title: {
    ar: 'صندوق الأزمات العائلي',
    en: 'Crisis Fund',
  },
  subtitle: {
    ar: 'منصة لإدارة الصناديق المالية العائلية، تنظم المساهمات وطلبات الدعم بحسابات دقيقة وصلاحيات واضحة.',
    en: 'A family fund management platform that organizes contributions and support requests with accurate accounts and clear permissions.',
  },
  category: {
    ar: 'إدارة صندوق عائلي',
    en: 'Family fund management',
  },
  status: {
    ar: 'قيد التطوير',
    en: 'In development',
  },
  confirmedRole: {
    ar: 'تصميم بنية النظام (System Architecture)، وتطوير منطق المعاملات المالية ونظام الصلاحيات.',
    en: 'System architecture and development of financial transaction logic and the permissions system.',
  },
  timeline: '2025 - 2026',
  verifiedStack: [
    'Laravel API',
    'PostgreSQL',
    'Next.js 14',
    'Flutter',
    'Docker Compose',
    'HMAC-SHA256 Webhooks',
  ],
  repoUrl: 'https://github.com/AhmadMakatrh/crisis-fund-platform',
  
  overview: {
    ar: 'تدير المنصة مساهمات أفراد العائلة وطلبات الدعم المالي ضمن سجل محاسبي واضح. تعرض النسخة التجريبية الحالية الأرصدة، الحالات، حركة التحصيل والصرف، وسجل التدقيق باستخدام بيانات تجريبية.',
    en: 'The platform manages family contributions and financial support requests within a clear accounting record. The current beta shows balances, cases, collections, disbursements, and an audit log using demo data.',
  },

  screenshots: projectCardBySlug('crisis-fund').media.items,

  problem: {
    ar: 'إدارة الصناديق العائلية بالطرق التقليدية غالباً ما تواجه مشاكل في تتبع الأرصدة أو تداخل الصلاحيات أو الخطأ في تسجيل الحوالات عند تكرار إشعارات الدفع. الهدف كان بناء نظام يضبط حركة الأموال ويحفظ سجلاً قابلاً للتتبع لكل عملية.',
    en: 'Traditional family fund management can make balances difficult to track, blur approval responsibilities, and duplicate transfers when payment notifications repeat. The goal was a system that controls the movement of funds and keeps every operation traceable.',
  },

  constraints: {
    ar: [
      'منع تسجيل الحوالة المالية مرتين إذا أعاد البنك إرسال إشعار الدفع (Webhook).',
      'منع صاحب الطلب أو مدخل المعاملة من الموافقة على صرف المبلغ لنفسه.',
      'حفظ سجل تدقيق (Audit Log) يوضح من نفّذ كل عملية مالية ومتى.',
      'عزل بيانات كل صندوق في قاعدة بيانات مستقلة عند النشر باستخدام Docker.',
    ],
    en: [
      'Prevent duplicate financial transfers when the bank resends a payment Webhook.',
      'Prevent the requester or transaction creator from approving their own disbursement.',
      'Keep an Audit Log showing who performed each financial action and when.',
      'Separate each organization’s data in its own database when deployed with Docker.',
    ],
  },

  architecture: {
    title: {
      ar: 'كيف يعمل النظام؟',
      en: 'System architecture',
    },
    narrative: {
      ar: 'تتصل لوحة الإدارة (Next.js 14) وتطبيق الهاتف (Flutter) بخادم مركزي (Laravel API) يتولى التحقق من الصلاحيات ومعالجة الحركات المالية وحفظها في PostgreSQL ضمن حاويات Docker مستقلة لكل جهة.',
      en: 'The Next.js 14 admin dashboard and Flutter mobile app connect to a central Laravel API that checks permissions, processes financial transactions, and stores them in PostgreSQL, with independent Docker environments for each organization.',
    },
  },

  securityDeepDive: {
    title: {
      ar: 'التحقق من إشعارات البنك ومنع تكرارها',
      en: 'Verifying bank notifications and preventing duplicates',
    },
    narrative: {
      ar: 'عند ضبط مفتاح توقيع إشعارات البنك، يتحقق النظام من توقيع HMAC-SHA256 ووقت الإشعار قبل معالجته. النافذة الزمنية الافتراضية خمس دقائق، ويُفحص معرّف الإشعار ومرجع التحويل لتجنب تسجيله مرة أخرى.',
      en: 'When a bank webhook signing key is configured, the system checks the HMAC-SHA256 signature and notification time before processing. The default time window is five minutes, and it checks the event ID and transfer reference to avoid recording the same transfer again.',
    },
  },

  financialFlow: {
    title: {
      ar: 'تسجيل العمليات بالقيد المزدوج',
      en: 'Recording transactions with double-entry bookkeeping',
    },
    narrative: {
      ar: 'عند ترحيل العملية المالية إلى دفتر الحسابات، تُسجَّل بقيدين متوازنين، مدين ودائن، في الحسابات المعنية. يسهّل ذلك تتبع حركة الرصيد ومطابقة القيود مع كشوف البنك المستوردة من ملفات CSV.',
      en: 'When a financial transaction is posted to the ledger, it creates balanced debit and credit entries in the relevant accounts. This helps track balance changes and reconcile records against bank statements imported from CSV files.',
    },
  },

  codeWalkthrough: {
    title: {
      ar: 'معالجة إشعارات البنك ومنع التكرار',
      en: 'Bank notification processing and deduplication',
    },
    description: {
      ar: 'مقتطف من BankIncomingWebhookService.php يوضح التحقق من المفتاح السري بزمن ثابت لمنع هجمات التوقيت، والبحث المسبق عن مراجع التحويل لمنع تكرار القيود (بينما يتم فحص توقيع HMAC والوقت في خدمة منفصلة).',
      en: 'An excerpt from BankIncomingWebhookService.php showing a constant-time secret comparison to prevent timing attacks and a transfer-reference lookup to avoid duplicate entries. A separate service checks the HMAC signature and timestamp.',
    },
    language: 'php',
    code: `// apps/laravel-api/app/Services/Finance/Incoming/BankIncomingWebhookService.php

private function guardWebhookAccess(?string $providedSecret): void
{
    $expectedSecret = $this->stringSetting('bank.integration.webhook_secret');

    if ($expectedSecret === null || $expectedSecret === '') {
        throw new DomainException('Bank webhook secret is not configured.');
    }

    // Constant-time comparison to prevent timing attacks
    if ($providedSecret === null || ! hash_equals($expectedSecret, $providedSecret)) {
        throw new DomainException('Invalid bank webhook secret.');
    }
}

private function resolveExistingTransaction(
    array $payload,
    FinancialAccount $account,
): ?IncomingTransaction {
    $providerReference = $this->trimmed($payload['provider_reference'] ?? null);
    $bankReference = $this->trimmed($payload['bank_reference'] ?? $payload['event_id'] ?? null);

    // Prevent unfiltered query execution if both references are missing
    if ($providerReference === null && $bankReference === null) {
        return null;
    }

    // If matching bank reference already exists in database, return it without re-creating
    return IncomingTransaction::query()
        ->where('financial_account_id', $account->id)
        ->where(function ($query) use ($providerReference, $bankReference): void {
            if ($providerReference !== null) {
                $query->orWhere('provider_reference', $providerReference);
            }
            if ($bankReference !== null) {
                $query->orWhere('bank_reference', $bankReference);
            }
        })
        ->first();
}`,
  },

  missingMediaPlaceholders: [
    {
      id: 'admin-dashboard',
      label: 'CRISIS FUND WEB ADMIN UI CAPTURE REQUIRED',
      description: {
        ar: 'لقطة شاشة للوحة التحكم الإدارية (Next.js Admin) توضح كشف الحسابات ومتابعة الحالات الطارئة.',
        en: 'Screenshot of the Next.js Web Admin dashboard showing account overviews and emergency case statuses.',
      },
    },
    {
      id: 'mobile-app',
      label: 'CRISIS FUND FLUTTER MOBILE APP CAPTURE REQUIRED',
      description: {
        ar: 'لقطة شاشة لتطبيق الهاتف (Flutter) توضح شاشة المساهمات وتفاصيل الحالة الإغاثية.',
        en: 'Screenshot of the Flutter mobile app displaying member contributions and emergency case hardship details.',
      },
    },
    {
      id: 'audit-reconciliation',
      label: 'CRISIS FUND RECONCILIATION & AUDIT LOG CAPTURE REQUIRED',
      description: {
        ar: 'لقطة شاشة من سجل التدقيق أو جدول المطابقة البنكية للمعاملات الواردة.',
        en: 'Capture of the audit log view or bank reconciliation discrepancies table.',
      },
    },
  ],

  technicalTakeaways: {
    title: {
      ar: 'قرارات تقنية في المشروع',
      en: 'Technical decisions in the project',
    },
    points: {
      ar: [
        'القيد المحاسبي المزدوج (Double-Entry): تسجيل كل حركة مالية بقيدين متوازنين (مدين ودائن) بدلاً من تعديل الرصيد مباشرة، مما يضمن دقة الحسابات ويسهل مطابقتها مع كشوف البنك (CSV).',
        'فرض الصلاحيات في الخادم (API Authorization): تطبيق شروط اعتماد الصرف وفصل المهام داخل Laravel API نفسه، وليس بمجرد إخفاء الأزرار في واجهة المستخدم.',
        'عزل قواعد البيانات (Database Isolation): تشغيل كل صندوق في بيئة وقاعدة بيانات PostgreSQL مستقلة عبر Docker Compose لضمان عدم تداخل السجلات المالية.',
      ],
      en: [
        'Double-Entry Bookkeeping: Every financial transaction posts balanced debit and credit ledger entries rather than mutating balances directly, simplifying CSV bank statement reconciliation.',
        'API-Level Segregation of Duties: Disbursement approval rules are strictly enforced in the Laravel API layer, preventing creators from approving their own requests.',
        'Single-Tenant Database Isolation: Each organization runs in an isolated PostgreSQL instance via Docker Compose to prevent cross-tenant data overlap.',
      ],
    },
  },
};
// codeguard:components:end
