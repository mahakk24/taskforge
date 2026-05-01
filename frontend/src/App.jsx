import { useState, useEffect, createContext, useContext } from "react";

// ─── API Client ──────────────────────────────────────────────────────────────
const API = import.meta.env.VITE_API_URL || "http://localhost:8000";

async function apiFetch(path, options = {}) {
  const token = localStorage.getItem("token");
  const res = await fetch(`${API}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...options,
  });
  if (res.status === 401) {
    localStorage.removeItem("token");
    window.location.href = "/login";
    return;
  }
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Request failed");
  }
  if (res.status === 204) return null;
  return res.json();
}

// ─── Auth Context ─────────────────────────────────────────────────────────────
const AuthCtx = createContext(null);
function useAuth() { return useContext(AuthCtx); }

// ─── Router (hash-based) ──────────────────────────────────────────────────────
function useRoute() {
  const [route, setRoute] = useState(window.location.hash || "#/dashboard");
  useEffect(() => {
    const handler = () => setRoute(window.location.hash || "#/dashboard");
    window.addEventListener("hashchange", handler);
    return () => window.removeEventListener("hashchange", handler);
  }, []);
  const navigate = (path) => { window.location.hash = path; };
  return { route, navigate };
}

// ─── Icons (inline SVG) ───────────────────────────────────────────────────────
const Icon = {
  dashboard: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>,
  projects: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z"/></svg>,
  tasks: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></svg>,
  users: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>,
  logout: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
  plus: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  alert: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>,
  close: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  chevron: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>,
};

// ─── UI Primitives ────────────────────────────────────────────────────────────
const PRIORITY_META = {
  low: { label: "Low", color: "#64748b" },
  medium: { label: "Medium", color: "#f59e0b" },
  high: { label: "High", color: "#f97316" },
  critical: { label: "Critical", color: "#ef4444" },
};

const STATUS_META = {
  todo: { label: "To Do", color: "#64748b" },
  in_progress: { label: "In Progress", color: "#3b82f6" },
  review: { label: "Review", color: "#8b5cf6" },
  done: { label: "Done", color: "#10b981" },
};

function Badge({ type, value }) {
  const meta = type === "priority" ? PRIORITY_META[value] : STATUS_META[value];
  if (!meta) return null;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      padding: "2px 8px", borderRadius: 4, fontSize: 11, fontWeight: 600,
      background: meta.color + "22", color: meta.color, letterSpacing: "0.04em", textTransform: "uppercase"
    }}>
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: meta.color, display: "inline-block" }}/>
      {meta.label}
    </span>
  );
}

function Avatar({ name, color, size = 32 }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%",
      background: color || "#6366f1",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: size * 0.4, fontWeight: 700, color: "#fff", flexShrink: 0,
      fontFamily: "'Space Mono', monospace"
    }}>
      {name?.[0]?.toUpperCase() || "?"}
    </div>
  );
}

function Modal({ title, onClose, children }) {
  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 1000,
      display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
      backdropFilter: "blur(4px)"
    }} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div style={{
        background: "#0f1117", border: "1px solid #1e2130",
        borderRadius: 12, padding: 28, width: "100%", maxWidth: 480,
        boxShadow: "0 25px 60px rgba(0,0,0,0.6)"
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <span style={{ color: "#e2e8f0", fontWeight: 700, fontSize: 18, fontFamily: "'Space Mono', monospace" }}>{title}</span>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#64748b", cursor: "pointer", padding: 4 }}>{Icon.close}</button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Input({ label, ...props }) {
  return (
    <div style={{ marginBottom: 16 }}>
      {label && <label style={{ display: "block", color: "#94a3b8", fontSize: 12, marginBottom: 6, fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase" }}>{label}</label>}
      <input {...props} style={{
        width: "100%", background: "#0a0c13", border: "1px solid #1e2130", borderRadius: 8,
        padding: "10px 14px", color: "#e2e8f0", fontSize: 14, outline: "none",
        fontFamily: "inherit", boxSizing: "border-box",
        ...props.style
      }} />
    </div>
  );
}

function Select({ label, children, ...props }) {
  return (
    <div style={{ marginBottom: 16 }}>
      {label && <label style={{ display: "block", color: "#94a3b8", fontSize: 12, marginBottom: 6, fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase" }}>{label}</label>}
      <select {...props} style={{
        width: "100%", background: "#0a0c13", border: "1px solid #1e2130", borderRadius: 8,
        padding: "10px 14px", color: "#e2e8f0", fontSize: 14, outline: "none",
        fontFamily: "inherit", boxSizing: "border-box"
      }}>
        {children}
      </select>
    </div>
  );
}

function Textarea({ label, ...props }) {
  return (
    <div style={{ marginBottom: 16 }}>
      {label && <label style={{ display: "block", color: "#94a3b8", fontSize: 12, marginBottom: 6, fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase" }}>{label}</label>}
      <textarea {...props} style={{
        width: "100%", background: "#0a0c13", border: "1px solid #1e2130", borderRadius: 8,
        padding: "10px 14px", color: "#e2e8f0", fontSize: 14, outline: "none",
        fontFamily: "inherit", boxSizing: "border-box", resize: "vertical", minHeight: 80
      }} />
    </div>
  );
}

function Btn({ children, variant = "primary", loading, ...props }) {
  const styles = {
    primary: { background: "#6366f1", color: "#fff", border: "none" },
    ghost: { background: "transparent", color: "#94a3b8", border: "1px solid #1e2130" },
    danger: { background: "#ef444422", color: "#ef4444", border: "1px solid #ef444444" },
  };
  return (
    <button {...props} style={{
      padding: "10px 20px", borderRadius: 8, fontSize: 14, fontWeight: 600,
      cursor: props.disabled || loading ? "not-allowed" : "pointer", display: "inline-flex",
      alignItems: "center", gap: 8, fontFamily: "inherit", opacity: loading ? 0.7 : 1,
      transition: "opacity 0.15s, transform 0.1s",
      ...styles[variant], ...props.style
    }}>
      {loading ? "..." : children}
    </button>
  );
}

function Toast({ msg, type, onDismiss }) {
  useEffect(() => { const t = setTimeout(onDismiss, 3500); return () => clearTimeout(t); }, []);
  return (
    <div style={{
      position: "fixed", bottom: 24, right: 24, zIndex: 9999,
      background: type === "error" ? "#1a0a0a" : "#0a1a0f",
      border: `1px solid ${type === "error" ? "#ef4444" : "#10b981"}`,
      color: type === "error" ? "#ef4444" : "#10b981",
      padding: "12px 20px", borderRadius: 10, fontSize: 14, fontWeight: 500,
      display: "flex", alignItems: "center", gap: 10, boxShadow: "0 8px 32px rgba(0,0,0,0.5)"
    }}>
      {type === "error" ? "✗" : "✓"} {msg}
    </div>
  );
}

// ─── Login / Signup Page ──────────────────────────────────────────────────────
function AuthPage({ onAuth }) {
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "member" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit() {
    setLoading(true); setError("");
    try {
      const data = mode === "login"
        ? await apiFetch("/api/auth/login", { method: "POST", body: JSON.stringify({ email: form.email, password: form.password }) })
        : await apiFetch("/api/auth/signup", { method: "POST", body: JSON.stringify(form) });
      localStorage.setItem("token", data.access_token);
      onAuth(data.user);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  return (
    <div style={{
      minHeight: "100vh", background: "#080a0f",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontFamily: "'DM Sans', sans-serif"
    }}>
      {/* Grid bg */}
      <div style={{
        position: "fixed", inset: 0, opacity: 0.04,
        backgroundImage: "linear-gradient(#6366f1 1px, transparent 1px), linear-gradient(90deg, #6366f1 1px, transparent 1px)",
        backgroundSize: "48px 48px"
      }}/>
      <div style={{ position: "relative", width: "100%", maxWidth: 420, padding: 20 }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 12,
            padding: "10px 20px", background: "#6366f111", border: "1px solid #6366f133", borderRadius: 100, marginBottom: 24
          }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#6366f1", boxShadow: "0 0 8px #6366f1" }}/>
            <span style={{ color: "#6366f1", fontSize: 12, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", fontFamily: "'Space Mono', monospace" }}>TaskForge</span>
          </div>
          <h1 style={{ color: "#e2e8f0", fontSize: 32, fontWeight: 800, margin: "0 0 8px", fontFamily: "'Space Mono', monospace", lineHeight: 1.2 }}>
            {mode === "login" ? "Welcome back" : "Create account"}
          </h1>
          <p style={{ color: "#475569", margin: 0, fontSize: 14 }}>
            {mode === "login" ? "Sign in to your workspace" : "Start your project command center"}
          </p>
        </div>
        {/* Card */}
        <div style={{ background: "#0f1117", border: "1px solid #1e2130", borderRadius: 16, padding: 32, boxShadow: "0 32px 80px rgba(0,0,0,0.5)" }}>
          {mode === "signup" && <Input label="Full Name" value={form.name} onChange={set("name")} placeholder="Jane Smith" />}
          <Input label="Email" type="email" value={form.email} onChange={set("email")} placeholder="you@company.com" />
          <Input label="Password" type="password" value={form.password} onChange={set("password")} placeholder="••••••••" />
          {mode === "signup" && (
            <Select label="Role" value={form.role} onChange={set("role")}>
              <option value="member">Member</option>
              <option value="admin">Admin</option>
            </Select>
          )}
          {error && (
            <div style={{ color: "#ef4444", fontSize: 13, marginBottom: 16, display: "flex", alignItems: "center", gap: 6 }}>
              {Icon.alert} {error}
            </div>
          )}
          <Btn loading={loading} onClick={submit} style={{ width: "100%", justifyContent: "center", marginTop: 4 }}>
            {mode === "login" ? "Sign In" : "Create Account"}
          </Btn>
          <p style={{ textAlign: "center", marginTop: 20, color: "#475569", fontSize: 13 }}>
            {mode === "login" ? "No account? " : "Already registered? "}
            <button onClick={() => setMode(m => m === "login" ? "signup" : "login")} style={{ background: "none", border: "none", color: "#6366f1", cursor: "pointer", fontWeight: 600, fontSize: 13, fontFamily: "inherit" }}>
              {mode === "login" ? "Sign up" : "Sign in"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────
function Sidebar({ user, route, navigate, onLogout }) {
  const links = [
    { hash: "#/dashboard", label: "Dashboard", icon: Icon.dashboard },
    { hash: "#/projects", label: "Projects", icon: Icon.projects },
    { hash: "#/tasks", label: "My Tasks", icon: Icon.tasks },
    ...(user.role === "admin" ? [{ hash: "#/users", label: "Users", icon: Icon.users }] : []),
  ];

  return (
    <aside style={{
      width: 220, background: "#0a0c13", borderRight: "1px solid #1e2130",
      display: "flex", flexDirection: "column", position: "fixed", top: 0, left: 0, bottom: 0, zIndex: 100
    }}>
      {/* Brand */}
      <div style={{ padding: "24px 20px 20px", borderBottom: "1px solid #1e2130" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 32, height: 32, background: "#6366f1", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>⚡</div>
          <span style={{ color: "#e2e8f0", fontWeight: 800, fontSize: 16, fontFamily: "'Space Mono', monospace" }}>TaskForge</span>
        </div>
      </div>
      {/* Nav */}
      <nav style={{ flex: 1, padding: "12px 10px" }}>
        {links.map(l => {
          const active = route.startsWith(l.hash);
          return (
            <button key={l.hash} onClick={() => navigate(l.hash)} style={{
              display: "flex", alignItems: "center", gap: 12, width: "100%",
              padding: "10px 12px", borderRadius: 8, border: "none", cursor: "pointer",
              background: active ? "#6366f122" : "transparent",
              color: active ? "#6366f1" : "#64748b",
              fontFamily: "inherit", fontSize: 14, fontWeight: active ? 700 : 500,
              marginBottom: 2, transition: "all 0.15s"
            }}>
              {l.icon} {l.label}
            </button>
          );
        })}
      </nav>
      {/* User */}
      <div style={{ padding: "16px", borderTop: "1px solid #1e2130" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
          <Avatar name={user.name} color={user.avatar_color} size={34} />
          <div>
            <div style={{ color: "#e2e8f0", fontSize: 13, fontWeight: 600, lineHeight: 1.3 }}>{user.name}</div>
            <div style={{ color: "#475569", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.05em" }}>{user.role}</div>
          </div>
        </div>
        <button onClick={onLogout} style={{
          display: "flex", alignItems: "center", gap: 8, width: "100%",
          background: "transparent", border: "1px solid #1e2130", borderRadius: 8,
          padding: "8px 12px", color: "#64748b", cursor: "pointer", fontSize: 13, fontFamily: "inherit"
        }}>
          {Icon.logout} Logout
        </button>
      </div>
    </aside>
  );
}

// ─── Dashboard ────────────────────────────────────────────────────────────────
function Dashboard({ user }) {
  const [stats, setStats] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);

  useEffect(() => {
    apiFetch("/api/tasks/dashboard/stats").then(setStats).catch(console.error);
    apiFetch("/api/projects").then(setProjects).catch(console.error);
  }, []);

  const statCards = stats ? [
    { label: "Total Tasks", value: stats.total_tasks, color: "#6366f1" },
    { label: "Completed", value: stats.completed_tasks, color: "#10b981" },
    { label: "In Progress", value: stats.in_progress_tasks, color: "#3b82f6" },
    { label: "Overdue", value: stats.overdue_tasks, color: "#ef4444" },
  ] : [];

  return (
    <div>
      <h2 style={{ color: "#e2e8f0", fontSize: 24, fontWeight: 800, marginBottom: 6, fontFamily: "'Space Mono', monospace" }}>
        Good {new Date().getHours() < 12 ? "morning" : "afternoon"}, {user.name.split(" ")[0]} 👋
      </h2>
      <p style={{ color: "#475569", marginBottom: 32, fontSize: 14 }}>Here's what's happening across your projects.</p>

      {/* Stats grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, marginBottom: 32 }}>
        {statCards.map(s => (
          <div key={s.label} style={{
            background: "#0f1117", border: "1px solid #1e2130", borderRadius: 12,
            padding: "20px 24px", borderLeft: `3px solid ${s.color}`
          }}>
            <div style={{ color: "#475569", fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 8 }}>{s.label}</div>
            <div style={{ color: s.color, fontSize: 40, fontWeight: 800, fontFamily: "'Space Mono', monospace", lineHeight: 1 }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Recent projects */}
      <h3 style={{ color: "#e2e8f0", fontSize: 16, fontWeight: 700, marginBottom: 16, fontFamily: "'Space Mono', monospace" }}>Active Projects</h3>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 14 }}>
        {projects.slice(0, 6).map(p => (
          <a key={p.id} href={`#/projects/${p.id}`} style={{
            display: "block", background: "#0f1117", border: "1px solid #1e2130",
            borderRadius: 12, padding: "18px 20px", textDecoration: "none",
            borderLeft: `3px solid ${p.color}`, transition: "border-color 0.15s"
          }}>
            <div style={{ color: "#e2e8f0", fontWeight: 600, fontSize: 15, marginBottom: 6 }}>{p.name}</div>
            <div style={{ color: "#475569", fontSize: 12 }}>{p.task_count} tasks · {p.members.length} members</div>
          </a>
        ))}
        {projects.length === 0 && (
          <div style={{ color: "#475569", fontSize: 14, padding: 20 }}>No projects yet. Create your first one!</div>
        )}
      </div>
    </div>
  );
}

