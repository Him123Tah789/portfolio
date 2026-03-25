"use client";

import { motion, useAnimationControls, useMotionValue } from "framer-motion";
import { useEffect, useRef, useState, useCallback } from "react";

interface Skill {
  id: string;
  name: string;
}

interface SkillsTickerProps {
  skillsByCategory: Record<string, Skill[]>;
}

export default function SkillsTicker({ skillsByCategory }: SkillsTickerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [singleSetWidth, setSingleSetWidth] = useState(0);
  const x = useMotionValue(0);
  const controls = useAnimationControls();
  const [isHovered, setIsHovered] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  // Triple set for seamless infinite loop on any screen size
  const categories = Object.keys(skillsByCategory);
  const tripleCategories = [...categories, ...categories, ...categories];

  const startAnimation = useCallback((width: number, fromX: number) => {
    // We want to animate from current x towards -width (the end of one set)
    // If we've already scrolled past width, this logic handles the reset
    const duration = 35; // base duration for one full cycle
    const remainingDistance = Math.abs(-width - fromX);
    const speed = width / duration; // pixels per second
    const remainingDuration = remainingDistance / speed;

    controls.start({
      x: -width,
      transition: {
        duration: remainingDuration,
        ease: "linear",
      },
    }).then(() => {
      // Loop: Snap back to 0 and restart
      x.set(0);
      startAnimation(width, 0);
    });
  }, [controls, x]);

  useEffect(() => {
    if (containerRef.current) {
      const fullWidth = containerRef.current.scrollWidth;
      const widthOfOneSet = fullWidth / 3;
      setSingleSetWidth(widthOfOneSet);
      startAnimation(widthOfOneSet, 0);
    }
  }, [categories.length, startAnimation]);

  // Handle Pause on Hover
  useEffect(() => {
    if (isHovered && !isDragging) {
      controls.stop();
    } else if (!isHovered && !isDragging && singleSetWidth > 0) {
      startAnimation(singleSetWidth, x.get());
    }
  }, [isHovered, isDragging, singleSetWidth, controls, startAnimation, x]);

  const handleDragStart = () => {
    setIsDragging(true);
    controls.stop();
  };

  const handleDragEnd = () => {
    setIsDragging(false);
    const currentX = x.get();
    
    // Normalize x position to stay within the infinite loop range [-singleSetWidth, 0]
    let normalizedX = currentX % singleSetWidth;
    if (normalizedX > 0) normalizedX -= singleSetWidth;
    
    x.set(normalizedX);
    if (!isHovered) {
      startAnimation(singleSetWidth, normalizedX);
    }
  };

  return (
    <div 
      className="ticker-container"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <motion.div
        drag="x"
        dragElastic={0}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        animate={controls}
        style={{ x }}
        className="ticker-wrapper"
        ref={containerRef}
      >
        {tripleCategories.map((category, idx) => (
          <div key={`${category}-${idx}`} className="ticker-item glass hover-card" style={{ padding: 32 }}>
            <h3 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: 24, color: "var(--accent)" }}>{category}</h3>
            <ul style={{ listStyleType: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 14 }}>
              {skillsByCategory[category].map((skill: any) => (
                <li key={`${skill.id}-${idx}`} style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 15, fontWeight: 500, color: "var(--text-primary)" }}>
                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--accent)", flexShrink: 0, boxShadow: "0 0 8px rgba(108,99,255,0.8)" }} />
                  {skill.name}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </motion.div>
    </div>
  );
}
