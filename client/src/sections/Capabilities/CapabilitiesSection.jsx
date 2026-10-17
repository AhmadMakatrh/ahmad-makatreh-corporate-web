// The file was created by Ahmed Al-Makhatreh.

// codeguard:components:start
// codeguard:defines: CapabilitiesSection
import React from 'react';
import { useLanguage as useLang } from '../../hooks/useLanguage';
import { useNavigation as useNav } from '../../hooks/useNavigation';

export function CapabilitiesSection() {
  const { t: tRef, language } = useLang();
  const { navigateTo: navigateToRef } = useNav();

  const capabilities = [
    {
      id: 'backend',
      number: '01',
      titleKey: 'cap1Title',
      problemKey: 'cap1Problem',
      valueKey: 'cap1Value',
      depthKey: 'cap1Depth',
      icon: 'fa-server',
    },
    {
      id: 'ai',
      number: '02',
      titleKey: 'cap2Title',
      problemKey: 'cap2Problem',
      valueKey: 'cap2Value',
      depthKey: 'cap2Depth',
      icon: 'fa-brain',
    },
    {
      id: 'platforms',
      number: '03',
      titleKey: 'cap3Title',
      problemKey: 'cap3Problem',
      valueKey: 'cap3Value',
      depthKey: 'cap3Depth',
      icon: 'fa-layer-group',
    },
    {
      id: 'simulation',
      number: '04',
      titleKey: 'cap4Title',
      problemKey: 'cap4Problem',
      valueKey: 'cap4Value',
      depthKey: 'cap4Depth',
      icon: 'fa-gamepad',
    },
  ];
  const capabilitiesRef = capabilities;

  return (
    <section id="capabilities" className="section-space-lg bg-[#0a0a0a] text-white border-y border-white/5 relative">
      <div className="container mx-auto page-gutter">
        {/* Section Header */}
        <div className="max-w-5xl mb-[var(--section-space-md)]">
          <div className="flex items-center gap-3 mb-4">
            <span className="w-2 h-2 rounded-full bg-[#D4EC31]"></span>
            <span className="font-display font-bold text-xs uppercase tracking-widest text-[#D4EC31]">
              {tRef('capabilitiesTag')}
            </span>
          </div>
          <h2 className="font-display text-2xl sm:text-3xl md:text-4xl lg:text-[2.85rem] font-black uppercase text-start-logical leading-tight mb-6">
            {tRef('capabilitiesHeading')}
          </h2>
          <p className="text-zinc-400 text-base sm:text-xl leading-relaxed text-start-logical font-light max-w-3xl">
            {tRef('capabilitiesIntro')}
          </p>
        </div>

        {/* 4 Pillars Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-fluid-md">
          {capabilitiesRef.map((cap) => (
            <div
              key={cap.id}
              className="bg-[#111111] border border-white/10 hover:border-[#D4EC31]/60 rounded-3xl card-pad-md transition-all duration-300 flex flex-col justify-between group"
            >
              <div>
                {/* Header Row: Icon & Pillar Number */}
                <div className="flex items-center justify-between mb-8">
                  <div className="w-12 h-12 rounded-2xl bg-[#D4EC31]/10 border border-[#D4EC31]/20 flex items-center justify-center text-[#D4EC31] text-xl group-hover:bg-[#D4EC31] group-hover:text-black transition-all duration-300">
                    <i className={`fa-solid ${cap.icon}`}></i>
                  </div>
                  <span className="font-display font-black text-xs text-zinc-500 tracking-widest">
                    [{cap.number}]
                  </span>
                </div>

                {/* Title */}
                <h3 className="font-display text-xl sm:text-2xl font-bold text-white mb-6 group-hover:text-[#D4EC31] transition-colors leading-snug text-start-logical">
                  {tRef(cap.titleKey)}
                </h3>

                {/* Business Value vs Problem Framework */}
                <div className="space-y-4 mb-8">
                  <div className="bg-[#080808] p-4 rounded-xl border border-white/5">
                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block mb-1">
                      {language === 'ar' ? 'المشكلة الشائعة:' : 'Common Technical Failure:'}
                    </span>
                    <p className="text-zinc-400 text-xs sm:text-sm font-light leading-relaxed">
                      {tRef(cap.problemKey)}
                    </p>
                  </div>

                  <div className="bg-[#080808] p-4 rounded-xl border border-[#D4EC31]/20">
                    <span className="text-[10px] font-bold text-[#D4EC31] uppercase tracking-widest block mb-1">
                      {language === 'ar' ? 'ما الفائدة لمشروعك؟:' : 'Tangible Business Outcome:'}
                    </span>
                    <p className="text-zinc-200 text-xs sm:text-sm font-light leading-relaxed">
                      {tRef(cap.valueKey)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Technical Depth Footer */}
              <div className="pt-5 border-t border-white/5 flex items-center justify-between text-start-logical">
                <span className="text-zinc-400 font-mono text-xs tracking-wider">
                  {tRef(cap.depthKey)}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Section Footer CTA: Explore Commercial Services & Pricing */}
        <div className="mt-14 pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-6">
          <p className="text-zinc-400 text-sm font-light text-center sm:text-start-logical">
            {language === 'ar'
              ? 'هل تبحث عن بناء نظام برمجي مخصص أو استشارة فنية لمشروعك؟'
              : 'Looking to build custom software, web platforms, or need technical consulting?'}
          </p>
          <button
            onClick={() => navigateToRef('services')}
            className="inline-flex items-center gap-3 bg-[#D4EC31] text-black font-display font-bold text-xs uppercase tracking-widest px-7 py-3.5 rounded-full hover:bg-white transition-colors cursor-pointer shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#D4EC31]"
          >
            <span>{language === 'ar' ? 'استكشف الخدمات والتسعير' : 'Explore Services & Pricing'}</span>
            <span>→</span>
          </button>
        </div>
      </div>
    </section>
  );
}
// codeguard:components:end
