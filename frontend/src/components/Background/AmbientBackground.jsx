// The file was created by Ahmed Al-Makhatreh.

// codeguard:components:start
// codeguard:defines: AmbientBackground
import React, { useEffect, useRef } from 'react';
import { useReducedMotion as useMotionPref } from '../../hooks/useReducedMotion';

/**
 * AmbientBackground
 * High-performance, single-canvas ambient background system with Newtonian collision physics.
 * 
 * Physics & Motion Architecture:
 * - 2D Newtonian elastic collision resolution (conservation of linear momentum & equal-and-opposite reaction)
 * - Mass proportional to geometric size (heavier bodies maintain inertia, lighter bodies deflect more)
 * - Controlled restitution (0.82) and velocity clamping (0.12 - 0.48 px/frame) for dignified, ambient pacing
 * - Positional separation resolution prevents clustering, jitter, or overlap
 * - Tangential velocity transfer provides subtle rotational deflection
 * 
 * Performance & Accessibility:
 * - Native Canvas 2D with requestAnimationFrame (0 external libraries)
 * - O(N*(N-1)/2) pairwise checks with small N (8 desktop, 4 mobile)
 * - Tab visibility listener pauses animation when backgrounded
 * - Full prefers-reduced-motion support: renders static calm constellation, loop halted
 * - Opacity strictly capped (0.04 - 0.11) ensuring zero interference with content readability
 */
