// Raw fixture data ported 1:1 from the design handoff's `Sunday Signal.dc.html`
// (ACCOUNTS, MARKET, FEED, HEALTH, QUEST_DEFS). Shaped to types.ts so the mock
// DataSource and the Supabase DataSource are interchangeable for every component.
import type { Account, FeedItem, MarketGroup, Quest, Task } from "../../types";

// city center coordinates, jittered per-id so same-region markers don't stack
const CITY: Record<string, [number, number]> = {
  london: [51.5074, -0.1278],
  manchester: [53.4808, -2.2426],
  liverpool: [53.4084, -2.9916],
  leeds: [53.8008, -1.5491],
  brighton: [50.8225, -0.1372],
  bristol: [51.4545, -2.5879],
  nottingham: [52.9548, -1.1581],
  glasgow: [55.8642, -4.2518],
  edinburgh: [55.9533, -3.1883],
  birmingham: [52.4862, -1.8904],
  cardiff: [51.4816, -3.1791],
  newcastle: [54.9783, -1.6178],
};

function jitter(id: string, [lat, lng]: [number, number]): [number, number] {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  const dLat = ((h % 100) / 100 - 0.5) * 0.6;
  const dLng = (((h >> 8) % 100) / 100 - 0.5) * 0.6;
  return [lat + dLat, lng + dLng];
}

function geo(id: string, city: keyof typeof CITY): { lat: number; lng: number } {
  const [lat, lng] = jitter(id, CITY[city]);
  return { lat, lng };
}

