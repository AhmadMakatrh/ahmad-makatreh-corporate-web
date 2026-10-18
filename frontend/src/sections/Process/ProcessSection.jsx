// The file was created by Ahmed Al-Makhatreh.

// codeguard:components:start
// codeguard:defines: ProcessSection
import React from 'react';
import { useLanguage as useLang } from '../../hooks/useLanguage';

export function ProcessSection() {
  const { t: tRef } = useLang();

  const steps = [
    {
      number: tRef('step1Number'),
      title: tRef('step1Title'),
      desc: tRef('step1Desc'),
    },
    {
      number: tRef('step2Number'),
      title: tRef('step2Title'),
      desc: tRef('step2Desc'),
    },
    {
      number: tRef('step3Number'),
      title: tRef('step3Title'),
      desc: tRef('step3Desc'),
    },
    {
      number: tRef('step4Number'),
      title: tRef('step4Title'),
      desc: tRef('step4Desc'),
    },
  ];

  return (
    <section id="process" className="section-space-lg bg-[#070707] text-white relative">
      <div className="container mx-auto page-gutter">
        {/* Section Header */}
        <div className="max-w-5xl mb-[var(--section-space-md)]">
          <div className="flex items-center gap-3 mb-4">
            <span className="w-2 h-2 rounded-full bg-[#D4EC31]"></span>
            <span className="font-display font-bold text-xs uppercase tracking-widest text-[#D4EC31]">
              {tRef('processTag')}
            </span>
          </div>
          <h2 className="font-display text-2xl sm:text-3xl md:text-4xl lg:text-[2.85rem] font-black uppercase text-start-logical leading-tight mb-6">
            {tRef('processHeading')}
          </h2>
          <p className="text-zinc-400 text-base sm:text-xl leading-relaxed text-start-logical font-light max-w-3xl">
            {tRef('processSubtitle')}
          </p>
        </div>

        {/* Process Steps: Sequential Timeline */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-fluid-md">
          {steps.map((step, index) => (
            <div
              key={index}
              className="border-t-2 border-zinc-800 hover:border-[#D4EC31] pt-6 flex flex-col justify-between transition-colors duration-300 group"
            >
              <div>
                <span className="font-display text-2xl md:text-3xl font-black text-zinc-600 group-hover:text-[#D4EC31] transition-colors block mb-4">
                  {step.number}
                </span>
                <h3 className="font-display text-lg sm:text-xl font-bold text-white mb-3 text-start-logical group-hover:text-[#D4EC31] transition-colors">
                  {step.title}
                </h3>
                <p className="text-zinc-400 text-xs sm:text-sm leading-relaxed font-light text-start-logical">
                  {step.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
// codeguard:components:end
