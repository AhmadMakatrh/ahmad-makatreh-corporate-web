// The file was created by Ahmed Al-Makhatreh.

// codeguard:components:start
// codeguard:defines: ExpertiseSection
import React from 'react';
import { useLanguage as useLang } from '../../hooks/useLanguage';

export function ExpertiseSection() {
  const { t: tRef, language } = useLang();

  const expertiseCards = [
    {
      icon: 'fa-server',
      titleKey: 'backendTitle',
      descKey: 'backendDescription',
    },
    {
      icon: 'fa-mobile-screen',
      titleKey: 'webTitle',
      descKey: 'webDescription',
    },
    {
      icon: 'fa-robot',
      titleKey: 'aiTitle',
      descKey: 'aiDescription',
    },
    {
      icon: 'fa-gamepad',
      titleKey: 'gameTitle',
      descKey: 'gameDescription',
    },
  ];
  const expertiseCardsRef = expertiseCards;

  return (
    <section className="section-space-lg bg-[#141414] text-white flex-grow">
      <div className="container mx-auto page-gutter">
        <div className="mb-[var(--section-space-md)] max-w-4xl">
          <h2 className="font-display text-3xl sm:text-5xl md:text-6xl font-black mb-6 uppercase text-start-logical leading-tight flex items-baseline gap-3">
            {language === 'ar' ? (
              <>
                <span>هندسة</span>
                <span className="text-zinc-500 outline-text">التميّز</span>
              </>
            ) : (
              <>
                <span>Engineering</span>
                <span className="text-zinc-500 outline-text">Excellence</span>
              </>
            )}
          </h2>
          <p className="text-base sm:text-xl text-zinc-400 leading-relaxed text-start-logical">
            {tRef('expertiseIntro')}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-10">
          {expertiseCardsRef.map((card, idx) => (
            <div
              key={idx}
              className="border border-zinc-800 bg-[#0c0c0c] p-8 md:p-10 rounded-3xl hover:border-[#D4EC31] transition-all duration-300 group flex flex-col justify-between"
            >
              <div>
                <div className="text-[#D4EC31] text-3xl md:text-4xl mb-6">
                  <i className={`fa-solid ${card.icon}`}></i>
                </div>
                <h3 className="font-display text-2xl sm:text-3xl font-bold text-white mb-4 uppercase group-hover:text-[#D4EC31] transition-colors text-start-logical">
                  {tRef(card.titleKey)}
                </h3>
                <p className="text-zinc-400 text-sm sm:text-base leading-relaxed text-start-logical">
                  {tRef(card.descKey)}
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
