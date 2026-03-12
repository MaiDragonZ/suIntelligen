import { useState } from "react";
import { Brain, Eye, EyeOff, Lock, Mail, AlertCircle, Loader } from "lucide-react";
import { authService } from "../../services/authService";
import "./Login.css";

export default function Login({ onLogin }) {
  const [form, setForm]       = useState({ email: "", password: "" });
  const [show, setShow]       = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password) { setError("Please fill in all fields."); return; }
    setLoading(true);
    setError("");
    try {
      const data = await authService.login(form.email, form.password);
      onLogin(data);
    } catch (err) {
      setError(err.message || "Invalid email or password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-shell">
      {/* Background grid */}
      <div className="login-bg">
        <div className="bg-grid" />
        <div className="bg-glow" />
      </div>

      {/* Left panel — branding */}
      <div className="login-left fade-in">
        <div className="brand-logo">
          <div className="brand-icon"><Brain size={22} color="#fff" /></div>
          <span className="brand-name">SU Intelligence</span>
        </div>
        <div className="brand-body">
          <h1 className="brand-headline">
            Intelligence<br />
            <span className="headline-accent">Redefined.</span>
          </h1>
          <p className="brand-desc">
            Enterprise-grade AI inference platform.<br />
            Real-time models, market data, and deep analytics.
          </p>
          <div className="brand-stats">
            {[
              { value: "99.99%", label: "Uptime SLA" },
              { value: "38ms",   label: "Avg Latency" },
              { value: "4 AI",   label: "Models Live" },
            ].map(s => (
              <div key={s.label} className="brand-stat">
                <span className="stat-val">{s.value}</span>
                <span className="stat-lbl">{s.label}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="brand-footer">
          <span className="version-badge">v2.4.1 — Production</span>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="login-right">
        <div className="login-card scale-in">
          <div className="login-card-header">
            <h2>Sign in</h2>
            <p>Access your SU Intelligence workspace</p>
          </div>

          {error && (
            <div className="login-error fade-in">
              <AlertCircle size={14} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="login-form">
            {/* Email */}
            <div className="field-group">
              <label className="field-label">Email address</label>
              <div className="field-wrap">
                <Mail size={14} className="field-icon" />
                <input
                  type="email"
                  className="field-input"
                  placeholder="admin@su-intelligence.ai"
                  value={form.email}
                  onChange={set("email")}
                  autoComplete="email"
                  autoFocus
                />
              </div>
            </div>

            {/* Password */}
            <div className="field-group">
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                <label className="field-label">Password</label>
                <button type="button" className="forgot-link">Forgot password?</button>
              </div>
              <div className="field-wrap">
                <Lock size={14} className="field-icon" />
                <input
                  type={show ? "text" : "password"}
                  className="field-input"
                  placeholder="Enter your password"
                  value={form.password}
                  onChange={set("password")}
                  autoComplete="current-password"
                />
                <button type="button" className="show-btn" onClick={() => setShow(s => !s)}>
                  {show ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button type="submit" className={`login-btn ${loading ? "loading" : ""}`} disabled={loading}>
              {loading
                ? <><Loader size={15} className="spin-anim" /> Authenticating…</>
                : "Sign in to workspace"
              }
            </button>
          </form>

          <div className="login-demo">
            <span>Demo credentials:</span>
            <code>admin@su.ai</code>
            <span>/</span>
            <code>admin123</code>
          </div>
        </div>
      </div>
    </div>
  );
}
