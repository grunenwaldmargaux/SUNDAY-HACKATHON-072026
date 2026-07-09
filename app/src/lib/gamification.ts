export const LEVELS = [
  { lv: 1, title: "Rookie", min: 0 },
  { lv: 2, title: "Runner", min: 400 },
  { lv: 3, title: "Prospector", min: 900 },
  { lv: 4, title: "Closer", min: 1500 },
  { lv: 5, title: "Top Closer", min: 2300 },
  { lv: 6, title: "Rainmaker", min: 3300 },
  { lv: 7, title: "Legend", min: 4600 },
] as const;

export function levelFor(xp: number): (typeof LEVELS)[number] {
  let cur: (typeof LEVELS)[number] = LEVELS[0];
  for (const l of LEVELS) if (xp >= l.min) cur = l;
  return cur;
}

export function nextLevel(xp: number) {
  return LEVELS.find((l) => l.min > xp);
}

export const QUEST_DEFS = [
  { key: "q1", label: "Advance 2 key accounts", target: 2, xp: 120, icon: "trending-up", color: "#DB00C4", tint: "#FFF0FD" },
  { key: "q2", label: "Log an activity today", target: 1, xp: 60, icon: "notebook-pen", color: "#2E90FA", tint: "#E9F3FE" },
  { key: "q3", label: "Follow a target group", target: 1, xp: 80, icon: "star", color: "#F79009", tint: "#FEF3E2" },
] as const;

export type QuestKey = (typeof QUEST_DEFS)[number]["key"];
