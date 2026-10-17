// The file was created by Ahmed Al-Makhatreh.

// codeguard:components:start
// codeguard:defines: PositioningSection
import React from 'react';
import { useLanguage as useLang } from '../../hooks/useLanguage';

export function PositioningSection() {
  const { t: tRef } = useLang();

  const pillars = [
    {
      number: '01',
      title: tRef('pillar1Title'),
      desc: tRef('pillar1Desc'),
      tech: 'State Machines • Invariant Checking • Idempotency',
    },
    {
      number: '02',
      title: tRef('pillar2Title'),
      desc: tRef('pillar2Desc'),
      tech: 'ASP.NET Core 10 • PostgreSQL • Clean Architecture',
    },
    {
      number: '03',
      title: tRef('pillar3Title'),
      desc: tRef('pillar3Desc'),
      tech: 'Next.js 15 • React 19 • Flutter Native • Profiling',
    },
  ];

  return (
    <section id="manifesto" className="section-space-lg bg-[#090909] text-white border-b border-white/5 relative overflow-hidden">
      <div className="container mx-auto page-gutter">
        {/* Section Header / Tag */}
        <div className="flex items-center gap-3 mb-6">
          <span className="w-2 h-2 rounded-full bg-[#D4EC31] animate-pulse"></span>
          <span className="font-display font-bold text-xs uppercase tracking-widest text-[#D4EC31]">
            {tRef('manifestoTag')}
          </span>
        </div>

        {/* Core Manifesto Headline */}
        <div className="max-w-6xl mb-[var(--section-space-md)]">
          <h2 className="font-display text-2xl sm:text-3xl md:text-4xl lg:text-[2.85rem] font-black text-white uppercase tracking-tight leading-tight mb-8 text-start-logical">
            {tRef('manifestoHeading')}
          </h2>
          <p className="text-base sm:text-xl md:text-2xl text-zinc-400 font-light leading-relaxed max-w-4xl text-start-logical">
            {tRef('manifestoNarrative')}
          </p>
        </div>

        {/* 3 Pillars Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-fluid-md border-t border-white/10 pt-[var(--content-gap-lg)]">
          {pillars.map((pillar, index) => (
            <div
              key={index}
              className="flex flex-col justify-between border-b md:border-b-0 md:border-e border-white/10 last:border-none pb-8 md:pb-0 md:pe-8 group"
            >
              <div>
                <span className="font-display text-xs font-black text-[#D4EC31] tracking-widest block mb-4">
                  [{pillar.number}]
                </span>
                <h3 className="font-display text-xl sm:text-2xl font-bold text-white mb-4 group-hover:text-[#D4EC31] transition-colors leading-snug text-start-logical">
                  {pillar.title}
                </h3>
                <p className="text-sm md:text-base text-zinc-400 font-light leading-relaxed mb-6 text-start-logical">
                  {pillar.desc}
                </p>
              </div>

              <div className="pt-4 border-t border-white/5">
                <span className="font-mono text-[11px] text-zinc-500 tracking-wider block text-start-logical">
                  {pillar.tech}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
// codeguard:components:end
