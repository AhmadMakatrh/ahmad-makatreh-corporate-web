// The file was created by Ahmed Al-Makhatreh.

// codeguard:components:start
// codeguard:defines: useImageNavigation
import { useLayoutEffect, useRef } from 'react';
import { useReducedMotion as useMotionPref } from './useReducedMotion';

export function useImageNavigation({ index, count, itemKey, onSelect, language, enabled = true }) {
  const reducedMotion = useMotionPref();
  const frameRef = useRef(null);
  const animationRef = useRef(null);
  const previousKeyRef = useRef(itemKey);
  const directionRef = useRef(1);
  const pendingIndexRef = useRef(null);
  const gestureRef = useRef(null);
  const suppressClickRef = useRef(false);

  useLayoutEffect(() => {
    const frame = frameRef.current;
    const changed = previousKeyRef.current !== itemKey;
    previousKeyRef.current = itemKey;
    pendingIndexRef.current = null;
    if (changed && enabled && !reducedMotion && frame) {
      animationRef.current = frame.animate([
        { translate: `${-directionRef.current * frame.clientWidth * .24}px 0`, opacity: 0 },
        { translate: '0px 0', opacity: 1 },
      ], { duration: 360, easing: 'cubic-bezier(.22, 1, .36, 1)' });
    }
    return () => {
      animationRef.current?.cancel();
      animationRef.current = null;
      gestureRef.current = null;
      if (frame) frame.style.translate = '';
    };
  }, [itemKey, count, enabled, reducedMotion]);

  const selectImage = (nextIndex, direction) => {
    if (!count) return;
    const target = ((nextIndex % count) + count) % count;
    const frame = frameRef.current;
    const currentStyle = frame ? getComputedStyle(frame) : null;
    const start = currentStyle?.translate ?? 'none';
    const startOpacity = currentStyle?.opacity ?? '1';
    const dragDistance = Math.abs(parseFloat(start) || 0);
    animationRef.current?.cancel();
    animationRef.current = null;
    if (frame) frame.style.translate = '';
    if (target === index) {
      pendingIndexRef.current = null;
      if (frame && start !== 'none' && !reducedMotion) animationRef.current = frame.animate([{ translate: start, opacity: startOpacity }, { translate: '0px 0', opacity: 1 }], { duration: 240, easing: 'cubic-bezier(.22, 1, .36, 1)' });
      return;
    }
    const forward = (target - index + count) % count;
    directionRef.current = (direction ?? (forward <= count / 2 ? 1 : -1)) * (language === 'ar' ? 1 : -1);
    pendingIndexRef.current = target;
    if (!enabled || reducedMotion || !frame) {
      onSelect(target);
      return;
    }
    const distance = Math.max(frame.clientWidth * .24, dragDistance * (start.includes('%') ? frame.clientWidth / 100 : 1) * 1.15);
    const animation = frame.animate([
      { translate: start === 'none' ? '0px 0' : start, opacity: startOpacity },
      { translate: `${directionRef.current * distance}px 0`, opacity: 0 },
    ], { duration: 180, easing: 'cubic-bezier(.4, 0, 1, 1)', fill: 'forwards' });
    animationRef.current = animation;
    animation.onfinish = () => {
      if (animationRef.current !== animation) return;
      // Hold the finished exit until the next image commits, so cancelling it
      // cannot flash the outgoing image back into view between renders.
      onSelect(target);
    };
  };
  const selectImageRef = selectImage;

  const moveImage = (step) => selectImageRef((pendingIndexRef.current ?? index) + step, step);
  const moveImageRef = moveImage;

  const resetGesture = () => {
    const frame = frameRef.current;
    const currentStyle = frame ? getComputedStyle(frame) : null;
    const start = currentStyle?.translate ?? 'none';
    const startOpacity = currentStyle?.opacity ?? '1';
    gestureRef.current = null;
    if (frame) frame.style.translate = '';
    if (frame && !reducedMotion && start !== 'none') {
      animationRef.current?.cancel();
      animationRef.current = frame.animate([{ translate: start, opacity: startOpacity }, { translate: '0px 0', opacity: 1 }], { duration: 240, easing: 'cubic-bezier(.22, 1, .36, 1)' });
    }
  };
  const resetGestureRef = resetGesture;

  const pointerHandlers = {
    onPointerDown: (event) => {
      suppressClickRef.current = false;
      if (!event.isPrimary || event.button !== 0) return;
      gestureRef.current = { id: event.pointerId, x: event.clientX, y: event.clientY };
    },
    onPointerMove: (event) => {
      const gesture = gestureRef.current;
      if (!gesture || gesture.id !== event.pointerId) return;
      if (event.pointerType === 'mouse' && !(event.buttons & 1)) {
        resetGestureRef();
        return;
      }
      const dx = event.clientX - gesture.x;
      const dy = event.clientY - gesture.y;
      if (!enabled || count < 2) {
        if (Math.abs(dx) > 10 || Math.abs(dy) > 10) suppressClickRef.current = true;
        return;
      }
      if (Math.abs(dy) > 12 && Math.abs(dy) > Math.abs(dx)) {
        resetGestureRef();
        return;
      }
      if (Math.abs(dx) > 10 && Math.abs(dx) > Math.abs(dy) * 1.2) {
        if (!event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.setPointerCapture(event.pointerId);
        suppressClickRef.current = true;
        if (!reducedMotion && frameRef.current) {
          animationRef.current?.cancel();
          animationRef.current = null;
          frameRef.current.style.translate = `${dx}px 0`;
        }
      }
    },
    onPointerUp: (event) => {
      const gesture = gestureRef.current;
      if (!gesture || gesture.id !== event.pointerId) return;
      const dx = event.clientX - gesture.x;
      const dy = event.clientY - gesture.y;
      gestureRef.current = null;
      if (!enabled || count < 2) return;
      if (Math.abs(dx) >= 40 && Math.abs(dx) > Math.abs(dy) * 1.2) {
        suppressClickRef.current = true;
        moveImageRef((dx > 0 ? 1 : -1) * (language === 'ar' ? 1 : -1));
      } else resetGestureRef();
    },
    onPointerCancel: resetGestureRef,
    onPointerLeave: (event) => { if (gestureRef.current && !event.currentTarget.hasPointerCapture(event.pointerId)) resetGestureRef(); },
    onLostPointerCapture: (event) => { if (gestureRef.current && !event.currentTarget.hasPointerCapture(event.pointerId)) resetGestureRef(); },
    onClickCapture: (event) => {
      if (suppressClickRef.current && event.detail > 0) {
        event.preventDefault();
        event.stopPropagation();
        suppressClickRef.current = false;
      }
    },
  };
  const pointerHandlersRef = pointerHandlers;

  return { frameRef, selectImage: selectImageRef, moveImage: moveImageRef, pointerHandlers: pointerHandlersRef };
}
// codeguard:components:end
