import { Icon } from "../lib/icons";
import { ICP_META } from "../lib/icp";
import { initials, arr } from "../lib/format";
import { useAppState } from "../state/AppState";
import { useNav } from "../state/nav";

export function MarketDetail() {
  const { market, accounts, addToBook, say } = useAppState();
  const nav = useNav();

  const group = market.find((g) => g.id === nav.marketId) ?? market[0];
  if (!group) {
    return <div style={{ padding: 56, color: "var(--ink-400)" }}>No market record selected.</div>;
  }

  const icp = ICP_META[group.icp];
  const fullAccount = accounts.find((a) => a.id === group.id);

  const stats = [
    { label: "Sites", value: String(group.sites) },
    { label: "Est. ARR", value: arr(group.arrK) },
    { label: "Prospect score", value: String(group.score) },
    { label: "Category", value: group.cat },
  ];

  return (
    <div style={{ maxWidth: 920, margin: "0 auto", padding: "20px 32px 56px" }}>
      <button
        onClick={() => nav.backToMarket()}
        className="navbtn"
        style={{ display: "flex", alignItems: "center", gap: 6, border: "none", background: "transparent", cursor: "pointer", fontFamily: "var(--font-body)", fontSize: 13, fontWeight: 500, color: "var(--ink-500)", padding: "7px 10px 7px 6px", borderRadius: "var(--radius-pill)", marginBottom: 14 }}
      >
        <Icon name="arrow-left" size={16} color="var(--ink-500)" />
        Back to market
      </button>

      <div style={{ background: "var(--white)", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-lg)", padding: 24, boxShadow: "var(--shadow-sm)", marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 18, flexWrap: "wrap" }}>
          <span style={{ width: 60, height: 60, flex: "0 0 auto", borderRadius: 16, background: "var(--ink-100)", color: "var(--ink-700)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--font-display)", fontSize: 21, fontWeight: 600 }}>
            {initials(group.name)}
          </span>
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              <span style={{ fontFamily: "var(--font-display)", fontSize: 25, fontWeight: 600, letterSpacing: "-0.03em", color: "var(--ink-950)" }}>{group.name}</span>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em", color: icp.color, background: icp.bg, borderRadius: 999, padding: "3px 10px" }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: icp.dot }} />{group.icp} ICP fit
              </span>
            </div>
            <div style={{ fontSize: 14, color: "var(--text-secondary)", marginTop: 3 }}>{group.cat} · {group.region}</div>
          </div>
          <div style={{ display: "flex", gap: 9, flex: "0 0 auto" }}>
            {group.book ? (
              <div style={{ display: "flex", alignItems: "center", gap: 7, border: "1px solid var(--pink-100)", background: "var(--pink-50)", color: "var(--pink-700)", fontFamily: "var(--font-body)", fontSize: 13, fontWeight: 600, borderRadius: "var(--radius-pill)", padding: "9px 15px" }}>
                <Icon name="check" size={15} color="var(--pink-700)" />
                In your book
              </div>
            ) : (
              <button
                onClick={() => void addToBook(group.id, group.name)}
                style={{ display: "flex", alignItems: "center", gap: 7, border: "none", cursor: "pointer", background: "var(--brand)", color: "#fff", fontFamily: "var(--font-body)", fontSize: 13, fontWeight: 600, borderRadius: "var(--radius-pill)", padding: "9px 16px", boxShadow: "var(--shadow-brand)" }}
              >
                <Icon name="plus" size={15} color="#fff" />
                Add to my accounts
              </button>
            )}
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 1, background: "var(--ink-100)", border: "1px solid var(--ink-100)", borderRadius: 12, overflow: "hidden", marginTop: 20 }}>
          {stats.map((s) => (
            <div key={s.label} style={{ background: "var(--white)", padding: "13px 16px" }}>
              <div style={{ fontSize: 11.5, color: "var(--ink-400)", textTransform: "uppercase", letterSpacing: "0.04em", fontWeight: 600 }}>{s.label}</div>
              <div style={{ fontSize: 16, fontWeight: 500, color: "var(--ink-950)", marginTop: 3 }}>{s.value}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: "flex", gap: 16, alignItems: "flex-start", flexWrap: "wrap" }}>
        <div style={{ flex: "1.4 1 400px", background: "var(--white)", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-lg)", padding: 20, boxShadow: "var(--shadow-sm)" }}>
          <div style={{ fontFamily: "var(--font-display)", fontSize: 16, fontWeight: 500, letterSpacing: "-0.02em", color: "var(--ink-950)", marginBottom: 14 }}>Why it fits your ICP</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {group.fit.map((f, i) => (
              <div key={i} style={{ display: "flex", gap: 9, alignItems: "flex-start" }}>
                <span style={{ width: 6, height: 6, marginTop: 7, flex: "0 0 auto", borderRadius: "50%", background: icp.dot }} />
                <span style={{ fontSize: 13.5, lineHeight: 1.45, color: "var(--ink-700)" }}>{f}</span>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 16, padding: "12px 14px", background: "var(--ink-50)", borderRadius: 12, fontSize: 12.5, color: "var(--ink-500)", lineHeight: 1.5 }}>
            This is a market record — no live signals yet. Add it to your book or hand it to an agent to enrich with contacts and buying-committee data.
          </div>
        </div>
        <div style={{ flex: "1 1 260px", minWidth: 260, display: "flex", flexDirection: "column", gap: 10 }}>
          <button
            onClick={() => say(`Agent finding the decision maker at ${group.name}`, "sparkles")}
            className="lift"
            style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, border: "1px solid var(--border-subtle)", background: "var(--white)", cursor: "pointer", fontFamily: "var(--font-body)", fontSize: 14, fontWeight: 500, color: "var(--ink-900)", borderRadius: "var(--radius-pill)", padding: 12, boxShadow: "var(--shadow-sm)" }}
          >
            <Icon name="sparkles" size={17} color="var(--pink-600)" />
            Find decision maker
          </button>
          {fullAccount && (
            <button
              onClick={() => nav.go("account", group.id)}
              className="lift"
              style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, border: "1px solid var(--border-subtle)", background: "var(--white)", cursor: "pointer", fontFamily: "var(--font-body)", fontSize: 14, fontWeight: 500, color: "var(--ink-900)", borderRadius: "var(--radius-pill)", padding: 12, boxShadow: "var(--shadow-sm)" }}
            >
              <Icon name="arrow-right" size={17} color="var(--ink-700)" />
              Open full account
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
