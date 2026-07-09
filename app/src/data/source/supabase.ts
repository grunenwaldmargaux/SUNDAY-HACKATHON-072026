import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type {
  Account,
  FeedItem,
  Me,
  MarketGroup,
  NextBestAction,
  SignalType,
  TimelineItem,
} from "../../types";
import type { DataSource } from "./types";
import {
  CITY_GEO,
  DEFAULT_REP_EMAIL,
  REPS,
  STAGE_NAME_TO_INDEX,
  SUNDAY_FIT_TO_ICP,
} from "./supabaseSchema";

// See supabaseSchema.ts for the full rationale behind every fallback below —
// this file stays close to the query/join logic, the "why" lives there.

type SfAccount = {
  id: string;
  name: string | null;
  owner_email: string | null;
  billing_city: string | null;
  industry: string | null;
  number_of_locations: number | null;
  venue_type: string | null;
  annual_turnover: number | null;
  average_yearly_turnover: number | null;
  stage: string | null;
  account_role: string | null;
  ai_research: string | null;
  ai_sunday_fit: string | null;
  ai_signals: string | null;
  ai_summary: string | null;
  ai_agent_score: number | null;
  ai_agent_reasoning: string | null;
};

type SfOpportunity = {
  id: string;
  account_id: string | null;
  owner_email: string | null;
  stage_name: string | null;
  amount: number | null;
  created_date: string | null;
};

type SfTask = {
  id: string;
  who_id: string | null;
  what_id: string | null;
  activity_date: string | null;
  subject: string | null;
  task_subtype: string | null;
  type: string | null;
};

const MS_PER_DAY = 86_400_000;

function daysBetween(from: string | null, to: Date): number {
  if (!from) return 999;
  return Math.max(0, Math.round((to.getTime() - new Date(from).getTime()) / MS_PER_DAY));
}

function monthsBetween(from: string | null, to: Date): number {
  if (!from) return 0;
  const f = new Date(from);
  return Math.max(0, (to.getFullYear() - f.getFullYear()) * 12 + (to.getMonth() - f.getMonth()));
}

function geocodeCity(city: string | null, seedId: string): { lat: number; lng: number } {
  const key = (city ?? "").trim().toLowerCase();
  const base = CITY_GEO[key] ?? [52.3555, -1.1743]; // England centroid fallback
  let h = 0;
  for (let i = 0; i < seedId.length; i++) h = (h * 31 + seedId.charCodeAt(i)) >>> 0;
  const dLat = ((h % 100) / 100 - 0.5) * 0.5;
  const dLng = (((h >> 8) % 100) / 100 - 0.5) * 0.5;
  return { lat: base[0] + dLat, lng: base[1] + dLng };
}

function icpFor(sundayFit: string | null, score: number | null): "High" | "Medium" | "Low" {
  if (sundayFit && SUNDAY_FIT_TO_ICP[sundayFit]) return SUNDAY_FIT_TO_ICP[sundayFit];
  if (score != null) return score >= 80 ? "High" : score >= 55 ? "Medium" : "Low";
  return "Medium"; // unscored majority — neutral, not artificially cold
}

function scoreFor(score: number | null): number {
  return score != null ? Math.round(score) : 50; // neutral default when un-scored
}

function catFor(acc: Pick<SfAccount, "venue_type" | "industry">): string {
  return acc.venue_type || acc.industry || "Restaurant group";
}

function splitBullets(text: string | null): string[] {
  if (!text) return [];
  return text
    .split(/\r?\n|;|(?<=\.)\s+(?=[A-Z])/)
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 6);
}

// Sales activities aren't signal categories — this is a best-effort bucket so the
// account timeline has some visual variety instead of one flat icon.
function timelineTypeFor(task: SfTask): SignalType {
  const s = `${task.task_subtype ?? ""} ${task.type ?? ""} ${task.subject ?? ""}`.toLowerCase();
  if (s.includes("rfp") || s.includes("tender")) return "rfp";
  if (s.includes("competitor") || s.includes("incumbent")) return "competitor";
  if (s.includes("funding") || s.includes("investment")) return "funding";
  if (s.includes("expansion") || s.includes("new site") || s.includes("opening")) return "expansion";
  if (s.includes("review") || s.includes("reputation")) return "reviews";
  if (s.includes("press") || s.includes("media")) return "press";
  return "decision";
}

function feedTypeFromSignalLine(line: string): SignalType {
  const s = line.toLowerCase();
  if (s.includes("rfp") || s.includes("tender")) return "rfp";
  if (s.includes("competitor") || s.includes("incumbent") || s.includes("sumup") || s.includes("switch"))
    return "competitor";
  if (s.includes("funding") || s.includes("series") || s.includes("raise")) return "funding";
  if (s.includes("expand") || s.includes("new site") || s.includes("opening")) return "expansion";
  if (s.includes("review") || s.includes("reputation") || s.includes("star")) return "reviews";
  if (s.includes("press") || s.includes("media") || s.includes("caterer")) return "press";
  if (s.includes("appoint") || s.includes("hire") || s.includes("cfo") || s.includes("director")) return "decision";
  return "decision";
}

