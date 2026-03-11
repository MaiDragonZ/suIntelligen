import { useState, useEffect } from "react";
import {
  Brain, Zap, Activity, Users, TrendingUp, TrendingDown,
  ArrowUpRight, CheckCircle2, AlertCircle, Circle, Clock,
  MoreHorizontal, RefreshCw,
} from "lucide-react";
import Navbar from "../../components/Navbar";
import Card   from "../../components/Card";
import { fetchModels, getModelStats } from "../../services/aiService";
import { formatNumber, formatPercent }   from "../../utils/format";
import { timeAgo } from "../../utils/time";
import "./Dashboard.css";

/* ── Static mock data ──────────────────────────────────────────────── */
const ACTIVITY_LOG = [
  { status:"success", title:"Model su-text-ultra deployed",     tag:"Deploy", time: new Date(Date.now()-120000).toISOString() },
  { status:"warning", title:"High latency on cluster #3",       tag:"Alert",  time: new Date(Date.now()-840000).toISOString() },
  { status:"success", title:"200K token benchmark passed",      tag:"Test",   time: new Date(Date.now()-3600000).toISOString() },
  { status:"error",   title:"Webhook integration timed out",    tag:"Error",  time: new Date(Date.now()-7200000).toISOString() },
  { status:"success", title:"Auto-scaling triggered ×2",        tag:"Scale",  time: new Date(Date.now()-10800000).toISOString() },
  { status:"info",    title:"New dataset ingested: SU-2024-Q4", tag:"Data",   time: new Date(Date.now()-18000000).toISOString() },
];

const STATUS_ICON = {
  success: <CheckCircle2 size={14} color="#22c55e" />,
  warning: <AlertCircle  size={14} color="#f59e0b" />,
  error:   <AlertCircle  size={14} color="#ef4444" />,
  info:    <Circle       size={14} color="#3b7ff5" />,
};

const TAG_COLORS = {
  Deploy:"#3b7ff5", Alert:"#f59e0b", Test:"#22c55e",
  Error:"#ef4444",  Scale:"#8b5cf6", Data:"#06b6d4",
};

