// Column/value mapping notes from the real Supabase project (jvmebywlusemucgbomgl),
// confirmed live via `mcp__Supabase__execute_sql` against the 9 tables described in
// ../../../../SCHEMA.md. Kept separate from supabase.ts so the "why" of each mapping
// decision is easy to audit against fresh introspection later.
//
// Known gaps in the current one-shot Salesforce mirror (not a bug in this adapter):
//  - No Contact / OpportunityContactRole table → Account.committee is always [].
//    "Email {champion}" and committee-engagement health factors degrade gracefully.
//  - No signals/news/intent table → FeedItem is synthesized from the sparse AI
//    fields that ARE populated (ai_signals/ai_summary/ai_agent_reasoning: ~30-48
//    of 684 accounts) plus a computed "stall" card. This is a real but thin feed
//    until a proper signals pipeline lands.
//  - ai_agent_score is null for 643/684 accounts, ai_sunday_fit null for 646/684 —
//    most of the TAM hasn't been scored yet. Unscored records fall back to a
//    neutral score/ICP rather than 0/Low so they don't look artificially cold.
//  - No OpportunityHistory (stage-transition dates) → "days in stage" is
//    approximated with days-since-opportunity-created (deal age), not true stage
//    velocity. Clearly a simplification, flagged inline where used.
//  - No per-rep "book" table → addToBook() is in-memory for the session only.
//    A real implementation should add a small `app_rep_book(rep_email, account_id)`
//    table (RLS-scoped to the rep) and upsert into it here instead.

// Real sf_opportunities.stage_name values -> the 6-stage deal cycle used by the UI.
export const STAGE_NAME_TO_INDEX: Record<string, number> = {
  Prequalification: 0,
  Discovery: 1,
  "Technical Setup": 2,
  Negotiation: 3,
  Signing: 4,
  "Onboarding Prerequisites": 5,
};

// sf_accounts.ai_sunday_fit real values -> ICP fit.
export const SUNDAY_FIT_TO_ICP: Record<string, "High" | "Medium" | "Low"> = {
  "Strong Fit": "High",
  "Potential Fit": "Medium",
  "Not Qualified": "Low",
};

export const DEFAULT_REP_EMAIL = "macarena.cibranrosado@sundayapp.com";

export const REPS = [
  { email: "macarena.cibranrosado@sundayapp.com", name: "Macarena Cibran Rosado" },
  { email: "natalia.sanzdawson@sundayapp.com", name: "Natalia Sanz Dawson" },
  { email: "virginia.guglielmi@sundayapp.com", name: "Virginia Guglielmi" },
  { email: "kim.machipisa@sundayapp.com", name: "Kim Machipisa" },
] as const;

// UK city -> approx [lat, lng], covering the billing_city values actually seen on
// prospect/customer accounts. Falls back to a jittered England-center point for
// anything unmapped (typos, "TBD", overseas holding addresses, etc).
export const CITY_GEO: Record<string, [number, number]> = {
  london: [51.5074, -0.1278],
  londres: [51.5074, -0.1278],
  manchester: [53.4808, -2.2426],
  "newcastle upon tyne": [54.9783, -1.6178],
  newcastle: [54.9783, -1.6178],
  glasgow: [55.8642, -4.2518],
  liverpool: [53.4084, -2.9916],
  bristol: [51.4545, -2.5879],
  bishopton: [55.9022, -4.5153],
  edinburgh: [55.9533, -3.1883],
  prestwick: [55.4967, -4.6072],
  crewe: [53.0977, -2.4386],
  birmingham: [52.4862, -1.8904],
  birmigham: [52.4862, -1.8904],
  cardiff: [51.4816, -3.1791],
  harrogate: [53.9919, -1.5378],
  bath: [51.3811, -2.3590],
  leeds: [53.8008, -1.5491],
  bromley: [51.4039, 0.0198],
  stockport: [53.4083, -2.1494],
  "kingston upon hull": [53.7676, -0.3274],
  nottingham: [52.9548, -1.1581],
  sheffield: [53.3811, -1.4701],
  brighton: [50.8225, -0.1372],
};