export class SupabaseDataSource implements DataSource {
  private client: SupabaseClient;
  private repEmail: string;
  private book = new Map<string, Account>(); // session-local "added from Market" placeholders — see supabaseSchema.ts

  constructor(url: string, anonKey: string, repEmail = DEFAULT_REP_EMAIL) {
    this.client = createClient(url, anonKey);
    this.repEmail = repEmail;
  }

  async getMe(): Promise<Me> {
    const { data: perf } = await this.client
      .from("qobra_rep_performance")
      .select("owner_name, monthly_quota, onboarded_amnr")
      .eq("owner_email", this.repEmail)
      .order("performance_month", { ascending: false })
      .limit(1)
      .maybeSingle();

    const rep = REPS.find((r) => r.email === this.repEmail);

    return {
      repName: perf?.owner_name || rep?.name || this.repEmail,
      region: "United Kingdom", // no per-rep region field in the mirror
      xp: 0,
      streak: 0,
      quests: [],
      // Only the current month is loaded (qobra_rep_performance has 1 row/rep) —
      // shown as-is rather than fabricating a quarterly rollup.
      quota: {
        currentK: Math.round(Number(perf?.onboarded_amnr ?? 0)),
        targetK: Math.round(Number(perf?.monthly_quota ?? 0)),
        period: "quarter",
      },
    };
  }

  private async fetchOpenOpportunities(accountIds: string[]): Promise<SfOpportunity[]> {
    if (accountIds.length === 0) return [];
    const { data, error } = await this.client
      .from("sf_opportunities")
      .select("id, account_id, owner_email, stage_name, amount, created_date")
      .in("account_id", accountIds);
    if (error) throw error;
    return data ?? [];
  }

  private async fetchTasksFor(whatIds: string[]): Promise<SfTask[]> {
    if (whatIds.length === 0) return [];
    const { data, error } = await this.client
      .from("sf_tasks")
      .select("id, who_id, what_id, activity_date, subject, task_subtype, type")
      .in("what_id", whatIds)
      .order("activity_date", { ascending: false });
    if (error) throw error;
    return data ?? [];
  }

  private buildAccount(
    acc: SfAccount,
    opps: SfOpportunity[],
    tasks: SfTask[],
    now: Date,
  ): Account {
    const accountOpps = opps.filter((o) => o.account_id === acc.id);
    const primaryOpp = [...accountOpps].sort((a, b) => (b.amount ?? 0) - (a.amount ?? 0))[0];
    const arrK = Math.round(accountOpps.reduce((s, o) => s + (o.amount ?? 0), 0) / 1000);
    const stageIndex = primaryOpp?.stage_name ? STAGE_NAME_TO_INDEX[primaryOpp.stage_name] ?? 0 : 0;
    const dealAgeMonths = primaryOpp ? monthsBetween(primaryOpp.created_date, now) : 0;
    // No OpportunityHistory table → approximate "days in stage" with deal age.
    const daysInStage = primaryOpp ? daysBetween(primaryOpp.created_date, now) : 0;

    const relevantWhatIds = new Set([acc.id, ...accountOpps.map((o) => o.id)]);
    const accountTasks = tasks.filter((t) => t.what_id && relevantWhatIds.has(t.what_id));
    const lastActivity = accountTasks[0]?.activity_date ?? null;
    const daysSinceLastActivity = daysBetween(lastActivity, now);

    const score = scoreFor(acc.ai_agent_score);
    const sites = acc.number_of_locations ? Math.round(acc.number_of_locations) : 1;

    const nba: NextBestAction[] = [];
    if (acc.ai_summary || acc.ai_agent_reasoning) {
      nba.push({
        tag: "Agent insight",
        meta: acc.ai_sunday_fit ?? "",
        title: acc.ai_summary ?? "Agent has analysis for this account",
        detail: acc.ai_agent_reasoning ?? "",
        cta: "Open in Salesforce",
      });
    }

    const timeline: TimelineItem[] = accountTasks.slice(0, 8).map((t) => ({
      type: timelineTypeFor(t),
      text: t.subject || `${t.task_subtype ?? t.type ?? "Activity"} logged`,
      time: t.activity_date ?? "",
    }));

    return {
      id: acc.id,
      name: acc.name ?? "Unnamed account",
      sub: `${catFor(acc)} · ${sites} venue${sites === 1 ? "" : "s"}`,
      city: acc.billing_city ?? "—",
      sites,
      score,
      tier: score >= 88 ? "Hot" : score >= 76 ? "Warm" : "Watch",
      stage: primaryOpp?.stage_name ?? acc.stage ?? "Qualification",
      stageIndex,
      arrK,
      cycleNote: `${primaryOpp?.stage_name ?? "No open opportunity"} · ${daysInStage} days in stage · deal age ${dealAgeMonths} mo`,
      reason: acc.ai_summary || acc.ai_agent_reasoning || "No agent analysis yet — assign to agent to enrich this account.",
      reasonIcon: "sparkles",
      nextAction: acc.ai_agent_reasoning || acc.ai_summary || "Assign to agent to generate a next-best-action.",
      committee: [], // no Contact / OpportunityContactRole table in this mirror
      nba,
      timeline,
      signals: splitBullets(acc.ai_signals) ?? [],
      daysInStage,
      daysSinceLastActivity,
    };
  }

