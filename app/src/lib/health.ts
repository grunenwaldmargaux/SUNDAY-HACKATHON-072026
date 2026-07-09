import type { Account } from "../types";

export type HealthFactor = {
  label: string;
  note: string;
  dot: string;
};

export type HealthResult = {
  score: number;
  label: "Healthy" | "At watch" | "At risk";
  color: string;
  bg: string;
  pct: string;
  stalled: boolean;
  factors: HealthFactor[];
};

const GREEN = "#12B76A";
const AMBER = "#F79009";
const RED = "#F04438";

// Deal-health score (DATA_CONTRACTS.md §1) — tune server-side later; computed
// client-side here from daysInStage / daysSinceLastActivity / committee engagement.
export function computeHealth(account: Account): HealthResult {
  const { daysInStage, daysSinceLastActivity: lastAct, committee } = account;
  const total = committee.length || 1;
  const engaged = committee.filter((c) => c.engaged).length;
  const buyer = committee.find((c) => c.tag === "Economic buyer");
  const buyerEngaged = buyer?.engaged ?? false;

  let score = Math.round((engaged / total) * 40);
  score += lastAct <= 3 ? 25 : lastAct <= 7 ? 18 : lastAct <= 14 ? 10 : 0;
  score += daysInStage <= 10 ? 25 : daysInStage <= 20 ? 16 : daysInStage <= 30 ? 8 : 2;
  score += buyerEngaged ? 10 : 0;
  score = Math.min(100, score);

  const stalled = lastAct > 14 || daysInStage > 30;

  const label = score >= 70 ? "Healthy" : score >= 45 ? "At watch" : "At risk";
  const color = score >= 70 ? "#0E8A50" : score >= 45 ? "#B56A00" : "#B42318";
  const bg = score >= 70 ? "#E7F8F0" : score >= 45 ? "#FEF3E2" : "#FEECEB";

  const ratio = engaged / total;
  const factors: HealthFactor[] = [
    {
      label: "Multithreading",
      note: `${engaged} of ${committee.length} engaged`,
      dot: ratio >= 0.6 ? GREEN : ratio >= 0.34 ? AMBER : RED,
    },
    {
      label: "Last activity",
      note: `${lastAct} day${lastAct === 1 ? "" : "s"} ago`,
      dot: lastAct <= 7 ? GREEN : lastAct <= 14 ? AMBER : RED,
    },
    {
      label: "Stage velocity",
      note: `${daysInStage} days in stage`,
      dot: daysInStage <= 15 ? GREEN : daysInStage <= 25 ? AMBER : RED,
    },
    {
      label: "Economic buyer",
      note: buyer ? (buyerEngaged ? "Engaged" : "Not engaged") : "Not identified",
      dot: buyerEngaged ? GREEN : RED,
    },
  ];

  return { score, label, color, bg, pct: `${score}%`, stalled, factors };
}
