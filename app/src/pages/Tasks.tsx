import { useMemo } from "react";
import { Icon } from "../lib/icons";
import { TYPE_META } from "../lib/signalMeta";
import { initials, avatarColors } from "../lib/format";
import { useAppState } from "../state/AppState";
import { useNav } from "../state/nav";
import type { Task } from "../types";

export function Tasks() {
  const { accounts, tasks, isTaskDone, completeTask } = useAppState();
  const nav = useNav();

  const byAccountId = useMemo(() => Object.fromEntries(accounts.map((a) => [a.id, a])), [accounts]);

  const todo = tasks.filter((t) => t.status !== "Completed" && !isTaskDone(t.id));
  const overdue = todo.filter((t) => t.isOverdue);
  const today = todo.filter((t) => !t.isOverdue && t.isToday);
  const upcoming = todo.filter((t) => !t.isOverdue && !t.isToday);

  const done = tasks.filter((t) => t.status === "Completed" || isTaskDone(t.id));

  const groups: { label: string; items: Task[]; tint: "overdue" | "default" }[] = [
    { label: "Overdue", items: overdue, tint: "overdue" },
    { label: "Today", items: today, tint: "default" },
    { label: "Upcoming", items: upcoming, tint: "default" },
  ];

  return (
    <div style={{ maxWidth: 1180, margin: "0 auto", padding: "26px 32px 56px" }}>
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontFamily: "var(--font-display)", fontSize: 30, fontWeight: 500, letterSpacing: "-0.03em", color: "var(--ink-950)" }}>
          Tasks
        </div>
        <div style={{ fontSize: 14.5, color: "var(--text-secondary)", marginTop: 2 }}>
          {overdue.length} overdue · {today.length} due today · {upcoming.length} upcoming · {done.length} completed recently.
        </div>
      </div>

      <div style={{ display: "flex", gap: 24, alignItems: "flex-start" }}>
        {/* TO DO */}
        <div style={{ flex: 1.7, minWidth: 0 }}>
          {groups.map(
            (g) =>
              g.items.length > 0 && (
                <div key={g.label} style={{ marginBottom: 22 }}>
                  <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", color: g.tint === "overdue" ? "#B42318" : "var(--ink-400)", marginBottom: 10 }}>
                    {g.label} · {g.items.length}
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {g.items.map((t) => {
                      const meta = TYPE_META[t.type];
                      const account = t.accountId ? byAccountId[t.accountId] : undefined;
                      const [avBg, avColor] = account ? avatarColors(accounts.indexOf(account)) : ["var(--ink-100)", "var(--ink-500)"];
                      return (
                        <div
                          key={t.id}
                          style={{
                            background: "var(--white)",
                            border: `1px solid ${t.isOverdue ? "#FDA29B" : "var(--border-subtle)"}`,
                            borderRadius: "var(--radius-lg)",
                            padding: 15,
                            boxShadow: "var(--shadow-sm)",
                            display: "flex",
                            alignItems: "center",
                            gap: 13,
                          }}
                        >
                          <span style={{ width: 38, height: 38, flex: "0 0 auto", borderRadius: 11, background: meta.tint, display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <Icon name={meta.icon} size={18} color={meta.color} />
                          </span>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 14, fontWeight: 500, letterSpacing: "-0.01em", color: "var(--ink-950)", lineHeight: 1.3 }}>{t.subject}</div>
                            <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
                              {account ? (
                                <button
                                  onClick={() => nav.openAccount(account.id)}
                                  className="navbtn"
                                  style={{ display: "flex", alignItems: "center", gap: 6, border: "none", background: "transparent", cursor: "pointer", padding: 0 }}
                                >
                                  <span style={{ width: 18, height: 18, borderRadius: "50%", background: avBg, color: avColor, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--font-display)", fontSize: 9, fontWeight: 600 }}>
                                    {initials(account.name)}
                                  </span>
                                  <span style={{ fontSize: 12.5, color: "var(--ink-700)" }}>{account.name}</span>
                                </button>
                              ) : (
                                <span style={{ fontSize: 12.5, color: "var(--ink-400)" }}>{t.accountName}</span>
                              )}
                              {t.dueDate && (
                                <>
                                  <span style={{ width: 3, height: 3, borderRadius: "50%", background: "var(--ink-300)" }} />
                                  <span style={{ fontSize: 12, color: t.isOverdue ? "#B42318" : "var(--ink-400)" }}>{t.dueDate}</span>
                                </>
                              )}
                            </div>
                          </div>
                          <button
                            onClick={() => completeTask(t.id, t.subject)}
                            style={{ display: "flex", alignItems: "center", gap: 6, border: "1px solid var(--border-subtle)", background: "#fff", cursor: "pointer", fontFamily: "var(--font-body)", fontSize: 12.5, fontWeight: 500, color: "var(--ink-700)", borderRadius: "var(--radius-pill)", padding: "7px 13px" }}
                          >
                            <Icon name="check" size={14} color="var(--ink-700)" />
                            Mark done
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ),
          )}
          {todo.length === 0 && (
            <div style={{ textAlign: "center", padding: 32, color: "var(--ink-400)", fontSize: 13 }}>
              You're all caught up · no open tasks
            </div>
          )}
        </div>

        {/* RECENT ACTIVITY */}
        <div style={{ flex: 1, minWidth: 300, position: "sticky", top: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
            <Icon name="calendar-check" size={17} color="var(--pink-600)" />
            <span style={{ fontFamily: "var(--font-display)", fontSize: 18, fontWeight: 500, letterSpacing: "-0.02em", color: "var(--ink-950)" }}>Recent activity</span>
          </div>
          <div style={{ background: "var(--white)", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-lg)", padding: 20, boxShadow: "var(--shadow-sm)" }}>
            <div style={{ display: "flex", flexDirection: "column" }}>
              {done.slice(0, 12).map((t, i) => {
                const meta = TYPE_META[t.type];
                return (
                  <div key={t.id} style={{ display: "flex", gap: 13, paddingBottom: 16 }}>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: "0 0 auto" }}>
                      <span style={{ width: 30, height: 30, borderRadius: "50%", background: meta.tint, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <Icon name={meta.icon} size={15} color={meta.color} />
                      </span>
                      {i < done.slice(0, 12).length - 1 && <span style={{ flex: 1, width: 2, background: "var(--ink-100)", marginTop: 4 }} />}
                    </div>
                    <div style={{ flex: 1, paddingTop: 4, minWidth: 0 }}>
                      <div style={{ fontSize: 13.5, color: "var(--ink-900)", lineHeight: 1.4 }}>{t.subject}</div>
                      <div style={{ fontSize: 12, color: "var(--ink-400)", marginTop: 2 }}>{t.accountName}{t.dueDate ? ` · ${t.dueDate}` : ""}</div>
                    </div>
                  </div>
                );
              })}
              {done.length === 0 && <div style={{ fontSize: 13, color: "var(--ink-400)" }}>Nothing completed yet.</div>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