  async getAccounts(): Promise<Account[]> {
    const { data: accounts, error } = await this.client
      .from("sf_accounts")
      .select(
        "id, name, owner_email, billing_city, industry, number_of_locations, venue_type, annual_turnover, average_yearly_turnover, stage, account_role, ai_research, ai_sunday_fit, ai_signals, ai_summary, ai_agent_score, ai_agent_reasoning",
      )
      .eq("owner_email", this.repEmail)
      .eq("account_role", "prospect");
    if (error) throw error;

    const accountIds = (accounts ?? []).map((a) => a.id);
    const opps = await this.fetchOpenOpportunities(accountIds);
    const tasks = await this.fetchTasksFor([...accountIds, ...opps.map((o) => o.id)]);
    const now = new Date();

    const built = (accounts ?? []).map((a) => this.buildAccount(a, opps, tasks, now));
    return [...built, ...this.book.values()];
  }

  async getAccount(id: string): Promise<Account | undefined> {
    if (this.book.has(id)) return this.book.get(id);
    const { data: acc, error } = await this.client
      .from("sf_accounts")
      .select(
        "id, name, owner_email, billing_city, industry, number_of_locations, venue_type, annual_turnover, average_yearly_turnover, stage, account_role, ai_research, ai_sunday_fit, ai_signals, ai_summary, ai_agent_score, ai_agent_reasoning",
      )
      .eq("id", id)
      .maybeSingle();
    if (error) throw error;
    if (!acc) return undefined;

    const opps = await this.fetchOpenOpportunities([id]);
    const tasks = await this.fetchTasksFor([id, ...opps.map((o) => o.id)]);
    return this.buildAccount(acc, opps, tasks, new Date());
  }

  // Feed has no dedicated signals table — synthesized from the sparse AI fields
  // that are populated, plus computed stall detection. See supabaseSchema.ts.
  async getFeed(): Promise<FeedItem[]> {
    const accounts = await this.getAccounts();
    const items: FeedItem[] = [];

    for (const acc of accounts) {
      if (acc.daysSinceLastActivity > 14 || acc.daysInStage > 30) {
        items.push({
          id: `stall-${acc.id}`,
          type: "stall",
          accountId: acc.id,
          isAI: true,
          primary: "Re-engage now",
          time: "Flagged today",
          title: `${acc.name} has gone quiet — ${acc.daysSinceLastActivity} days with no logged activity`,
          body: `£${acc.arrK}k is sitting in ${acc.stage} with no recent movement. The agent can draft a re-engagement.`,
        });
      }
      if (acc.reason && !acc.reason.startsWith("No agent analysis")) {
        items.push({
          id: `ai-${acc.id}`,
          type: "ai",
          accountId: acc.id,
          isAI: true,
          primary: "Draft the case",
          time: "Agent insight",
          title: acc.reason,
          body: acc.nextAction,
        });
      }
      for (const [i, line] of acc.signals.entries()) {
        items.push({
          id: `sig-${acc.id}-${i}`,
          type: feedTypeFromSignalLine(line),
          accountId: acc.id,
          time: "Recently",
          title: line,
          body: `Signal on ${acc.name}.`,
        });
      }
    }

    return items;
  }

  private async fetchAssetSums(accountIds: string[]): Promise<Map<string, number>> {
    if (accountIds.length === 0) return new Map();
    const { data, error } = await this.client
      .from("sf_assets")
      .select("account_id, price")
      .in("account_id", accountIds);
    if (error) throw error;
    const sums = new Map<string, number>();
    for (const row of data ?? []) {
      if (!row.account_id || row.price == null) continue;
      sums.set(row.account_id, (sums.get(row.account_id) ?? 0) + Number(row.price));
    }
    return sums;
  }

