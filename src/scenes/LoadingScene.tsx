import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { useExperience } from "../state/ExperienceContext";

export function LoadingScene() {
  const { finishLoading } = useExperience();
  const [percent, setPercent] = useState(0);
  const [leaving, setLeaving] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const counter = { value: 0 };
    const tween = gsap.to(counter, {
      value: 100,
      duration: 2.6,
      ease: "power2.inOut",
      onUpdate() {
        setPercent(Math.round(counter.value));
      },
      onComplete() {
        setLeaving(true);
        gsap.to(rootRef.current, {
          opacity: 0,
          duration: 0.9,
          delay: 0.35,
          ease: "power2.inOut",
          onComplete: finishLoading,
        });
      },
    });
    return () => {
      tween.kill();
    };
  }, [finishLoading]);

  return (
    <div ref={rootRef} className={`loading-shell${leaving ? " loading-shell--leaving" : ""}`}>
      <div className="loading-grain" />
      <div className="loading-content">
        <p className="loading-label">LOADING SCENE...</p>
        <div className="loading-bar-track">
          <div className="loading-bar-fill" style={{ width: `${percent}%` }} />
        </div>
        <p className="loading-percent">{percent}%</p>
      </div>
    </div>
  );
}
