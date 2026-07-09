import { useMemo, useState } from "react";
import { MapContainer, TileLayer, CircleMarker, Tooltip } from "react-leaflet";
import { Icon } from "../lib/icons";
import { ICP_META } from "../lib/icp";
import { arr } from "../lib/format";
import { useAppState } from "../state/AppState";
import { useNav } from "../state/nav";

type Mode = "map" | "list";

// Great Britain, roughly centered — good default view for a UK TAM map.
const UK_CENTER: [number, number] = [54.4, -3.2];

export function Market() {
  const { market, accounts, addToBook } = useAppState();
  const nav = useNav();
  const [mode, setMode] = useState<Mode>("map");
  const [category, setCategory] = useState<string>("All");

  const categories = useMemo(() => ["All", ...Array.from(new Set(market.map((g) => g.cat)))], [market]);

  const filtered = useMemo(
    () => market.filter((g) => (category === "All" ? true : g.cat === category)).sort((a, b) => b.score - a.score),
    [market, category],
  );

  const totalArrM = (market.reduce((s, g) => s + g.arrK, 0) / 1000).toFixed(1);
  const highIcp = market.filter((g) => g.icp === "High").length;
  const inBook = market.filter((g) => g.book).length;

  const stats = [
    { label: "Groups in TAM", value: String(market.length) },
    { label: "Total addressable ARR", value: `£${totalArrM}M` },
    { label: "High ICP fit", value: String(highIcp) },
    { label: "In your book", value: String(inBook) },
  ];

  const openDetail = (id: string) => nav.openMarketDetail(id);

  const handleAdd = (id: string, name: string) => {
    void addToBook(id, name);
  };

  return (
    <div style={{ maxWidth: 1180, margin: "0 auto", padding: "26px 32px 56px" }}>
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 20, marginBottom: 20 }}>
        <div>
          <div style={{ fontFamily: "var(--font-display)", fontSize: 30, fontWeight: 500, letterSpacing: "-0.03em", color: "var(--ink-950)" }}>Market · TAM</div>
          <div style={{ fontSize: 14.5, color: "var(--text-secondary)", marginTop: 2 }}>
            Every UK restaurant group in your addressable market. No signals here — just the landscape.
          </div>
        </div>
        <div style={{ display: "flex", gap: 4, background: "var(--ink-50)", borderRadius: "var(--radius-pill)", padding: 4, flex: "0 0 auto" }}>
          {(["map", "list"] as Mode[]).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              style={{
                display: "flex", alignItems: "center", gap: 6, border: "none", cursor: "pointer",
                background: mode === m ? "var(--ink-950)" : "#fff", color: mode === m ? "#fff" : "var(--ink-700)",
                fontFamily: "var(--font-body)", fontSize: 13, fontWeight: 500, borderRadius: "var(--radius-pill)", padding: "7px 14px",
              }}
            >
              <Icon name={m === "map" ? "map" : "list"} size={15} color={mode === m ? "#fff" : "var(--ink-700)"} />
              {m === "map" ? "Map" : "List"}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 1, background: "var(--ink-100)", border: "1px solid var(--ink-100)", borderRadius: 12, overflow: "hidden", marginBottom: 22 }}>
        {stats.map((s) => (
          <div key={s.label} style={{ background: "var(--white)", padding: "14px 18px" }}>
            <div style={{ fontSize: 11.5, color: "var(--ink-400)", textTransform: "uppercase", letterSpacing: "0.04em", fontWeight: 600 }}>{s.label}</div>
            <div style={{ fontFamily: "var(--font-display)", fontSize: 22, fontWeight: 600, color: "var(--ink-950)", marginTop: 3, letterSpacing: "-0.02em" }}>{s.value}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 7, flexWrap: "wrap", marginBottom: 18 }}>
        {categories.map((c) => (
          <button
            key={c}
            onClick={() => setCategory(c)}
            style={{
              border: `1px solid ${category === c ? "var(--ink-950)" : "var(--border-subtle)"}`,
              background: category === c ? "var(--ink-950)" : "#fff",
              color: category === c ? "#fff" : "var(--ink-700)",
              fontFamily: "var(--font-body)", fontSize: 12.5, fontWeight: 500, cursor: "pointer",
              borderRadius: "var(--radius-pill)", padding: "6px 13px",
            }}
          >
            {c}
          </button>
        ))}
      </div>

      {mode === "map" ? (
        <div style={{ display: "flex", gap: 20, alignItems: "stretch" }}>
          <div style={{ flex: 1.15, background: "var(--white)", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-lg)", boxShadow: "var(--shadow-sm)", padding: 14, position: "relative", minHeight: 520 }}>
            <div style={{ position: "absolute", top: 28, right: 28, display: "flex", flexDirection: "column", gap: 7, zIndex: 1000 }}>
              {(["High", "Medium", "Low"] as const).map((k) => (
                <div key={k} style={{ display: "flex", alignItems: "center", gap: 7, background: "rgba(255,255,255,.85)", borderRadius: 999, padding: "3px 9px" }}>
                  <span style={{ width: 9, height: 9, borderRadius: "50%", background: ICP_META[k].dot }} />
                  <span style={{ fontSize: 11.5, color: "var(--ink-700)", fontWeight: 500 }}>{k === "High" ? "High ICP fit" : k}</span>
                </div>
              ))}
            </div>
            <MapContainer center={UK_CENTER} zoom={6} style={{ width: "100%", height: 500, borderRadius: "var(--radius-lg)" }} scrollWheelZoom={false}>
              <TileLayer
                url="https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
              />
              {filtered.map((g) => (
                <CircleMarker
                  key={g.id}
                  center={[g.lat, g.lng]}
                  radius={6 + Math.round(g.score / 12)}
                  pathOptions={{
                    fillColor: ICP_META[g.icp].dot,
                    fillOpacity: 0.9,
                    color: g.book ? "#14141A" : "#fff",
                    weight: g.book ? 2 : 1.5,
                  }}
                  eventHandlers={{ click: () => openDetail(g.id) }}
                >
                  <Tooltip direction="top" offset={[0, -4]}>
                    {g.name} · {g.icp} ICP · {arr(g.arrK)}
                  </Tooltip>
                </CircleMarker>
              ))}
            </MapContainer>
          </div>
          <div style={{ flex: 1, minWidth: 300, display: "flex", flexDirection: "column" }}>
            <div style={{ fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em", color: "var(--ink-400)", marginBottom: 10 }}>
              Ranked by prospect score
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, overflowY: "auto", maxHeight: 520, paddingRight: 4 }}>
              {filtered.map((g) => (
                <div
                  key={g.id}
                  className="row-hover"
                  onClick={() => openDetail(g.id)}
                  style={{ display: "flex", alignItems: "center", gap: 11, background: "var(--white)", border: "1px solid var(--border-subtle)", borderRadius: 12, padding: "11px 13px", cursor: "pointer" }}
                >
                  <span style={{ width: 9, height: 9, flex: "0 0 auto", borderRadius: "50%", background: ICP_META[g.icp].dot }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13.5, fontWeight: 500, color: "var(--ink-950)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{g.name}</div>
                    <div style={{ fontSize: 11.5, color: "var(--ink-400)" }}>{g.cat} · {g.region} · {g.sites} sites</div>
                  </div>
                  <div style={{ textAlign: "right", flex: "0 0 auto" }}>
                    <div style={{ fontFamily: "var(--font-display)", fontSize: 15, fontWeight: 600, color: "var(--ink-950)", lineHeight: 1 }}>{g.score}</div>
                    <div style={{ fontSize: 10.5, color: "var(--ink-400)" }}>{arr(g.arrK)}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 14 }}>
          {filtered.map((g) => {
            const icp = ICP_META[g.icp];
            const inBookAcct = accounts.some((a) => a.id === g.id);
            return (
              <div key={g.id} className="lift" style={{ background: "var(--white)", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-lg)", padding: 18, boxShadow: "var(--shadow-sm)", display: "flex", flexDirection: "column" }}>
                <div onClick={() => openDetail(g.id)} style={{ cursor: "pointer", flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 11, marginBottom: 12 }}>
                    <span style={{ width: 40, height: 40, flex: "0 0 auto", borderRadius: 11, background: "var(--ink-100)", color: "var(--ink-700)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--font-display)", fontSize: 14, fontWeight: 600 }}>
                      {g.name.replace(/[^A-Za-z ]/g, "").split(/\s+/).filter(Boolean).map((w) => w[0]).slice(0, 2).join("").toUpperCase()}
                    </span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14.5, fontWeight: 500, letterSpacing: "-0.01em", color: "var(--ink-950)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{g.name}</div>
                      <div style={{ fontSize: 12, color: "var(--ink-400)" }}>{g.region} · {g.sites} sites</div>
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 12, flexWrap: "wrap" }}>
                    <span style={{ fontSize: 11.5, fontWeight: 500, color: "var(--ink-700)", background: "var(--ink-50)", borderRadius: 999, padding: "3px 10px" }}>{g.cat}</span>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 11, fontWeight: 600, color: icp.color, background: icp.bg, borderRadius: 999, padding: "3px 10px" }}>
                      <span style={{ width: 6, height: 6, borderRadius: "50%", background: icp.dot }} />{g.icp} fit
                    </span>
                  </div>
                  <div style={{ display: "flex", gap: 1, background: "var(--ink-100)", border: "1px solid var(--ink-100)", borderRadius: 10, overflow: "hidden", marginBottom: 14 }}>
                    <div style={{ flex: 1, background: "var(--white)", padding: "9px 12px" }}>
                      <div style={{ fontSize: 10.5, color: "var(--ink-400)", textTransform: "uppercase", letterSpacing: "0.03em", fontWeight: 600 }}>Score</div>
                      <div style={{ fontFamily: "var(--font-display)", fontSize: 17, fontWeight: 600, color: "var(--ink-950)", letterSpacing: "-0.02em" }}>{g.score}</div>
                    </div>
                    <div style={{ flex: 1, background: "var(--white)", padding: "9px 12px" }}>
                      <div style={{ fontSize: 10.5, color: "var(--ink-400)", textTransform: "uppercase", letterSpacing: "0.03em", fontWeight: 600 }}>Est. ARR</div>
                      <div style={{ fontFamily: "var(--font-display)", fontSize: 17, fontWeight: 600, color: "var(--ink-950)", letterSpacing: "-0.02em" }}>{arr(g.arrK)}</div>
                    </div>
                  </div>
                </div>
                {g.book || inBookAcct ? (
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, border: "1px solid var(--pink-100)", background: "var(--pink-50)", color: "var(--pink-700)", fontFamily: "var(--font-body)", fontSize: 12.5, fontWeight: 600, borderRadius: "var(--radius-pill)", padding: "8px 0" }}>
                    <Icon name="check" size={14} color="var(--pink-700)" />
                    In your book
                  </div>
                ) : (
                  <button
                    onClick={() => handleAdd(g.id, g.name)}
                    style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 7, border: "none", cursor: "pointer", background: "var(--ink-950)", color: "#fff", fontFamily: "var(--font-body)", fontSize: 12.5, fontWeight: 600, borderRadius: "var(--radius-pill)", padding: "9px 0" }}
                  >
                    <Icon name="plus" size={14} color="#fff" />
                    Add to my accounts
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
