import { Icon } from "../lib/icons";

// email_content is stored as "[SUBJECT LINE] ...\n[GREETING] ...\n..." —
// pull the subject out for the modal header, show the rest as the body.
function parseEmail(raw: string): { subject: string | null; body: string } {
  const match = raw.match(/^\[SUBJECT LINE\]\s*(.+?)(?:\n|$)/);
  if (!match) return { subject: null, body: raw };
  return { subject: match[1].trim(), body: raw.slice(match[0].length).trim() };
}

export function EmailDraftModal({ content, onClose }: { content: string; onClose: () => void }) {
  const { subject, body } = parseEmail(content);

  return (
    <div
      onClick={onClose}
      style={{ position: "fixed", inset: 0, background: "rgba(20,20,26,.45)", zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ background: "var(--white)", borderRadius: "var(--radius-lg)", boxShadow: "var(--shadow-lg)", width: "100%", maxWidth: 560, maxHeight: "80vh", display: "flex", flexDirection: "column", overflow: "hidden" }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "16px 20px", borderBottom: "1px solid var(--border-subtle)" }}>
          <span style={{ width: 32, height: 32, flex: "0 0 auto", borderRadius: 9, background: "var(--pink-50)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Icon name="sparkles" size={16} color="var(--pink-600)" />
          </span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: "var(--font-display)", fontSize: 15, fontWeight: 500, color: "var(--ink-950)" }}>Drafted by your agent</div>
            <div style={{ fontSize: 11.5, color: "var(--ink-400)" }}>Review before sending</div>
          </div>
          <button onClick={onClose} style={{ width: 28, height: 28, border: "none", background: "transparent", cursor: "pointer", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Icon name="x" size={16} color="var(--ink-400)" />
          </button>
        </div>

        <div style={{ padding: 20, overflowY: "auto" }}>
          {subject && (
            <div style={{ marginBottom: 14, paddingBottom: 14, borderBottom: "1px solid var(--ink-100)" }}>
              <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em", color: "var(--ink-400)", marginBottom: 3 }}>Subject</div>
              <div style={{ fontSize: 14.5, fontWeight: 500, color: "var(--ink-950)" }}>{subject}</div>
            </div>
          )}
          <div style={{ fontSize: 13.5, color: "var(--ink-800)", lineHeight: 1.65, whiteSpace: "pre-wrap" }}>{body}</div>
        </div>

        <div style={{ display: "flex", gap: 10, padding: "14px 20px", borderTop: "1px solid var(--border-subtle)" }}>
          <button
            onClick={onClose}
            style={{ flex: 1, border: "1px solid var(--border-subtle)", background: "#fff", cursor: "pointer", fontFamily: "var(--font-body)", fontSize: 13, fontWeight: 500, color: "var(--ink-700)", borderRadius: "var(--radius-pill)", padding: "10px 0" }}
          >
            Close
          </button>
          <button
            onClick={onClose}
            style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 7, border: "none", cursor: "pointer", background: "var(--brand)", color: "#fff", fontFamily: "var(--font-body)", fontSize: 13, fontWeight: 600, borderRadius: "var(--radius-pill)", padding: "10px 0", boxShadow: "var(--shadow-brand)" }}
          >
            <Icon name="send" size={14} color="#fff" />
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
