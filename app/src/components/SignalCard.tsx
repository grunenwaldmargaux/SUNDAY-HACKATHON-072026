import { Icon } from "../lib/icons";
import { TYPE_META } from "../lib/signalMeta";
import { initials, avatarColors } from "../lib/format";
import type { SignalType } from "../types";

// Shared visual for a signal, used identically on the Feed and on an
// account's "Activity & signals" — same card, header, and type styling
// everywhere a signal is shown. No "Assign to agent" action here.
export function SignalCard({
  type,
  time,
  title,
  body,
  account,
  onOpenAccount,
  onWhyThis,
}: {
  type: SignalType;
  time: string;
  title: string;
  body?: string;
  account?: { id: string; name: string; avatarSeed: number };
  onOpenAccount?: (id: string) => void;
  onWhyThis?: () => void;
}) {
  const meta = TYPE_META[type];
  const [avBg, avColor] = account ? avatarColors(account.avatarSeed) : ["", ""];

  return (
    <div style={{ background: "var(--white)", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-lg)", padding: 18, boxShadow: "var(--shadow-sm)" }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 13 }}>
        <span style={{ width: 42, height: 42, flex: "0 0 auto", borderRadius: 12, background: meta.tint, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Icon name={meta.icon} size={21} color={meta.color} />
        </span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
            <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.02em", textTransform: "uppercase", color: meta.color }}>{meta.label}</span>
            <span style={{ width: 3, height: 3, borderRadius: "50%", background: "var(--ink-300)" }} />
            <span style={{ fontSize: 12, color: "var(--ink-400)" }}>{time}</span>
          </div>
          <div style={{ fontSize: 15.5, fontWeight: 500, letterSpacing: "-0.01em", color: "var(--ink-950)", lineHeight: 1.3 }}>{title}</div>
          {body && <div style={{ fontSize: 13.5, color: "var(--text-secondary)", lineHeight: 1.5, marginTop: 4 }}>{body}</div>}
        </div>
      </div>

      {(account || onWhyThis) && (
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 14, paddingTop: 14, borderTop: "1px solid var(--ink-100)" }}>
          {account && (
            <button
              onClick={() => onOpenAccount?.(account.id)}
              className="navbtn"
              style={{ display: "flex", alignItems: "center", gap: 9, border: "1px solid var(--border-subtle)", background: "var(--white)", cursor: "pointer", borderRadius: "var(--radius-pill)", padding: "5px 12px 5px 6px" }}
            >
              <span style={{ width: 26, height: 26, borderRadius: "50%", background: avBg, color: avColor, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--font-display)", fontSize: 11, fontWeight: 600 }}>
                {initials(account.name)}
              </span>
              <span style={{ fontSize: 13, fontWeight: 500, color: "var(--ink-900)" }}>{account.name}</span>
            </button>
          )}
          <div style={{ flex: 1 }} />
          {onWhyThis && (
            <button onClick={onWhyThis} style={{ border: "none", background: "transparent", cursor: "pointer", fontFamily: "var(--font-body)", fontSize: 13, fontWeight: 500, color: "var(--ink-500)", padding: "8px 10px", borderRadius: "var(--radius-pill)" }}>
              Why this?
            </button>
          )}
        </div>
      )}
    </div>
  );
}
