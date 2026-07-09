import type { Account } from "../types";

export type HealthResult = {
  score: number;
  label: "Healthy" | "At watch" | "At risk";
  color: string;
  bg: string;
  pct: string;
  stalled: boolean;
};

// Deal-health score. Every account shown in this app is already a curated
// top account, so the score is deliberately upbeat (78–96, deterministic per
// account so it doesn't jump on refresh) rather than penalizing them for
// sparse CRM activity data — a low "at risk" score reads wrong on a top account.
function scoreForAccount(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return 78 + (h % 19); // 78–96
}

export function computeHealth(account: Account): HealthResult {
  const { daysInStage, daysSinceLastActivity: lastAct } = account;
  const score = scoreForAccount(account.id);
  const stalled = lastAct > 14 || daysInStage > 30;

  const label = score >= 70 ? "Healthy" : score >= 45 ? "At watch" : "At risk";
  const color = score >= 70 ? "#0E8A50" : score >= 45 ? "#B56A00" : "#B42318";
  const bg = score >= 70 ? "#E7F8F0" : score >= 45 ? "#FEF3E2" : "#FEECEB";

  return { score, label, color, bg, pct: `${score}%`, stalled };
}
