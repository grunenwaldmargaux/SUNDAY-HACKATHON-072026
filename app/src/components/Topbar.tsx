import { Icon } from "../lib/icons";
import { useAppState } from "../state/AppState";

function repInitials(name: string) {
  return name.trim().split(/\s+/).map((w) => w[0]).slice(0, 2).join("").toUpperCase();
}

export function Topbar() {
  const { me } = useAppState();
  const today = new Date().toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 16, padding: "14px 28px", background: "var(--white)", borderBottom: "1px solid var(--border-subtle)", flex: "0 0 auto" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 9, flex: 1, maxWidth: 420, background: "var(--ink-50)", border: "1px solid transparent", borderRadius: "var(--radius-pill)", padding: "9px 15px" }}>
        <Icon name="search" size={16} color="var(--ink-400)" />
        <span style={{ fontSize: 13.5, color: "var(--ink-400)" }}>Search groups, stakeholders, signals…</span>
      </div>
      <div style={{ flex: 1 }} />
      <div style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 12.5, color: "var(--text-secondary)", background: "var(--ink-50)", borderRadius: "var(--radius-pill)", padding: "7px 13px" }}>
        <Icon name="calendar" size={14} color="var(--ink-500)" />
        {today}
      </div>
      <button className="navbtn" style={{ width: 40, height: 40, borderRadius: "50%", border: "1px solid var(--border-subtle)", background: "var(--white)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
        <Icon name="bell" size={18} color="var(--ink-700)" />
        <span style={{ position: "absolute", top: 8, right: 9, width: 7, height: 7, borderRadius: "50%", background: "var(--brand)", border: "1.5px solid #fff" }} />
      </button>
      <span style={{ height: 40, width: 40, borderRadius: "50%", background: "var(--pink-100)", color: "var(--pink-700)", display: "inline-flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 14 }}>
        {me ? repInitials(me.repName) : ""}
      </span>
    </div>
  );
}
