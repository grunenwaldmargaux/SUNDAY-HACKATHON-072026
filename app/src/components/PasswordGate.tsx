import { useState, type FormEvent, type ReactNode } from "react";

const STORAGE_KEY = "sunday-signal-unlocked";

function isUnlocked(): boolean {
  return sessionStorage.getItem(STORAGE_KEY) === "true";
}

export function PasswordGate({ children }: { children: ReactNode }) {
  const requiredPassword = import.meta.env.VITE_APP_PASSWORD;
  const [unlocked, setUnlocked] = useState(() => !requiredPassword || isUnlocked());
  const [value, setValue] = useState("");
  const [error, setError] = useState(false);

  if (unlocked) return <>{children}</>;

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (value === requiredPassword) {
      sessionStorage.setItem(STORAGE_KEY, "true");
      setUnlocked(true);
    } else {
      setError(true);
    }
  }

  return (
    <div
      style={{
        height: "100vh",
        width: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--surface-sunken)",
      }}
    >
      <form
        onSubmit={handleSubmit}
        style={{
          width: 320,
          maxWidth: "90vw",
          background: "#fff",
          borderRadius: "var(--radius-lg)",
          boxShadow: "var(--shadow-lg)",
          border: "1px solid var(--border-subtle)",
          padding: 32,
          display: "flex",
          flexDirection: "column",
          gap: 16,
        }}
      >
        <div>
          <div style={{ fontSize: 18, fontWeight: 600, color: "var(--text-primary)" }}>
            sunday signal
          </div>
          <div style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: 4 }}>
            Enter the password to continue
          </div>
        </div>
        <input
          type="password"
          autoFocus
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            setError(false);
          }}
          placeholder="Password"
          style={{
            padding: "10px 12px",
            borderRadius: "var(--radius-sm)",
            border: `1px solid ${error ? "#E1345C" : "var(--border-default)"}`,
            fontSize: 14,
            fontFamily: "var(--font-body)",
            outline: "none",
          }}
        />
        {error && (
          <div style={{ fontSize: 13, color: "#E1345C", marginTop: -8 }}>
            Incorrect password — try again.
          </div>
        )}
        <button
          type="submit"
          style={{
            padding: "10px 12px",
            borderRadius: "var(--radius-sm)",
            border: "none",
            background: "var(--brand)",
            color: "#fff",
            fontWeight: 600,
            fontSize: 14,
            cursor: "pointer",
          }}
        >
          Enter
        </button>
      </form>
    </div>
  );
}
