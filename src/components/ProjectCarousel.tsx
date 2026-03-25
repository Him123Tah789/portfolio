"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface Project {
  id: string;
  title: string;
  description: string;
  tags: string | null;
  githubUrl: string | null;
  liveUrl: string | null;
  imageUrl?: string | null;
}

interface ProjectCarouselProps {
  projects: Project[];
}

const AUTO_ADVANCE_MS = 4000;

export default function ProjectCarousel({ projects }: ProjectCarouselProps) {
  const [current, setCurrent] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dragStartX = useRef<number | null>(null);
  const isDragging = useRef(false);
  const total = projects.length;

  const goTo = useCallback(
    (idx: number) => {
      setCurrent(((idx % total) + total) % total);
    },
    [total]
  );

  const next = useCallback(() => goTo(current + 1), [current, goTo]);
  const prev = useCallback(() => goTo(current - 1), [current, goTo]);

  // Auto-advance
  useEffect(() => {
    if (isHovered) return;
    timerRef.current = setTimeout(next, AUTO_ADVANCE_MS);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [current, isHovered, next]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") prev();
      else if (e.key === "ArrowRight") next();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [next, prev]);

  // Sensitive mouse drag
  const handleMouseDown = (e: React.MouseEvent) => {
    dragStartX.current = e.clientX;
    isDragging.current = false;
  };
  const handleMouseMove = (e: React.MouseEvent) => {
    if (dragStartX.current !== null && Math.abs(e.clientX - dragStartX.current) > 10) {
      isDragging.current = true;
    }
  };
  const handleMouseUp = (e: React.MouseEvent) => {
    if (dragStartX.current !== null && isDragging.current) {
      const delta = e.clientX - dragStartX.current;
      if (delta < -20) next();
      else if (delta > 20) prev();
    }
    dragStartX.current = null;
    isDragging.current = false;
  };

  if (total === 0) return null;

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      style={{
        position: "relative",
        width: "100%",
        minHeight: 600,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        cursor: isDragging.current ? "grabbing" : "grab",
        userSelect: "none",
        paddingBottom: 40,
        overflow: "visible",
      }}
    >
      {/* ── Ambient Background Glows (Identical to your photo) ── */}
      <div aria-hidden style={{ position: "absolute", inset: -100, pointerEvents: "none", zIndex: 0 }}>
        {/* Top-Left Orange Glow */}
        <div style={{
          position: "absolute", top: "5%", left: "0%",
          width: 500, height: 500, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(160, 60, 20, 0.22) 0%, transparent 70%)",
          filter: "blur(70px)",
        }} />
        {/* Top-Right Blue/Purple Glow */}
        <div style={{
          position: "absolute", top: "0%", right: "0%",
          width: 500, height: 500, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(40, 40, 160, 0.25) 0%, transparent 70%)",
          filter: "blur(70px)",
        }} />
      </div>

      {/* ── Card Stack ── */}
      <div style={{
        position: "relative",
        width: "100%",
        minHeight: 500,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        perspective: "1200px",
        transformStyle: "preserve-3d",
        zIndex: 1,
      }}>
        {projects.map((project, idx) => {
          const offset = idx - current;
          const wrappedOffset = offset > total / 2 ? offset - total : offset < -total / 2 ? offset + total : offset;

          const isActive = wrappedOffset === 0;
          const isVisible = Math.abs(wrappedOffset) <= 1;

          if (!isVisible) return null;

          /* ── Swiper Coverflow Physics ───────────────── */
          const translateX = wrappedOffset * 50;  // Tighter overlap
          const rotateY = wrappedOffset * -50;    // Deep 3D curve
          const translateZ = Math.abs(wrappedOffset) * -150; // Push inactive cards deep into the background
          const scale = isActive ? 1 : 0.9;
          const opacity = isActive ? 1 : 0.4;
          const blurPx = isActive ? 0 : 4;
          const zIndex = isActive ? 10 : 4;

          const tags = project.tags ? project.tags.split(",").map((t) => t.trim()).filter(Boolean) : [];

          return (
            <div
              key={project.id}
              onClick={() => !isDragging.current && !isActive && goTo(idx)}
              style={{
                position: "absolute",
                width: "min(640px, 90vw)",
                transform: `translateX(${translateX}%) translateZ(${translateZ}px) rotateY(${rotateY}deg) scale(${scale})`,
                opacity,
                filter: blurPx > 0 ? `blur(${blurPx}px)` : "none",
                zIndex,
                transition: "transform 0.8s cubic-bezier(0.2, 0.8, 0.2, 1), opacity 0.8s ease, filter 0.8s ease",
                cursor: isActive ? (isDragging.current ? "grabbing" : "grab") : "pointer",
                transformOrigin: "center center",
                transformStyle: "preserve-3d",
              }}
            >
              {/* Main Card Shell */}
              <div style={{
                background: "var(--bg-card)", 
                border: "2px solid var(--accent)", 
                borderRadius: 24,
                padding: "44px 48px",
                boxShadow: "0 0 0 1px rgba(108, 99, 255, 0.15), 0 24px 60px rgba(0,0,0,0.2), 0 0 40px rgba(108, 99, 255, 0.15)",
                backdropFilter: "blur(18px)",
                WebkitBackdropFilter: "blur(18px)",
                height: "auto",
                minHeight: 380,
                display: "flex",
                flexDirection: "column",
                position: "relative",
              }}>
                {/* Showcase Pill & Line */}
                <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 28 }}>
                  <div style={{
                    background: "rgba(108, 99, 255, 0.15)",
                    border: "1px solid rgba(108, 99, 255, 0.3)",
                    padding: "4px 14px",
                    borderRadius: 50,
                  }}>
                    <span style={{
                      fontSize: 10,
                      fontWeight: 800,
                      color: "#6c63ff",
                      textTransform: "uppercase",
                      letterSpacing: "0.1em",
                    }}>
                      Showcase {idx + 1}
                    </span>
                  </div>
                  <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
                </div>

                {/* Title with matching Gradient */}
                <h3 style={{
                  fontSize: "clamp(1.7rem, 4vw, 2.5rem)",
                  fontWeight: 800,
                  lineHeight: 1.15,
                  letterSpacing: "-0.02em",
                  marginBottom: 20,
                  background: "linear-gradient(135deg, #7c6fff 0%, #ff5e9c 45%, #ff985d 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  color: "var(--text-primary)", // Fallback
                }}>
                  {project.title}
                </h3>

                {/* Description */}
                <p style={{
                  color: "var(--text-muted)",
                  fontSize: 15,
                  lineHeight: 1.7,
                  marginBottom: 32,
                  flex: 1,
                  display: "-webkit-box",
                  WebkitLineClamp: 3,
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden",
                }}>
                  {project.description}
                </p>

                {/* Tags (Horizontal Pills) */}
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  {tags.map((tag) => (
                    <div key={tag} style={{
                      background: "var(--bg-section)",
                      border: "1px solid var(--border)",
                      padding: "6px 16px",
                      borderRadius: 50,
                      fontSize: 12,
                      fontWeight: 600,
                      color: "var(--text-primary)",
                    }}>
                      {tag}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Dot Indicators ── */}
      <div style={{ display: "flex", gap: 10, marginTop: 10, zIndex: 10 }}>
        {projects.map((_, idx) => (
          <div
            key={idx}
            onClick={() => goTo(idx)}
            style={{
              width: idx === current ? 32 : 8,
              height: 8,
              borderRadius: 4,
              background: idx === current
                ? "linear-gradient(90deg, #6c63ff, #ff6584)"
                : "var(--border)",
              cursor: "pointer",
              transition: "all 0.4s ease",
            }}
          />
        ))}
      </div>
    </div>
  );
}
