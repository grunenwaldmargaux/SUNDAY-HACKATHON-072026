import type { Account, FeedItem, Me, MarketGroup, Task } from "../../types";

// Every screen reads exclusively through this interface — components never touch
// mock data or Supabase directly. "Book" membership (My accounts) is simply which
// Account records getAccounts() returns; per-rep UI state (tracking, dismissed
// feed cards, XP/quests) is NOT part of this contract — see lib/localState.ts.
export interface DataSource {
  getMe(): Promise<Me>;
  getFeed(): Promise<FeedItem[]>;
  getAccounts(): Promise<Account[]>;
  getAccount(id: string): Promise<Account | undefined>;
  getMarket(): Promise<MarketGroup[]>;
  getMarketGroup(id: string): Promise<MarketGroup | undefined>;
  // The rep's own open + recently-completed tasks, across every account they
  // own — not scoped to the top_account set getAccounts() returns.
  getTasks(): Promise<Task[]>;
  // Adds a market prospect to the rep's book. If no full Account exists yet for
  // this id, the source creates a minimal placeholder (score/sites/ARR carried
  // over, committee/timeline/signals empty) so it shows up in My accounts
  // immediately — mirrors "should create/flag Salesforce record ownership" from
  // DATA_CONTRACTS.md.
  addToBook(marketGroupId: string): Promise<Account>;
}
