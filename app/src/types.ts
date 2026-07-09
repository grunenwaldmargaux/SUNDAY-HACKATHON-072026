// Data contract shared by every screen and by both DataSource implementations
// (mock + Supabase). Mirrors project/design_handoff_sunday_signal/DATA_CONTRACTS.md.
// Components read only these shapes — never a source-specific field.

export type SignalType =
  | "ai"
  | "stall"
  | "rfp"
  | "competitor"
  | "funding"
  | "expansion"
  | "decision"
  | "reviews"
  | "press";

export type Tier = "Hot" | "Warm" | "Watch";

export type CommitteeTag =
  | "Champion"
  | "Economic buyer"
  | "Finance"
  | "Procurement"
  | "IT & Security";

export type CommitteeMember = {
  name: string;
  role: string;
  tag: CommitteeTag;
  engaged: boolean;
};

export type NextBestAction = {
  tag: string;
  meta: string;
  title: string;
  detail: string;
  cta: string;
};

export type TimelineItem = {
  type: SignalType;
  text: string;
  time: string;
};

export type Account = {
  id: string;
  name: string;
  sub: string;
  city: string;
  sites: number;
  score: number;
  tier: Tier;
  stage: string;
  stageIndex: number;
  arrK: number;
  cycleNote: string;
  reason: string;
  reasonIcon: string;
  nextAction: string;

  committee: CommitteeMember[];
  nba: NextBestAction[];
  timeline: TimelineItem[];
  signals: string[];

  // deal-health inputs — the score itself is computed client-side, see lib/health.ts
  daysInStage: number;
  daysSinceLastActivity: number;
};

export type Task = {
  id: string;
  accountId: string | null;
  accountName: string;
  type: SignalType;
  subject: string;
  status: string;
  dueDate: string | null;
  isOverdue: boolean;
  isToday: boolean;
};

export type FeedItem = {
  id: string;
  type: SignalType;
  accountId: string;
  time: string;
  title: string;
  body: string;
  isAI?: boolean;
  primary?: string;
};

export type ICPFit = "High" | "Medium" | "Low";

export type MarketGroup = {
  id: string;
  name: string;
  cat: string;
  region: string;
  sites: number;
  arrK: number;
  icp: ICPFit;
  score: number;
  lat: number;
  lng: number;
  book: boolean;
  fit: string[];
};

export type Quest = {
  key: string;
  label: string;
  target: number;
  progress: number;
  xp: number;
};

export type Me = {
  repName: string;
  region: string;
  xp: number;
  streak: number;
  quests: Quest[];
  // Plain £ amounts, not thousands — Qobra's real monthly quota/achieved
  // figures are already human-scale (e.g. £326 of £5,062), unlike arrK.
  quota: { current: number; target: number; period: "month" | "quarter" };
};

export const ICP_SEGMENTS = [
  "Gastropub", "Wet & Dry", "Wet Only", "Community", "Brewery/TapHouse", "Sports Bar",
  "Brunch / Breakfast", "American", "Other World Foods", "European", "Asian Food", "Indian", "Pizza",
  "Middle Eastern", "Vegan / Vegetarian", "Fast Food", "Premium Counter Service", "Food Truck",
  "Grab & Go", "Michelin Guide & 1*", "Michelin 2* & 3*", "Gourmet Dining", "Cocktail Bar",
  "Competitive socialising", "Nightclub", "Wine Bar", "Members Club", "Managed", "Market",
  "Independent Restaurant", "Budget Hotel", "Premium Hotel",
] as const;

export const DEAL_STAGES = [
  "Qualification",
  "Discovery",
  "Solution review",
  "Procurement",
  "Legal & security",
  "Rollout",
] as const;
