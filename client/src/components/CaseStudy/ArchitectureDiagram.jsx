// The file was created by Ahmed Al-Makhatreh.

// codeguard:components:start
// codeguard:defines: ArchitectureDiagram
import React from 'react';
import { TechnicalText as TechnicalTextRef } from './TechnicalText';

export function ArchitectureDiagram({ slug, language }) {
  const isAr = language === 'ar';

  if (slug === 'crisis-fund') {
    return (
      <div className="portfolio-case-architecture space-y-8 my-8">
        {/* Diagram 1: System Architecture */}
        <div className="bg-[#fffefa] border border-[var(--portfolio-line)] rounded-2xl p-6 sm:p-8">
          <div className="portfolio-case-diagram-heading flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3 border-b border-[var(--portfolio-line)] pb-4 mb-6">
            <span className="font-mono text-xs text-[var(--portfolio-green)] uppercase tracking-widest">
              {isAr ? '01 · مكونات النظام' : '01 · System components'}
            </span>
            <span className="text-[var(--portfolio-muted)] font-mono text-xs">
              {isAr ? 'كيف تتصل الواجهات بالخادم وقاعدة البيانات' : 'How the apps connect to the API and database'}
            </span>
          </div>

          <div className="portfolio-system-flow text-sm">
            {/* Clients */}
            <div className="portfolio-system-node border border-[var(--portfolio-line)] bg-[#fffefa] p-5 rounded-xl flex flex-col justify-center items-start space-y-3">
              <span className="text-[var(--portfolio-muted)] font-bold uppercase tracking-wider">
                {isAr ? 'واجهات الاستخدام' : 'User interfaces'}
              </span>
              <div className="w-full bg-[#f3f5ee] border border-[var(--portfolio-line)] py-2 px-3 rounded text-[var(--portfolio-ink)]">
                <TechnicalTextRef>{isAr ? 'لوحة الإدارة (Next.js 14)' : 'Admin dashboard (Next.js 14)'}</TechnicalTextRef>
              </div>
              <div className="w-full bg-[#f3f5ee] border border-[var(--portfolio-line)] py-2 px-3 rounded text-[var(--portfolio-ink)]">
                <TechnicalTextRef>{isAr ? 'تطبيق الهاتف (Flutter)' : 'Mobile app (Flutter)'}</TechnicalTextRef>
              </div>
              <span className="portfolio-system-connector" aria-hidden="true"><span className="portfolio-flow-horizontal">↔</span><span className="portfolio-flow-vertical">↕</span></span>
            </div>

            {/* Application Gateway & API */}
            <div className="portfolio-system-node border border-[#a9bdaa] bg-[var(--portfolio-sage)] p-5 rounded-xl flex flex-col justify-center items-start space-y-3">
              <span className="text-[var(--portfolio-green)] font-bold uppercase tracking-wider">
                {isAr ? 'الخادم وواجهة البرمجة' : 'Server and API'}
              </span>
              <div className="w-full bg-[var(--portfolio-paper)] border border-[#a9bdaa] py-2 px-3 rounded text-[var(--portfolio-green)]">
                <TechnicalTextRef>{isAr ? 'واجهة Laravel API' : 'Laravel API'}</TechnicalTextRef>
              </div>
              <div className="text-[11px] text-[var(--portfolio-muted)] leading-tight">
                <TechnicalTextRef>{isAr
                  ? 'قواعد الصلاحيات · توقيع HMAC · معالجة المعاملات'
                  : 'Permission rules · HMAC signatures · Transaction processing'}</TechnicalTextRef>
              </div>
              <span className="portfolio-system-connector" aria-hidden="true"><span className="portfolio-flow-horizontal">↔</span><span className="portfolio-flow-vertical">↕</span></span>
            </div>

            {/* Persistence & Data */}
            <div className="portfolio-system-node border border-[var(--portfolio-line)] bg-[#fffefa] p-5 rounded-xl flex flex-col justify-center items-start space-y-3">
              <span className="text-[var(--portfolio-muted)] font-bold uppercase tracking-wider">
                {isAr ? 'قاعدة البيانات والسجلات' : 'Database and records'}
              </span>
              <div className="w-full bg-[#f3f5ee] border border-[var(--portfolio-line)] py-2 px-3 rounded text-[var(--portfolio-ink)]">
                <TechnicalTextRef>{isAr ? 'الحسابات والقيود المالية (PostgreSQL)' : 'Accounts and ledger entries (PostgreSQL)'}</TechnicalTextRef>
              </div>
              <div className="w-full bg-[#f3f5ee] border border-[var(--portfolio-line)] py-2 px-3 rounded text-[var(--portfolio-ink)]">
                {isAr ? 'سجل التدقيق والمرفقات' : 'Audit log and attachments'}
              </div>
            </div>
          </div>

          <div className="mt-5 pt-4 border-t border-[var(--portfolio-line)] text-xs text-[var(--portfolio-muted)]">
            <TechnicalTextRef>{isAr
              ? 'قاعدة بيانات مستقلة لكل جهة عند النشر باستخدام Docker Compose'
              : 'A separate database for each organization when deployed with Docker Compose'}</TechnicalTextRef>
          </div>
        </div>

        {/* Diagram 2: Webhook & Idempotency Pipeline */}
        <div className="bg-[#fffefa] border border-[var(--portfolio-line)] rounded-2xl p-6 sm:p-8">
          <div className="portfolio-case-diagram-heading flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3 border-b border-[var(--portfolio-line)] pb-4 mb-6">
            <span className="font-mono text-xs text-[var(--portfolio-green)] uppercase tracking-widest">
              {isAr ? '02 · مراحل فحص إشعارات البنك' : '02 · Bank notification checks'}
            </span>
            <span className="text-[var(--portfolio-muted)] font-mono text-xs">
              {isAr ? 'خطوات فحص الإشعار ومنع تكراره' : 'How notifications are checked and deduplicated'}
            </span>
          </div>

          <ol className="portfolio-webhook-steps space-y-3 text-sm">
            {/* Step 1 */}
            <li className="p-4 rounded-lg bg-[#fffefa] border border-[var(--portfolio-line)]">
              <span className="text-[var(--portfolio-green)] font-bold">{isAr ? '01. استلام الإشعار' : '01. Notification received'}</span>
              <span className="text-[var(--portfolio-ink)]">
                <TechnicalTextRef>{`${isAr ? 'قراءة ترويسات التحقق:' : 'Request headers include:'} X-Bank-Webhook-Timestamp · X-Bank-Webhook-Signature · X-Bank-Webhook-Event-Id`}</TechnicalTextRef>
              </span>
            </li>

            {/* Step 2 */}
            <li className="p-4 rounded-lg bg-[#fffefa] border border-[var(--portfolio-line)]">
              <span className="text-[var(--portfolio-green)] font-bold">{isAr ? '02. تأكيد المصدر' : '02. Authenticate notification'}</span>
              <span className="text-[var(--portfolio-ink)]">
                <TechnicalTextRef>{isAr ? 'التحقق من توقيع HMAC-SHA256 عند تفعيله، أو مطابقة المفتاح السري عبر hash_equals' : 'Check the HMAC-SHA256 signature when enabled; otherwise compare the shared secret with hash_equals'}</TechnicalTextRef>
              </span>
            </li>

            {/* Step 3 */}
            <li className="p-4 rounded-lg bg-[#fffefa] border border-[var(--portfolio-line)]">
              <span className="text-[var(--portfolio-green)] font-bold">{isAr ? '03. فحص توقيت الطلب' : '03. Check notification time'}</span>
              <span className="text-[var(--portfolio-ink)]">
                {isAr ? 'رفض الإشعارات التي تتجاوز المهلة المسموحة (5 دقائق افتراضياً) لمنع إعادة استخدام الطلب' : 'With signature verification, reject notifications outside the allowed window (five minutes by default) to prevent replay'}
              </span>
            </li>

            {/* Step 4 */}
            <li className="p-4 rounded-lg bg-[#fffefa] border border-[var(--portfolio-line)]">
              <span className="text-[var(--portfolio-green)] font-bold">{isAr ? '04. منع تكرار الحوالة' : '04. Avoid duplicate transfers'}</span>
              <span className="text-[var(--portfolio-ink)]">
                {isAr ? 'مطابقة معرّف الإشعار ومرجع الحوالة قبل تسجيل أي معاملة جديدة' : 'Check the event ID and transfer references before recording a new transaction'}
              </span>
            </li>

            {/* Step 5 */}
            <li className="p-4 rounded-lg bg-[var(--portfolio-sage)] border border-[#a9bdaa]">
              <span className="text-[var(--portfolio-green)] font-bold">{isAr ? '05. تسجيل القيد المالي' : '05. Record transaction'}</span>
              <span className="text-[var(--portfolio-green)]">
                <TechnicalTextRef>{isAr ? 'حفظ الحوالة في PostgreSQL وترحيل قيد مزدوج متوازن (مدين ودائن) عند المطابقة' : 'Save the transfer in PostgreSQL and post balanced debit and credit ledger entries upon reconciliation'}</TechnicalTextRef>
              </span>
            </li>
          </ol>
        </div>
      </div>
    );
  }

  // Barari Diagrams
  return (
    <div className="space-y-8 my-8">
      {/* Diagram 1: Combat Hit Detection & Combo Loop */}
      <div className="bg-[#fffefa] border border-[var(--portfolio-line)] rounded-2xl p-6 sm:p-8">
        <div className="flex items-center justify-between border-b border-[var(--portfolio-line)] pb-4 mb-6">
          <span className="font-mono text-xs text-[var(--portfolio-green)] uppercase tracking-widest">
            {isAr ? '01 · مسار الضربة' : '01 · Hit detection flow'}
          </span>
          <span className="text-[var(--portfolio-muted)] font-mono text-xs">
            {isAr ? 'من ضغطة اللاعب إلى تسجيل الإصابة' : 'From player input to a registered hit'}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs font-mono">
          <div className="bg-[#fffefa] p-4 rounded-xl border border-[var(--portfolio-line)] flex flex-col justify-between">
            <span className="text-[var(--portfolio-green)] font-bold mb-2">{isAr ? '01. ضغط زر الهجوم' : '01. Attack input'}</span>
            <p className="text-[var(--portfolio-muted)] text-[11px] leading-relaxed">
              {isAr ? 'يسجّل النظام وقت ضغطة الهجوم في CachedAttackInputTime' : 'The system stores the attack input time in CachedAttackInputTime'}
            </p>
          </div>

          <div className="bg-[#fffefa] p-4 rounded-xl border border-[var(--portfolio-line)] flex flex-col justify-between">
            <span className="text-[var(--portfolio-green)] font-bold mb-2">{isAr ? '02. إشعار الحركة' : '02. Animation notify'}</span>
            <p className="text-[var(--portfolio-muted)] text-[11px] leading-relaxed">
              {isAr ? 'يشغّل AnimNotify_DoAttackTrace فحص الإصابة في لحظة الضربة' : 'AnimNotify_DoAttackTrace starts hit detection at the moment of the strike'}
            </p>
          </div>

          <div className="bg-[#fffefa] p-4 rounded-xl border border-[var(--portfolio-line)] flex flex-col justify-between">
            <span className="text-[var(--portfolio-green)] font-bold mb-2">{isAr ? '03. فحص الإصابة' : '03. Hit detection'}</span>
            <p className="text-[var(--portfolio-muted)] text-[11px] leading-relaxed">
              {isAr ? 'تجري SweepMultiByObjectType فحصًا كرويًا أمام الشخصية للبحث عن أهداف' : 'SweepMultiByObjectType checks for targets with a sphere sweep in front of the character'}
            </p>
          </div>

          <div className="bg-[var(--portfolio-sage)] p-4 rounded-xl border border-[#a9bdaa] flex flex-col justify-between">
            <span className="text-[var(--portfolio-green)] font-bold mb-2">{isAr ? '04. الضرر وقوة الدفع' : '04. Damage and knockback'}</span>
            <p className="text-[var(--portfolio-ink)] text-[11px] leading-relaxed">
              {isAr ? 'إذا كان الهدف يدعم ICombatDamageable، يُطبّق الضرر وقوة الدفع' : 'If the target supports ICombatDamageable, apply damage and knockback'}
            </p>
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-[var(--portfolio-line)] text-[11px] text-[var(--portfolio-muted)] font-mono text-center">
          {isAr
            ? 'يفحص AnimNotify_CheckCombo الضغطة المحفوظة للانتقال إلى الضربة التالية'
            : 'AnimNotify_CheckCombo checks buffered input to move to the next attack'}
        </div>
      </div>

      {/* Diagram 2: StateTree & EQS Enemy Flow */}
      <div className="bg-[#fffefa] border border-[var(--portfolio-line)] rounded-2xl p-6 sm:p-8">
        <div className="flex items-center justify-between border-b border-[var(--portfolio-line)] pb-4 mb-6">
          <span className="font-mono text-xs text-[var(--portfolio-green)] uppercase tracking-widest">
            {isAr ? '02 · قرارات الأعداء' : '02 · Enemy decisions'}
          </span>
          <span className="text-[var(--portfolio-muted)] font-mono text-xs">
            {isAr ? 'كيف يختار العدو حالته وموقعه' : 'How enemies choose a state and position'}
          </span>
        </div>

        <div className="space-y-3 text-xs font-mono">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 rounded-lg bg-[#fffefa] border border-[var(--portfolio-line)] gap-2">
            <span className="text-[var(--portfolio-green)] font-bold">{isAr ? 'تحديد حالة العدو' : 'Choose enemy state'}</span>
            <span className="text-[var(--portfolio-ink)]">
              CombatAIController {isAr ? 'يحدد ما إذا كان العدو سيتجول أو يغيّر موقعه أو يهاجم' : 'chooses whether the enemy patrols, repositions, or attacks'}
            </span>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 rounded-lg bg-[#fffefa] border border-[var(--portfolio-line)] gap-2">
            <span className="text-[var(--portfolio-muted)] font-bold">{isAr ? 'تقييم المواقع (EQS)' : 'Evaluate positions (EQS)'}</span>
            <span className="text-[var(--portfolio-ink)]">
              EnvQueryContext_Player {isAr ? 'يمدّ EQS بموقع اللاعب لتقييم المسافة والمواضع الممكنة' : 'provides the player location so EQS can evaluate distance and possible positions'}
            </span>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 rounded-lg bg-[#fffefa] border border-[var(--portfolio-line)] gap-2">
            <span className="text-[var(--portfolio-muted)] font-bold">{isAr ? 'الانتقال بين الحالات' : 'Switch states'}</span>
            <span className="text-[var(--portfolio-ink)]">
              {isAr ? 'ينتقل العدو إلى الهجوم عندما تتحقق شروط المسافة وخلو المسار' : 'The enemy attacks when distance and clear-path conditions are met'}
            </span>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 rounded-lg bg-[var(--portfolio-sage)] border border-[#a9bdaa] gap-2">
            <span className="text-[var(--portfolio-green)] font-bold">{isAr ? 'تنفيذ الهجوم' : 'Execute attack'}</span>
            <span className="text-[var(--portfolio-green)]">
              {isAr ? 'ينفّذ CombatEnemy حركة الهجوم، ويعرض UCombatLifeBar مستوى الصحة' : 'CombatEnemy plays the attack animation, while UCombatLifeBar shows health'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
// codeguard:components:end
