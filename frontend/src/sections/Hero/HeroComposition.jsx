// The file was created by Ahmed Al-Makhatreh.

// codeguard:components:start
// codeguard:defines: HeroComposition
import React from 'react';
import { useLanguage as useLang } from '../../hooks/useLanguage';
const HeroCompositionRef = HeroComposition;


/**
 * Unified Hero Composition Component (Arabic & English)
 * 
 * Features:
 * - Single DOM tree: 1 heading, 1 kinetic System Core, 3 semantic words.
 * - Semantic mapping:
 *     heroTitle1 = start / top word
 *     heroTitle2 = center word locked inside System Core
 *     heroTitle3 = end / bottom word
 * - Shared responsive system:
 *     COMPACT = default base (vertical stack: word1 -> Core+word2 -> word3)
 *     WIDE = single positive media query (3-column grid: word1 -> Core+word2 -> word3)
 * - Single accessible H1 with sr-only full sentence to eliminate screen-reader stutter.
 */
export function HeroComposition({ language: propLanguage }) {
  const { t: tRef, language: ctxLanguage } = useLang();
  const language = propLanguage || ctxLanguage || 'ar';

  const word1 = tRef('heroTitle1');
  const word2 = tRef('heroTitle2');
  const word3 = tRef('heroTitle3');
  const accessibleHeading = `${word1} ${word2} ${word3}`;

  return (
    <div 
      className="hero-composition" 
      role="region" 
      aria-label={accessibleHeading}
      data-lang={language}
    >
      {/* Single Accessible H1 for Screen Readers */}
      <h1 className="sr-only">{accessibleHeading}</h1>

      {/* Visual Composition: Single Shared DOM Tree */}
      <div className="hero-composition-visual" aria-hidden="true">
        {/* Start / Top Word (heroTitle1: CREATING / نصنع) */}
        <div className="hero-comp-item hero-comp-item--start">
          <span className="hero-word hero-word--start font-display">
            {word1}
          </span>
        </div>

        {/* Center Stage: Single Square Bounding Box containing System Core + Center Word */}
        <div className="hero-comp-item hero-comp-item--center hero-core-stage">
          {/* Kinetic System Core Geometry */}
          <div className="hero-system-core">
            {/* Ambient Core Flare */}
            <div className="hero-core-flare" />

            {/* Precision Crosshair Axis */}
            <div className="hero-axis-x" />
            <div className="hero-axis-y" />



            {/* Architectural Telemetry Annotations */}
            <div className="hero-telemetry hero-telemetry--start">
              <span className="w-1.5 h-1.5 rounded-full bg-[#D4EC31] animate-ping" />
              <span>SYS.CORE // 01</span>
            </div>

            <div className="hero-telemetry hero-telemetry--end" dir="ltr">
              <span>31.1810° N · 35.7018° E</span>
            </div>
          </div>

          {/* Center Word (heroTitle2: DIGITAL / واقع) locked in exact center */}
          <div className="hero-center-word">
            <span className="hero-word hero-word--center font-display">
              {word2}
            </span>
          </div>
        </div>

        {/* End / Bottom Word (heroTitle3: REALITIES / رقميًا) */}
        <div className="hero-comp-item hero-comp-item--end">
          <span className="hero-word hero-word--end font-display">
            {word3}
          </span>
        </div>
      </div>
    </div>
  );
}
// codeguard:components:end

export default HeroCompositionRef;
