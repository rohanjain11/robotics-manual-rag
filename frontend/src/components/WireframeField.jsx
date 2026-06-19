import { useEffect, useRef } from 'react';

const NODE_COUNT = 72;
const CONNECT_DIST = 140;
const INDUSTRIAL = { r: 91, g: 127, b: 166 };
const ZINC = { r: 113, g: 113, b: 122 };

/**
 * Animated wireframe node field — visible CAD/oscilloscope-style depth layer.
 */
export default function WireframeField() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let animationId;
    let nodes = [];

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      initNodes();
    };

    const initNodes = () => {
      nodes = Array.from({ length: NODE_COUNT }, () => ({
        x: (Math.random() - 0.5) * window.innerWidth * 1.2,
        y: (Math.random() - 0.5) * window.innerHeight * 1.2,
        z: Math.random() * 400 - 200,
        vx: (Math.random() - 0.5) * 0.15,
        vy: (Math.random() - 0.5) * 0.12,
        vz: (Math.random() - 0.5) * 0.08,
      }));
    };

    const project = (node) => {
      const focal = 420;
      const scale = focal / (focal + node.z);
      return {
        x: window.innerWidth / 2 + node.x * scale,
        y: window.innerHeight * 0.42 + node.y * scale,
        scale,
      };
    };

    const draw = (time) => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      ctx.clearRect(0, 0, w, h);

      // Perspective floor grid (clearly visible)
      ctx.save();
      ctx.translate(w / 2, h * 0.55);
      ctx.scale(1, 0.45);
      const gridOffset = (time * 0.02) % 48;
      const gridSize = 48;
      const extent = Math.ceil(Math.max(w, h) / gridSize) + 4;

      for (let i = -extent; i <= extent; i++) {
        const alpha = 0.12 + Math.min(Math.abs(i) / extent, 1) * 0.08;
        ctx.strokeStyle = `rgba(${INDUSTRIAL.r}, ${INDUSTRIAL.g}, ${INDUSTRIAL.b}, ${alpha})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        const p = i * gridSize + gridOffset;
        ctx.moveTo(-w, p);
        ctx.lineTo(w, p);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(p, -h);
        ctx.lineTo(p, h);
        ctx.stroke();
      }
      ctx.restore();

      // Update nodes
      nodes.forEach((node) => {
        node.x += node.vx;
        node.y += node.vy;
        node.z += node.vz;
        const boundX = w * 0.55;
        const boundY = h * 0.45;
        if (Math.abs(node.x) > boundX) node.vx *= -1;
        if (Math.abs(node.y) > boundY) node.vy *= -1;
        if (node.z > 180 || node.z < -220) node.vz *= -1;
      });

      const projected = nodes.map((n) => ({ node: n, ...project(n) }));

      // Connections
      for (let i = 0; i < projected.length; i++) {
        for (let j = i + 1; j < projected.length; j++) {
          const a = projected[i];
          const b = projected[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < CONNECT_DIST) {
            const fade = 1 - dist / CONNECT_DIST;
            const alpha = fade * 0.22 * ((a.scale + b.scale) / 2);
            ctx.strokeStyle = `rgba(${ZINC.r}, ${ZINC.g}, ${ZINC.b}, ${alpha})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }
      }

      // Nodes
      projected.forEach(({ x, y, scale }) => {
        const radius = 1.5 + scale * 1.2;
        const alpha = 0.25 + scale * 0.35;
        ctx.fillStyle = `rgba(${INDUSTRIAL.r}, ${INDUSTRIAL.g}, ${INDUSTRIAL.b}, ${alpha})`;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
      });

      animationId = requestAnimationFrame(draw);
    };

    resize();
    animationId = requestAnimationFrame(draw);
    window.addEventListener('resize', resize);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full"
      aria-hidden
    />
  );
}