// ─── Projects Page ────────────────────────────────────────────────────────────
function ProjectsPage({ user }) {
  const [projects, setProjects] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: "", description: "", color: "#6366f1" });
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

  const refresh = () => apiFetch("/api/projects").then(setProjects);
  useEffect(() => { refresh(); }, []);

  async function createProject() {
    setLoading(true);
    try {
      await apiFetch("/api/projects", { method: "POST", body: JSON.stringify(form) });
      setShowModal(false); setForm({ name: "", description: "", color: "#6366f1" });
      refresh(); setToast({ msg: "Project created!", type: "success" });
    } catch (e) { setToast({ msg: e.message, type: "error" }); }
    finally { setLoading(false); }
  }

  const COLORS = ["#6366f1", "#ec4899", "#10b981", "#f59e0b", "#3b82f6", "#8b5cf6", "#ef4444", "#06b6d4"];

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28 }}>
        <div>
          <h2 style={{ color: "#e2e8f0", fontSize: 22, fontWeight: 800, margin: 0, fontFamily: "'Space Mono', monospace" }}>Projects</h2>
          <p style={{ color: "#475569", margin: "4px 0 0", fontSize: 14 }}>{projects.length} active projects</p>
        </div>
        <Btn onClick={() => setShowModal(true)}>{Icon.plus} New Project</Btn>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 16 }}>
        {projects.map(p => (
          <a key={p.id} href={`#/projects/${p.id}`} style={{
            display: "block", background: "#0f1117", border: "1px solid #1e2130",
            borderRadius: 14, padding: 22, textDecoration: "none", transition: "transform 0.15s, box-shadow 0.15s"
          }}
            onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 12px 32px rgba(0,0,0,0.4)"; }}
            onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = ""; }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: p.color + "22", border: `1px solid ${p.color}44`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>📁</div>
              <span style={{ color: p.color, fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", background: p.color + "18", padding: "3px 8px", borderRadius: 6 }}>Active</span>
            </div>
            <div style={{ color: "#e2e8f0", fontSize: 16, fontWeight: 700, marginBottom: 6 }}>{p.name}</div>
            {p.description && <div style={{ color: "#64748b", fontSize: 13, marginBottom: 14, lineHeight: 1.5, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>{p.description}</div>}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 14, borderTop: "1px solid #1e2130" }}>
              <div style={{ display: "flex", gap: -4 }}>
                {p.members.slice(0, 4).map(m => (
                  <div key={m.id} style={{ marginRight: -8 }}>
                    <Avatar name={m.user.name} color={m.user.avatar_color} size={26} />
                  </div>
                ))}
              </div>
              <span style={{ color: "#475569", fontSize: 12 }}>{p.task_count} tasks</span>
            </div>
          </a>
        ))}
      </div>

      {showModal && (
        <Modal title="New Project" onClose={() => setShowModal(false)}>
          <Input label="Project Name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="My Awesome Project" />
          <Textarea label="Description" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="What is this project about?" />
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: "block", color: "#94a3b8", fontSize: 12, marginBottom: 10, fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase" }}>Color</label>
            <div style={{ display: "flex", gap: 8 }}>
              {COLORS.map(c => (
                <button key={c} onClick={() => setForm(f => ({ ...f, color: c }))} style={{
                  width: 28, height: 28, borderRadius: 6, background: c, border: form.color === c ? "2px solid #fff" : "2px solid transparent", cursor: "pointer"
                }} />
              ))}
            </div>
          </div>
          <Btn loading={loading} onClick={createProject} style={{ width: "100%", justifyContent: "center" }}>Create Project</Btn>
        </Modal>
      )}
      {toast && <Toast {...toast} onDismiss={() => setToast(null)} />}
    </div>
  );
}

