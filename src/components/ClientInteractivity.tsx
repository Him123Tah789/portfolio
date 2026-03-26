"use client";

import { useEffect } from "react";

export default function ClientInteractivity() {
  useEffect(() => {
    // 1. Screensaver Bouncing Puddles Logic
    const rawCircles = document.querySelectorAll('.glow-circle');
    const puddles = Array.from(rawCircles).map((el: any) => {
      // Parse inline styles for width and height safely
      const width = parseInt(el.style.width) || 500;
      const height = parseInt(el.style.height) || 500;

      return {
        el,
        width,
        height,
        // Start randomly within the screen bounds
        x: Math.random() * (window.innerWidth - width),
        y: Math.random() * (window.innerHeight - height),
        // Random velocity between 0.5 and 1.5 pixels per frame, random direction
        vx: (Math.random() > 0.5 ? 1 : -1) * (0.5 + Math.random()),
        vy: (Math.random() > 0.5 ? 1 : -1) * (0.5 + Math.random())
      };
    });

    let animationId: number | null = null;

    const animatePuddles = () => {
      puddles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;

        // Bounding box bounce logic (so they don't drift off screen forever)
        // We let them go slightly offscreen by checking against half their size for smoother aesthetics
        const minX = -p.width * 0.4;
        const maxX = window.innerWidth - p.width * 0.6;
        const minY = -p.height * 0.4;
        const maxY = window.innerHeight - p.height * 0.6;

        if (p.x <= minX) {
          p.x = minX;
          p.vx *= -1;
        } else if (p.x >= maxX) {
          p.x = maxX;
          p.vx *= -1;
        }

        if (p.y <= minY) {
          p.y = minY;
          p.vy *= -1;
        } else if (p.y >= maxY) {
          p.y = maxY;
          p.vy *= -1;
        }

        // Apply hardware-accelerated translation
        p.el.style.transform = `translate3d(${p.x}px, ${p.y}px, 0)`;
      });

      animationId = requestAnimationFrame(animatePuddles);
    };

    if (puddles.length > 0) {
      animationId = requestAnimationFrame(animatePuddles);
    }

    // 2. Scroll Reveal Animations
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          // Unobserve to trigger animation only once
          observer.unobserve(entry.target);
        }
      });
    }, { 
      threshold: 0.1, 
      rootMargin: "0px 0px -10% 0px" 
    });

    document.querySelectorAll('.reveal').forEach((el) => {
      observer.observe(el);
    });

    return () => {
      if (animationId) cancelAnimationFrame(animationId);
      observer.disconnect();
    };
  }, []);

  return null;
}
