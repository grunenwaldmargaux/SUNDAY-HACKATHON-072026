import { useState } from "react";
import { AppStateProvider } from "./state/AppState";
import { NavContext, type View } from "./state/nav";
import { Sidebar } from "./components/Sidebar";
import { Topbar } from "./components/Topbar";
import { Toast } from "./components/Toast";
import { Confetti } from "./components/Confetti";
import { Feed } from "./pages/Feed";
import { Pipeline } from "./pages/Pipeline";
import { AccountDetail } from "./pages/AccountDetail";
import { Market } from "./pages/Market";
import { MarketDetail } from "./pages/MarketDetail";

function Screens() {
  const [view, setView] = useState<View>("home");
  const [acctId, setAcctId] = useState<string | null>(null);
  const [marketId, setMarketId] = useState<string | null>(null);

  const nav = {
    view,
    acctId,
    marketId,
    go: (v: View, id?: string) => {
      setView(v);
      if (id !== undefined) setAcctId(id);
    },
    openAccount: (id: string) => {
      setAcctId(id);
      setView("account");
    },
    openMarketDetail: (id: string) => {
      setMarketId(id);
      setView("mktdetail");
    },
    backToMarket: () => setView("market"),
  };

  return (
    <NavContext.Provider value={nav}>
      <div style={{ display: "flex", height: "100vh", width: "100%", overflow: "hidden", background: "var(--surface-sunken)" }}>
        <Sidebar />
        <main style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          <Topbar />
          <div style={{ flex: 1, overflowY: "auto" }}>
            {view === "home" && <Feed />}
            {view === "pipeline" && <Pipeline />}
            {view === "account" && <AccountDetail />}
            {view === "market" && <Market />}
            {view === "mktdetail" && <MarketDetail />}
          </div>
        </main>
      </div>
      <Confetti />
      <Toast />
    </NavContext.Provider>
  );
}

export default function App() {
  return (
    <AppStateProvider>
      <Screens />
    </AppStateProvider>
  );
}
