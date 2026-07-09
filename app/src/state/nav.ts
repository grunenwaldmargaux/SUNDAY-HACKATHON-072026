import { createContext, useContext } from "react";

export type View = "home" | "pipeline" | "account" | "market" | "mktdetail" | "tasks";

export type NavState = {
  view: View;
  acctId: string | null;
  marketId: string | null;
  go: (view: View, id?: string) => void;
  openAccount: (id: string) => void;
  openMarketDetail: (id: string) => void;
  backToMarket: () => void;
};

export const NavContext = createContext<NavState | null>(null);

export function useNav() {
  const ctx = useContext(NavContext);
  if (!ctx) throw new Error("useNav must be used within NavContext.Provider");
  return ctx;
}
