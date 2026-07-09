import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { dataSource } from "../data/source";
import type { Account, FeedItem, Me, MarketGroup } from "../types";
import { levelFor, nextLevel, QUEST_DEFS, type QuestKey } from "../lib/gamification";

type QuestProgress = Record<string, number>;

const STORAGE_KEY = "sunday-signal:local-state";

type PersistedState = {
  xp: number;
  streak: number;
  quests: QuestProgress;
  following: Record<string, boolean>;
  dismissed: Record<string, boolean>;
};

function loadPersisted(): PersistedState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // ignore corrupt storage
  }
  return { xp: 1240, streak: 9, quests: {}, following: {}, dismissed: {} };
}

type ToastState = { message: string; icon: string } | null;

type AppStateValue = {
  loading: boolean;
  me: Me | null;
  accounts: Account[];
  feed: FeedItem[];
  market: MarketGroup[];
  refreshAccounts: () => Promise<void>;
  refreshMarket: () => Promise<void>;

  xp: number;
  level: ReturnType<typeof levelFor>;
  levelPct: number;
  xpNextLabel: string;
  streak: number;
  quests: Array<(typeof QUEST_DEFS)[number] & { progress: number; done: boolean }>;
  questsDone: number;

  following: Record<string, boolean>;
  dismissed: Record<string, boolean>;
  isFollowing: (id: string) => boolean;
  toggleFollow: (id: string, name: string) => void;
  dismissFeedItem: (id: string) => void;
  addXp: (amount: number, reason: string, icon?: string) => void;
  progressQuest: (key: QuestKey) => void;
  addToBook: (marketGroupId: string, name: string) => Promise<void>;
  say: (message: string, icon?: string) => void;

  toast: ToastState;
  confetti: boolean;
};

const AppStateContext = createContext<AppStateValue | null>(null);

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [me, setMe] = useState<Me | null>(null);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [feed, setFeed] = useState<FeedItem[]>([]);
  const [market, setMarket] = useState<MarketGroup[]>([]);

  const [persisted, setPersisted] = useState<PersistedState>(loadPersisted);
  const [toast, setToast] = useState<ToastState>(null);
  const [confetti, setConfetti] = useState(false);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const confettiTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(persisted));
  }, [persisted]);

  const refreshAccounts = useCallback(async () => {
    setAccounts(await dataSource.getAccounts());
  }, []);
  const refreshMarket = useCallback(async () => {
    setMarket(await dataSource.getMarket());
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [meData, feedData, accountsData, marketData] = await Promise.all([
        dataSource.getMe(),
        dataSource.getFeed(),
        dataSource.getAccounts(),
        dataSource.getMarket(),
      ]);
      if (cancelled) return;
      setMe(meData);
      setFeed(feedData);
      setAccounts(accountsData);
      setMarket(marketData);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const say = useCallback((message: string, icon = "check") => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ message, icon });
    toastTimer.current = setTimeout(() => setToast(null), 2600);
  }, []);

  const celebrate = useCallback(() => {
    setConfetti(false);
    if (confettiTimer.current) clearTimeout(confettiTimer.current);
    setTimeout(() => setConfetti(true), 20);
    confettiTimer.current = setTimeout(() => setConfetti(false), 2200);
  }, []);

  const addXp = useCallback(
    (amount: number, reason: string, icon = "zap") => {
      setPersisted((prev) => {
        const before = levelFor(prev.xp).lv;
        const xp = prev.xp + amount;
        const after = levelFor(xp).lv;
        if (after > before) {
          const t = levelFor(xp);
          say(`Level up! You're now Level ${t.lv} · ${t.title}`, "trophy");
          celebrate();
        } else {
          say(`+${amount} XP · ${reason}`, icon);
        }
        return { ...prev, xp };
      });
    },
    [say, celebrate],
  );

  const progressQuest = useCallback(
    (key: QuestKey) => {
      const def = QUEST_DEFS.find((q) => q.key === key);
      if (!def) return;
      setPersisted((prev) => {
        const cur = prev.quests[key] ?? 0;
        if (cur >= def.target) return prev;
        const next = cur + 1;
        if (next >= def.target) {
          setTimeout(() => {
            addXp(def.xp, `Quest complete · ${def.label}`, "trophy");
            celebrate();
          }, 0);
        }
        return { ...prev, quests: { ...prev.quests, [key]: next } };
      });
    },
    [addXp, celebrate],
  );

  const toggleFollow = useCallback(
    (id: string, name: string) => {
      setPersisted((prev) => {
        const on = !prev.following[id];
        if (on) {
          setTimeout(() => {
            addXp(40, `Tracking ${name}`, "star");
            progressQuest("q3");
          }, 0);
        } else {
          setTimeout(() => say(`Stopped tracking ${name}`, "star"), 0);
        }
        return { ...prev, following: { ...prev.following, [id]: on } };
      });
    },
    [addXp, progressQuest, say],
  );

  const dismissFeedItem = useCallback((id: string) => {
    setPersisted((prev) => ({ ...prev, dismissed: { ...prev.dismissed, [id]: true } }));
  }, []);

  const addToBook = useCallback(
    async (marketGroupId: string, name: string) => {
      const alreadyBooked = market.find((g) => g.id === marketGroupId)?.book;
      if (alreadyBooked) {
        say(`${name} is already in your book`, "check");
        return;
      }
      const account = await dataSource.addToBook(marketGroupId);
      setMarket((prev) => prev.map((g) => (g.id === marketGroupId ? { ...g, book: true } : g)));
      setAccounts((prev) => (prev.some((a) => a.id === account.id) ? prev : [...prev, account]));
      addXp(80, `Added ${name} to your book`, "user-plus");
      progressQuest("q3");
    },
    [market, addXp, progressQuest, say],
  );

  const xp = persisted.xp;
  const level = levelFor(xp);
  const next = nextLevel(xp);
  const levelPct = next ? Math.round(((xp - level.min) / (next.min - level.min)) * 100) : 100;
  const xpNextLabel = next ? `${next.min} XP · ${next.title}` : "Max level";

  const quests = QUEST_DEFS.map((q) => {
    const progress = Math.min(persisted.quests[q.key] ?? 0, q.target);
    return { ...q, progress, done: progress >= q.target };
  });
  const questsDone = quests.filter((q) => q.done).length;

  const value = useMemo<AppStateValue>(
    () => ({
      loading,
      me,
      accounts,
      feed,
      market,
      refreshAccounts,
      refreshMarket,
      xp,
      level,
      levelPct,
      xpNextLabel,
      streak: persisted.streak,
      quests,
      questsDone,
      following: persisted.following,
      dismissed: persisted.dismissed,
      isFollowing: (id: string) => !!persisted.following[id],
      toggleFollow,
      dismissFeedItem,
      addXp,
      progressQuest,
      addToBook,
      say,
      toast,
      confetti,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [loading, me, accounts, feed, market, persisted, toast, confetti],
  );

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}

export function useAppState() {
  const ctx = useContext(AppStateContext);
  if (!ctx) throw new Error("useAppState must be used within AppStateProvider");
  return ctx;
}
