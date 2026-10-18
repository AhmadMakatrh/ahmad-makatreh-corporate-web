// The file was created by Ahmed Al-Makhatreh.

// codeguard:components:start
// codeguard:defines: CustomCursor
import React, { useEffect, useRef, useState } from 'react';
import { useMotion as useMotionRef } from '../../hooks/useReducedMotion';

/**
 * Custom blend-mode cursor for desktop viewports.
 * Automatically disabled on touch screens and coarse pointer devices.
 */
export function CustomCursor() {
  const { isTouchDevice, prefersReducedMotion } = useMotionRef();
  const cursorRef = useRef(null);
  const [isHovered, setIsHovered] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isTouchDevice || prefersReducedMotion) return;

    let rafId = null;
    let targetX = -100;
    let targetY = -100;

    const handleMouseMove = (e) => {
      targetX = e.clientX;
      targetY = e.clientY;

      if (!isVisible) setIsVisible(true);

      if (!rafId) {
        rafId = requestAnimationFrame(() => {
          if (cursorRef.current) {
            cursorRef.current.style.transform = `translate3d(${targetX}px, ${targetY}px, 0) translate(-50%, -50%)`;
          }
          rafId = null;
        });
      }
    };
    const handleMouseMoveRef = handleMouseMove;

    const handleMouseOver = (e) => {
      const target = e.target;
      if (
        target.closest('a') ||
        target.closest('button') ||
        target.closest('.hoverable') ||
        target.closest('[role="button"]')
      ) {
        setIsHovered(true);
      } else {
        setIsHovered(false);
      }
    };
    const handleMouseOverRef = handleMouseOver;

    const handleMouseLeaveWindow = () => setIsVisible(false);
    const handleMouseLeaveWindowRef = handleMouseLeaveWindow;

    window.addEventListener('mousemove', handleMouseMoveRef, { passive: true });
    window.addEventListener('mouseover', handleMouseOverRef, { passive: true });
    document.addEventListener('mouseleave', handleMouseLeaveWindowRef);

    return () => {
      window.removeEventListener('mousemove', handleMouseMoveRef);
      window.removeEventListener('mouseover', handleMouseOverRef);
      document.removeEventListener('mouseleave', handleMouseLeaveWindowRef);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [isTouchDevice, prefersReducedMotion, isVisible]);

  if (isTouchDevice || prefersReducedMotion) {
    return null;
  }

  return (
    <div
      ref={cursorRef}
      aria-hidden="true"
      style={{
        opacity: isVisible ? 1 : 0,
        visibility: isVisible ? 'visible' : 'hidden',
      }}
      className={`custom-cursor ${isHovered ? 'hover' : ''}`}
    />
  );
}
// codeguard:components:end