export const MOCK_ACCOUNTS: Account[] = [
  {
    id: "cop", name: "Copper & Co. Group", sub: "Gastropub group · 24 venues", city: "London",
    sites: 24, score: 94, tier: "Hot", stage: "Legal & security", stageIndex: 4, arrK: 310,
    cycleNote: "Master renewal · 12 days in stage · deal age 9 mo",
    reason: "Master renewal in 45 days · 9 sites still on a legacy provider", reasonIcon: "clock",
    nextAction: "Send the group renewal + 9-site migration business case",
    daysInStage: 12, daysSinceLastActivity: 1,
    committee: [
      { name: "Priya Menon", role: "Group Ops Director", tag: "Champion", engaged: true, email: null, phone: null, linkedinUrl: null },
      { name: "David Cole", role: "Group CFO", tag: "Economic buyer", engaged: false, email: null, phone: null, linkedinUrl: null },
      { name: "Sarah Blake", role: "Head of IT", tag: "IT & Security", engaged: true, email: null, phone: null, linkedinUrl: null },
    ],
    nba: [
      { tag: "Renewal risk", meta: "£310k at risk", title: "Send the group renewal + 9-site migration case", detail: "Master contract ends in 45 days and 9 venues still run a legacy provider. Priya is bought in but David (CFO) hasn't engaged — lead with consolidated reporting and a single settlement.", cta: "Draft business case" },
      { tag: "Multithread", meta: "unblock buyer", title: "Get a 20-min slot with David Cole, CFO", detail: "The economic buyer is unengaged with 45 days to go. Ask Priya for a warm intro this week.", cta: "Request intro" },
    ],
    timeline: [
      { type: "ai", text: "Agent flagged renewal risk — 45 days to master contract end, CFO not engaged", time: "Today" },
      { type: "expansion", text: "Group announced 6 new sites for 2026 (Shoreditch, Leeds, Bristol…)", time: "4 days ago" },
      { type: "reviews", text: "Live sites now averaging 4.7★ on Google (+0.3 since sunday)", time: "2 weeks ago" },
    ],
    signalCards: [],
    signals: ["£310k master renewal window opens in 45 days", "9 of 24 venues still on a legacy provider", "Champion engaged, economic buyer not yet", "Group expanding by 6 sites in 2026"],
  },
  {
    id: "non", name: "Nonna Holdings", sub: "Italian casual-dining · 41 venues", city: "Manchester",
    sites: 41, score: 90, tier: "Hot", stage: "Solution review", stageIndex: 2, arrK: 420,
    cycleNote: "RFP live · 6 days in stage · deal age 4 mo",
    reason: "Issued a group-wide RFP for payments across all 41 sites", reasonIcon: "file-text",
    nextAction: "Submit RFP response + reference a comparable group",
    daysInStage: 6, daysSinceLastActivity: 2,
    committee: [
      { name: "Marco Ferretti", role: "Group COO", tag: "Champion", engaged: true, email: null, phone: null, linkedinUrl: null },
      { name: "Elena Rossi", role: "Group Finance Director", tag: "Finance", engaged: false, email: null, phone: null, linkedinUrl: null },
      { name: "Tom Reilly", role: "Procurement Lead", tag: "Procurement", engaged: true, email: null, phone: null, linkedinUrl: null },
    ],
    nba: [
      { tag: "Active RFP", meta: "£420k · deadline 18 Jul", title: "Submit the RFP response with a peer-group reference", detail: "Nonna Holdings issued an RFP across 41 sites. Procurement is running it. Differentiate on reviews uplift and reconciliation — attach a comparable 40+ site reference.", cta: "Build RFP response" },
    ],
    timeline: [
      { type: "rfp", text: "Procurement issued a formal RFP for group payments", time: "2 days ago" },
      { type: "decision", text: "Tom Reilly (Procurement) added as evaluator", time: "3 days ago" },
    ],
    signalCards: [],
    signals: ["Formal RFP across all 41 venues", "£420k potential — largest live deal", "Champion (COO) sponsoring internally"],
  },
  {
    id: "har", name: "Harbour Restaurant Group", sub: "Premium seafood · 12 venues", city: "Brighton",
    sites: 12, score: 86, tier: "Warm", stage: "Procurement", stageIndex: 3, arrK: 180,
    cycleNote: "Displacement · 9 days in stage · deal age 6 mo",
    reason: "SumUp is the incumbent; group contract ends this quarter", reasonIcon: "swords",
    nextAction: "Build the displacement case vs SumUp for the MD",
    daysInStage: 9, daysSinceLastActivity: 5,
    committee: [
      { name: "Sophie Reed", role: "Operations Director", tag: "Champion", engaged: true, email: null, phone: null, linkedinUrl: null },
      { name: "James Whitfield", role: "Managing Director", tag: "Economic buyer", engaged: false, email: null, phone: null, linkedinUrl: null },
      { name: "Nadia Osei", role: "Finance Controller", tag: "Finance", engaged: true, email: null, phone: null, linkedinUrl: null },
    ],
    nba: [
      { tag: "Displacement", meta: "incumbent exit", title: "Build the switch case vs SumUp before Q3", detail: "The incumbent's group contract ends this quarter. Sophie wants better reputation tooling — quantify the review uplift and the switching cost saved to win the MD.", cta: "Draft switch case" },
    ],
    timeline: [
      { type: "competitor", text: "SumUp (incumbent) contract confirmed ending Q3", time: "5 days ago" },
      { type: "ai", text: "Agent detected renewal window on incumbent contract", time: "6 days ago" },
    ],
    signalCards: [],
    signals: ["Incumbent contract ends this quarter", "£180k across 12 premium venues", "Champion prioritises online reputation"],
  },
  {
    id: "grf", name: "GreenFork Collective", sub: "Fast-casual chain · 60 venues", city: "London",
    sites: 60, score: 82, tier: "Warm", stage: "Discovery", stageIndex: 1, arrK: 540,
    cycleNote: "New logo · 14 days in stage · deal age 2 mo",
    reason: "Raised a £22M Series B · new group CFO appointed", reasonIcon: "trending-up",
    nextAction: "Open a discovery with the new CFO on the 60-site rollout",
    daysInStage: 21, daysSinceLastActivity: 18,
    committee: [
      { name: "Idris Kane", role: "Group COO", tag: "Champion", engaged: true, email: null, phone: null, linkedinUrl: null },
      { name: "Nadia Khan", role: "Group CFO (new)", tag: "Economic buyer", engaged: false, email: null, phone: null, linkedinUrl: null },
      { name: "Ben Ford", role: "Head of Digital", tag: "IT & Security", engaged: false, email: null, phone: null, linkedinUrl: null },
    ],
    nba: [
      { tag: "Expansion trigger", meta: "biggest deal · £540k", title: "Open discovery with the new CFO on a 60-site rollout", detail: "Fresh £22M Series B and a brand-new CFO usually means a tooling refresh. Idris is your champion — ask him to sponsor a discovery with Nadia while budgets are being set.", cta: "Draft discovery brief" },
    ],
    timeline: [
      { type: "funding", text: "Announced £22M Series B led by Balderton", time: "3 days ago" },
      { type: "decision", text: "Nadia Khan appointed Group CFO (ex-Leon)", time: "2 weeks ago" },
    ],
    signalCards: [],
    signals: ["£22M Series B → tooling budget", "60 venues = largest potential ARR", "New CFO = fresh evaluation window"],
  },
  {
    id: "lum", name: "Lumen Coffee Group", sub: "Specialty coffee · 30 venues", city: "Bristol",
    sites: 30, score: 77, tier: "Warm", stage: "Qualification", stageIndex: 0, arrK: 240,
    cycleNote: "Champion building · 3 days in stage · deal age 1 mo",
    reason: "New Group Ops Director joined from a sunday client", reasonIcon: "user-cog",
    nextAction: "Warm outreach — the new director already knows sunday",
    daysInStage: 3, daysSinceLastActivity: 6,
    committee: [
      { name: "Leah Roy", role: "Group Ops Director", tag: "Champion", engaged: true, email: null, phone: null, linkedinUrl: null },
      { name: "Owen Pryce", role: "Finance Director", tag: "Finance", engaged: false, email: null, phone: null, linkedinUrl: null },
      { name: "Mia Chen", role: "Head of Estates", tag: "Procurement", engaged: false, email: null, phone: null, linkedinUrl: null },
    ],
    nba: [
      { tag: "Warm champion", meta: "easy entry", title: "Reach Leah — she rolled out sunday at her last group", detail: "Leah joined from Honest Burgers, a happy sunday client. She's a ready-made internal champion across 30 venues — a short, personal note referencing her experience opens the door fast.", cta: "Draft warm intro" },
    ],
    timeline: [
      { type: "decision", text: "Leah Roy appointed Group Ops Director (ex-Honest Burgers)", time: "1 week ago" },
      { type: "expansion", text: "Group opened 4 new sites in the South West", time: "3 weeks ago" },
    ],
    signalCards: [],
    signals: ["New Group Ops Director already knows the product", "30 venues, coffee = high transaction volume", "No enterprise incumbent detected"],
  },
  {
    id: "anc", name: "Anchor Inns", sub: "Managed pub group · 85 venues", city: "Leeds",
    sites: 85, score: 71, tier: "Watch", stage: "Qualification", stageIndex: 0, arrK: 380,
    cycleNote: "Board-led · 7 days in stage · deal age 1 mo",
    reason: "Group-wide review scores declining; board has flagged it", reasonIcon: "star",
    nextAction: "Lead with a group reputation-recovery programme",
    daysInStage: 7, daysSinceLastActivity: 4,
    committee: [
      { name: "James Holt", role: "Estates & Ops Director", tag: "Champion", engaged: false, email: null, phone: null, linkedinUrl: null },
      { name: "Rachel Dunn", role: "Group Finance Director", tag: "Finance", engaged: false, email: null, phone: null, linkedinUrl: null },
      { name: "Paul Iverson", role: "Chief Executive", tag: "Economic buyer", engaged: false, email: null, phone: null, linkedinUrl: null },
    ],
    nba: [
      { tag: "Board pressure", meta: "exec-level hook", title: "Pitch a group reputation-recovery programme", detail: "Review scores are declining across 85 sites and the board has flagged it. sunday's 1-tap review flow is the exact fix at scale — frame it as an exec-level programme, not a payments swap.", cta: "Draft exec brief" },
    ],
    timeline: [
      { type: "reviews", text: "Group Google average dropped across the estate", time: "This week" },
      { type: "press", text: "Trade press noted declining guest sentiment", time: "2 weeks ago" },
    ],
    signalCards: [],
    signals: ["Board-level pressure on reputation", "£380k across 85 managed sites", "No committee member engaged yet — greenfield"],
  },
];

