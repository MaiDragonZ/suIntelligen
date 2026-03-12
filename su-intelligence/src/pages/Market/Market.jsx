import { useState, useEffect } from "react";
import { TrendingUp, TrendingDown, RefreshCw, Activity } from "lucide-react";
import Navbar from "../../components/Navbar";
import Card   from "../../components/Card";
import { fetchAssets, fetchChart } from "../../services/marketService";
import { formatCurrency, formatPercent }  from "../../utils/format";
import "./Market.css";

function MiniLine({ data, up }) {
  const W = 72, H = 30;
  const vals = data.map(d => d.value);
  const max = Math.max(...vals), min = Math.min(...vals);
  const pts = vals.map((v, i) => {
    const x = (i / (vals.length - 1)) * W;
    const y = H - ((v - min) / ((max - min) || 1)) * (H - 4) - 2;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(" ");
  const color = up ? "#22c55e" : "#ef4444";
  return (
    <svg width={W} height={H}>
      <polyline points={`0,${H} ${pts} ${W},${H}`} fill={color} fillOpacity=".1" strokeWidth="0" />
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.8"
        strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

export default function Market() {
  const [assets, setAssets]     = useState([]);
  const [charts, setCharts]     = useState({});
  const [loading, setLoading]   = useState(true);
  const [selected, setSelected] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    const data = await fetchAssets();
    setAssets(data);
    // ดึง chart ทุก symbol พร้อมกัน
    const chartResults = await Promise.allSettled(
      data.map(a => fetchChart(a.symbol))
    );
    const ch = {};
    data.forEach((a, i) => {
      const r = chartResults[i];
      ch[a.symbol] = r.status === "fulfilled" ? r.value : [];
    });
    setCharts(ch);
    if (!selected) setSelected(data[0]?.symbol ?? null);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const refresh = async () => {
    setRefreshing(true);
    const data = await fetchAssets();
    setAssets(data);
    setRefreshing(false);
  };

  const selectedAsset = assets.find(a => a.symbol === selected);
  const selectedChart = charts[selected] ?? [];

  return (
    <div style={{ display:"flex", flexDirection:"column", height:"100%" }}>
      <Navbar title="Market" subtitle="Live asset data">
        <button className="btn btn-ghost" onClick={refresh}>
          <RefreshCw size={12} className={refreshing ? "spin-anim" : ""} /> Refresh
        </button>
        <button className="btn btn-primary">
          <TrendingUp size={12} /> Trade
        </button>
      </Navbar>

      <div className="page">
        <div style={{ display:"grid", gridTemplateColumns:"1fr 340px", gap:16, flex:1 }}>

          {/* Asset table */}
          <div style={{ display:"flex", flexDirection:"column", gap:16 }}>

            {/* Selected chart */}
            {selectedAsset && (
              <Card
                title={`${selectedAsset.name} (${selectedAsset.symbol})`}
                subtitle="24-hour price chart"
                action={
                  <span className={`badge ${selectedAsset.change >= 0 ? "badge-green" : "badge-red"}`}>
                    {selectedAsset.change >= 0 ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                    {formatPercent(selectedAsset.change)}
                  </span>
                }
              >
                <div style={{ marginBottom:12 }}>
                  <span style={{ fontFamily:"var(--font-display)", fontSize:28, fontWeight:700, color:"var(--text)" }}>
                    {formatCurrency(selectedAsset.price)}
                  </span>
                </div>
                <LargeChart data={selectedChart} up={selectedAsset.change >= 0} />
              </Card>
            )}

            {/* Table */}
            <Card title="Assets" subtitle="Click a row to inspect">
              {loading ? (
                <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                  {[1,2,3,4,5,6].map(i => (
                    <div key={i} style={{ height:44, borderRadius:8, background:"var(--surface2)", animation:"shimmer 1.4s infinite", backgroundSize:"200% 100%", backgroundImage:"linear-gradient(90deg,var(--surface2) 25%,var(--surface3) 50%,var(--surface2) 75%)" }} />
                  ))}
                </div>
              ) : (
                <table className="data-table">
                  <thead>
                    <tr><th>Asset</th><th>Price</th><th>24h Change</th><th>Volume</th><th>Market Cap</th><th>Chart</th></tr>
                  </thead>
                  <tbody>
                    {assets.map((a, i) => (
                      <tr key={a.symbol}
                        className={`asset-row fade-up ${selected === a.symbol ? "asset-row-active" : ""}`}
                        style={{ animationDelay:`${i*50}ms`, cursor:"pointer" }}
                        onClick={() => setSelected(a.symbol)}
                      >
                        <td>
                          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                            <div className="asset-badge">{a.symbol.slice(0,2)}</div>
                            <div>
                              <div style={{ fontWeight:600, color:"var(--text)", fontSize:13 }}>{a.symbol}</div>
                              <div style={{ fontSize:11, color:"var(--text3)" }}>{a.name}</div>
                            </div>
                          </div>
                        </td>
                        <td style={{ fontFamily:"var(--font-mono)", fontWeight:600, color:"var(--text)" }}>
                          {formatCurrency(a.price)}
                        </td>
                        <td>
                          <span style={{
                            display:"inline-flex", alignItems:"center", gap:4,
                            color: a.change >= 0 ? "var(--green)" : "var(--red)",
                            fontFamily:"var(--font-mono)", fontSize:12, fontWeight:600,
                          }}>
                            {a.change >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                            {formatPercent(a.change)}
                          </span>
                        </td>
                        <td style={{ fontFamily:"var(--font-mono)", color:"var(--text2)" }}>{a.volume}</td>
                        <td style={{ fontFamily:"var(--font-mono)", color:"var(--text2)" }}>{a.cap}</td>
                        <td>
                          {charts[a.symbol] && <MiniLine data={charts[a.symbol]} up={a.change >= 0} />}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </Card>
          </div>

          {/* Side panel */}
          <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
            {selectedAsset && (
              <Card title="Asset Details">
                <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
                  <div className="asset-badge-lg">{selectedAsset.symbol.slice(0,2)}</div>
                  <div>
                    <div style={{ fontFamily:"var(--font-display)", fontSize:20, fontWeight:700, color:"var(--text)" }}>{selectedAsset.name}</div>
                    <div style={{ fontSize:12, color:"var(--text3)" }}>{selectedAsset.symbol}</div>
                  </div>
                  {[
                    { label:"Current Price", value:formatCurrency(selectedAsset.price), mono:true },
                    { label:"24h Change",     value:formatPercent(selectedAsset.change), mono:true,
                      color: selectedAsset.change >= 0 ? "var(--green)" : "var(--red)" },
                    { label:"Volume",         value:selectedAsset.volume, mono:true },
                    { label:"Market Cap",     value:selectedAsset.cap,    mono:true },
                  ].map(row => (
                    <div key={row.label} style={{ display:"flex", justifyContent:"space-between", padding:"8px 0", borderBottom:"1px solid var(--border)" }}>
                      <span style={{ fontSize:12, color:"var(--text3)" }}>{row.label}</span>
                      <span style={{ fontSize:13, fontWeight:600, fontFamily:row.mono?"var(--font-mono)":undefined, color:row.color || "var(--text)" }}>
                        {row.value}
                      </span>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            <Card title="Market Summary">
              {[
                { icon:TrendingUp,   label:"Gainers Today", value:"4", color:"var(--green)" },
                { icon:TrendingDown, label:"Losers Today",  value:"2", color:"var(--red)"   },
                { icon:Activity,     label:"Total Volume",  value:"$81.2B", color:"var(--accent)" },
              ].map(({ icon:Icon, label, value, color }) => (
                <div key={label} style={{ display:"flex", alignItems:"center", gap:12, padding:"10px 0", borderBottom:"1px solid var(--border)" }}>
                  <div style={{ width:32, height:32, borderRadius:8, background:`${color}18`, border:`1px solid ${color}25`, display:"flex", alignItems:"center", justifyContent:"center" }}>
                    <Icon size={14} color={color} />
                  </div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:11, color:"var(--text3)" }}>{label}</div>
                    <div style={{ fontSize:16, fontWeight:700, fontFamily:"var(--font-display)", color:"var(--text)" }}>{value}</div>
                  </div>
                </div>
              ))}
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

function LargeChart({ data, up }) {
  if (!data.length) return null;
  const W = 600, H = 100;
  const vals = data.map(d => d.value);
  const max = Math.max(...vals), min = Math.min(...vals);
  const pts = vals.map((v, i) => {
    const x = (i / (vals.length - 1)) * W;
    const y = H - ((v - min) / ((max - min) || 1)) * (H - 8) - 4;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(" ");
  const color = up ? "#22c55e" : "#ef4444";
  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ overflow:"visible" }}>
      <defs>
        <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity=".2" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polyline points={`0,${H} ${pts} ${W},${H}`} fill="url(#chartGrad)" strokeWidth="0" />
      <polyline points={pts} fill="none" stroke={color} strokeWidth="2"
        strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}