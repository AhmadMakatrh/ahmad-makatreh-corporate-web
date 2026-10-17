// The file was created by Ahmed Al-Makhatreh.

// codeguard:components:start
// codeguard:defines: MediaPlaceholder
import React from 'react';

export function MediaPlaceholder({ items, language }) {
  const isAr = language === 'ar';

  return (
    <div className="space-y-6 my-10">
      <div className="flex items-center justify-between border-b border-[var(--portfolio-line)] pb-3">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#bd8b66] animate-pulse" />
          <span className="font-mono text-xs text-[#996442] font-bold uppercase tracking-wider">
            {isAr ? 'متطلبات التوثيق البصري الفعلي' : 'Authentic Media Requirements'}
          </span>
        </div>
        <span className="text-[11px] font-mono text-[var(--portfolio-muted)]">
          {isAr ? 'قيد انتظار لقطات المشروع الحقيقية' : 'Pending Real Project Captures'}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {items.map((item) => (
          <div
            key={item.id}
            className="border-2 border-dashed border-[#b6c5b3] bg-[#fffefa] rounded-xl p-6 flex flex-col justify-between min-h-[220px] transition-colors hover:border-[#729279]"
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="font-mono text-[10px] text-[var(--portfolio-muted)] bg-[var(--portfolio-sage)] px-2 py-0.5 rounded">
                  {item.id}
                </span>
                <span className="font-mono text-[10px] text-[#996442] font-bold tracking-wider">
                  PLACEHOLDER
                </span>
              </div>
              <h4 className="font-mono text-xs font-bold text-[var(--portfolio-ink)] tracking-wide mb-2 uppercase">
                {item.label}
              </h4>
              <p className="text-xs text-[var(--portfolio-muted)] font-light leading-relaxed">
                {isAr ? item.description.ar : item.description.en}
              </p>
            </div>

            <div className="mt-4 pt-3 border-t border-[var(--portfolio-line)] flex items-center justify-between text-[11px] font-mono text-[var(--portfolio-muted)]">
              <span>{isAr ? 'الملف المطلوب' : 'Source'}</span>
              <span className="text-[var(--portfolio-muted)] font-bold">1920x1080 PNG</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
// codeguard:components:end