export const MOCK_FEED: FeedItem[] = [
  { id: "f0", type: "stall", accountId: "grf", isAI: true, primary: "Re-engage now", time: "Flagged today",
    title: "GreenFork Collective has gone quiet — 18 days with no committee activity",
    body: "Your biggest live deal (£540k) is stalling in Discovery and the new CFO never replied. The agent can draft a multi-stakeholder re-engagement." },
  { id: "f1", type: "ai", accountId: "cop", isAI: true, primary: "Draft the case", time: "Just now",
    title: "Copper & Co. master renewal is 45 days out — and 9 sites are still on a legacy provider",
    body: "Your agent suggests sending the group renewal + migration business case now to protect £310k and unlock +£120k. The CFO isn't engaged yet." },
  { id: "f2", type: "rfp", accountId: "non", time: "32 min ago",
    title: "Nonna Holdings issued a group-wide RFP for payments across 41 sites",
    body: "Procurement is running the evaluation. Deadline 18 Jul — a peer-group reference will matter." },
  { id: "f3", type: "competitor", accountId: "har", time: "1 h ago",
    title: "SumUp's incumbent contract at Harbour Group ends this quarter",
    body: "A £180k displacement window is opening. Sophie (champion) wants stronger reputation tooling." },
  { id: "f4", type: "funding", accountId: "grf", time: "3 h ago",
    title: "GreenFork Collective raised a £22M Series B — and appointed a new CFO",
    body: "60 venues and a fresh budget cycle. New CFO Nadia Khan joined from Leon two weeks ago." },
  { id: "f5", type: "decision", accountId: "lum", time: "Yesterday",
    title: "Lumen Coffee Group appointed a new Group Ops Director",
    body: "Leah Roy comes from Honest Burgers, a sunday client — a ready-made champion across 30 sites." },
  { id: "f6", type: "reviews", accountId: "anc", time: "Yesterday",
    title: "Anchor Inns' group review scores are declining — the board has flagged it",
    body: "85 managed sites, exec-level attention. A clear opening for a reputation-recovery programme." },
  { id: "f7", type: "expansion", accountId: "cop", time: "2 days ago",
    title: "Copper & Co. announced 6 new sites for 2026",
    body: "Expansion strengthens the renewal-and-grow case. Reference it in the business case." },
  { id: "f8", type: "press", accountId: "grf", time: "3 days ago",
    title: "GreenFork featured in The Caterer's 'fast-casual groups to watch'",
    body: "Extra proof the group is scaling fast. Useful air-cover for your CFO outreach." },
];

