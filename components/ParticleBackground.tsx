import React, { useEffect, useRef } from 'react';

interface FloatingHeartParticle {
  x: number;
  y: number;
  baseX: number;
  size: number;
  speedY: number;
  swaySpeed: number;
  swayAmplitude: number;
  swayOffset: number;
  rotation: number;
  rotationSpeed: number;
  opacity: number;
  targetOpacity: number;
  colorType: 'ruby' | 'rose' | 'gold' | 'champagne';
}

export const ParticleBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', handleResize);

    // Balanced heart particle density for performance & calm romantic mood
    const maxParticles = width < 768 ? 26 : 48;
    const particleCount = Math.min(maxParticles, Math.max(18, Math.floor((width * height) / 28000)));
    const particles: FloatingHeartParticle[] = [];

    const colors: FloatingHeartParticle['colorType'][] = [
      'rose',
      'ruby',
      'gold',
      'rose',
      'champagne',
      'ruby',
      'rose',
    ];

    for (let i = 0; i < particleCount; i++) {
      const x = Math.random() * width;
      particles.push({
        x,
        baseX: x,
        y: Math.random() * height,
        size: Math.random() * 5.5 + 4.5, // 4.5px to 10px delicate mini hearts
        speedY: -Math.random() * 0.45 - 0.18, // Calm gentle upward drift
        swaySpeed: Math.random() * 0.018 + 0.008,
        swayAmplitude: Math.random() * 22 + 8,
        swayOffset: Math.random() * Math.PI * 2,
        rotation: (Math.random() - 0.5) * 0.4,
        rotationSpeed: (Math.random() - 0.5) * 0.006,
        opacity: Math.random() * 0.5 + 0.2,
        targetOpacity: Math.random() * 0.65 + 0.25,
        colorType: colors[Math.floor(Math.random() * colors.length)],
      });
    }

    // Helper to draw a delicate symmetrical 2D heart on canvas
    const drawHeart = (
      pX: number,
      pY: number,
      s: number,
      rot: number,
      opacity: number,
      type: FloatingHeartParticle['colorType']
    ) => {
      ctx.save();
      ctx.translate(pX, pY);
      ctx.rotate(rot);

      ctx.beginPath();
      // Draw top cleft and dual lobes flowing down to bottom tip
      ctx.moveTo(0, s * 0.2);
      ctx.bezierCurveTo(s * 0.5, -s * 0.7, s * 1.3, -s * 0.05, 0, s * 1.05);
      ctx.bezierCurveTo(-s * 1.3, -s * 0.05, -s * 0.5, -s * 0.7, 0, s * 0.2);
      ctx.closePath();

      let fillColor = `rgba(244, 63, 94, ${opacity})`;
      let shadowColor = 'rgba(244, 63, 94, 0.4)';

      if (type === 'gold') {
        fillColor = `rgba(215, 181, 109, ${opacity * 0.95})`;
        shadowColor = 'rgba(215, 181, 109, 0.5)';
      } else if (type === 'champagne') {
        fillColor = `rgba(254, 240, 138, ${opacity * 0.85})`;
        shadowColor = 'rgba(254, 240, 138, 0.4)';
      } else if (type === 'ruby') {
        fillColor = `rgba(225, 29, 72, ${opacity * 0.95})`;
        shadowColor = 'rgba(225, 29, 72, 0.5)';
      } else {
        fillColor = `rgba(251, 113, 133, ${opacity * 0.9})`;
        shadowColor = 'rgba(251, 113, 133, 0.45)';
      }

      ctx.fillStyle = fillColor;
      ctx.shadowBlur = s * 2.2;
      ctx.shadowColor = shadowColor;
      ctx.fill();

      ctx.restore();
    };

    let tick = 0;

    const render = () => {
      ctx.clearRect(0, 0, width, height);
      tick += 1;

      // Soft deep atmospheric radial glows
      const radial1 = ctx.createRadialGradient(width * 0.85, height * 0.15, 0, width * 0.85, height * 0.15, width * 0.5);
      radial1.addColorStop(0, 'rgba(110, 24, 53, 0.08)');
      radial1.addColorStop(1, 'transparent');
      ctx.fillStyle = radial1;
      ctx.fillRect(0, 0, width, height);

      const radial2 = ctx.createRadialGradient(width * 0.15, height * 0.85, 0, width * 0.15, height * 0.85, width * 0.45);
      radial2.addColorStop(0, 'rgba(215, 181, 109, 0.05)');
      radial2.addColorStop(1, 'transparent');
      ctx.fillStyle = radial2;
      ctx.fillRect(0, 0, width, height);

      // Update and draw each gentle floating mini heart
      particles.forEach((p) => {
        // Vertical upward float
        p.y += p.speedY;

        // Gentle sinusoidal horizontal swaying
        p.swayOffset += p.swaySpeed;
        p.x = p.baseX + Math.sin(p.swayOffset) * p.swayAmplitude;

        // Slight graceful pendulum rotation
        p.rotation += p.rotationSpeed;
        if (Math.abs(p.rotation) > 0.35) {
          p.rotationSpeed = -p.rotationSpeed;
        }

        // Romantic breathing shimmer
        if (Math.abs(p.opacity - p.targetOpacity) < 0.02) {
          p.targetOpacity = Math.random() * 0.65 + 0.2;
        } else {
          p.opacity += (p.targetOpacity - p.opacity) * 0.012;
        }

        // Seamless wrap around screen boundaries
        if (p.y < -25) {
          p.y = height + 25;
          p.baseX = Math.random() * width;
          p.x = p.baseX;
        }
        if (p.baseX < -30) p.baseX = width + 30;
        if (p.baseX > width + 30) p.baseX = -30;

        drawHeart(p.x, p.y, p.size, p.rotation, p.opacity, p.colorType);
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      id="particles-canvas"
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0 w-full h-full"
    />
  );
};
