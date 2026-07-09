import type { ICPFit } from "../types";

export const ICP_META: Record<ICPFit, { color: string; bg: string; dot: string }> = {
  High: { color: "#0E8A50", bg: "#E7F8F0", dot: "#12B76A" },
  Medium: { color: "#B56A00", bg: "#FEF3E2", dot: "#F79009" },
  Low: { color: "#6B6B78", bg: "#F0F0F3", dot: "#C7C7D1" },
};
