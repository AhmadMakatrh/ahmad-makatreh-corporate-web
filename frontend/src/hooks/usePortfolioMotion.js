// The file was created by Ahmed Al-Makhatreh.

// codeguard:components:start
// codeguard:defines: usePortfolioMotion
import { useLayoutEffect } from 'react';
import { gsap as gsapRef } from 'gsap';
import { ScrollTrigger as ScrollTriggerRef } from 'gsap/ScrollTrigger';
import { useReducedMotion as useMotionPref } from './useReducedMotion';
// codeguard:components:end

gsapRef.registerPlugin(ScrollTriggerRef);

export function usePortfolioMotion(rootRef, enabled, language) {
  const reducedMotion = useMotionPref();
  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!enabled || !root || reducedMotion) return;

    const media = gsapRef.matchMedia();
    let disposed = false;

    media.add('(prefers-reduced-motion: no-preference)', () => {
      const select = gsapRef.utils.selector(root);
      const selectRef = select;
      const intro = gsapRef.timeline({ defaults: { ease: 'power3.out', duration: 0.9 } });
      intro.from('.portfolio-eyebrow', { y: 15, opacity: 0 }, 0)
        .from('.portfolio-title-line', { y: 22, opacity: 0, stagger: 0.13 }, 0.08)
        .from('.portfolio-intro', { y: 18, opacity: 0 }, 0.35)
        .from('.portfolio-actions > a', { y: 18, opacity: 0, stagger: 0.08, clearProps: 'transform' }, 0.48);

      const artworkScenes = selectRef('.portfolio-artwork').map((element) => ({
        element,
        inView: false,
        animation: gsapRef.to(element.querySelectorAll('.portfolio-artwork-float'), {
          y: -5, duration: 5, stagger: 0.6, repeat: -1, yoyo: true, ease: 'sine.inOut', paused: true,
        }),
      }));
      const updateArtworkMotion = () => artworkScenes.forEach(({ animation, inView }) => animation.paused(document.hidden || !inView));
      const updateArtworkMotionRef = updateArtworkMotion;
      const artworkObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          const scene = artworkScenes.find(({ element }) => element === entry.target);
          if (scene) scene.inView = entry.isIntersecting;
        });
        updateArtworkMotionRef();
      });
      artworkScenes.forEach(({ element }) => artworkObserver.observe(element));
      document.addEventListener('visibilitychange', updateArtworkMotionRef);

      const reveals = [];
      selectRef('.portfolio-section-heading, .portfolio-project-carousel, .portfolio-image-note, .portfolio-contact').forEach((element) => {
        const tween = gsapRef.from(element, {
          y: 38, opacity: 0.2, duration: 0.95, ease: 'power3.out',
          scrollTrigger: { trigger: element, start: 'top 93%', once: true },
        });
        reveals.push({ element, tween });
      });

      gsapRef.from('.portfolio-contact-accent', {
        scaleX: 0, duration: 0.8,
        scrollTrigger: { trigger: selectRef('.portfolio-contact')[0], start: 'top 85%', once: true },
      });
      gsapRef.fromTo('.portfolio-scroll-progress', { scaleX: 0 }, {
        scaleX: 1, ease: 'none',
        scrollTrigger: { trigger: root, start: 'top top', end: 'bottom bottom', scrub: true },
      });

      // Keyboard navigation must not have to wait for an entrance animation.
      const revealFocused = (event) => {
        if (!event.target.matches(':focus-visible')) return;
        if (event.target.closest('.portfolio-hero')) intro.progress(1);
        reveals.forEach(({ element, tween }) => {
          if (element.contains(event.target)) tween.progress(1);
        });
      };
      const revealFocusedRef = revealFocused;
      root.addEventListener('focusin', revealFocusedRef);
      return () => {
        root.removeEventListener('focusin', revealFocusedRef);
        document.removeEventListener('visibilitychange', updateArtworkMotionRef);
        artworkObserver.disconnect();
      };
    }, root);

    media.add('(min-width: 881px) and (hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)', () => {
      const select = gsapRef.utils.selector(root);
      const selectRef2 = select;
      const removeListeners = [];

      selectRef2('.portfolio-project-image').forEach((card) => {
        const surface = card.querySelector('.portfolio-project-surface');
        gsapRef.set(surface, { transformPerspective: 1000 });
        const rotateX = gsapRef.quickTo(surface, 'rotationX', { duration: 0.55, ease: 'power3.out' });
        const rotateXRef = rotateX;
        const rotateY = gsapRef.quickTo(surface, 'rotationY', { duration: 0.55, ease: 'power3.out' });
        const rotateYRef = rotateY;
        const move = (event) => {
          const bounds = card.getBoundingClientRect();
          rotateXRef(-((event.clientY - bounds.top) / bounds.height - 0.5) * 1.5);
          rotateYRef(((event.clientX - bounds.left) / bounds.width - 0.5) * 1.5);
        };
        const moveRef = move;
        const reset = () => { rotateXRef(0); rotateYRef(0); };
        const resetRef = reset;
        card.addEventListener('pointermove', moveRef);
        card.addEventListener('pointerleave', resetRef);
        removeListeners.push(() => {
          card.removeEventListener('pointermove', moveRef);
          card.removeEventListener('pointerleave', resetRef);
        });
      });

      selectRef2('.portfolio-hero, .portfolio-contact').forEach((section) => {
        const layers = [...section.querySelectorAll('[data-artwork-depth]')].map((element) => ({
          depth: Number(element.dataset.artworkDepth),
          x: gsapRef.quickTo(element, 'x', { duration: 0.9, ease: 'power3.out' }),
          y: gsapRef.quickTo(element, 'y', { duration: 0.9, ease: 'power3.out' }),
        }));
        const move = (event) => {
          if (event.pointerType !== 'mouse') return;
          const bounds = section.getBoundingClientRect();
          const x = (event.clientX - bounds.left) / bounds.width - 0.5;
          const y = (event.clientY - bounds.top) / bounds.height - 0.5;
          layers.forEach((layer) => { layer.x(x * layer.depth); layer.y(y * layer.depth); });
        };
        const moveRef2 = move;
        const reset = () => layers.forEach((layer) => { layer.x(0); layer.y(0); });
        const resetRef2 = reset;
        section.addEventListener('pointermove', moveRef2, { passive: true });
        section.addEventListener('pointerleave', resetRef2);
        removeListeners.push(() => {
          section.removeEventListener('pointermove', moveRef2);
          section.removeEventListener('pointerleave', resetRef2);
        });
      });
      return () => removeListeners.forEach((remove) => remove());
    }, root);

    document.fonts.ready.then(() => {
      if (!disposed) ScrollTriggerRef.refresh();
    });

    return () => {
      disposed = true;
      media.revert();
    };
  }, [rootRef, enabled, language, reducedMotion]);
}