// id matches an Account id when book:true — MARKET has no signals, just the TAM landscape.
export const MOCK_MARKET: MarketGroup[] = [
  { id: "cop", name: "Copper & Co. Group", cat: "Gastropub", region: "London", sites: 24, arrK: 310, icp: "High", score: 94, book: true, ...geo("cop", "london"),
    fit: ["24 table-service venues — core ICP", "Group ops team + procurement in place", "Actively expanding (6 sites in 2026)"] },
  { id: "non", name: "Nonna Holdings", cat: "European", region: "North West", sites: 41, arrK: 420, icp: "High", score: 90, book: true, ...geo("non", "manchester"),
    fit: ["41 sites, high covers per venue", "Central group finance function", "Running a formal payments RFP"] },
  { id: "grf", name: "GreenFork Collective", cat: "Premium Counter Service", region: "London", sites: 60, arrK: 540, icp: "High", score: 82, book: true, ...geo("grf", "london"),
    fit: ["60 venues — top-decile group size", "VC-backed, fresh budget cycle", "New CFO = evaluation window"] },
  { id: "anc", name: "Anchor Inns", cat: "Wet & Dry", region: "Yorkshire", sites: 85, arrK: 380, icp: "Medium", score: 71, book: true, ...geo("anc", "leeds"),
    fit: ["85 managed sites — large estate", "Reputation pain at board level", "Mixed wet/dry — longer integration"] },
  { id: "har", name: "Harbour Restaurant Group", cat: "Gourmet Dining", region: "South East", sites: 12, arrK: 180, icp: "Medium", score: 86, book: true, ...geo("har", "brighton"),
    fit: ["12 premium venues, high ticket", "Incumbent contract ending", "Smaller estate than core ICP"] },
  { id: "lum", name: "Lumen Coffee Group", cat: "Brunch / Breakfast", region: "South West", sites: 30, arrK: 240, icp: "Medium", score: 77, book: true, ...geo("lum", "bristol"),
    fit: ["30 sites, very high volume", "Fast decision cycle", "Lower ARR per site (coffee)"] },

  { id: "m01", name: "Metropolitan Grills", cat: "American", region: "London", sites: 18, arrK: 290, icp: "High", score: 90, book: false, ...geo("m01", "london"),
    fit: ["18 high-ticket steakhouses", "Premium guest base, strong tips upside", "Central ops & finance team"] },
  { id: "m02", name: "Spice Route Group", cat: "Indian", region: "East Midlands", sites: 26, arrK: 250, icp: "High", score: 84, book: false, ...geo("m02", "nottingham"),
    fit: ["26 table-service venues", "Growing 20% YoY", "No enterprise incumbent"] },
  { id: "m03", name: "Oakwood Hotels F&B", cat: "Premium Hotel", region: "South West", sites: 22, arrK: 300, icp: "High", score: 86, book: false, ...geo("m03", "bristol"),
    fit: ["Hotel restaurants + bars, high covers", "Group F&B director owns decision", "Payments fragmented across sites"] },
  { id: "m04", name: "Highland Taverns", cat: "Managed", region: "Scotland", sites: 34, arrK: 280, icp: "High", score: 82, book: false, ...geo("m04", "glasgow"),
    fit: ["34 managed pubs across Scotland", "Central procurement", "Seasonal tourist volume"] },
  { id: "m05", name: "Alba Fine Dining", cat: "Michelin Guide & 1*", region: "Scotland", sites: 9, arrK: 170, icp: "High", score: 80, book: false, ...geo("m05", "edinburgh"),
    fit: ["9 fine-dining rooms, very high ticket", "Reputation-led — reviews matter", "Small but premium estate"] },
  { id: "m06", name: "Brasseria Group", cat: "European", region: "West Midlands", sites: 20, arrK: 230, icp: "High", score: 88, book: false, ...geo("m06", "birmingham"),
    fit: ["20 brasseries, family-owned", "Consolidating suppliers now", "Ready for a group rollout"] },
  { id: "m07", name: "Verde Plant Kitchen", cat: "Vegan / Vegetarian", region: "South West", sites: 15, arrK: 160, icp: "Medium", score: 71, book: false, ...geo("m07", "bristol"),
    fit: ["15 plant-based fast-casual", "Younger, digital-first guests", "Lower average spend"] },
  { id: "m08", name: "Toro Tapas", cat: "European", region: "London", sites: 14, arrK: 190, icp: "Medium", score: 72, book: false, ...geo("m08", "london"),
    fit: ["14 tapas bars, shared-plate model", "High table turnover", "Owner-led decisions — slower"] },
  { id: "m09", name: "Dragon Dining", cat: "Gastropub", region: "Wales", sites: 17, arrK: 150, icp: "Medium", score: 66, book: false, ...geo("m09", "cardiff"),
    fit: ["17 gastropubs across Wales", "Regional brand strength", "Thinner group ops layer"] },
  { id: "m10", name: "Clyde & Sons", cat: "American", region: "Scotland", sites: 11, arrK: 160, icp: "Medium", score: 70, book: false, ...geo("m10", "glasgow"),
    fit: ["11 premium grills", "High ticket, strong tips upside", "Compact estate"] },
  { id: "m11", name: "Mersey Kitchen Co.", cat: "Fast Food", region: "North West", sites: 16, arrK: 150, icp: "Medium", score: 68, book: false, ...geo("m11", "liverpool"),
    fit: ["16 fast-casual sites", "Value positioning", "Price-sensitive buyer"] },
  { id: "m12", name: "Coastline Fish Co.", cat: "Other World Foods", region: "South West", sites: 13, arrK: 140, icp: "Medium", score: 64, book: false, ...geo("m12", "bristol"),
    fit: ["13 coastal seafood venues", "Seasonal peaks", "Dispersed geography"] },
  { id: "m13", name: "Harborne Pub Co.", cat: "Wet Only", region: "West Midlands", sites: 19, arrK: 170, icp: "Medium", score: 67, book: false, ...geo("m13", "birmingham"),
    fit: ["19 managed pubs", "Wet-led, some food", "Longer payback"] },
  { id: "m14", name: "The Grind House", cat: "Grab & Go", region: "London", sites: 21, arrK: 150, icp: "Medium", score: 74, book: false, ...geo("m14", "london"),
    fit: ["21 coffee sites, very high volume", "Fast cycle", "Lower ARR per site"] },
  { id: "m15", name: "Tyne Social", cat: "Cocktail Bar", region: "North East", sites: 12, arrK: 120, icp: "Low", score: 55, book: false, ...geo("m15", "newcastle"),
    fit: ["12 late-night bars", "Payments less table-centric", "Weak ICP fit for pay-at-table"] },
  { id: "m16", name: "Patty & Bun Collective", cat: "Fast Food", region: "North West", sites: 10, arrK: 90, icp: "Low", score: 58, book: false, ...geo("m16", "manchester"),
    fit: ["10 counter-service burger sites", "QSR model — limited table pay", "Smaller estate"] },
  { id: "m17", name: "The Bakehouse Group", cat: "Grab & Go", region: "Yorkshire", sites: 14, arrK: 80, icp: "Low", score: 52, book: false, ...geo("m17", "leeds"),
    fit: ["14 bakery cafés", "Grab-and-go dominant", "Low fit for core product"] },
  { id: "m18", name: "Northern Roast", cat: "Grab & Go", region: "Yorkshire", sites: 9, arrK: 70, icp: "Low", score: 54, book: false, ...geo("m18", "leeds"),
    fit: ["9 coffee shops", "Small, counter-service", "Below target estate size"] },
];

