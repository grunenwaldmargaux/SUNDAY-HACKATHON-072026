import { Icon } from "../lib/icons";
import { useAppState } from "../state/AppState";

export function GamificationStrip() {
  const { xp, level, levelPct, xpNextLabel, streak, quests, questsDone, me } = useAppState();

  const quotaCur = me?.quota.currentK ?? 0;
  const quotaTgt = me?.quota.targetK ?? 1;
  const quotaPct = quotaTgt > 0 ? Math.min(1, quotaCur / quotaTgt) : 0;
  const C = 2 * Math.PI * 34;
  const quotaOffset = (C * (1 - quotaPct)).toFixed(1);

  return (
    <div style={{ display: "flex", gap: 14, marginBottom: 26, alignItems: "stretch" }}>
      {/* LEVEL */}
      <div style={{ flex: 1.15, background: "var(--ink-950)", borderRadius: "var(--radius-lg)", padding: "18px 20px", color: "#fff", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontSize: 11.5, color: "rgba(255,255,255,.55)", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 600 }}>Level {level.lv}</div>
            <div style={{ fontFamily: "var(--font-display)", fontSize: 24, fontWeight: 600, letterSpacing: "-0.03em", lineHeight: 1.05 }}>{level.title}</div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 5, background: "rgba(255,255,255,.1)", borderRadius: 999, padding: "5px 11px" }}>
            <span style={{ fontSize: 16, animation: "flame 2.4s ease-in-out infinite", display: "inline-block" }}>🔥</span>
            <span style={{ fontSize: 13, fontWeight: 600 }}>{streak}</span>
          </div>
        </div>
        <div style={{ marginTop: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11.5, color: "rgba(255,255,255,.6)", marginBottom: 6 }}>
            <span>{xp.toLocaleString()} XP</span><span>{xpNextLabel}</span>
          </div>
          <div style={{ height: 8, borderRadius: 999, background: "rgba(255,255,255,.14)", overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${levelPct}%`, background: "var(--pink-400)", borderRadius: 999, transition: "width .5s var(--ease-standard)" }} />
          </div>
        </div>
      </div>

      {/* DAILY QUESTS */}
      <div style={{ flex: 1.9, background: "var(--white)", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-lg)", padding: "16px 20px", boxShadow: "var(--shadow-sm)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 13 }}>
          <Icon name="target" size={16} color="var(--pink-600)" />
          <span style={{ fontFamily: "var(--font-display)", fontSize: 16, fontWeight: 500, letterSpacing: "-0.02em", color: "var(--ink-950)" }}>Daily quests</span>
          <span style={{ fontSize: 11.5, color: "var(--ink-400)" }}>· resets in 6h</span>
          <div style={{ flex: 1 }} />
          <span style={{ fontSize: 12, fontWeight: 600, color: "var(--pink-700)", background: "var(--pink-50)", borderRadius: 999, padding: "2px 9px" }}>{questsDone}/{quests.length}</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
          {quests.map((q) => (
            <div key={q.key} style={{ display: "flex", alignItems: "center", gap: 11 }}>
              <span style={{ width: 26, height: 26, flex: "0 0 auto", borderRadius: 8, background: q.tint, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Icon name={q.icon} size={14} color={q.color} />
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 13, fontWeight: 500, color: q.done ? "var(--ink-400)" : "var(--ink-900)", textDecoration: q.done ? "line-through" : "none" }}>{q.label}</span>
                  <div style={{ flex: 1 }} />
                  <span style={{ fontSize: 11, color: "var(--ink-400)" }}>{q.progress}/{q.target}</span>
                  <span style={{ fontSize: 11, fontWeight: 600, color: "var(--pink-700)" }}>+{q.xp} XP</span>
                </div>
                <div style={{ height: 5, borderRadius: 999, background: "var(--ink-100)", overflow: "hidden", marginTop: 5 }}>
                  <div style={{ height: "100%", width: `${Math.round((q.progress / q.target) * 100)}%`, background: q.done ? "#12B76A" : q.color, borderRadius: 999, transition: "width .4s ease" }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* QUOTA RING */}
      <div style={{ flex: 1, background: "var(--white)", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-lg)", padding: "16px 18px", boxShadow: "var(--shadow-sm)", display: "flex", alignItems: "center", gap: 14 }}>
        <div style={{ position: "relative", width: 84, height: 84, flex: "0 0 auto" }}>
          <svg width={84} height={84} viewBox="0 0 80 80">
            <circle cx={40} cy={40} r={34} fill="none" stroke="var(--ink-100)" strokeWidth={8} />
            <circle cx={40} cy={40} r={34} fill="none" stroke="var(--brand)" strokeWidth={8} strokeLinecap="round" strokeDasharray={C.toFixed(1)} strokeDashoffset={quotaOffset} transform="rotate(-90 40 40)" />
          </svg>
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--font-display)", fontSize: 17, fontWeight: 600, letterSpacing: "-0.02em", color: "var(--ink-950)" }}>
            {Math.round(quotaPct * 100)}%
          </div>
        </div>
        <div>
          <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>Quarterly quota</div>
          <div style={{ fontFamily: "var(--font-display)", fontSize: 20, fontWeight: 600, letterSpacing: "-0.02em", color: "var(--ink-950)", marginTop: 2 }}>£{quotaCur}k</div>
          <div style={{ fontSize: 12, color: "var(--ink-400)" }}>of £{quotaTgt}k</div>
        </div>
      </div>
    </div>
  );
}
