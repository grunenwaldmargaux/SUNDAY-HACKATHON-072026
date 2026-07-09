import { useState } from "react";
import { Icon } from "../lib/icons";
import { TYPE_META, ROLE_META } from "../lib/signalMeta";
import { tierFor, initials, avatarColors, arr, firstName } from "../lib/format";
import { computeHealth } from "../lib/health";
import { useAppState } from "../state/AppState";
import { useNav } from "../state/nav";
import { SignalCard } from "../components/SignalCard";
import { DEAL_STAGES } from "../types";

export function AccountDetail() {
  const { accounts, isFollowing, toggleFollow, addXp, progressQuest, say } = useAppState();
  const nav = useNav();
  const [expandedContact, setExpandedContact] = useState<number | null>(null);

  const account = accounts.find((a) => a.id === nav.acctId) ?? accounts[0];
  if (!account) {
    return <div style={{ padding: 56, color: "var(--ink-400)" }}>No account selected.</div>;
  }

  const [avBg, avColor] = avatarColors(accounts.indexOf(account));
  const { tier, color: tierColor, bg: tierBg } = tierFor(account.score);
  const following = isFollowing(account.id);
  const health = computeHealth(account);
  const champion = account.committee.find((c) => c.tag === "Champion") ?? account.committee[0];
  const dealAge = (account.cycleNote.match(/deal age ([^·]+)/) ?? [])[1]?.trim() ?? "—";

  const stats = [
    { label: "Stage", value: account.stage },
    { label: "Open ARR", value: arr(account.arrK) },
    { label: "Sites", value: String(account.sites) },
    { label: "Deal age", value: dealAge },
  ];

  const actions = [
    { label: "Log a meeting", icon: "calendar-check", onClick: () => { addXp(30, `Meeting logged · ${account.name}`, "calendar-check"); progressQuest("q2"); } },
    { label: "Send email", icon: "mail", onClick: () => say(`Email composer opened · ${champion?.name ?? "champion"}`, "mail") },
    { label: "Create task", icon: "check-check", onClick: () => say(`Task created on ${account.name}`, "check-check") },
  ];

  return (
    <div style={{ maxWidth: 1080, margin: "0 auto", padding: "20px 32px 56px" }}>
      <button
        onClick={() => nav.go("home")}
        className="navbtn"
        style={{ display: "flex", alignItems: "center", gap: 6, border: "none", background: "transparent", cursor: "pointer", fontFamily: "var(--font-body)", fontSize: 13, fontWeight: 500, color: "var(--ink-500)", padding: "7px 10px 7px 6px", borderRadius: "var(--radius-pill)", marginBottom: 14 }}
      >
        <Icon name="arrow-left" size={16} color="var(--ink-500)" />
        Back to feed
      </button>

      {/* Header card */}
      <div style={{ background: "var(--white)", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-lg)", padding: 24, boxShadow: "var(--shadow-sm)", marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 18 }}>
          <span style={{ width: 64, height: 64, flex: "0 0 auto", borderRadius: 16, background: avBg, color: avColor, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--font-display)", fontSize: 23, fontWeight: 600 }}>
            {initials(account.name)}
          </span>
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 11, flexWrap: "wrap" }}>
              <span style={{ fontFamily: "var(--font-display)", fontSize: 26, fontWeight: 600, letterSpacing: "-0.03em", color: "var(--ink-950)" }}>{account.name}</span>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em", color: tierColor, background: tierBg, borderRadius: 999, padding: "3px 10px" }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: tierColor }} />{tier} · {account.score}
              </span>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em", color: health.color, background: health.bg, borderRadius: 999, padding: "3px 10px" }}>
                <Icon name="activity" size={12} color={health.color} />Health {health.score} · {health.label}
              </span>
            </div>
            <div style={{ fontSize: 14, color: "var(--text-secondary)", marginTop: 3 }}>{account.sub} · {account.city}</div>
          </div>
          <div style={{ display: "flex", gap: 9, flex: "0 0 auto" }}>
            <button
              onClick={() => toggleFollow(account.id, account.name)}
              style={{
                display: "flex", alignItems: "center", gap: 7,
                border: `1px solid ${following ? "#FFB3F4" : "#E4E4EA"}`,
                background: following ? "#FFF0FD" : "var(--white)",
                color: following ? "#A8009A" : "#6B6B78",
                cursor: "pointer", fontFamily: "var(--font-body)", fontSize: 13, fontWeight: 500, borderRadius: "var(--radius-pill)", padding: "9px 15px",
              }}
            >
              <Icon name={following ? "check" : "plus"} size={15} color={following ? "#A8009A" : "#6B6B78"} />
              {following ? "Tracking" : "Track"}
            </button>
            <button
              onClick={() => say("Opening record in Salesforce…", "external-link")}
              style={{ display: "flex", alignItems: "center", gap: 7, border: "1px solid var(--border-default)", background: "var(--white)", color: "var(--ink-700)", cursor: "pointer", fontFamily: "var(--font-body)", fontSize: 13, fontWeight: 500, borderRadius: "var(--radius-pill)", padding: "9px 15px" }}
            >
              <Icon name="external-link" size={15} color="var(--ink-500)" />
              Salesforce
            </button>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 1, background: "var(--ink-100)", border: "1px solid var(--ink-100)", borderRadius: 12, overflow: "hidden", marginTop: 20 }}>
          {stats.map((s) => (
            <div key={s.label} style={{ background: "var(--white)", padding: "13px 16px" }}>
              <div style={{ fontSize: 11.5, color: "var(--ink-400)", textTransform: "uppercase", letterSpacing: "0.04em", fontWeight: 600 }}>{s.label}</div>
              <div style={{ fontSize: 16, fontWeight: 500, color: "var(--ink-950)", marginTop: 3, letterSpacing: "-0.01em" }}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* Deal cycle stepper */}
        <div style={{ marginTop: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 11 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: "var(--ink-700)" }}>Deal cycle</span>
            <span style={{ fontSize: 12, color: "var(--ink-400)" }}>· {account.cycleNote}</span>
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            {DEAL_STAGES.map((label, i) => (
              <div key={label} style={{ flex: 1 }}>
                <div style={{ height: 5, borderRadius: 999, background: i < account.stageIndex ? "var(--ink-900)" : i === account.stageIndex ? "var(--brand)" : "var(--ink-100)" }} />
                <div style={{ fontSize: 10.5, marginTop: 6, color: i <= account.stageIndex ? "var(--ink-900)" : "var(--ink-400)", fontWeight: i === account.stageIndex ? 600 : 400, letterSpacing: "-0.01em" }}>
                  {label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Action bar */}
      <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
        {actions.map((ac) => (
          <button
            key={ac.label}
            onClick={ac.onClick}
            className="lift"
            style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, border: "1px solid var(--border-subtle)", background: "var(--white)", cursor: "pointer", fontFamily: "var(--font-body)", fontSize: 14, fontWeight: 500, color: "var(--ink-900)", borderRadius: "var(--radius-pill)", padding: 12, boxShadow: "var(--shadow-sm)" }}
          >
            <Icon name={ac.icon} size={17} color="var(--pink-600)" />
            {ac.label}
          </button>
        ))}
      </div>

      <div style={{ display: "flex", gap: 16, alignItems: "flex-start", flexWrap: "wrap" }}>
        {/* LEFT: NBA + timeline */}
        <div style={{ flex: "1.6 1 400px", minWidth: 0, display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ background: "linear-gradient(180deg,var(--pink-50),var(--white))", border: "1px solid var(--pink-100)", borderRadius: "var(--radius-lg)", padding: 20 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
              <Icon name="sparkles" size={18} color="var(--pink-600)" />
              <span style={{ fontFamily: "var(--font-display)", fontSize: 17, fontWeight: 500, letterSpacing: "-0.02em", color: "var(--ink-950)" }}>Next best actions</span>
              <span style={{ fontSize: 11.5, color: "var(--pink-700)", background: "var(--pink-100)", borderRadius: 999, padding: "2px 9px", fontWeight: 600 }}>by your agent</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
              {account.nba.map((n, i) => (
                <div key={i} style={{ background: "var(--white)", border: "1px solid var(--pink-100)", borderRadius: 14, padding: 15 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                    <span style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.03em", color: "var(--pink-700)" }}>{n.tag}</span>
                    <span style={{ fontSize: 11, color: "var(--ink-400)" }}>· {n.meta}</span>
                  </div>
                  <div style={{ fontSize: 14.5, fontWeight: 500, color: "var(--ink-950)", lineHeight: 1.35 }}>{n.title}</div>
                  <div style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.5, marginTop: 4 }}>{n.detail}</div>
                  <div style={{ display: "flex", gap: 9, marginTop: 12 }}>
                    <button
                      onClick={() => { addXp(60, `${n.cta} — agent on it`, "sparkles"); progressQuest("q1"); }}
                      style={{ display: "flex", alignItems: "center", gap: 6, border: "none", cursor: "pointer", background: "var(--brand)", color: "#fff", fontFamily: "var(--font-body)", fontSize: 12.5, fontWeight: 600, borderRadius: "var(--radius-pill)", padding: "8px 15px", boxShadow: "var(--shadow-brand)" }}
                    >
                      <Icon name="zap" size={14} color="#fff" />
                      {n.cta}
                    </button>
                    <button
                      onClick={() => say(`Agent assigned: ${n.tag} · ${account.name}`, "sparkles")}
                      style={{ border: "1px solid var(--pink-200)", background: "var(--white)", color: "var(--pink-700)", cursor: "pointer", fontFamily: "var(--font-body)", fontSize: 12.5, fontWeight: 500, borderRadius: "var(--radius-pill)", padding: "8px 14px" }}
                    >
                      Assign to agent
                    </button>
                  </div>
                </div>
              ))}
              {account.nba.length === 0 && (
                <div style={{ fontSize: 13, color: "var(--ink-400)" }}>No agent actions right now.</div>
              )}
            </div>
          </div>

          {account.signalCards.length > 0 && (
            <div>
              <div style={{ fontFamily: "var(--font-display)", fontSize: 17, fontWeight: 500, letterSpacing: "-0.02em", color: "var(--ink-950)", marginBottom: 16 }}>Signals</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {account.signalCards.map((sc) => (
                  <SignalCard key={sc.id} type={sc.type} time={sc.time} title={sc.title} body={sc.body} actionLabel={sc.actionName} onAction={() => say(`${sc.actionName} · ${account.name}`, "sparkles")} />
                ))}
              </div>
            </div>
          )}

          <div style={{ background: "var(--white)", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-lg)", padding: 20, boxShadow: "var(--shadow-sm)" }}>
            <div style={{ fontFamily: "var(--font-display)", fontSize: 17, fontWeight: 500, letterSpacing: "-0.02em", color: "var(--ink-950)", marginBottom: 16 }}>Activity</div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              {account.timeline.map((t, i) => {
                const meta = TYPE_META[t.type];
                return (
                  <div key={i} style={{ display: "flex", gap: 13, paddingBottom: 16 }}>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: "0 0 auto" }}>
                      <span style={{ width: 30, height: 30, borderRadius: "50%", background: meta.tint, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <Icon name={meta.icon} size={15} color={meta.color} />
                      </span>
                      <span style={{ flex: 1, width: 2, background: "var(--ink-100)", marginTop: 4 }} />
                    </div>
                    <div style={{ flex: 1, paddingTop: 4 }}>
                      <div style={{ fontSize: 13.5, color: "var(--ink-900)", lineHeight: 1.4 }}>{t.text}</div>
                      <div style={{ fontSize: 12, color: "var(--ink-400)", marginTop: 2 }}>{t.time}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* RIGHT: health + committee + why priority */}
        <div style={{ flex: "1 1 280px", minWidth: 280, display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ background: "var(--white)", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-lg)", padding: 20, boxShadow: "var(--shadow-sm)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
              <span style={{ fontFamily: "var(--font-display)", fontSize: 15, fontWeight: 500, letterSpacing: "-0.02em", color: "var(--ink-950)" }}>Deal health</span>
              <span style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em", color: health.color, background: health.bg, borderRadius: 999, padding: "3px 10px" }}>{health.label}</span>
            </div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 5, marginBottom: 12 }}>
              <span style={{ fontFamily: "var(--font-display)", fontSize: 40, fontWeight: 600, letterSpacing: "-0.03em", color: "var(--ink-950)", lineHeight: 1 }}>{health.score}</span>
              <span style={{ fontSize: 14, color: "var(--ink-400)" }}>/ 100</span>
            </div>
            <div style={{ height: 7, borderRadius: 999, background: "var(--ink-100)", overflow: "hidden", marginBottom: 16 }}>
              <div style={{ height: "100%", width: health.pct, background: health.color, borderRadius: 999 }} />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
              {health.factors.map((h) => (
                <div key={h.label} style={{ display: "flex", alignItems: "center", gap: 9 }}>
                  <span style={{ width: 8, height: 8, flex: "0 0 auto", borderRadius: "50%", background: h.dot }} />
                  <span style={{ fontSize: 13, color: "var(--ink-700)", flex: 1 }}>{h.label}</span>
                  <span style={{ fontSize: 12.5, color: "var(--ink-400)" }}>{h.note}</span>
                </div>
              ))}
            </div>
          </div>

          <div style={{ background: "var(--white)", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-lg)", padding: 20, boxShadow: "var(--shadow-sm)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
              <span style={{ fontFamily: "var(--font-display)", fontSize: 15, fontWeight: 500, letterSpacing: "-0.02em", color: "var(--ink-950)" }}>Buying committee</span>
              <span style={{ fontSize: 11.5, color: "var(--ink-400)" }}>· {account.committee.length} stakeholders</span>
            </div>
            {account.committee.length === 0 ? (
              <div style={{ fontSize: 12.5, color: "var(--ink-400)", lineHeight: 1.5 }}>
                No committee data yet — Salesforce contacts/roles aren't loaded for this account.
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 13 }}>
                {account.committee.map((m, i) => {
                  const roleMeta = ROLE_META[m.tag] ?? ROLE_META.Procurement;
                  const open = expandedContact === i;
                  const hasDetails = Boolean(m.email || m.phone);
                  return (
                    <div key={`${m.name}-${i}`}>
                      <div
                        onClick={() => setExpandedContact(open ? null : i)}
                        className="navbtn"
                        style={{ display: "flex", alignItems: "center", gap: 11, cursor: "pointer", borderRadius: "var(--radius-md)", padding: "2px 4px", margin: "-2px -4px" }}
                      >
                        <span style={{ width: 38, height: 38, flex: "0 0 auto", borderRadius: "50%", background: "var(--ink-100)", color: "var(--ink-700)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--font-display)", fontSize: 13, fontWeight: 600 }}>
                          {initials(m.name)}
                        </span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <span style={{ fontSize: 13.5, fontWeight: 500, color: "var(--ink-950)" }}>{m.name}</span>
                            <span style={{ width: 7, height: 7, borderRadius: "50%", background: m.engaged ? "#12B76A" : "#C7C7D1" }} title={m.engaged ? "Engaged" : "Not engaged"} />
                          </div>
                          <div style={{ fontSize: 12, color: "var(--ink-400)" }}>{m.role}</div>
                        </div>
                        <span style={{ fontSize: 10.5, fontWeight: 600, color: roleMeta.color, background: roleMeta.bg, borderRadius: 999, padding: "2px 9px", whiteSpace: "nowrap" }}>{m.tag}</span>
                        <Icon name={open ? "arrow-left" : "arrow-right"} size={13} color="var(--ink-300)" />
                      </div>
                      {open && (
                        <div style={{ marginTop: 8, marginLeft: 49, padding: "10px 12px", background: "var(--ink-50)", borderRadius: 10, display: "flex", flexDirection: "column", gap: 7 }}>
                          {hasDetails ? (
                            <>
                              {m.email && (
                                <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12.5, color: "var(--ink-700)" }}>
                                  <Icon name="mail" size={14} color="var(--ink-400)" />
                                  {m.email}
                                </div>
                              )}
                              {m.phone && (
                                <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12.5, color: "var(--ink-700)" }}>
                                  <Icon name="send" size={14} color="var(--ink-400)" />
                                  {m.phone}
                                </div>
                              )}
                            </>
                          ) : (
                            <>
                              <div style={{ fontSize: 12.5, color: "var(--ink-400)" }}>No email or phone on file for this contact.</div>
                              <button
                                onClick={(e) => { e.stopPropagation(); say(`Enrichment requested — ${m.name}`, "sparkles"); }}
                                style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 7, alignSelf: "flex-start", border: "none", cursor: "pointer", background: "var(--brand)", color: "#fff", fontFamily: "var(--font-body)", fontSize: 12.5, fontWeight: 600, borderRadius: "var(--radius-pill)", padding: "7px 14px" }}
                              >
                                <Icon name="sparkles" size={14} color="#fff" />
                                Enrich contact
                              </button>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
            <button
              onClick={() => say(`Email composer opened · ${champion?.name ?? "champion"}`, "mail")}
              style={{ width: "100%", marginTop: 16, border: "none", cursor: "pointer", background: "var(--ink-950)", color: "#fff", fontFamily: "var(--font-body)", fontSize: 13, fontWeight: 600, borderRadius: "var(--radius-pill)", padding: "10px 0" }}
            >
              Email {champion ? firstName(champion.name) : "champion"}
            </button>
          </div>

          <div style={{ background: "var(--white)", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-lg)", padding: 20, boxShadow: "var(--shadow-sm)" }}>
            <div style={{ fontFamily: "var(--font-display)", fontSize: 15, fontWeight: 500, letterSpacing: "-0.02em", color: "var(--ink-950)", marginBottom: 12 }}>Why it's a priority</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
              {account.signals.map((sg, i) => (
                <div key={i} style={{ display: "flex", gap: 9, alignItems: "flex-start" }}>
                  <Icon name="circle-check" size={16} color="var(--success-500)" />
                  <span style={{ fontSize: 13, lineHeight: 1.45, color: "var(--ink-700)" }}>{sg}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
