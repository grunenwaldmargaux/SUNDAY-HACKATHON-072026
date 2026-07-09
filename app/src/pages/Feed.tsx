import { useMemo, useState } from "react";
import { Icon } from "../lib/icons";
import { TYPE_META } from "../lib/signalMeta";
import { tierFor, initials, avatarColors, arr } from "../lib/format";
import { useAppState } from "../state/AppState";
import { useNav } from "../state/nav";
import { GamificationStrip } from "../components/GamificationStrip";
import { SignalCard } from "../components/SignalCard";
import type { Account } from "../types";

type FeedFilter = "all" | "signals" | "ai";

export function Feed() {
  const { me, accounts, feed, dismissed, dismissFeedItem, addXp, progressQuest, say } = useAppState();
  const nav = useNav();
  const [filter, setFilter] = useState<FeedFilter>("all");

  const byId = useMemo(() => Object.fromEntries(accounts.map((a) => [a.id, a])), [accounts]);

  const visibleFeed = feed
    .filter((f) => !dismissed[f.id])
    .filter((f) => (filter === "all" ? true : filter === "signals" ? f.type !== "ai" && f.type !== "stall" : f.type === "ai" || f.type === "stall"));

  const topAccounts = useMemo(() => [...accounts].sort((a, b) => b.score - a.score).slice(0, 5), [accounts]);

  const totalArrK = accounts.reduce((s, a) => s + a.arrK, 0);
  const stalledCount = accounts.filter((a) => a.daysSinceLastActivity > 14 || a.daysInStage > 30).length;

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  const filters: { key: FeedFilter; label: string }[] = [
    { key: "all", label: "All" },
    { key: "signals", label: "Signals" },
    { key: "ai", label: "Agent" },
  ];

  return (
    <div style={{ maxWidth: 1180, margin: "0 auto", padding: "26px 32px 56px" }}>
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 20, marginBottom: 20 }}>
        <div>
          <div style={{ fontFamily: "var(--font-display)", fontSize: 30, fontWeight: 500, letterSpacing: "-0.03em", color: "var(--ink-950)" }}>
            {greeting}, {me?.repName ?? ""}
          </div>
          <div style={{ fontSize: 14.5, color: "var(--text-secondary)", marginTop: 2 }}>
            {accounts.length} group accounts in motion · {arr(totalArrK)} open pipeline · {stalledCount} deal{stalledCount === 1 ? "" : "s"} stalling.
          </div>
        </div>
      </div>

      <GamificationStrip />

      <div style={{ display: "flex", gap: 24, alignItems: "flex-start" }}>
        {/* FEED */}
        <div style={{ flex: 1.7, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
            <span style={{ fontFamily: "var(--font-display)", fontSize: 18, fontWeight: 500, letterSpacing: "-0.02em", color: "var(--ink-950)" }}>Your feed</span>
            <span style={{ fontSize: 12, color: "var(--ink-400)" }}>Live signals across your named groups</span>
            <div style={{ flex: 1 }} />
            {filters.map((f) => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                style={{
                  border: `1px solid ${filter === f.key ? "var(--ink-950)" : "var(--border-subtle)"}`,
                  background: filter === f.key ? "var(--ink-950)" : "#fff",
                  color: filter === f.key ? "#fff" : "var(--ink-700)",
                  fontFamily: "var(--font-body)", fontSize: 12.5, fontWeight: 500, cursor: "pointer",
                  borderRadius: "var(--radius-pill)", padding: "5px 12px", marginLeft: 6,
                }}
              >
                {f.label}
              </button>
            ))}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {visibleFeed.map((item) => {
              const account: Account | undefined = byId[item.accountId];
              if (!account) return null;

              if (!item.isAI) {
                return (
                  <SignalCard
                    key={item.id}
                    type={item.type}
                    time={item.time}
                    title={item.title}
                    body={item.body}
                    account={{ id: account.id, name: account.name, avatarSeed: accounts.indexOf(account) }}
                    onOpenAccount={nav.openAccount}
                    onWhyThis={() => say(`Why this? · ${account.name}`, "sparkles")}
                  />
                );
              }

              const meta = TYPE_META[item.type];
              const [avBg, avColor] = avatarColors(accounts.indexOf(account));
              const cardBorder = item.type === "stall" ? "#FDA29B" : "#FFB3F4";

              return (
                <div key={item.id} className="sig-card" style={{ background: "var(--white)", border: `1px solid ${cardBorder}`, borderRadius: "var(--radius-lg)", padding: 18, boxShadow: "var(--shadow-sm)" }}>
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 13 }}>
                    <span style={{ width: 42, height: 42, flex: "0 0 auto", borderRadius: 12, background: meta.tint, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Icon name={meta.icon} size={21} color={meta.color} />
                    </span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
                        <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.02em", textTransform: "uppercase", color: meta.color }}>{meta.label}</span>
                        <span style={{ width: 3, height: 3, borderRadius: "50%", background: "var(--ink-300)" }} />
                        <span style={{ fontSize: 12, color: "var(--ink-400)" }}>{item.time}</span>
                      </div>
                      <div style={{ fontSize: 15.5, fontWeight: 500, letterSpacing: "-0.01em", color: "var(--ink-950)", lineHeight: 1.3 }}>{item.title}</div>
                      <div style={{ fontSize: 13.5, color: "var(--text-secondary)", lineHeight: 1.5, marginTop: 4 }}>{item.body}</div>
                    </div>
                    <button
                      onClick={() => dismissFeedItem(item.id)}
                      title="Dismiss"
                      style={{ width: 26, height: 26, flex: "0 0 auto", border: "none", background: "transparent", cursor: "pointer", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center" }}
                    >
                      <Icon name="x" size={15} color="var(--ink-300)" />
                    </button>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 14, paddingTop: 14, borderTop: "1px solid var(--ink-100)" }}>
                    <button
                      onClick={() => nav.openAccount(account.id)}
                      className="navbtn"
                      style={{ display: "flex", alignItems: "center", gap: 9, border: "1px solid var(--border-subtle)", background: "var(--white)", cursor: "pointer", borderRadius: "var(--radius-pill)", padding: "5px 12px 5px 6px" }}
                    >
                      <span style={{ width: 26, height: 26, borderRadius: "50%", background: avBg, color: avColor, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--font-display)", fontSize: 11, fontWeight: 600 }}>
                        {initials(account.name)}
                      </span>
                      <span style={{ fontSize: 13, fontWeight: 500, color: "var(--ink-900)" }}>{account.name}</span>
                    </button>
                    <div style={{ flex: 1 }} />
                    <button onClick={() => say(`Agent reasoning opened · ${account.name}`, "sparkles")} style={{ border: "none", background: "transparent", cursor: "pointer", fontFamily: "var(--font-body)", fontSize: 13, fontWeight: 500, color: "var(--ink-500)", padding: "8px 10px", borderRadius: "var(--radius-pill)" }}>
                      Why this?
                    </button>
                    <button
                      onClick={() => { addXp(60, `${item.primary || "Done"} — agent on it`, "sparkles"); progressQuest("q1"); }}
                      style={{ display: "flex", alignItems: "center", gap: 7, border: "none", cursor: "pointer", background: "var(--brand)", color: "#fff", fontFamily: "var(--font-body)", fontSize: 13, fontWeight: 600, borderRadius: "var(--radius-pill)", padding: "9px 16px", boxShadow: "var(--shadow-brand)" }}
                    >
                      <Icon name="zap" size={15} color="#fff" />
                      {item.primary || "Do it"}
                    </button>
                  </div>
                </div>
              );
            })}
            <div style={{ textAlign: "center", padding: 18, color: "var(--ink-400)", fontSize: 13 }}>
              You're all caught up · {visibleFeed.length} signals today
            </div>
          </div>
        </div>

        {/* PRIORITY RAIL */}
        <div style={{ flex: 1, minWidth: 300, position: "sticky", top: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
            <Icon name="flame" size={17} color="var(--pink-600)" />
            <span style={{ fontFamily: "var(--font-display)", fontSize: 18, fontWeight: 500, letterSpacing: "-0.02em", color: "var(--ink-950)" }}>Top priority</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
            {topAccounts.map((a) => {
              const [avBg, avColor] = avatarColors(accounts.indexOf(a));
              const { tier, color: tierColor, bg: reasonBg } = tierFor(a.score);
              return (
                <div
                  key={a.id}
                  className="lift"
                  onClick={() => nav.openAccount(a.id)}
                  style={{ cursor: "pointer", background: "var(--white)", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-lg)", padding: 15, boxShadow: "var(--shadow-sm)" }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
                    <span style={{ width: 38, height: 38, flex: "0 0 auto", borderRadius: 11, background: avBg, color: avColor, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--font-display)", fontSize: 14, fontWeight: 600 }}>
                      {initials(a.name)}
                    </span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14.5, fontWeight: 500, letterSpacing: "-0.01em", color: "var(--ink-950)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{a.name}</div>
                      <div style={{ fontSize: 12, color: "var(--ink-400)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{a.sub}</div>
                    </div>
                    <div style={{ textAlign: "right", flex: "0 0 auto" }}>
                      <div style={{ fontFamily: "var(--font-display)", fontSize: 19, fontWeight: 600, letterSpacing: "-0.02em", color: tierColor, lineHeight: 1 }}>{a.score}</div>
                      <div style={{ fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em", color: tierColor }}>{tier}</div>
                    </div>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 11 }}>
                    <span style={{ fontSize: 12.5, fontWeight: 600, color: "var(--ink-900)" }}>{arr(a.arrK)} ARR</span>
                    <span style={{ fontSize: 11.5, color: "var(--ink-400)" }}>{a.stage}</span>
                  </div>
                  <div style={{ display: "flex", gap: 7, marginTop: 9, padding: "9px 11px", background: reasonBg, borderRadius: 10 }}>
                    <Icon name={a.reasonIcon} size={14} color={tierColor} />
                    <span style={{ fontSize: 12, lineHeight: 1.4, color: "var(--ink-700)" }}>{a.reason}</span>
                  </div>
                </div>
              );
            })}
            <button
              onClick={() => nav.go("pipeline")}
              className="navbtn"
              style={{ border: "1px dashed var(--border-default)", background: "transparent", cursor: "pointer", borderRadius: "var(--radius-lg)", padding: 12, fontFamily: "var(--font-body)", fontSize: 13, fontWeight: 500, color: "var(--ink-500)" }}
            >
              View all accounts →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
