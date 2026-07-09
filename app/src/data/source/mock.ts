import type { Account, FeedItem, Me, MarketGroup, Task } from "../../types";
import type { DataSource } from "./types";
import { MOCK_ACCOUNTS, MOCK_FEED, MOCK_MARKET, MOCK_ME, MOCK_TASKS } from "./mockData";

function delay<T>(value: T, ms = 120): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

export class MockDataSource implements DataSource {
  private accounts: Account[] = MOCK_ACCOUNTS.map((a) => ({ ...a }));
  private market: MarketGroup[] = MOCK_MARKET.map((g) => ({ ...g }));

  async getMe(): Promise<Me> {
    return delay({ ...MOCK_ME, quests: MOCK_ME.quests.map((q) => ({ ...q })) });
  }

  async getFeed(): Promise<FeedItem[]> {
    return delay(MOCK_FEED.map((f) => ({ ...f })));
  }

  async getAccounts(): Promise<Account[]> {
    return delay(this.accounts.map((a) => ({ ...a })));
  }

  async getAccount(id: string): Promise<Account | undefined> {
    const found = this.accounts.find((a) => a.id === id);
    return delay(found ? { ...found } : undefined);
  }

  async getMarket(): Promise<MarketGroup[]> {
    return delay(this.market.map((g) => ({ ...g })));
  }

  async getMarketGroup(id: string): Promise<MarketGroup | undefined> {
    const found = this.market.find((g) => g.id === id);
    return delay(found ? { ...found } : undefined);
  }

  async getTasks(): Promise<Task[]> {
    return delay(MOCK_TASKS.map((t) => ({ ...t })));
  }

  async addToBook(marketGroupId: string): Promise<Account> {
    const group = this.market.find((g) => g.id === marketGroupId);
    if (!group) throw new Error(`Unknown market group: ${marketGroupId}`);
    group.book = true;

    const existing = this.accounts.find((a) => a.id === marketGroupId);
    if (existing) return { ...existing };

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
    this.accounts.push(placeholder);
    return { ...placeholder };
  }
}
