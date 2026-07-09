import { Icon } from "../lib/icons";
import { useAppState } from "../state/AppState";

export function Toast() {
  const { toast } = useAppState();
  if (!toast) return null;

  return (
    <div
      style={{
        position: "fixed", bottom: 26, left: "50%", transform: "translateX(-50%)",
        background: "var(--ink-950)", color: "#fff", padding: "13px 20px", borderRadius: "var(--radius-pill)",
        boxShadow: "var(--shadow-lg)", display: "flex", alignItems: "center", gap: 10,
        fontSize: 13.5, fontWeight: 500, zIndex: 210, animation: "toast-in .28s var(--ease-standard) both",
      }}
    >
      <Icon name={toast.icon} size={18} color="var(--pink-400)" />
      {toast.message}
    </div>
  );
}
