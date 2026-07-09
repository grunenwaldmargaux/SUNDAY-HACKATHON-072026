import type { Tier } from "../types";

export function initials(name: string): string {
  return name
    .replace(/[^A-Za-z ]/g, "")
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

// Same rotating palette as the prototype's AV array.
const AVATAR_COLORS: [string, string][] = [
  ["#FFDBFA", "#A8009A"],
  ["#E9F3FE", "#1E6FD0"],
  ["#E7F8F0", "#0E8A50"],
  ["#FEF3E2", "#B56A00"],
  ["#F0F0F3", "#3A3A44"],
  ["#EDE9FE", "#6D28D9"],
];

export function avatarColors(seed: number): [string, string] {
  return AVATAR_COLORS[Math.abs(seed) % AVATAR_COLORS.length];
}

export function tierFor(score: number): { tier: Tier; color: string; bg: string } {
  if (score >= 88) return { tier: "Hot", color: "#DB00C4", bg: "#FFF0FD" };
  if (score >= 76) return { tier: "Warm", color: "#F79009", bg: "#FEF3E2" };
  return { tier: "Watch", color: "#6B6B78", bg: "#F0F0F3" };
}

export function arr(arrK: number): string {
  return `£${arrK}k`;
}

export function firstName(fullName: string): string {
  return fullName.split(" ")[0] ?? fullName;
}
