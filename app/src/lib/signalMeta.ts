import type { SignalType } from "../types";

export const TYPE_META: Record<SignalType, { label: string; color: string; tint: string; icon: string }> = {
  ai: { label: "Agent · Next best action", color: "#DB00C4", tint: "#FFF0FD", icon: "sparkles" },
  stall: { label: "Deal stalling · needs attention", color: "#F04438", tint: "#FEECEB", icon: "trending-down" },
  rfp: { label: "RFP issued", color: "#2E90FA", tint: "#E9F3FE", icon: "file-text" },
  competitor: { label: "Incumbent / competitor", color: "#F04438", tint: "#FEECEB", icon: "swords" },
  funding: { label: "Funding / M&A", color: "#2E90FA", tint: "#E9F3FE", icon: "trending-up" },
  expansion: { label: "Group expansion", color: "#12B76A", tint: "#E7F8F0", icon: "building-2" },
  decision: { label: "Committee change", color: "#F79009", tint: "#FEF3E2", icon: "user-cog" },
  reviews: { label: "Reputation / board", color: "#F79009", tint: "#FEF3E2", icon: "star" },
  press: { label: "In the press", color: "#3A3A44", tint: "#F0F0F3", icon: "newspaper" },
};

export const ROLE_META: Record<string, { color: string; bg: string }> = {
  Champion: { color: "#0E8A50", bg: "#E7F8F0" },
  "Economic buyer": { color: "#A8009A", bg: "#FFF0FD" },
  Finance: { color: "#1E6FD0", bg: "#E9F3FE" },
  Procurement: { color: "#3A3A44", bg: "#F0F0F3" },
  "IT & Security": { color: "#B56A00", bg: "#FEF3E2" },
};
