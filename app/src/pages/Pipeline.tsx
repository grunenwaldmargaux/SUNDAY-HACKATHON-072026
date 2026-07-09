import { useMemo, useState, type CSSProperties } from "react";
import { Icon } from "../lib/icons";
import { tierFor, initials, avatarColors, arr } from "../lib/format";
import { useAppState } from "../state/AppState";
import { useNav } from "../state/nav";

type PipeFilter = "all" | "hot" | "warm" | "following";

export function Pipeline() {
  const { accounts, isFollowing, toggleFollow } = useAppState();
  const nav = useNav();
  const [filter, setFilter] = useState<PipeFilter>("all");

  const sorted = useMemo(() => [...accounts].sort((a, b) => b.score - a.score), [accounts]);

  const filtered = sorted.filter((a) => {
    if (filter === "all") return true;
    if (filter === "hot") return a.score >= 88;
    if (filter === "warm") return a.score >= 76 && a.score < 88;
    return isFollowing(a.id);
  });

  const totalArrM = (accounts.reduce((s, a) => s + a.arrK, 0) / 1000).toFixed(2);

  const filters: { key: PipeFilter; label: string }[] = [
    { key: "all", label: "All groups" },
    { key: "hot", label: "Hot" },
    { key: "warm", label: "Warm" },
    { key: "following", label: "Tracking" },
  ];

  return (
    <div style={{ maxWidth: 1180, margin: "0 auto", padding: "26px 32px 56px" }}>
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontFamily: "var(--font-display)", fontSize: 30, fontWeight: 500, letterSpacing: "-0.03em", color: "var(--ink-950)" }}>
          My accounts
        </div>
        <div style={{ fontSize: 14.5, color: "var(--text-secondary)", marginTop: 2 }}>
          {accounts.length} restaurant groups on your patch · £{totalArrM}M open ARR, ranked by priority score.
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
        {filters.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            style={{
              border: `1px solid ${filter === f.key ? "var(--ink-950)" : "var(--border-subtle)"}`,
              background: filter === f.key ? "var(--ink-950)" : "#fff",
              color: filter === f.key ? "#fff" : "var(--ink-700)",
              fontFamily: "var(--font-body)", fontSize: 13, fontWeight: 500, cursor: "pointer",
              borderRadius: "var(--radius-pill)", padding: "7px 15px",
            }}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div style={{ background: "var(--white)", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-lg)", overflow: "hidden", boxShadow: "var(--shadow-sm)" }}>
        <div style={{ display: "grid", gridTemplateColumns: "2.2fr 0.85fr 1.15fr 0.9fr 1.55fr 44px", gap: 12, padding: "13px 20px", borderBottom: "1px solid var(--ink-100)", background: "var(--ink-50)" }}>
          <span style={headerStyle}>Group</span>
          <span style={headerStyle}>Priority</span>
          <span style={headerStyle}>Stage</span>
          <span style={headerStyle}>Open ARR</span>
          <span style={headerStyle}>Next best action</span>
          <span />
        </div>

        {filtered.map((a) => {
          const [avBg, avColor] = avatarColors(accounts.indexOf(a));
          const tierColor = tierFor(a.score).color;
          const following = isFollowing(a.id);
          const stalled = a.daysSinceLastActivity > 14 || a.daysInStage > 30;

          return (
            <div
              key={a.id}
              className="row-hover"
              onClick={() => nav.openAccount(a.id)}
              style={{ display: "grid", gridTemplateColumns: "2.2fr 0.85fr 1.15fr 0.9fr 1.55fr 44px", gap: 12, alignItems: "center", padding: "13px 20px", borderTop: "1px solid var(--ink-100)", cursor: "pointer" }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 11, minWidth: 0 }}>
                <span style={{ width: 34, height: 34, flex: "0 0 auto", borderRadius: 10, background: avBg, color: avColor, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--font-display)", fontSize: 13, fontWeight: 600 }}>
                  {initials(a.name)}
                </span>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 500, color: "var(--ink-950)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{a.name}</div>
                  <div style={{ fontSize: 12, color: "var(--ink-400)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{a.sub}</div>
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: tierColor }} />
                <span style={{ fontFamily: "var(--font-display)", fontSize: 15, fontWeight: 600, color: "var(--ink-950)" }}>{a.score}</span>
              </div>
              <span style={{ fontSize: 13, color: "var(--ink-700)" }}>{a.stage}</span>
              <span style={{ fontSize: 13.5, fontWeight: 500, color: "var(--ink-950)" }}>{arr(a.arrK)}</span>
              <div style={{ minWidth: 0 }}>
                {stalled && (
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.03em", color: "#B42318", background: "#FEECEB", borderRadius: 999, padding: "1px 7px", marginBottom: 3 }}>
                    ⚠ Stalled
                  </span>
                )}
                <span style={{ fontSize: 12.5, color: "var(--text-secondary)", lineHeight: 1.35, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                  {a.nextAction}
                </span>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); toggleFollow(a.id, a.name); }}
                title="Track"
                style={{ width: 32, height: 32, border: "none", background: "transparent", cursor: "pointer", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", justifySelf: "end" }}
              >
                <Icon name="star" size={17} color={following ? "#FF17E9" : "#C7C7D1"} />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

const headerStyle: CSSProperties = {
  fontSize: 11,
  fontWeight: 600,
  textTransform: "uppercase",
  letterSpacing: "0.05em",
  color: "var(--ink-400)",
};
