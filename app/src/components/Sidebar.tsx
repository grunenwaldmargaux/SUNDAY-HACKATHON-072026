import { Icon } from "../lib/icons";
import { useNav } from "../state/nav";
import { useAppState } from "../state/AppState";
import sundayIcon from "../assets/sunday-icon.svg";

function repInitials(name: string) {
  return name.trim().split(/\s+/).map((w) => w[0]).slice(0, 2).join("").toUpperCase();
}

export function Sidebar() {
  const nav = useNav();
  const { me, accounts, feed, tasks, isTaskDone } = useAppState();
  const openTaskCount = tasks.filter((t) => t.status !== "Completed" && !isTaskDone(t.id)).length;

  const items = [
    { key: "home" as const, label: "Feed", icon: "zap", count: String(feed.length), active: nav.view === "home", onClick: () => nav.go("home") },
    { key: "pipeline" as const, label: "My accounts", icon: "users", count: String(accounts.length), active: nav.view === "pipeline" || nav.view === "account", onClick: () => nav.go("pipeline") },
    { key: "market" as const, label: "Market · TAM", icon: "map", count: "", active: nav.view === "market" || nav.view === "mktdetail", onClick: () => nav.go("market") },
    { key: "tasks" as const, label: "Tasks", icon: "check-check", count: String(openTaskCount), active: nav.view === "tasks", onClick: () => nav.go("tasks") },
  ];

  return (
    <aside style={{ width: 224, flex: "0 0 auto", background: "var(--white)", borderRight: "1px solid var(--border-subtle)", display: "flex", flexDirection: "column", padding: "20px 14px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 9, padding: "4px 8px 22px" }}>
        <img src={sundayIcon} height={26} alt="sunday" style={{ display: "block" }} />
        <span style={{ fontFamily: "var(--font-display)", fontSize: 19, fontWeight: 500, letterSpacing: "-0.03em", color: "var(--ink-950)" }}>signal</span>
      </div>

      {items.map((n) => (
        <button
          key={n.key}
          className="navbtn"
          onClick={n.onClick}
          style={{
            display: "flex", alignItems: "center", gap: 11, padding: "10px 12px", border: "none", cursor: "pointer",
            borderRadius: "var(--radius-md)", textAlign: "left", fontFamily: "var(--font-body)", fontSize: 14,
            letterSpacing: "-0.01em", marginBottom: 3,
            background: n.active ? "var(--pink-50)" : "transparent",
            color: n.active ? "var(--pink-700)" : "var(--ink-700)",
            fontWeight: n.active ? 600 : 400,
          }}
        >
          <Icon name={n.icon} size={18} color={n.active ? "var(--pink-700)" : "var(--ink-700)"} />
          <span style={{ flex: 1 }}>{n.label}</span>
          {n.count && (
            <span style={{ fontSize: 11, fontWeight: 600, background: "var(--pink-100)", color: "var(--pink-700)", borderRadius: 999, padding: "1px 7px" }}>
              {n.count}
            </span>
          )}
        </button>
      ))}

      <div style={{ marginTop: "auto", display: "flex", alignItems: "center", gap: 11, padding: "14px 10px 4px", borderTop: "1px solid var(--border-subtle)" }}>
        <span style={{ width: 38, height: 38, flex: "0 0 auto", borderRadius: "50%", background: "var(--pink-100)", color: "var(--pink-700)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 14 }}>
          {me ? repInitials(me.repName) : ""}
        </span>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 13.5, fontWeight: 500, color: "var(--ink-950)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {me?.repName ?? ""}
          </div>
          <div style={{ fontSize: 11.5, color: "var(--ink-400)" }}>Enterprise · {me?.region ?? ""}</div>
        </div>
      </div>
    </aside>
  );
}