  private buildMarketGroup(
    acc: SfAccount,
    oppAmountByAccount: Map<string, number>,
    assetSumByAccount: Map<string, number>,
  ): MarketGroup {
    const oppAmt = oppAmountByAccount.get(acc.id);
    const assetSum = assetSumByAccount.get(acc.id);
    let arrK: number;
    if (oppAmt) arrK = Math.round(oppAmt / 1000);
    else if (assetSum) arrK = Math.round((assetSum * 12) / 1000); // annualize
    else if (acc.annual_turnover) arrK = Math.max(10, Math.round((acc.annual_turnover * 0.004) / 1000));
    else arrK = 50; // no financial signal at all

    const sites = acc.number_of_locations ? Math.round(acc.number_of_locations) : 1;

    return {
      id: acc.id,
      name: acc.name ?? "Unnamed account",
      cat: catFor(acc),
      region: acc.billing_city ?? "—",
      sites,
      arrK,
      icp: icpFor(acc.ai_sunday_fit, acc.ai_agent_score),
      score: scoreFor(acc.ai_agent_score),
      ...geocodeCity(acc.billing_city, acc.id),
      book: acc.owner_email === this.repEmail && acc.account_role === "prospect",
      fit: [
        acc.ai_research,
        `${sites} site${sites === 1 ? "" : "s"} · ${catFor(acc)}`,
        acc.average_yearly_turnover ? `~£${Math.round(acc.average_yearly_turnover / 1000)}k average yearly turnover` : null,
      ].filter((x): x is string => Boolean(x)),
    };
  }

  async getMarket(): Promise<MarketGroup[]> {
    const { data: accounts, error } = await this.client
      .from("sf_accounts")
      .select(
        "id, name, owner_email, billing_city, industry, number_of_locations, venue_type, annual_turnover, average_yearly_turnover, stage, account_role, ai_research, ai_sunday_fit, ai_signals, ai_summary, ai_agent_score, ai_agent_reasoning",
      )
      .in("account_role", ["prospect", "customer"]);
    if (error) throw error;

    const ids = (accounts ?? []).map((a) => a.id);
    const [opps, assetSums] = await Promise.all([
      this.fetchOpenOpportunities(ids),
      this.fetchAssetSums(ids),
    ]);
    const oppAmountByAccount = new Map<string, number>();
    for (const o of opps) {
      if (!o.account_id) continue;
      oppAmountByAccount.set(o.account_id, (oppAmountByAccount.get(o.account_id) ?? 0) + (o.amount ?? 0));
    }

    return (accounts ?? []).map((a) => this.buildMarketGroup(a, oppAmountByAccount, assetSums));
  }

  async getMarketGroup(id: string): Promise<MarketGroup | undefined> {
    const { data: acc, error } = await this.client
      .from("sf_accounts")
      .select(
        "id, name, owner_email, billing_city, industry, number_of_locations, venue_type, annual_turnover, average_yearly_turnover, stage, account_role, ai_research, ai_sunday_fit, ai_signals, ai_summary, ai_agent_score, ai_agent_reasoning",
      )
      .eq("id", id)
      .maybeSingle();
    if (error) throw error;
    if (!acc) return undefined;

    const [opps, assetSums] = await Promise.all([
      this.fetchOpenOpportunities([id]),
      this.fetchAssetSums([id]),
    ]);
    const oppAmountByAccount = new Map<string, number>();
    for (const o of opps) {
      if (o.account_id) oppAmountByAccount.set(o.account_id, (oppAmountByAccount.get(o.account_id) ?? 0) + (o.amount ?? 0));
    }
    return this.buildMarketGroup(acc, oppAmountByAccount, assetSums);
  }

  async addToBook(marketGroupId: string): Promise<Account> {
    const existing = await this.getAccount(marketGroupId);
    if (existing) return existing;

    const group = await this.getMarketGroup(marketGroupId);
    if (!group) throw new Error(`Unknown market group: ${marketGroupId}`);

    const placeholder: Account = {
      id: group.id,
      name: group.name,
      sub: `${group.cat} · ${group.sites} venues`,
      city: group.region,
      sites: group.sites,
      score: group.score,
      tier: group.score >= 88 ? "Hot" : group.score >= 76 ? "Warm" : "Watch",
      stage: "Qualification",
      stageIndex: 0,
      arrK: group.arrK,
      cycleNote: "New to book · 0 days in stage · deal age 0 mo",
      reason: "Added from Market · TAM — not yet worked",
      reasonIcon: "sparkles",
      nextAction: "Assign to agent to enrich contacts and open a first conversation",
      daysInStage: 0,
      daysSinceLastActivity: 0,
      committee: [],
      nba: [],
      timeline: [],
      signals: group.fit,
    };
    // Session-local only — see the "book table" note in supabaseSchema.ts.
    this.book.set(marketGroupId, placeholder);
    return placeholder;
  }
}