// ─── Project Detail ───────────────────────────────────────────────────────────
function ProjectDetail({ projectId, user }) {
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [taskForm, setTaskForm] = useState({ title: "", description: "", assignee_id: "", priority: "medium", status: "todo", due_date: "" });
  const [memberEmail, setMemberEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [filter, setFilter] = useState("all");

  const refresh = async () => {
    const [p, t, u] = await Promise.all([
      apiFetch(`/api/projects/${projectId}`),
      apiFetch(`/api/projects/${projectId}/tasks`),
      apiFetch("/api/users")
    ]);
    setProject(p); setTasks(t); setUsers(u);
  };

  useEffect(() => { refresh(); }, [projectId]);

  const isAdmin = project && (user.role === "admin" || project.owner_id === user.id ||
    project.members.some(m => m.user.id === user.id && m.role === "admin"));

  async function createTask() {
    setLoading(true);
    try {
      const body = { ...taskForm, assignee_id: taskForm.assignee_id || null, due_date: taskForm.due_date || null };
      await apiFetch(`/api/tasks/project/${projectId}`, { method: "POST", body: JSON.stringify(body) });
      setShowTaskModal(false);
      setTaskForm({ title: "", description: "", assignee_id: "", priority: "medium", status: "todo", due_date: "" });
      refresh(); setToast({ msg: "Task created!", type: "success" });
    } catch (e) { setToast({ msg: e.message, type: "error" }); }
    finally { setLoading(false); }
  }

  async function updateTaskStatus(taskId, status) {
    await apiFetch(`/api/tasks/${taskId}`, { method: "PATCH", body: JSON.stringify({ status }) });
    setTasks(ts => ts.map(t => t.id === taskId ? { ...t, status } : t));
  }

  async function addMember() {
    setLoading(true);
    try {
      await apiFetch(`/api/projects/${projectId}/members`, { method: "POST", body: JSON.stringify({ email: memberEmail, role: "member" }) });
      setShowMemberModal(false); setMemberEmail("");
      refresh(); setToast({ msg: "Member added!", type: "success" });
    } catch (e) { setToast({ msg: e.message, type: "error" }); }
    finally { setLoading(false); }
  }

  if (!project) return <div style={{ color: "#475569" }}>Loading...</div>;

  const filtered = filter === "all" ? tasks : tasks.filter(t => t.status === filter);
  const columns = ["todo", "in_progress", "review", "done"];

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 6 }}>
            <div style={{ width: 12, height: 12, borderRadius: "50%", background: project.color }}/>
            <h2 style={{ color: "#e2e8f0", fontSize: 22, fontWeight: 800, margin: 0, fontFamily: "'Space Mono', monospace" }}>{project.name}</h2>
          </div>
          {project.description && <p style={{ color: "#475569", margin: 0, fontSize: 14, maxWidth: 500 }}>{project.description}</p>}
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          {isAdmin && <Btn variant="ghost" onClick={() => setShowMemberModal(true)}>{Icon.users} Members</Btn>}
          <Btn onClick={() => setShowTaskModal(true)}>{Icon.plus} Add Task</Btn>
        </div>
      </div>

      {/* Members row */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 24 }}>
        <span style={{ color: "#475569", fontSize: 12, marginRight: 4 }}>Team:</span>
        {project.members.map(m => (
          <div key={m.id} title={`${m.user.name} (${m.role})`}>
            <Avatar name={m.user.name} color={m.user.avatar_color} size={28} />
          </div>
        ))}
      </div>

      {/* Kanban board */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, minWidth: 800 }}>
        {columns.map(col => {
          const colTasks = tasks.filter(t => t.status === col);
          const meta = STATUS_META[col];
          return (
            <div key={col} style={{ background: "#0a0c13", border: "1px solid #1e2130", borderRadius: 12, padding: 16, minHeight: 300 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: meta.color }}/>
                  <span style={{ color: "#94a3b8", fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>{meta.label}</span>
                </div>
                <span style={{ color: meta.color, fontSize: 12, fontWeight: 700, background: meta.color + "18", padding: "1px 8px", borderRadius: 20 }}>{colTasks.length}</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {colTasks.map(task => (
                  <div key={task.id} style={{
                    background: "#0f1117", border: "1px solid #1e2130", borderRadius: 10, padding: 14,
                    borderLeft: `3px solid ${PRIORITY_META[task.priority]?.color}`
                  }}>
                    <div style={{ color: "#e2e8f0", fontSize: 13, fontWeight: 600, marginBottom: 8, lineHeight: 1.4 }}>{task.title}</div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <Badge type="priority" value={task.priority} />
                      {task.assignee && <Avatar name={task.assignee.name} color={task.assignee.avatar_color} size={22} />}
                    </div>
                    {task.due_date && (
                      <div style={{
                        color: new Date(task.due_date) < new Date() && task.status !== "done" ? "#ef4444" : "#475569",
                        fontSize: 11, marginTop: 8
                      }}>
                        Due {new Date(task.due_date).toLocaleDateString()}
                      </div>
                    )}
                    {/* Quick status change */}
                    <select value={task.status} onChange={e => updateTaskStatus(task.id, e.target.value)} style={{
                      marginTop: 10, background: "#0a0c13", border: "1px solid #1e2130", borderRadius: 6,
                      color: "#64748b", fontSize: 11, padding: "4px 6px", width: "100%", fontFamily: "inherit"
                    }}>
                      {columns.map(c => <option key={c} value={c}>{STATUS_META[c].label}</option>)}
                    </select>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Task Modal */}
      {showTaskModal && (
        <Modal title="New Task" onClose={() => setShowTaskModal(false)}>
          <Input label="Title" value={taskForm.title} onChange={e => setTaskForm(f => ({ ...f, title: e.target.value }))} placeholder="Task title..." />
          <Textarea label="Description" value={taskForm.description} onChange={e => setTaskForm(f => ({ ...f, description: e.target.value }))} placeholder="Details..." />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Select label="Priority" value={taskForm.priority} onChange={e => setTaskForm(f => ({ ...f, priority: e.target.value }))}>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </Select>
            <Select label="Assignee" value={taskForm.assignee_id} onChange={e => setTaskForm(f => ({ ...f, assignee_id: e.target.value }))}>
              <option value="">Unassigned</option>
              {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
            </Select>
          </div>
          <Input label="Due Date" type="datetime-local" value={taskForm.due_date} onChange={e => setTaskForm(f => ({ ...f, due_date: e.target.value }))} />
          <Btn loading={loading} onClick={createTask} style={{ width: "100%", justifyContent: "center" }}>Create Task</Btn>
        </Modal>
      )}

      {/* Member Modal */}
      {showMemberModal && (
        <Modal title="Add Member" onClose={() => setShowMemberModal(false)}>
          <Input label="Email Address" value={memberEmail} onChange={e => setMemberEmail(e.target.value)} placeholder="teammate@company.com" />
          <Btn loading={loading} onClick={addMember} style={{ width: "100%", justifyContent: "center" }}>Add Member</Btn>
        </Modal>
      )}

      {toast && <Toast {...toast} onDismiss={() => setToast(null)} />}
    </div>
  );
}

// ─── My Tasks Page ────────────────────────────────────────────────────────────
function MyTasksPage({ user }) {
  const [tasks, setTasks] = useState([]);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    // Fetch all tasks from all user's projects
    apiFetch("/api/projects").then(async (projects) => {
      const allTasks = await Promise.all(projects.map(p => apiFetch(`/api/projects/${p.id}/tasks`)));
      const mine = allTasks.flat().filter(t => t.assignee?.id === user.id || t.creator.id === user.id);
      setTasks(mine);
    });
  }, []);

  const statuses = ["all", "todo", "in_progress", "review", "done"];
  const filtered = filter === "all" ? tasks : tasks.filter(t => t.status === filter);

  return (
    <div>
      <h2 style={{ color: "#e2e8f0", fontSize: 22, fontWeight: 800, marginBottom: 6, fontFamily: "'Space Mono', monospace" }}>My Tasks</h2>
      <p style={{ color: "#475569", marginBottom: 24, fontSize: 14 }}>{tasks.length} total tasks assigned to you</p>

      {/* Filter pills */}
      <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
        {statuses.map(s => (
          <button key={s} onClick={() => setFilter(s)} style={{
            padding: "6px 16px", borderRadius: 20, border: "none", cursor: "pointer",
            background: filter === s ? "#6366f1" : "#1e2130",
            color: filter === s ? "#fff" : "#64748b", fontSize: 12, fontWeight: 600,
            textTransform: "capitalize", fontFamily: "inherit"
          }}>
            {s.replace("_", " ")}
          </button>
        ))}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {filtered.map(t => (
          <div key={t.id} style={{
            background: "#0f1117", border: "1px solid #1e2130", borderRadius: 12, padding: "16px 20px",
            borderLeft: `3px solid ${PRIORITY_META[t.priority]?.color}`,
            display: "flex", justifyContent: "space-between", alignItems: "center"
          }}>
            <div style={{ flex: 1 }}>
              <div style={{ color: "#e2e8f0", fontWeight: 600, marginBottom: 6 }}>{t.title}</div>
              <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <Badge type="status" value={t.status} />
                <Badge type="priority" value={t.priority} />
                {t.due_date && <span style={{ color: new Date(t.due_date) < new Date() ? "#ef4444" : "#475569", fontSize: 11 }}>Due {new Date(t.due_date).toLocaleDateString()}</span>}
              </div>
            </div>
          </div>
        ))}
        {filtered.length === 0 && <div style={{ color: "#475569", fontSize: 14, padding: 20 }}>No tasks found.</div>}
      </div>
    </div>
  );
}

// ─── Users Page (Admin only) ──────────────────────────────────────────────────
function UsersPage() {
  const [users, setUsers] = useState([]);
  useEffect(() => { apiFetch("/api/users").then(setUsers); }, []);

  return (
    <div>
      <h2 style={{ color: "#e2e8f0", fontSize: 22, fontWeight: 800, marginBottom: 24, fontFamily: "'Space Mono', monospace" }}>All Users</h2>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {users.map(u => (
          <div key={u.id} style={{
            display: "flex", alignItems: "center", gap: 16,
            background: "#0f1117", border: "1px solid #1e2130", borderRadius: 12, padding: "16px 20px"
          }}>
            <Avatar name={u.name} color={u.avatar_color} size={42} />
            <div style={{ flex: 1 }}>
              <div style={{ color: "#e2e8f0", fontWeight: 600 }}>{u.name}</div>
              <div style={{ color: "#475569", fontSize: 13 }}>{u.email}</div>
            </div>
            <span style={{
              padding: "4px 12px", borderRadius: 20,
              background: u.role === "admin" ? "#6366f122" : "#1e2130",
              color: u.role === "admin" ? "#6366f1" : "#64748b",
              fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em"
            }}>{u.role}</span>
            <div style={{ color: "#475569", fontSize: 12 }}>
              Joined {new Date(u.created_at).toLocaleDateString()}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── App Shell ────────────────────────────────────────────────────────────────
export default function App() {
  const { route, navigate } = useRoute();
  const [user, setUser] = useState(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      apiFetch("/api/auth/me").then(u => { setUser(u); setChecking(false); }).catch(() => { localStorage.removeItem("token"); setChecking(false); });
    } else { setChecking(false); }
  }, []);

  if (checking) return (
    <div style={{ minHeight: "100vh", background: "#080a0f", display: "flex", alignItems: "center", justifyContent: "center", color: "#6366f1", fontFamily: "'Space Mono', monospace" }}>
      Initializing...
    </div>
  );

  if (!user) return <AuthPage onAuth={u => { setUser(u); navigate("#/dashboard"); }} />;

  const logout = () => { localStorage.removeItem("token"); setUser(null); };

  let page;
  if (route.startsWith("#/projects/")) {
    const id = route.split("/")[2];
    page = <ProjectDetail projectId={id} user={user} />;
  } else if (route === "#/projects") { page = <ProjectsPage user={user} />; }
  else if (route === "#/tasks") { page = <MyTasksPage user={user} />; }
  else if (route === "#/users") { page = <UsersPage />; }
  else { page = <Dashboard user={user} />; }

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#080a0f", fontFamily: "'DM Sans', sans-serif" }}>
      <Sidebar user={user} route={route} navigate={navigate} onLogout={logout} />
      <main style={{ marginLeft: 220, flex: 1, padding: "36px 40px", minHeight: "100vh", overflowX: "auto" }}>
        {page}
      </main>
    </div>
  );
}