export const MOCK_QUESTS: Quest[] = [
  { key: "q1", label: "Advance 2 key accounts", target: 2, xp: 120, progress: 0 },
  { key: "q2", label: "Log an activity today", target: 1, xp: 60, progress: 0 },
  { key: "q3", label: "Follow a target group", target: 1, xp: 80, progress: 0 },
];

export const MOCK_ME = {
  repName: "Alex Carter",
  region: "London",
  xp: 1240,
  streak: 9,
  quests: MOCK_QUESTS,
  quota: { current: 420_000, target: 600_000, period: "quarter" as const },
};

function daysFromNow(offset: number): string {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return d.toISOString().slice(0, 10);
}

const today = daysFromNow(0);

export const MOCK_TASKS: Task[] = [
  { id: "t1", accountId: "cop", accountName: "Copper & Co. Group", type: "ai", subject: "Send the group renewal + 9-site migration case", status: "Open", dueDate: daysFromNow(-3), isOverdue: true, isToday: false },
  { id: "t2", accountId: "har", accountName: "Harbour Restaurant Group", subject: "Call Sophie Reed re: switch case timeline", type: "competitor", status: "Open", dueDate: daysFromNow(-1), isOverdue: true, isToday: false },
  { id: "t3", accountId: "non", accountName: "Nonna Holdings", subject: "Submit RFP response with peer-group reference", type: "rfp", status: "Open", dueDate: today, isOverdue: false, isToday: true },
  { id: "t4", accountId: "cop", accountName: "Copper & Co. Group", subject: "Follow up with David Cole (CFO) — still unengaged", type: "decision", status: "Open", dueDate: today, isOverdue: false, isToday: true },
  { id: "t5", accountId: "non", accountName: "Nonna Holdings", subject: "Prep reference call with comparable 40+ site group", type: "decision", status: "Planned", dueDate: daysFromNow(2), isOverdue: false, isToday: false },
  { id: "t6", accountId: "har", accountName: "Harbour Restaurant Group", subject: "Quantify review uplift for the MD business case", type: "reviews", status: "Planned", dueDate: daysFromNow(4), isOverdue: false, isToday: false },
  { id: "t7", accountId: "cop", accountName: "Copper & Co. Group", subject: "Agent flagged renewal risk — reviewed with Priya", type: "ai", status: "Completed", dueDate: daysFromNow(-1), isOverdue: false, isToday: false },
  { id: "t8", accountId: "non", accountName: "Nonna Holdings", subject: "Procurement issued a formal RFP for group payments", type: "rfp", status: "Completed", dueDate: daysFromNow(-2), isOverdue: false, isToday: false },
  { id: "t9", accountId: "har", accountName: "Harbour Restaurant Group", subject: "SumUp (incumbent) contract confirmed ending Q3", type: "competitor", status: "Completed", dueDate: daysFromNow(-5), isOverdue: false, isToday: false },
];
