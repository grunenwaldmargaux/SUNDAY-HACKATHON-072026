import { useMemo } from "react";
import { useAppState } from "../state/AppState";

export function Confetti() {
  const { confetti } = useAppState();
  const sizes = [16, 22, 18, 26, 14, 20];
  const pieces = useMemo(
    () =>
      Array.from({ length: 40 }, (_, i) => ({
        left: `${((i * 7.31) % 100).toFixed(1)}%`,
        size: `${sizes[i % sizes.length]}px`,
        dur: `${(1.2 + (i % 6) * 0.18).toFixed(2)}s`,
        delay: `${((i % 10) * 0.06).toFixed(2)}s`,
      })),
    [], // eslint-disable-line react-hooks/exhaustive-deps
  );

  if (!confetti) return null;

  return (
    <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 200, overflow: "hidden" }}>
      {pieces.map((c, i) => (
        <span
          key={i}
          style={{
            position: "absolute", top: -30, left: c.left, fontSize: c.size, lineHeight: 1,
            animation: `confetti-fall ${c.dur} cubic-bezier(0.2,0,0,1) ${c.delay} forwards`,
          }}
        >
          🍕
        </span>
      ))}
    </div>
  );
}
