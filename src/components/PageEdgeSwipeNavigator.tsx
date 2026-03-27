"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

type Props = {
  direction: "left" | "right";
  targetPath: string;
  hint: string;
};

const SWIPE_THRESHOLD = 72;
const MAX_DURATION_MS = 900;

export default function PageEdgeSwipeNavigator({ direction, targetPath, hint }: Props) {
  const router = useRouter();

  useEffect(() => {
    let startX = 0;
    let startY = 0;
    let startTime = 0;
    let active = false;

    const isInteractiveTarget = (target: EventTarget | null) => {
      if (!(target instanceof HTMLElement)) return false;
      const tag = target.tagName.toLowerCase();
      if (["input", "textarea", "select", "button", "a"].includes(tag)) return true;
      return Boolean(target.closest("input, textarea, select, button, a"));
    };

    const onPointerDown = (event: PointerEvent) => {
      if (isInteractiveTarget(event.target)) return;
      startX = event.clientX;
      startY = event.clientY;
      startTime = Date.now();
      active = true;
    };

    const onPointerUp = (event: PointerEvent) => {
      if (!active) return;
      active = false;

      const dx = event.clientX - startX;
      const dy = event.clientY - startY;
      const dt = Date.now() - startTime;

      if (dt > MAX_DURATION_MS) return;
      if (Math.abs(dx) < SWIPE_THRESHOLD) return;
      if (Math.abs(dx) <= Math.abs(dy)) return;

      const isExpected = direction === "left" ? dx < 0 : dx > 0;
      if (!isExpected) return;

      router.push(targetPath);
    };

    const onPointerCancel = () => {
      active = false;
    };

    window.addEventListener("pointerdown", onPointerDown, { passive: true });
    window.addEventListener("pointerup", onPointerUp, { passive: true });
    window.addEventListener("pointercancel", onPointerCancel, { passive: true });

    return () => {
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("pointercancel", onPointerCancel);
    };
  }, [direction, router, targetPath]);

  return (
    <div className="page-swipe-hint" aria-hidden>
      {hint}
    </div>
  );
}
