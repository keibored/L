import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { useProgress } from "@react-three/drei";
import { useExperience } from "../state/ExperienceContext";
import { useEntrancePreferences } from "../hooks/useEntrancePreferences";
import { ENTRANCE_TUNING } from "../components/Photobooth/entranceConfig";

export function LoadingScene() {
  const { finishLoading } = useExperience();
  const [percent, setPercent] = useState(0);
  const [leaving, setLeaving] = useState(false);
  const [sequenceComplete, setSequenceComplete] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const veilRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const exitStarted = useRef(false);
  const exitTween = useRef<gsap.core.Tween | null>(null);
  const { reducedMotion } = useEntrancePreferences();
  const { active: assetsLoading } = useProgress();

  useEffect(() => {
    const counter = { value: 0 };
    const duration = reducedMotion ? 0.65 : ENTRANCE_TUNING.revealDuration;
    const timeline = gsap.timeline({ onComplete: () => setSequenceComplete(true) });

    timeline.to(counter, {
      value: 100,
      duration: duration * 0.78,
      ease: "power2.inOut",
      onUpdate() {
        setPercent(Math.round(counter.value));
      },
    }, 0);
    timeline.to(contentRef.current, {
      opacity: 0,
      y: -4,
      duration: reducedMotion ? 0.18 : 0.55,
      ease: "power2.in",
    }, duration * 0.58);
    timeline.to(veilRef.current, {
      opacity: reducedMotion ? 0.08 : 0.16,
      duration: reducedMotion ? 0.45 : duration * 0.58,
      ease: "power2.inOut",
    }, reducedMotion ? 0.08 : duration * 0.2);

    return () => {
      timeline.kill();
    };
  }, [reducedMotion]);

  useEffect(() => {
    if (!sequenceComplete || exitStarted.current) return;

    const finishReveal = () => {
      if (exitStarted.current) return;
      exitStarted.current = true;
      setLeaving(true);
      exitTween.current = gsap.to(rootRef.current, {
        opacity: 0,
        duration: reducedMotion ? 0.15 : 0.38,
        ease: "power2.inOut",
        onComplete: finishLoading,
      });
    };

    if (!assetsLoading) {
      finishReveal();
      return;
    }

    const fallback = window.setTimeout(finishReveal, 1200);
    return () => window.clearTimeout(fallback);
  }, [assetsLoading, finishLoading, reducedMotion, sequenceComplete]);

  useEffect(() => () => {
    exitTween.current?.kill();
  }, []);

  return (
    <div ref={rootRef} className={`loading-shell${leaving ? " loading-shell--leaving" : ""}`}>
      <div ref={veilRef} className="loading-veil" />
      <div className="loading-grain" aria-hidden="true" />
      <div ref={contentRef} className="loading-content">
        <p className="loading-label">OPENING THE ARCHIVE</p>
        <div className="loading-bar-track">
          <div className="loading-bar-fill" style={{ width: `${percent}%` }} />
        </div>
        <p className="loading-percent">{percent}%</p>
      </div>
    </div>
  );
}
