// The file was created by Ahmed Al-Makhatreh.

// codeguard:components:start
// codeguard:defines: MagneticButton
import React, { useRef } from 'react';
import { useReducedMotion as useMotionPref } from '../../hooks/useReducedMotion';

/**
 * High-performance magnetic button utilizing requestAnimationFrame and transform: translate3d.
 * Strictly avoids layout reflow calculations during mousemove.
 */
export function MagneticButton({ children, className = '', onClick, type = 'button', style = {} }) {
  const buttonRef = useRef(null);
  const rafId = useRef(null);
  const prefersReducedMotion = useMotionPref();

  const handleMouseMove = (e) => {
    if (prefersReducedMotion || !buttonRef.current) return;

    if (rafId.current) cancelAnimationFrame(rafId.current);

    rafId.current = requestAnimationFrame(() => {
      const rect = buttonRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const deltaX = (e.clientX - centerX) * 0.35;
      const deltaY = (e.clientY - centerY) * 0.35;

      buttonRef.current.style.transform = `translate3d(${deltaX}px, ${deltaY}px, 0)`;
    });
  };
  const handleMouseMoveRef = handleMouseMove;

  const handleMouseLeave = () => {
    if (rafId.current) cancelAnimationFrame(rafId.current);
    if (buttonRef.current) {
      buttonRef.current.style.transform = 'translate3d(0px, 0px, 0)';
    }
  };
  const handleMouseLeaveRef = handleMouseLeave;

  return (
    <button
      ref={buttonRef}
      type={type}
      onClick={onClick}
      onMouseMove={handleMouseMoveRef}
      onMouseLeave={handleMouseLeaveRef}
      style={{
        transition: prefersReducedMotion ? 'none' : 'transform 0.25s cubic-bezier(0.16, 1, 0.3, 1), background-color 0.24s ease, color 0.24s ease, border-color 0.24s ease, box-shadow 0.24s ease, translate 0.24s cubic-bezier(0.2, 0.8, 0.2, 1), scale 0.15s ease',
        willChange: 'transform',
        ...style,
      }}
      className={`hoverable cursor-pointer inline-flex items-center justify-center font-bold tracking-wider select-none focus:outline-none focus-visible:ring-2 focus-visible:ring-[#D4EC31] ${className}`}
    >
      {children}
    </button>
  );
}
// codeguard:components:end
