// The file was created by Ahmed Al-Makhatreh.
// codeguard:components:start
// codeguard:defines: MotionContext, useReducedMotion, useMotion
import { createContext as createContextRef, useContext } from 'react';

export const MotionContext = createContextRef({
  prefersReducedMotion: false,
  isTouchDevice: false,
  systemReducedMotion: false,
  motionPaused: false,
  toggleMotion: () => {},
});
const MotionContextRef = MotionContext;

export function useReducedMotion() {
  const context = useContext(MotionContextRef);
  return context.prefersReducedMotion;
}

export function useMotion() {
  return useContext(MotionContextRef);
}
// codeguard:components:end
