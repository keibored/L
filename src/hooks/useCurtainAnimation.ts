import { useCallback, useEffect, useRef, useState } from "react";
import { gsap } from "gsap";

const DRAG_RANGE = 260;
const CLICK_MOVE_THRESHOLD = 4;
const READY_THRESHOLD = 0.995;

export function useCurtainAnimation(reducedMotion = false) {
  const [progress, setProgress] = useState(0);
  const [ready, setReady] = useState(false);
  const [dragging, setDragging] = useState(false);

  const progressRef = useRef(0);
  const dragStart = useRef<{ x: number; progress: number } | null>(null);
  const suppressClickRef = useRef(false);
  const tweenRef = useRef<gsap.core.Tween | null>(null);

  const applyProgress = useCallback((value: number) => {
    const clamped = Math.min(1, Math.max(0, value));
    progressRef.current = clamped;
    setProgress(clamped);
    setReady(clamped >= READY_THRESHOLD);
  }, []);

  const animateTo = useCallback(
    (target: number, duration?: number) => {
      tweenRef.current?.kill();
      const obj = { value: progressRef.current };
      tweenRef.current = gsap.to(obj, {
        value: target,
        duration: reducedMotion ? 0.24 : duration ?? 0.95,
        ease: target > obj.value ? "power3.out" : "power2.inOut",
        onUpdate() {
          applyProgress(obj.value);
        },
      });
    },
    [applyProgress, reducedMotion],
  );

  const openCurtain = useCallback((duration?: number) => animateTo(1, duration), [animateTo]);

  const handlePointerDown = useCallback((clientX: number) => {
    tweenRef.current?.kill();
    dragStart.current = { x: clientX, progress: progressRef.current };
    setDragging(true);
  }, []);

  useEffect(() => {
    if (!dragging) return;

    const handleMove = (event: PointerEvent) => {
      if (!dragStart.current) return;
      const delta = event.clientX - dragStart.current.x;
      if (Math.abs(delta) > CLICK_MOVE_THRESHOLD) suppressClickRef.current = true;
      applyProgress(dragStart.current.progress + Math.abs(delta) / DRAG_RANGE);
    };

    const handleUp = () => {
      setDragging(false);
      dragStart.current = null;
      animateTo(progressRef.current > 0.5 ? 1 : 0);
    };

    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerup", handleUp);
    return () => {
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", handleUp);
    };
  }, [dragging, applyProgress, animateTo]);

  const handleClick = useCallback(() => {
    if (suppressClickRef.current) {
      suppressClickRef.current = false;
      return false;
    }
    animateTo(progressRef.current > 0.5 ? 0 : 1);
    return true;
  }, [animateTo]);

  useEffect(() => {
    if (ready || dragging) return;
    const idle = setTimeout(() => applyProgress(0.04), 1800);
    return () => clearTimeout(idle);
  }, [ready, dragging, applyProgress]);

  return {
    progress,
    ready,
    dragging,
    handlePointerDown,
    handleClick,
    openCurtain,
  };
}
