// The file was created by Ahmed Al-Makhatreh.

// codeguard:components:start
// codeguard:defines: MobileEyeCta
import React, { useEffect, useRef, useState } from 'react';
import { useReducedMotion as useMotionPref } from '../../hooks/useReducedMotion';

/**
 * MobileEyeCta — Abstract Eye-shaped Interactive CTA for Mobile Hero
 *
 * Layers:
 * 1. Outer Shell: Horizontally stretched almond SVG silhouette with thin #D4EC31 outline & HUD ticks
 * 2. Inner Pupil: Organic target-based wandering core, dashed reticle, aperture glint (clipped inside eye)
 * 3. Eyelids: Infrequent, smooth organic blink (scaleY)
 * 4. Anchored Label: High-contrast, rock-solid localized text (never jitters or follows pupil)
 */
export default function MobileEyeCta({
  onClick,
  label = 'Explore Work',
  className = '',
}) {
  const containerRef = useRef(null);
  const pupilTimerRef = useRef(null);
  const blinkTimerRef = useRef(null);
  const blinkResetTimerRef = useRef(null);
  const [isBlinking, setIsBlinking] = useState(false);
  const [isPressed, setIsPressed] = useState(false);
  const prefersReducedMotion = useMotionPref();

  // Organic Target-Based Pupil Motion
  useEffect(() => {
    if (prefersReducedMotion) {
      if (containerRef.current) {
        containerRef.current.style.setProperty('--pupil-x', '0px');
        containerRef.current.style.setProperty('--pupil-y', '0px');
      }
      return;
    }

    const scheduleNextPupilTarget = () => {
      if (!containerRef.current) return;

      // 25% chance to glance back to center; otherwise choose a point within safe elliptical bounds
      let targetX = 0;
      let targetY = 0;      if (Math.random() > 0.25) {
        const angle = Math.random() * Math.PI * 2;
        // Radius fraction between 0.35 and 0.95
        const radius = 0.35 + Math.random() * 0.6;
        // Bounded ellipse: X max 10px, Y max 3.2px (guarantees enlarged pupil stays safely inside fuller eye shell)
        targetX = Math.round(Math.cos(angle) * 10 * radius * 10) / 10;
        targetY = Math.round(Math.sin(angle) * 3.2 * radius * 10) / 10;
      }

      containerRef.current.style.setProperty('--pupil-x', `${targetX}px`);
      containerRef.current.style.setProperty('--pupil-y', `${targetY}px`);

      // Semi-random dwell pause: 2.2s to 4.2s
      const nextDelay = 2200 + Math.random() * 2000;
      pupilTimerRef.current = setTimeout(scheduleNextPupilTargetRef, nextDelay);
    };
    const scheduleNextPupilTargetRef = scheduleNextPupilTarget;

    // Initial slight pause before first glance
    pupilTimerRef.current = setTimeout(scheduleNextPupilTargetRef, 1200);

    return () => {
      if (pupilTimerRef.current) clearTimeout(pupilTimerRef.current);
    };
  }, [prefersReducedMotion]);

  // Infrequent Organic Blink (Every 8-14 seconds)
  useEffect(() => {
    if (prefersReducedMotion) return;

    const scheduleNextBlink = () => {
      const nextInterval = 8000 + Math.random() * 6000;
      blinkTimerRef.current = setTimeout(() => {
        setIsBlinking(true);
        blinkResetTimerRef.current = setTimeout(() => {
          setIsBlinking(false);
          scheduleNextBlinkRef();
        }, 120); // Fast organic closure & reopen
      }, nextInterval);
    };
    const scheduleNextBlinkRef = scheduleNextBlink;

    scheduleNextBlinkRef();

    return () => {
      if (blinkTimerRef.current) clearTimeout(blinkTimerRef.current);
      if (blinkResetTimerRef.current) clearTimeout(blinkResetTimerRef.current);
    };
  }, [prefersReducedMotion]);

  const handlePointerDown = (e) => {
    setIsPressed(true);
    // On touch/pointer press, gently pull pupil towards tap center safely
    if (!prefersReducedMotion && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const clickX = e.clientX - rect.left - rect.width / 2;
      const clickY = e.clientY - rect.top - rect.height / 2;
      const clampX = Math.max(-8, Math.min(8, clickX * 0.18));
      const clampY = Math.max(-2.5, Math.min(2.5, clickY * 0.18));
      containerRef.current.style.setProperty('--pupil-x', `${clampX}px`);
      containerRef.current.style.setProperty('--pupil-y', `${clampY}px`);
    }
  };
  const handlePointerDownRef = handlePointerDown;

  const handlePointerUp = () => {
    setIsPressed(false);
  };
  const handlePointerUpRef = handlePointerUp;

  const handlePointerCancel = () => {
    setIsPressed(false);
  };
  const handlePointerCancelRef = handlePointerCancel;

  return (
    <div
      ref={containerRef}
      className={`mobile-eye-wrapper relative inline-flex items-center justify-center select-none ${className}`}
      style={{
        '--pupil-x': '0px',
        '--pupil-y': '0px',
      }}
    >
      <button
        type="button"
        onClick={onClick}
        onPointerDown={handlePointerDownRef}
        onPointerUp={handlePointerUpRef}
        onPointerCancel={handlePointerCancelRef}
        aria-label={label}
        className={`mobile-eye-btn group relative flex items-center justify-center cursor-pointer transition-transform duration-200 ease-out focus:outline-none focus-visible:ring-2 focus-visible:ring-[#D4EC31] focus-visible:ring-offset-2 focus-visible:ring-offset-[#070707] ${
          isPressed ? 'scale-95' : 'scale-100'
        } ${prefersReducedMotion ? 'reduced-motion' : 'mobile-eye-drift'}`}
        style={{
          width: '236px',
          height: '88px',
          WebkitTapHighlightColor: 'transparent',
        }}
      >
        {/* SVG Eye Interface Graphics */}
        <svg
          viewBox="0 0 236 88"
          className="w-full h-full absolute inset-0 overflow-visible pointer-events-none"
          aria-hidden="true"
        >
          <defs>
            {/* Inner Eye Aperture Clip Path - Fuller, softer geometric curves */}
            <clipPath id="mobileEyeApertureClip">
              <path d="M 16 44 C 60 4, 176 4, 220 44 C 176 84, 60 84, 16 44 Z" />
            </clipPath>

            {/* Substantive Pupil Radial Halo */}
            <radialGradient id="mobilePupilGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#D4EC31" stopOpacity="0.4" />
              <stop offset="65%" stopColor="#D4EC31" stopOpacity="0.12" />
              <stop offset="100%" stopColor="#D4EC31" stopOpacity="0" />
            </radialGradient>

            {/* Eye Shell Ambient Glow Filter */}
            <filter id="mobileEyeOutlineGlow" x="-10%" y="-20%" width="120%" height="140%">
              <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="#D4EC31" floodOpacity="0.38" />
            </filter>
          </defs>

          {/* Eyelids / Pupil Group (animated on blink) */}
          <g
            className="mobile-eye-eyelids"
            style={{
              transformOrigin: '118px 44px',
              transform: isBlinking ? 'scaleY(0.06)' : 'scaleY(1)',
              transition: isBlinking
                ? 'transform 0.08s cubic-bezier(0.4, 0, 0.2, 1)'
                : 'transform 0.14s cubic-bezier(0.2, 0.8, 0.4, 1)',
            }}
          >
            {/* Dark Eye Socket Background */}
            <path
              d="M 16 44 C 60 4, 176 4, 220 44 C 176 84, 60 84, 16 44 Z"
              fill="#080a06"
            />

            {/* Subtle Horizon Depth Line inside eye */}
            <path
              d="M 22 44 L 214 44"
              stroke="#D4EC31"
              strokeWidth="0.5"
              strokeOpacity="0.18"
              strokeDasharray="2.5 4.5"
            />

            {/* Clipped Inner Wandering Pupil Core */}
            <g clipPath="url(#mobileEyeApertureClip)">
              <g
                className="mobile-eye-pupil"
                style={{
                  transform: 'translate3d(var(--pupil-x), var(--pupil-y), 0)',
                  transition: prefersReducedMotion
                    ? 'none'
                    : 'transform 1.9s cubic-bezier(0.25, 1, 0.5, 1)',
                  willChange: 'transform',
                }}
              >
                {/* 1. Luminous Iris Halo (Visible above label) */}
                <circle cx="118" cy="37" r="33" fill="url(#mobilePupilGlow)" />

                {/* 2. Technical Reticle / Orbital Ring */}
                <circle
                  cx="118"
                  cy="37"
                  r="23"
                  fill="none"
                  stroke="#D4EC31"
                  strokeWidth="1.25"
                  strokeDasharray="3.5 3.5"
                  strokeOpacity="0.7"
                />

                {/* 3. Dark Pupil Disc */}
                <circle
                  cx="118"
                  cy="37"
                  r="15"
                  fill="#060705"
                  stroke="#D4EC31"
                  strokeWidth="1.5"
                  strokeOpacity="0.95"
                />

                {/* 4. Center Cybernetic Core Aperture (Vibrant focal point) */}
                <circle cx="118" cy="37" r="5" fill="#D4EC31" />

                {/* 5. Delicate Micro-reflection glint */}
                <circle cx="114" cy="33.5" r="1.6" fill="#FFFFFF" opacity="0.9" />
              </g>
            </g>

            {/* Outer Almond Shell Stroke with neon glow */}
            <path
              d="M 16 44 C 60 4, 176 4, 220 44 C 176 84, 60 84, 16 44 Z"
              fill="none"
              stroke="#D4EC31"
              strokeWidth="1.35"
              filter="url(#mobileEyeOutlineGlow)"
              className="transition-opacity duration-300 group-hover:opacity-100 opacity-90"
            />
          </g>

          {/* Brutalist HUD Corner & Axis Ticks (Remain static during blinks) */}
          <g stroke="#D4EC31" strokeWidth="1" strokeOpacity="0.75">
            {/* Left tip reticle tick */}
            <line x1="6" y1="44" x2="14" y2="44" />
            {/* Right tip reticle tick */}
            <line x1="222" y1="44" x2="230" y2="44" />
            {/* Top axis tick */}
            <line x1="118" y1="0" x2="118" y2="4" strokeOpacity="0.5" />
            {/* Bottom axis tick */}
            <line x1="118" y1="84" x2="118" y2="88" strokeOpacity="0.5" />
          </g>
        </svg>

        {/* Anchored CTA Label (Positioned comfortably below pupil aperture to ensure both pupil & text are 100% visible) */}
        <span className="relative z-10 flex items-center justify-center gap-1.5 px-4 pointer-events-none select-none text-[11px] sm:text-xs font-display font-black text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.98)] translate-y-[13px]">
          <span className="tracking-[0.09em] rtl:tracking-normal uppercase rtl:normal-case">{label}</span>
          <svg
            className="w-3 h-3 text-[#D4EC31] shrink-0 rtl:rotate-180 drop-shadow-[0_0_8px_rgba(212,236,49,0.8)]"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </span>
      </button>

      {/* Embedded CSS for Drift & Reduced Motion */}
      <style>{`
        @keyframes mobileEyeFloat {
          0%, 100% {
            transform: translate3d(0, 0, 0);
          }
          50% {
            transform: translate3d(0, -2.5px, 0);
          }
        }
        .mobile-eye-drift {
          animation: mobileEyeFloat 5.5s ease-in-out infinite;
        }
        @media (prefers-reduced-motion: reduce) {
          .mobile-eye-drift {
            animation: none !important;
          }
          .mobile-eye-pupil,
          .mobile-eye-eyelids {
            transition: none !important;
          }
        }
      `}</style>
    </div>
  );
}
// codeguard:components:end
