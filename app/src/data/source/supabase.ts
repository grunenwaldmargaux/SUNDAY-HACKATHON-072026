import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type {
  Account,
  CommitteeMember,
  CommitteeTag,
  FeedItem,
  Me,
  MarketGroup,
  NextBestAction,
  SignalCardData,
  SignalType,
  Task,
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
  top_account: boolean | null;
};

type SfOpportunity = {
  id: string;
  account_id: string | null;
  owner_email: string | null;
  stage_name: string | null;
  amount: number | null;
  created_date: string | null;
};

// Opportunity.Amount is a flat platform/setup fee (near-always £99), not deal
// size — the real recurring-revenue signal is the sum of Estimated Monthly Net
// Revenue across the opportunity's line items. We annualize it (×12) the same
// way asset `price` is annualized elsewhere in this file.
type SfOpportunityProduct = {
  opportunity_id: string | null;
  estimated_monthly_net_revenue: number | null;
};

type SfTask = {
  id: string;
  who_id: string | null;
  what_id: string | null;
  owner_email: string | null;
  activity_date: string | null;
  subject: string | null;
  status: string | null;
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

type SfContact = {
  mapping_id: number;
  first_name: string | null;
  last_name: string | null;
  position: string | null;
  linkedin_url: string | null;
  email: string | null;
  phone_number: string | null;
};

// Sillage contacts have no CRM-style buying-committee tag — best-effort guess
// from job title so they still render in the existing "Buying committee" UI.
function tagForPosition(position: string | null): CommitteeTag {
  const p = (position ?? "").toLowerCase();
  if (p.includes("ceo") || p.includes("founder") || p.includes("owner") || p.includes("managing director")) return "Economic buyer";
  if (p.includes("cfo") || p.includes("finance")) return "Finance";
  if (p.includes("cto") || p.includes("it ") || p.includes("technology") || p.includes("security")) return "IT & Security";
  if (p.includes("procurement") || p.includes("purchasing")) return "Procurement";
  return "Champion";
}

type SfSignal = {
  id: number;
  signal_type: string;
  account_id: string | null;
  signal_date: string | null;
  source_url: string | null;
  author_name: string | null;
  author_headline: string | null;
  excerpt: string | null;
  data: Record<string, unknown> | null;
  action_name: string | null;
  email_content: string | null;
};

// sillage_signals.signal_type -> our SignalType. Competitor and job-move
// signals reuse the existing "competitor"/"decision" categories rather than
// duplicating them; the rest are Sillage-specific additions (see signalMeta.ts).
function sillageSignalType(raw: string): SignalType {
  if (raw === "keywordDetection") return "keyword";
  if (raw === "jobPostingKeywordDetection") return "hiring";
  if (raw === "recentlyPromoted" || raw === "newJob") return "decision";
  if (raw.startsWith("competitor")) return "competitor";
  if (raw.startsWith("customer")) return "customer";
  if (raw.startsWith("partner")) return "partner";
  if (raw.startsWith("influencer")) return "influencer";
  if (raw.startsWith("champion")) return "champion";
  return "decision";
}

// Playbook-derived guidance for the LinkedIn-interaction signal family
// (competitor/customer/partner/influencer/champion), condensed to one line —
// see sillage_v2_get_signal_playbook for the full reasoning per type.
const INTERACTION_GUIDANCE: Partial<Record<SignalType, string>> = {
  competitor: "A competitor is engaging with this account on LinkedIn — reach out and differentiate before they set the narrative.",
  customer: "One of your customers is connected to this account — consider asking them for a warm introduction.",
  partner: "A partner is connected to this account — a warm introduction path may exist.",
  influencer: "An influencer this account follows is in the loop — a shared interest worth referencing.",
  champion: "A champion you track is connected to this account — ask them to make the introduction.",
};

function truncate(text: string, max: number): string {
  return text.length > max ? text.slice(0, max - 1).trimEnd() + "…" : text;
}

function sillageSignalText(s: SfSignal, accountName: string): { title: string; body: string } {
  const type = sillageSignalType(s.signal_type);
  const data = s.data ?? {};

  if (type === "keyword") {
    const keywords = (data.keywords_found as string[] | undefined)?.join(", ") ?? "a tracked topic";
    return { title: `${s.author_name ?? "Someone"} posted about "${keywords}"`, body: s.excerpt ? truncate(s.excerpt, 160) : `${s.author_headline ?? ""}` };
  }
  if (type === "hiring") {
    const keywords = (data.keywords_found as string[] | undefined)?.join(", ") ?? "a tracked keyword";
    const posting = data.posting as { title?: string } | undefined;
    return { title: `${accountName} is hiring — job posting mentions "${keywords}"`, body: posting?.title ? `Open role: ${posting.title}` : "" };
  }
  if (type === "decision") {
    const prev = data.previous_position as { role?: string; company_name?: string } | undefined;
    const next = data.new_position as { role?: string; company_name?: string } | undefined;
    if (prev?.role) {
      return { title: `${s.author_name ?? "A contact"} was promoted to ${next?.role ?? "a new role"}`, body: `Previously ${prev.role}${prev.company_name ? ` at ${prev.company_name}` : ""}.` };
    }
    return { title: `${s.author_name ?? "A contact"} started as ${next?.role ?? "a new role"} at ${next?.company_name ?? accountName}`, body: "New role — the first 90 days are unusually open to fresh conversations." };
  }
  // competitor / customer / partner / influencer / champion — all *InboundComment / *OutboundComment
  const interaction = data.interaction as { author?: { full_name?: string; headline?: string } } | undefined;
  const post = data.post as { author?: { full_name?: string } } | undefined;
  const otherParty = interaction?.author?.full_name ?? s.author_name ?? "Someone";
  const accountPerson = post?.author?.full_name ?? accountName;
  return {
    title: `${otherParty} engaged with ${accountPerson}'s LinkedIn post`,
    body: INTERACTION_GUIDANCE[type] ?? "",
  };
}

function interleaveByAccount(items: FeedItem[]): FeedItem[] {
  const byAccount = new Map<string, FeedItem[]>();
  for (const item of items) {
    if (!byAccount.has(item.accountId)) byAccount.set(item.accountId, []);
    byAccount.get(item.accountId)!.push(item);
  }
  const queues = [...byAccount.values()];
  const interleaved: FeedItem[] = [];
  for (let i = 0; queues.some((q) => q.length > i); i++) {
    for (const q of queues) if (q[i]) interleaved.push(q[i]);
  }
  return interleaved;
}

function groupByAccount(signals: SfSignal[]): Map<string, SfSignal[]> {
  const byAccount = new Map<string, SfSignal[]>();
  for (const s of signals) {
    if (!s.account_id) continue;
    if (!byAccount.has(s.account_id)) byAccount.set(s.account_id, []);
    byAccount.get(s.account_id)!.push(s);
  }
  return byAccount;
}

function buildSillageFeedItem(s: SfSignal, accountName: string): FeedItem {
  const type = sillageSignalType(s.signal_type);
  const time = s.signal_date ? s.signal_date.slice(0, 10) : "Recently";
  return {
    id: `sillage-${s.id}`,
    type,
    accountId: s.account_id ?? "",
    time,
    primary: s.action_name ?? "Assign to agent",
    emailContent: s.email_content,
    ...sillageSignalText(s, accountName),
  };
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
        current: Math.round(Number(perf?.onboarded_amnr ?? 0)),
        target: Math.round(Number(perf?.monthly_quota ?? 0)),
        period: "month",
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

  private async fetchOpportunityEmnr(opportunityIds: string[]): Promise<Map<string, number>> {
    const sums = new Map<string, number>();
    if (opportunityIds.length === 0) return sums;
    const { data, error } = await this.client
      .from("sf_opportunity_products")
      .select("opportunity_id, estimated_monthly_net_revenue")
      .in("opportunity_id", opportunityIds);
    if (error) throw error;
    for (const row of (data ?? []) as SfOpportunityProduct[]) {
      if (!row.opportunity_id || row.estimated_monthly_net_revenue == null) continue;
      sums.set(
        row.opportunity_id,
        (sums.get(row.opportunity_id) ?? 0) + Number(row.estimated_monthly_net_revenue),
      );
    }
    return sums;
  }

  private async fetchTasksFor(whatIds: string[]): Promise<SfTask[]> {
    if (whatIds.length === 0) return [];
    const { data, error } = await this.client
      .from("sf_tasks")
      .select("id, who_id, what_id, owner_email, activity_date, subject, status, task_subtype, type")
      .in("what_id", whatIds)
      .order("activity_date", { ascending: false });
    if (error) throw error;
    return data ?? [];
  }

  private async fetchSillageContacts(accountIds: string[]): Promise<Map<string, SfContact[]>> {
    const byAccount = new Map<string, SfContact[]>();
    if (accountIds.length === 0) return byAccount;
    const { data: companies, error: compErr } = await this.client
      .from("sillage_companies")
      .select("mapping_id, account_id")
      .in("account_id", accountIds);
    if (compErr) throw compErr;
    const accountIdByMapping = new Map((companies ?? []).map((c) => [c.mapping_id as number, c.account_id as string]));
    const mappingIds = [...accountIdByMapping.keys()];
    if (mappingIds.length === 0) return byAccount;

    const { data: contacts, error: contactErr } = await this.client
      .from("sillage_contacts")
      .select("mapping_id, first_name, last_name, position, linkedin_url, email, phone_number")
      .in("mapping_id", mappingIds);
    if (contactErr) throw contactErr;
    for (const c of (contacts ?? []) as SfContact[]) {
      const accountId = accountIdByMapping.get(c.mapping_id);
      if (!accountId) continue;
      if (!byAccount.has(accountId)) byAccount.set(accountId, []);
      byAccount.get(accountId)!.push(c);
    }
    return byAccount;
  }

  private buildAccount(
    acc: SfAccount,
    opps: SfOpportunity[],
    tasks: SfTask[],
    emnrByOpp: Map<string, number>,
    sillageSignalsByAccount: Map<string, SfSignal[]>,
    sillageContactsByAccount: Map<string, SfContact[]>,
    now: Date,
  ): Account {
    const accountOpps = opps.filter((o) => o.account_id === acc.id);
    const primaryOpp = [...accountOpps].sort(
      (a, b) => (emnrByOpp.get(b.id) ?? 0) - (emnrByOpp.get(a.id) ?? 0),
    )[0];
    const emnrTotal = accountOpps.reduce((s, o) => s + (emnrByOpp.get(o.id) ?? 0), 0);
    const arrK = Math.round((emnrTotal * 12) / 1000);
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

    const accountName = acc.name ?? "Unnamed account";
    const accountSignals = sillageSignalsByAccount.get(acc.id) ?? [];
    const accountContacts = sillageContactsByAccount.get(acc.id) ?? [];

    const timeline: TimelineItem[] = accountTasks.slice(0, 8).map((t) => ({
      type: timelineTypeFor(t),
      text: t.subject || `${t.task_subtype ?? t.type ?? "Activity"} logged`,
      time: t.activity_date ?? "",
    }));

    // Same shape/visual as Feed's real-signal cards (SignalCard) — the point
    // is this account's signals look identical whether seen on the Feed or here.
    const signalCards: SignalCardData[] = accountSignals.map((s) => ({
      id: `sillage-${s.id}`,
      type: sillageSignalType(s.signal_type),
      time: s.signal_date ? s.signal_date.slice(0, 10) : "Recently",
      actionName: s.action_name ?? "Assign to agent",
      emailContent: s.email_content,
      ...sillageSignalText(s, accountName),
    }));

    const committee: CommitteeMember[] = accountContacts.map((c) => ({
      name: `${c.first_name ?? ""} ${c.last_name ?? ""}`.trim() || "Unknown contact",
      role: c.position ?? "Contact",
      tag: tagForPosition(c.position),
      engaged: false,
      email: c.email,
      phone: c.phone_number,
      linkedinUrl: c.linkedin_url,
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
      committee, // from sillage_contacts, not Salesforce Contact/OpportunityContactRole
      nba,
      timeline,
      signals: accountSignals.map((s) => sillageSignalText(s, accountName).title),
      signalCards,
      daysInStage,
      daysSinceLastActivity,
    };
  }

  // "My accounts" shows the strategic top accounts — the same set surfaced in the
  // Sillage top-account list — driven by the sf_accounts.top_account flag (24 rows
  // spanning several owners and roles). We intentionally do NOT scope by owner_email
  // or account_role here: top accounts are a curated cross-rep set, and filtering by
  // the current rep / prospect-only would drop all but a handful of them.
  async getAccounts(): Promise<Account[]> {
    const { data: accounts, error } = await this.client
      .from("sf_accounts")
      .select(
        "id, name, owner_email, billing_city, industry, number_of_locations, venue_type, annual_turnover, average_yearly_turnover, stage, account_role, ai_research, ai_sunday_fit, ai_signals, ai_summary, ai_agent_score, ai_agent_reasoning, top_account",
      )
      .eq("top_account", true);
    if (error) throw error;

    const accountIds = (accounts ?? []).map((a) => a.id);
    const opps = await this.fetchOpenOpportunities(accountIds);
    const [tasks, emnrByOpp, sillageSignalsByAccount, sillageContactsByAccount] = await Promise.all([
      this.fetchTasksFor([...accountIds, ...opps.map((o) => o.id)]),
      this.fetchOpportunityEmnr(opps.map((o) => o.id)),
      this.fetchSillageSignals(accountIds).then(groupByAccount),
      this.fetchSillageContacts(accountIds),
    ]);
    const now = new Date();

    const built = (accounts ?? []).map((a) =>
      this.buildAccount(a, opps, tasks, emnrByOpp, sillageSignalsByAccount, sillageContactsByAccount, now),
    );
    return [...built, ...this.book.values()];
  }

  async getAccount(id: string): Promise<Account | undefined> {
    if (this.book.has(id)) return this.book.get(id);
    const { data: acc, error } = await this.client
      .from("sf_accounts")
      .select(
        "id, name, owner_email, billing_city, industry, number_of_locations, venue_type, annual_turnover, average_yearly_turnover, stage, account_role, ai_research, ai_sunday_fit, ai_signals, ai_summary, ai_agent_score, ai_agent_reasoning, top_account",
      )
      .eq("id", id)
      .maybeSingle();
    if (error) throw error;
    if (!acc) return undefined;

    const opps = await this.fetchOpenOpportunities([id]);
    const [tasks, emnrByOpp, sillageSignalsByAccount, sillageContactsByAccount] = await Promise.all([
      this.fetchTasksFor([id, ...opps.map((o) => o.id)]),
      this.fetchOpportunityEmnr(opps.map((o) => o.id)),
      this.fetchSillageSignals([id]).then(groupByAccount),
      this.fetchSillageContacts([id]),
    ]);
    return this.buildAccount(acc, opps, tasks, emnrByOpp, sillageSignalsByAccount, sillageContactsByAccount, new Date());
  }

  // Task.WhatId is polymorphic — usually an Account, sometimes an Opportunity.
  // Resolve both so every task can still deep-link to the account it's about.
  private async resolveAccountsForTasks(
    whatIds: string[],
  ): Promise<Map<string, { accountId: string; accountName: string }>> {
    const result = new Map<string, { accountId: string; accountName: string }>();
    if (whatIds.length === 0) return result;

    const { data: accts, error: acctErr } = await this.client
      .from("sf_accounts")
      .select("id, name")
      .in("id", whatIds);
    if (acctErr) throw acctErr;
    const acctNameById = new Map((accts ?? []).map((a) => [a.id as string, a.name as string | null]));
    for (const id of whatIds) {
      if (acctNameById.has(id)) result.set(id, { accountId: id, accountName: acctNameById.get(id) ?? "Unnamed account" });
    }

    const remaining = whatIds.filter((id) => !result.has(id));
    if (remaining.length > 0) {
      const { data: opps, error: oppErr } = await this.client
        .from("sf_opportunities")
        .select("id, account_id")
        .in("id", remaining);
      if (oppErr) throw oppErr;
      const oppAccountIds = [...new Set((opps ?? []).map((o) => o.account_id).filter((x): x is string => Boolean(x)))];
      if (oppAccountIds.length > 0) {
        const { data: oppAccts, error: oppAcctErr } = await this.client
          .from("sf_accounts")
          .select("id, name")
          .in("id", oppAccountIds);
        if (oppAcctErr) throw oppAcctErr;
        const oppAcctNameById = new Map((oppAccts ?? []).map((a) => [a.id as string, a.name as string | null]));
        for (const o of opps ?? []) {
          if (o.account_id && oppAcctNameById.has(o.account_id)) {
            result.set(o.id, { accountId: o.account_id, accountName: oppAcctNameById.get(o.account_id) ?? "Unnamed account" });
          }
        }
      }
    }
    return result;
  }

  // "Tasks" is the rep's own action list — every task they own, across every
  // account (not just the top_account set getAccounts() returns), split by the
  // page into an overdue/today/upcoming to-do list plus a completed-activity log.
  async getTasks(): Promise<Task[]> {
    const { data, error } = await this.client
      .from("sf_tasks")
      .select("id, who_id, what_id, owner_email, activity_date, subject, status, task_subtype, type")
      .eq("owner_email", this.repEmail)
      .order("activity_date", { ascending: true });
    if (error) throw error;
    const tasks = (data ?? []) as SfTask[];

    const whatIds = [...new Set(tasks.map((t) => t.what_id).filter((x): x is string => Boolean(x)))];
    const resolved = await this.resolveAccountsForTasks(whatIds);

    const today = new Date().toISOString().slice(0, 10);

    return tasks.map((t) => {
      const link = t.what_id ? resolved.get(t.what_id) : undefined;
      const due = t.activity_date;
      const status = t.status ?? "Open";
      return {
        id: t.id,
        accountId: link?.accountId ?? null,
        accountName: link?.accountName ?? "No linked account",
        type: timelineTypeFor(t),
        subject: t.subject || t.task_subtype || t.type || "Activity",
        status,
        dueDate: due,
        isOverdue: Boolean(due && due < today && status !== "Completed"),
        isToday: due === today,
      };
    });
  }

  private async fetchSillageSignals(accountIds: string[]): Promise<SfSignal[]> {
    if (accountIds.length === 0) return [];
    const { data, error } = await this.client
      .from("sillage_signals")
      .select("id, signal_type, account_id, signal_date, source_url, author_name, author_headline, excerpt, data, action_name, email_content")
      .in("account_id", accountIds)
      .order("signal_date", { ascending: false });
    if (error) throw error;
    return (data ?? []) as SfSignal[];
  }

  // Stall detection and agent insight are computed from real Salesforce data
  // (activity gaps, AI-agent fields) — kept as-is. The generic per-line
  // "signals" bullets (guessed category from freetext) are replaced by
  // sillage_signals: real, dated, sourced, attributed events instead of a
  // keyword-matched guess. See lib/signalMeta.ts for the 8 Sillage types.
  async getFeed(): Promise<FeedItem[]> {
    const accounts = await this.getAccounts();
    const accountNameById = new Map(accounts.map((a) => [a.id, a.name]));

    const stallItems: FeedItem[] = [];
    const aiItems: FeedItem[] = [];
    for (const acc of accounts) {
      if (acc.daysSinceLastActivity > 14 || acc.daysInStage > 30) {
        stallItems.push({
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
        aiItems.push({
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
    }

    const signals = await this.fetchSillageSignals(accounts.map((a) => a.id));
    const signalItems = signals
      .filter((s) => s.account_id)
      .map((s) => buildSillageFeedItem(s, accountNameById.get(s.account_id!) ?? "this account"));

    // Real Sillage signals lead the feed (round-robined across accounts so
    // several companies show up before repeating one), then stall alerts,
    // then agent insights — otherwise the many "gone quiet" alerts (most
    // top accounts are dormant in this dataset) bury the real signals below
    // the fold before a user ever sees them.
    return [...interleaveByAccount(signalItems), ...interleaveByAccount(stallItems), ...interleaveByAccount(aiItems)];
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
    oppEmnrByAccount: Map<string, number>,
    assetSumByAccount: Map<string, number>,
  ): MarketGroup {
    const oppEmnr = oppEmnrByAccount.get(acc.id);
    const assetSum = assetSumByAccount.get(acc.id);
    let arrK: number;
    if (oppEmnr) arrK = Math.round((oppEmnr * 12) / 1000); // annualize
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
        "id, name, owner_email, billing_city, industry, number_of_locations, venue_type, annual_turnover, average_yearly_turnover, stage, account_role, ai_research, ai_sunday_fit, ai_signals, ai_summary, ai_agent_score, ai_agent_reasoning, top_account",
      )
      .in("account_role", ["prospect", "customer"]);
    if (error) throw error;

    const ids = (accounts ?? []).map((a) => a.id);
    const [opps, assetSums] = await Promise.all([
      this.fetchOpenOpportunities(ids),
      this.fetchAssetSums(ids),
    ]);
    const emnrByOpp = await this.fetchOpportunityEmnr(opps.map((o) => o.id));
    const oppEmnrByAccount = new Map<string, number>();
    for (const o of opps) {
      if (!o.account_id) continue;
      oppEmnrByAccount.set(
        o.account_id,
        (oppEmnrByAccount.get(o.account_id) ?? 0) + (emnrByOpp.get(o.id) ?? 0),
      );
    }

    return (accounts ?? []).map((a) => this.buildMarketGroup(a, oppEmnrByAccount, assetSums));
  }

  async getMarketGroup(id: string): Promise<MarketGroup | undefined> {
    const { data: acc, error } = await this.client
      .from("sf_accounts")
      .select(
        "id, name, owner_email, billing_city, industry, number_of_locations, venue_type, annual_turnover, average_yearly_turnover, stage, account_role, ai_research, ai_sunday_fit, ai_signals, ai_summary, ai_agent_score, ai_agent_reasoning, top_account",
      )
      .eq("id", id)
      .maybeSingle();
    if (error) throw error;
    if (!acc) return undefined;

    const [opps, assetSums] = await Promise.all([
      this.fetchOpenOpportunities([id]),
      this.fetchAssetSums([id]),
    ]);
    const emnrByOpp = await this.fetchOpportunityEmnr(opps.map((o) => o.id));
    const oppEmnrByAccount = new Map<string, number>();
    for (const o of opps) {
      if (o.account_id) {
        oppEmnrByAccount.set(o.account_id, (oppEmnrByAccount.get(o.account_id) ?? 0) + (emnrByOpp.get(o.id) ?? 0));
      }
    }
    return this.buildMarketGroup(acc, oppEmnrByAccount, assetSums);
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
      signalCards: [],
    };
    // Session-local only — see the "book table" note in supabaseSchema.ts.
    this.book.set(marketGroupId, placeholder);
    return placeholder;
  }
}