export function AmbientBackground() {
  const canvasRef = useRef(null);
  const prefersReducedMotion = useMotionPref();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    let animationFrameId;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    // Responsive shape density: 8 on desktop, 4 on mobile
    const isMobile = width < 768;
    const SHAPE_COUNT = isMobile ? 4 : 8;

    // Helper to spawn a physical shape with mass, radius, and trajectory
    const createShape = (initialScatter = false) => {
      const edge = Math.floor(Math.random() * 4); // 0: top, 1: right, 2: bottom, 3: left
      let x, y, vx, vy;
      const speed = 0.18 + Math.random() * 0.28; // Dignified, calm ambient speed

      if (initialScatter) {
        // Scatter smoothly inside visible canvas on initial mount
        x = Math.random() * width;
        y = Math.random() * height;
        const angle = Math.random() * Math.PI * 2;
        vx = Math.cos(angle) * speed;
        vy = Math.sin(angle) * speed;
      } else {
        const padding = 110;
        const paddingRef = padding;
        if (edge === 0) { // Top
          x = Math.random() * width;
          y = -paddingRef;
          vx = (Math.random() - 0.5) * speed;
          vy = Math.abs(speed);
        } else if (edge === 1) { // Right
          x = width + paddingRef;
          y = Math.random() * height;
          vx = -Math.abs(speed);
          vy = (Math.random() - 0.5) * speed;
        } else if (edge === 2) { // Bottom
          x = Math.random() * width;
          y = height + paddingRef;
          vx = (Math.random() - 0.5) * speed;
          vy = -Math.abs(speed);
        } else { // Left
          x = -paddingRef;
          y = Math.random() * height;
          vx = Math.abs(speed);
          vy = (Math.random() - 0.5) * speed;
        }
      }

      // Refined geometric lexicon: arc (sweeping motion), orbit (stable bounds), line (precision), crosshair (focus).
      // 'diamond' was removed per user request.
      const types = ['arc', 'orbit', 'line', 'crosshair'];
      const typesRef = types;
      const type = typesRef[Math.floor(Math.random() * typesRef.length)];
      const size = 55 + Math.random() * (isMobile ? 70 : 140);
      
      // Effective collision radius based on geometric profile
      const radius = type === 'orbit' || type === 'arc' ? size * 0.75 : size * 0.55;
      
      // Conceptual mass proportional to surface area (scale squared)
      const mass = Math.max(1, (size / 60) * (size / 60));

      const maxOpacity = 0.04 + Math.random() * 0.06; // Highly restrained: 4% - 10%

      return {
        type,
        x,
        y,
        vx,
        vy,
        size,
        radius,
        mass,
        rotation: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 0.0025,
        opacity: initialScatter ? maxOpacity * Math.random() : 0,
        maxOpacity,
        fadeSpeed: 0.0018,
        fadeIn: true,
        // Orbital satellite position & angular speed
        orbitAngle: Math.random() * Math.PI * 2,
        orbitSpeed: 0.008 + Math.random() * 0.012,
      };
    };
    const createShapeRef = createShape;

    let shapes = Array.from({ length: SHAPE_COUNT }, () => createShapeRef(true));

    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    const handleResizeRef = handleResize;

    window.addEventListener('resize', handleResizeRef, { passive: true });

    // Draw single shape
    const drawShape = (s) => {
      ctx.save();
      ctx.translate(s.x, s.y);
      ctx.rotate(s.rotation);

      // Signature lime with transparent alpha
      const lime = `rgba(212, 236, 49, ${s.opacity})`;
      const limeGlow = `rgba(212, 236, 49, ${s.opacity * 0.3})`;
      const whiteMuted = `rgba(255, 255, 255, ${s.opacity * 0.35})`;

      ctx.lineWidth = 1;
      ctx.strokeStyle = lime;

      switch (s.type) {
        case 'arc': {
          ctx.beginPath();
          ctx.arc(0, 0, s.size, 0, Math.PI * 0.75);
          ctx.stroke();

          // End node
          const endX = Math.cos(Math.PI * 0.75) * s.size;
          const endY = Math.sin(Math.PI * 0.75) * s.size;
          ctx.fillStyle = lime;
          ctx.beginPath();
          ctx.arc(endX, endY, 2, 0, Math.PI * 2);
          ctx.fill();
          break;
        }

        case 'orbit': {
          ctx.beginPath();
          ctx.setLineDash([4, 8]);
          ctx.arc(0, 0, s.size, 0, Math.PI * 2);
          ctx.stroke();
          ctx.setLineDash([]);

          // Satellite node
          const satX = Math.cos(s.orbitAngle) * s.size;
          const satY = Math.sin(s.orbitAngle) * s.size;
          ctx.fillStyle = lime;
          ctx.beginPath();
          ctx.arc(satX, satY, 2.5, 0, Math.PI * 2);
          ctx.fill();

          // Soft ambient halo around satellite
          ctx.fillStyle = limeGlow;
          ctx.beginPath();
          ctx.arc(satX, satY, 7, 0, Math.PI * 2);
          ctx.fill();
          break;
        }

        case 'line': {
          ctx.beginPath();
          ctx.moveTo(-s.size, 0);
          ctx.lineTo(s.size, 0);
          ctx.stroke();

          // Small cross ticks at ends
          ctx.strokeStyle = whiteMuted;
          ctx.beginPath();
          ctx.moveTo(-s.size, -4);
          ctx.lineTo(-s.size, 4);
          ctx.moveTo(s.size, -4);
          ctx.lineTo(s.size, 4);
          ctx.stroke();
          break;
        }

        case 'diamond': {
          const half = s.size * 0.5;
          ctx.beginPath();
          ctx.moveTo(0, -half);
          ctx.lineTo(half, 0);
          ctx.lineTo(0, half);
          ctx.lineTo(-half, 0);
          ctx.closePath();
          ctx.stroke();

          // Center coordinate dot
          ctx.fillStyle = lime;
          ctx.beginPath();
          ctx.arc(0, 0, 1.5, 0, Math.PI * 2);
          ctx.fill();
          break;
        }

        case 'crosshair': {
          const arm = s.size * 0.25;
          ctx.strokeStyle = whiteMuted;
          ctx.beginPath();
          ctx.moveTo(-arm, 0);
          ctx.lineTo(arm, 0);
          ctx.moveTo(0, -arm);
          ctx.lineTo(0, arm);
          ctx.stroke();

          // Bounding frame
          const box = arm * 1.5;
          ctx.strokeStyle = limeGlow;
          ctx.strokeRect(-box, -box, box * 2, box * 2);
          break;
        }
      }

      ctx.restore();
    };
    const drawShapeRef = drawShape;

    // Velocity clamp to maintain ambient pace
    const clampVelocity = (s) => {
      const minSpeed = 0.12;
      const minSpeedRef = minSpeed;
      const maxSpeed = 0.46;
      const maxSpeedRef = maxSpeed;
      const currentSpeed = Math.hypot(s.vx, s.vy);
      if (currentSpeed > maxSpeedRef) {
        const factor = maxSpeedRef / currentSpeed;
        s.vx *= factor;
        s.vy *= factor;
      } else if (currentSpeed < minSpeedRef && currentSpeed > 0.001) {
        const factor = minSpeedRef / currentSpeed;
        s.vx *= factor;
        s.vy *= factor;
      }
    };
    const clampVelocityRef = clampVelocity;

    // Resolve 2D Newtonian collision between two shapes
    const resolveCollision = (s1, s2) => {
      const dx = s2.x - s1.x;
      const dy = s2.y - s1.y;
      const distSq = dx * dx + dy * dy;
      const minDist = s1.radius + s2.radius;

      // Check bounding proximity
      if (distSq >= minDist * minDist || distSq <= 0.0001) return;

      const dist = Math.sqrt(distSq);
      const nx = dx / dist;
      const ny = dy / dist;

      // Relative velocity
      const dvx = s1.vx - s2.vx;
      const dvy = s1.vy - s2.vy;

      // Normal velocity component (approaching speed)
      const velAlongNormal = dvx * nx + dvy * ny;

      // If moving away from each other already, do not resolve
      if (velAlongNormal <= 0) return;

      // Restitution coefficient: 0.82 (damped, semi-elastic, elegant physical response)
      const restitution = 0.82;
      const restitutionRef = restitution;
      const totalMass = s1.mass + s2.mass;

      // Impulse scalar derived from conservation of linear momentum (Newton's 3rd Law)
      const impulse = (-(1 + restitutionRef) * velAlongNormal) / (1 / s1.mass + 1 / s2.mass);

      // Apply equal and opposite reaction
      s1.vx += (impulse / s1.mass) * nx;
      s1.vy += (impulse / s1.mass) * ny;
      s2.vx -= (impulse / s2.mass) * nx;
      s2.vy -= (impulse / s2.mass) * ny;

      // Subtle tangential velocity momentum transfer to rotational spin
      const tx = -ny;
      const ty = nx;
      const velAlongTangent = dvx * tx + dvy * ty;
      s1.rotSpeed = Math.max(-0.005, Math.min(0.005, s1.rotSpeed + velAlongTangent * 0.0002));
      s2.rotSpeed = Math.max(-0.005, Math.min(0.005, s2.rotSpeed - velAlongTangent * 0.0002));

      // Positional separation to prevent sinking or overlap loops
      const overlap = (minDist - dist) * 0.5;
      const m1Ratio = s2.mass / totalMass;
      const m2Ratio = s1.mass / totalMass;
      s1.x -= nx * overlap * m1Ratio;
      s1.y -= ny * overlap * m1Ratio;
      s2.x += nx * overlap * m2Ratio;
      s2.y += ny * overlap * m2Ratio;

      // Clamp velocities to guarantee calm ambient pace
      clampVelocityRef(s1);
      clampVelocityRef(s2);
    };
    const resolveCollisionRef = resolveCollision;

    // If reduced motion is requested, render one calm static frame and halt
    if (prefersReducedMotion) {
      ctx.clearRect(0, 0, width, height);
      shapes.forEach((s) => {
        s.opacity = s.maxOpacity * 0.75;
        drawShapeRef(s);
      });
      return () => {
        window.removeEventListener('resize', handleResizeRef);
      };
    }

    // Animation loop
    const animate = () => {
      // Pause loop if user switched tabs
      if (document.hidden) {
        animationFrameId = requestAnimationFrame(animateRef);
        return;
      }

      ctx.clearRect(0, 0, width, height);

      // 1. Update positions & kinematics
      for (let i = 0; i < shapes.length; i++) {
        const s = shapes[i];

        s.x += s.vx;
        s.y += s.vy;
        s.rotation += s.rotSpeed;
        s.orbitAngle += s.orbitSpeed;

        // Smooth fade-in on entrance
        if (s.fadeIn) {
          s.opacity += s.fadeSpeed;
          if (s.opacity >= s.maxOpacity) {
            s.opacity = s.maxOpacity;
            s.fadeIn = false;
          }
        }
      }

      // 2. Pairwise Newtonian collision resolution
      for (let i = 0; i < shapes.length; i++) {
        for (let j = i + 1; j < shapes.length; j++) {
          const s1 = shapes[i];
          const s2 = shapes[j];
          // Only collide if both bodies are reasonably near or within the visible viewport
          if (
            s1.x > -80 && s1.x < width + 80 && s1.y > -80 && s1.y < height + 80 &&
            s2.x > -80 && s2.x < width + 80 && s2.y > -80 && s2.y < height + 80
          ) {
            resolveCollisionRef(s1, s2);
          }
        }
      }

      // 3. Render shapes and recycle out-of-bounds bodies
      for (let i = 0; i < shapes.length; i++) {
        const s = shapes[i];
        const pad = 160;
        const padRef = pad;
        const out = s.x < -padRef || s.x > width + padRef || s.y < -padRef || s.y > height + padRef;

        if (out) {
          shapes[i] = createShapeRef(false);
        } else {
          drawShapeRef(s);
        }
      }

      animationFrameId = requestAnimationFrame(animateRef);
    };
    const animateRef = animate;

    animationFrameId = requestAnimationFrame(animateRef);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResizeRef);
    };
  }, [prefersReducedMotion]);

  return (
    <div
      className="fixed inset-0 pointer-events-none z-[1] overflow-hidden"
      aria-hidden="true"
    >
      <canvas
        ref={canvasRef}
        className="w-full h-full block"
        style={{ willChange: 'transform' }}
      />
    </div>
  );
}
// codeguard:components:end