/* ── Sparkline SVG ──────────────────────────────────────────────────── */
function Sparkline({ data, color = "#3b7ff5" }) {
  if (!data?.length) return null;
  const W = 80, H = 28;
  const max = Math.max(...data), min = Math.min(...data);
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * W;
    const y = H - ((v - min) / ((max - min) || 1)) * H;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(" ");
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
      <polyline points={`0,${H} ${pts} ${W},${H}`}
        fill={color} fillOpacity=".1" strokeWidth="0" />
      <polyline points={pts} fill="none"
        stroke={color} strokeWidth="2"
        strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

/* ── Mini bar chart ─────────────────────────────────────────────────── */
function BarChart({ data, color = "#3b7ff5" }) {
  const max = Math.max(...data);
  return (
    <div style={{ display:"flex", alignItems:"flex-end", gap:3, height:40 }}>
      {data.map((v, i) => (
        <div key={i} style={{
          flex:1, borderRadius:"3px 3px 0 0",
          background: i === data.length - 1 ? color : `${color}55`,
          height: `${(v / max) * 100}%`,
          minHeight: 3,
          transition: "height .3s ease",
        }} />
      ))}
    </div>
  );
}

/* ── Stat Card ──────────────────────────────────────────────────────── */
function StatCard({ icon: Icon, label, value, delta, up, color, sparkData, delay = 0 }) {
  return (
    <div className="stat-card fade-up" style={{ animationDelay: `${delay}ms` }}>
      <div className="stat-top">
        <div className="stat-icon-wrap" style={{ background: `${color}18`, border:`1px solid ${color}30` }}>
          <Icon size={16} color={color} />
        </div>
        <Sparkline data={sparkData} color={color} />
      </div>
      <div className="stat-value">{value}</div>
      <div className="stat-footer">
        <span className="stat-label">{label}</span>
        <span className={`stat-delta ${up ? "up" : "down"}`}>
          {up ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
          {delta}
        </span>
      </div>
    </div>
  );
}

/* ── Dashboard Page ─────────────────────────────────────────────────── */
export default function Dashboard({ onNavigate }) {
  const [models, setModels]     = useState([]);
  const [stats, setStats]       = useState(null);
  const [loading, setLoading]   = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    setLoading(true);
    const [m, s] = await Promise.all([fetchModels(), Promise.resolve(getModelStats())]);
    setModels(m);
    setStats(s);
    setLoading(false);
  };

  const refresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  useEffect(() => { load(); }, []);

  const STAT_CARDS = stats ? [
    { icon:Brain,    label:"Active Models",   value: formatNumber(stats.activeModels), delta:"+1 this week", up:true,  color:"#3b7ff5", sparkData:[2,3,3,2,3,3,4,4] },
    { icon:Zap,      label:"Requests Today",  value: formatNumber(stats.totalRequests), delta:"+12.5%",      up:true,  color:"#22c55e", sparkData:[70,82,75,90,85,95,88,100] },
    { icon:Activity, label:"Avg Latency",     value:`${stats.avgLatency}ms`,           delta:"-4ms",         up:true,  color:"#f59e0b", sparkData:[55,50,48,42,44,40,38,38] },
    { icon:Users,    label:"Active Users",    value:"8,291",                            delta:"-0.8%",        up:false, color:"#8b5cf6", sparkData:[95,92,90,93,91,88,85,83] },
  ] : [];

  const reqBars = [420,510,380,620,580,710,640,820,760,880,820,960];

  return (
    <div style={{ display:"flex", flexDirection:"column", height:"100%" }}>
      <Navbar title="Dashboard" subtitle="SU Intelligence Platform">
        <button className="btn btn-ghost" onClick={refresh} style={{ gap:6 }}>
          <RefreshCw size={13} className={refreshing ? "spin-anim" : ""} />
          Refresh
        </button>
        <button className="btn btn-primary" onClick={() => onNavigate?.("ai-chat")}>
          <Brain size={13} /> New Inference
        </button>
      </Navbar>

      <div className="page" style={{ gap:20 }}>

        {/* Stat cards */}
        <div className="grid-4 stagger">
          {STAT_CARDS.map((s, i) => (
            <StatCard key={s.label} {...s} delay={i * 55} />
          ))}
        </div>

        {/* Middle row */}
        <div style={{ display:"grid", gridTemplateColumns:"1fr 360px", gap:16 }}>

          {/* Models table */}
          <Card title="Active Models" subtitle="Live inference engines"
            action={<button className="btn btn-ghost" style={{fontSize:11}}>View All</button>}>
            {loading ? (
              <div className="loading-rows">
                {[1,2,3,4].map(i => <div key={i} className="loading-row shimmer-row" />)}
              </div>
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Model</th><th>Type</th><th>Req/s</th><th>Latency</th><th>Health</th><th>Uptime</th>
                  </tr>
                </thead>
                <tbody>
                  {models.map((m, i) => (
                    <tr key={m.id} className="fade-up" style={{ animationDelay:`${i*60}ms` }}>
                      <td>
                        <div style={{ fontWeight:500, color:"var(--text)" }}>{m.name}</div>
                        <div style={{ fontSize:10, color:"var(--text3)", fontFamily:"var(--font-mono)" }}>{m.id}</div>
                      </td>
                      <td><span className="badge badge-blue">{m.type}</span></td>
                      <td style={{ fontFamily:"var(--font-mono)", color:"var(--cyan)" }}>{formatNumber(m.rps)}</td>
                      <td style={{ fontFamily:"var(--font-mono)" }}>{m.latency}ms</td>
                      <td>
                        <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                          <div style={{ flex:1, height:4, background:"var(--border2)", borderRadius:99, overflow:"hidden" }}>
                            <div style={{
                              height:"100%", borderRadius:99,
                              width:`${m.health}%`,
                              background: m.health > 95 ? "var(--green)" : m.health > 80 ? "var(--amber)" : "var(--red)",
                            }} />
                          </div>
                          <span style={{ fontSize:11, color:"var(--text2)", fontFamily:"var(--font-mono)", minWidth:32 }}>
                            {m.health}%
                          </span>
                        </div>
                      </td>
                      <td style={{ color:"var(--green)", fontFamily:"var(--font-mono)", fontSize:12 }}>{m.uptime}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Card>

          {/* Request chart */}
          <Card title="Request Volume" subtitle="Last 12 hours">
            <BarChart data={reqBars} color="#3b7ff5" />
            <div style={{ marginTop:16, display:"flex", flexDirection:"column", gap:10 }}>
              {[
                { label:"Peak RPS",      value:"1,240",  color:"var(--accent)" },
                { label:"Avg RPS",       value:"820",    color:"var(--text2)"  },
                { label:"Error Rate",    value:"0.02%",  color:"var(--green)"  },
                { label:"P99 Latency",   value:"142ms",  color:"var(--amber)"  },
              ].map(row => (
                <div key={row.label} style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                  <span style={{ fontSize:12, color:"var(--text3)" }}>{row.label}</span>
                  <span style={{ fontSize:13, fontWeight:600, fontFamily:"var(--font-mono)", color:row.color }}>{row.value}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Bottom row */}
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>

          {/* Activity log */}
          <Card title="Activity Log" subtitle="Recent system events"
            action={<button className="btn btn-ghost" style={{fontSize:11}}>View All</button>}>
            <div style={{ display:"flex", flexDirection:"column", gap:0 }}>
              {ACTIVITY_LOG.map((item, i) => (
                <div key={i} className="activity-row fade-up" style={{ animationDelay:`${i*40}ms` }}>
                  <div className="activity-icon">{STATUS_ICON[item.status]}</div>
                  <div style={{ flex:1 }}>
                    <span style={{ fontSize:12, color:"var(--text2)" }}>{item.title}</span>
                  </div>
                  <span className="activity-tag" style={{
                    background:`${TAG_COLORS[item.tag]}18`,
                    color: TAG_COLORS[item.tag],
                    border:`1px solid ${TAG_COLORS[item.tag]}30`,
                  }}>{item.tag}</span>
                  <span style={{ fontSize:11, color:"var(--text3)", minWidth:64, textAlign:"right" }}>
                    {timeAgo(item.time)}
                  </span>
                </div>
              ))}
            </div>
          </Card>

          {/* Quick actions */}
          <Card title="Quick Actions" subtitle="Common operations">
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
              {[
                { icon:Brain,      label:"Run Inference",    color:"#3b7ff5", action:"ai-chat" },
                { icon:TrendingUp, label:"View Market",      color:"#22c55e", action:"market"  },
                { icon:Activity,   label:"Check Metrics",    color:"#f59e0b", action:null       },
                { icon:Users,      label:"Manage Users",     color:"#8b5cf6", action:null       },
                { icon:ArrowUpRight,label:"Deploy Model",    color:"#06b6d4", action:null       },
                { icon:Clock,      label:"Audit Logs",       color:"#ec4899", action:null       },
              ].map(({ icon:Icon, label, color, action }) => (
                <button key={label} className="quick-action-btn"
                  onClick={() => action && onNavigate?.(action)}
                  style={{ "--qa-color": color }}>
                  <div className="qa-icon" style={{ background:`${color}18`, border:`1px solid ${color}28` }}>
                    <Icon size={15} color={color} />
                  </div>
                  <span>{label}</span>
                </button>
              ))}
            </div>
          </Card>
        </div>

      </div>
    </div>
  );
}
