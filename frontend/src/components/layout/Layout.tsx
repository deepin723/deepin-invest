import { useEffect, useState } from "react";
import { Link, Outlet, useLocation, useSearchParams } from "react-router-dom";
import { LineChart, Bot, Moon, Sun, Plus, Trash2, Pencil, MessageSquare, ChevronsLeft, ChevronsRight, Settings, Layers, BookOpen, NotebookPen, HelpCircle, Menu, X, Home } from "lucide-react";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n";
import { useDarkMode } from "@/hooks/useDarkMode";
import { api, type SessionItem } from "@/lib/api";
import { useAgentStore } from "@/stores/agent";
import { ConnectionBanner } from "@/components/layout/ConnectionBanner";
import { GlossaryPanel } from "@/components/common/GlossaryPanel";
import { WorkflowGuide, useWorkflowGuide } from "@/components/common/WorkflowGuide";

const APP_VERSION = "v0.1.8";

const NAV = [
  { to: "/", icon: LineChart, key: "home" as const, label: null },
  { to: "/agent", icon: Bot, key: "agent" as const, label: null },
  { to: "/journal", icon: NotebookPen, key: "agent" as const, label: "日记" },
  { to: "/alpha-zoo", icon: Layers, key: "alphaZoo" as const, label: "Alpha Zoo" },
  { to: "/settings", icon: Settings, key: "settings" as const, label: null },
  { to: "/correlation", icon: LineChart, key: "correlation" as const, label: null },
];

// Bottom nav tabs shown on mobile (4 items max)
const BOTTOM_NAV = [
  { to: "/", icon: Home, label: "首页" },
  { to: "/agent", icon: Bot, label: "智能体" },
  { to: "/journal", icon: NotebookPen, label: "日记" },
];

/** Shared sessions list — used in both desktop sidebar and mobile drawer */
function SessionsList({
  sessions, sessionsLoading, activeSessionId, t,
  deleteTarget, setDeleteTarget,
  renameTarget, setRenameTarget,
  renameValue, setRenameValue,
  deleteSession, renameSession,
  onNavClick,
}: {
  sessions: SessionItem[];
  sessionsLoading: boolean;
  activeSessionId: string | null;
  t: Record<string, string>;
  deleteTarget: string | null;
  setDeleteTarget: (v: string | null) => void;
  renameTarget: string | null;
  setRenameTarget: (v: string | null) => void;
  renameValue: string;
  setRenameValue: (v: string) => void;
  deleteSession: (sid: string) => void;
  renameSession: (sid: string) => void;
  onNavClick?: () => void;
}) {
  return (
    <div className="flex-1 overflow-auto border-t mt-2 flex flex-col min-h-0">
      <div className="flex items-center justify-between px-4 py-2">
        <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
          <MessageSquare className="h-3.5 w-3.5" />
          {t.sessions}
        </span>
        <Link
          to="/agent"
          onClick={onNavClick}
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
          title={t.newChat}
        >
          <Plus className="h-3.5 w-3.5" />
        </Link>
      </div>
      <div className="px-2 pb-2 space-y-0.5 overflow-auto flex-1">
        {sessionsLoading ? (
          <div className="space-y-1.5 px-2 py-1">
            {[1, 2, 3].map((i) => <div key={i} className="h-7 rounded-md bg-muted/50 animate-pulse" />)}
          </div>
        ) : sessions.length === 0 ? (
          <p className="px-3 py-2 text-xs text-muted-foreground/60">{t.noSessions}</p>
        ) : null}
        {sessions.map((s) => {
          const isActive = s.session_id === activeSessionId;
          const isDeleting = deleteTarget === s.session_id;
          const isRenaming = renameTarget === s.session_id;
          return (
            <div key={s.session_id} className="group relative flex items-center">
              {isRenaming ? (
                <input
                  autoFocus
                  value={renameValue}
                  onChange={(e) => setRenameValue(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") renameSession(s.session_id); if (e.key === "Escape") setRenameTarget(null); }}
                  onBlur={() => renameSession(s.session_id)}
                  className="flex-1 min-w-0 pl-3 pr-2 py-1 rounded-md text-xs border border-primary bg-background outline-none"
                />
              ) : (
                <Link
                  to={`/agent?session=${s.session_id}`}
                  onClick={onNavClick}
                  className={cn(
                    "flex-1 min-w-0 pl-3 pr-14 py-1.5 rounded-md text-xs transition-colors truncate block border-l-2",
                    isActive
                      ? "border-l-primary bg-primary/10 text-primary font-medium"
                      : "border-l-transparent text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                  title={s.title || s.session_id}
                >
                  <span className="flex items-center gap-1.5">
                    <span className={cn(
                      "h-1.5 w-1.5 rounded-full shrink-0",
                      s.status === "failed" ? "bg-danger" : isActive ? "bg-warning" : "bg-success/60"
                    )} />
                    {s.title || s.session_id.slice(0, 16)}
                  </span>
                </Link>
              )}
              {!isRenaming && isDeleting ? (
                <div className="absolute right-0.5 flex items-center gap-0.5">
                  <button onClick={() => deleteSession(s.session_id)} className="p-1 text-danger hover:bg-danger/10 rounded text-[10px] font-medium">{t.confirmDelete}</button>
                  <button onClick={() => setDeleteTarget(null)} className="p-1 text-muted-foreground hover:bg-muted rounded text-[10px]">{t.cancelDelete}</button>
                </div>
              ) : !isRenaming ? (
                <div className="absolute right-1 opacity-0 group-hover:opacity-100 flex items-center gap-0.5 transition-opacity">
                  <button
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); setRenameTarget(s.session_id); setRenameValue(s.title || ""); }}
                    className="p-1 text-muted-foreground hover:text-foreground rounded"
                    title="Rename"
                  ><Pencil className="h-3 w-3" /></button>
                  <button
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); setDeleteTarget(s.session_id); }}
                    className="p-1 text-muted-foreground hover:text-danger rounded"
                    title={t.deleteConfirm}
                  ><Trash2 className="h-3 w-3" /></button>
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function Layout() {
  const { pathname } = useLocation();
  const [searchParams] = useSearchParams();
  const { t } = useI18n();
  const { dark, toggle } = useDarkMode();
  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(true);
  const sseStatus = useAgentStore(s => s.sseStatus);
  const sseRetryAttempt = useAgentStore(s => s.sseRetryAttempt);
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem("qa-sidebar") === "collapsed");
  const [glossaryOpen, setGlossaryOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { open: guideOpen, setOpen: setGuideOpen } = useWorkflowGuide();

  const activeSessionId = searchParams.get("session");

  useEffect(() => {
    localStorage.setItem("qa-sidebar", collapsed ? "collapsed" : "expanded");
  }, [collapsed]);

  // Close mobile drawer on navigation
  useEffect(() => { setDrawerOpen(false); }, [pathname]);

  const loadSessions = () => {
    api.listSessions()
      .then((list) => setSessions(Array.isArray(list) ? list : []))
      .catch(() => {})
      .finally(() => setSessionsLoading(false));
  };

  const isAgentPage = pathname.startsWith("/agent");
  useEffect(() => { loadSessions(); }, [isAgentPage, activeSessionId]);

  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [renameTarget, setRenameTarget] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");

  const deleteSession = async (sid: string) => {
    try {
      await api.deleteSession(sid);
      setSessions((prev) => prev.filter((s) => s.session_id !== sid));
    } catch { /* ignore */ }
    setDeleteTarget(null);
  };

  const renameSession = async (sid: string) => {
    if (!renameValue.trim()) { setRenameTarget(null); return; }
    try {
      await api.renameSession(sid, renameValue.trim());
      setSessions((prev) => prev.map((s) => s.session_id === sid ? { ...s, title: renameValue.trim() } : s));
    } catch { /* ignore */ }
    setRenameTarget(null);
  };

  const sessionListProps = {
    sessions, sessionsLoading, activeSessionId, t,
    deleteTarget, setDeleteTarget,
    renameTarget, setRenameTarget,
    renameValue, setRenameValue,
    deleteSession, renameSession,
  };

  return (
    <div className="flex h-[100dvh] bg-background">

      {/* ─── Desktop sidebar (hidden on mobile) ──────────────────────────── */}
      <aside className={cn(
        "hidden md:flex border-r bg-card flex-col shrink-0 transition-all duration-200",
        collapsed ? "w-12" : "w-64"
      )}>
        {/* Brand */}
        <div className={cn("border-b", collapsed ? "p-2 flex justify-center" : "p-4")}>
          <Link to="/" className={cn("flex items-center font-bold text-base tracking-tight", collapsed ? "justify-center" : "gap-2")}>
            <div className="h-6 w-6 rounded-md bg-gradient-to-br from-sky-500 to-emerald-500 flex items-center justify-center shrink-0">
              <LineChart className="h-3.5 w-3.5 text-white" />
            </div>
            {!collapsed && <span className="bg-gradient-to-r from-sky-500 to-emerald-500 bg-clip-text text-transparent">Deepin</span>}
          </Link>
        </div>

        {/* Nav */}
        <nav className={cn("space-y-0.5", collapsed ? "p-1" : "p-2")}>
          {NAV.map(({ to, icon: Icon, key, label }) => {
            const text = label ?? t[key];
            return (
              <Link
                key={to}
                to={to}
                className={cn(
                  "flex items-center rounded-md text-sm transition-colors",
                  collapsed ? "justify-center p-2" : "gap-3 px-3 py-2",
                  (to === "/" ? pathname === "/" : pathname.startsWith(to))
                    ? "bg-primary/10 text-primary font-medium"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
                title={collapsed ? text : undefined}
              >
                <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                {!collapsed && text}
              </Link>
            );
          })}
        </nav>

        {/* Sessions */}
        {!collapsed && <SessionsList {...sessionListProps} />}
        {collapsed && <div className="flex-1" />}

        {/* Footer */}
        <div className={cn("border-t", collapsed ? "p-1 flex flex-col items-center gap-1" : "p-3 space-y-2")}>
          {collapsed ? (
            <>
              <button onClick={() => setGlossaryOpen(true)} className="p-1.5 text-muted-foreground hover:text-foreground rounded transition-colors" title="投资词典">
                <BookOpen className="h-3.5 w-3.5" />
              </button>
              <button onClick={() => setGuideOpen(true)} className="p-1.5 text-muted-foreground hover:text-foreground rounded transition-colors" title="使用指南">
                <HelpCircle className="h-3.5 w-3.5" />
              </button>
              <button onClick={toggle} className="p-1.5 text-muted-foreground hover:text-foreground rounded transition-colors" title={dark ? t.lightMode : t.darkMode}>
                {dark ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
              </button>
              <button onClick={() => setCollapsed(false)} className="p-1.5 text-muted-foreground hover:text-foreground rounded transition-colors" title="Expand">
                <ChevronsRight className="h-3.5 w-3.5" />
              </button>
            </>
          ) : (
            <>
              <button onClick={() => setGlossaryOpen(true)} className="flex items-center gap-1.5 w-full text-xs text-muted-foreground hover:text-foreground transition-colors px-1 py-1 rounded hover:bg-muted">
                <BookOpen className="h-3.5 w-3.5 shrink-0" />投资词典
              </button>
              <button onClick={() => setGuideOpen(true)} className="flex items-center gap-1.5 w-full text-xs text-muted-foreground hover:text-foreground transition-colors px-1 py-1 rounded hover:bg-muted">
                <HelpCircle className="h-3.5 w-3.5 shrink-0" />使用指南
              </button>
              <div className="flex items-center justify-between">
                <button onClick={toggle} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
                  {dark ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
                  {dark ? t.lightMode : t.darkMode}
                </button>
                <button onClick={() => setCollapsed(true)} className="p-1 text-muted-foreground hover:text-foreground rounded transition-colors" title="Collapse">
                  <ChevronsLeft className="h-3.5 w-3.5" />
                </button>
              </div>
              <p className="text-xs text-muted-foreground/60">{APP_VERSION}</p>
            </>
          )}
        </div>
      </aside>

      {/* ─── Main content ─────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <ConnectionBanner status={sseStatus} retryAttempt={sseRetryAttempt} />

        {/* Mobile top bar */}
        <header className="flex md:hidden items-center justify-between px-4 h-12 border-b bg-card shrink-0 pt-safe">
          <Link to="/" className="flex items-center gap-2 font-bold text-base">
            <div className="h-6 w-6 rounded-md bg-gradient-to-br from-sky-500 to-emerald-500 flex items-center justify-center">
              <LineChart className="h-3.5 w-3.5 text-white" />
            </div>
            <span className="bg-gradient-to-r from-sky-500 to-emerald-500 bg-clip-text text-transparent">Deepin</span>
          </Link>
          <div className="flex items-center gap-1">
            <button onClick={() => setGlossaryOpen(true)} className="p-2 text-muted-foreground hover:text-foreground rounded-lg transition-colors" aria-label="投资词典">
              <BookOpen className="h-5 w-5" />
            </button>
            <button onClick={() => setDrawerOpen(true)} className="p-2 text-muted-foreground hover:text-foreground rounded-lg transition-colors" aria-label="菜单">
              <Menu className="h-5 w-5" />
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-auto pb-bottom-nav md:pb-0">
          <Outlet />
        </main>
      </div>

      {/* ─── Mobile bottom navigation ─────────────────────────────────────── */}
      <nav className="fixed bottom-0 inset-x-0 h-bottom-nav flex md:hidden items-stretch border-t bg-card/95 backdrop-blur-sm z-40">
        {BOTTOM_NAV.map(({ to, icon: Icon, label }) => {
          const isActive = to === "/" ? pathname === "/" : pathname.startsWith(to);
          return (
            <Link
              key={to}
              to={to}
              className={cn(
                "flex-1 flex flex-col items-center justify-center gap-0.5 text-[10px] font-medium transition-colors pb-safe",
                isActive ? "text-primary" : "text-muted-foreground"
              )}
            >
              <Icon className={cn("h-5 w-5", isActive && "stroke-[2.5]")} />
              {label}
            </Link>
          );
        })}
        {/* More button → opens drawer */}
        <button
          onClick={() => setDrawerOpen(true)}
          className="flex-1 flex flex-col items-center justify-center gap-0.5 text-[10px] font-medium text-muted-foreground transition-colors pb-safe"
        >
          <Menu className="h-5 w-5" />
          更多
        </button>
      </nav>

      {/* ─── Mobile slide-in drawer ────────────────────────────────────────── */}
      {drawerOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/40 z-50 md:hidden"
            onClick={() => setDrawerOpen(false)}
          />
          {/* Panel */}
          <div className="fixed left-0 top-0 h-full w-72 max-w-[85vw] bg-card z-50 md:hidden flex flex-col shadow-2xl pt-safe">
            {/* Drawer header */}
            <div className="flex items-center justify-between px-4 py-3 border-b">
              <Link to="/" onClick={() => setDrawerOpen(false)} className="flex items-center gap-2 font-bold">
                <div className="h-6 w-6 rounded-md bg-gradient-to-br from-sky-500 to-emerald-500 flex items-center justify-center">
                  <LineChart className="h-3.5 w-3.5 text-white" />
                </div>
                <span className="bg-gradient-to-r from-sky-500 to-emerald-500 bg-clip-text text-transparent">Deepin</span>
              </Link>
              <button onClick={() => setDrawerOpen(false)} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Nav links */}
            <nav className="p-2 space-y-0.5 border-b">
              {NAV.map(({ to, icon: Icon, key, label }) => {
                const text = label ?? t[key];
                const isActive = to === "/" ? pathname === "/" : pathname.startsWith(to);
                return (
                  <Link
                    key={to}
                    to={to}
                    onClick={() => setDrawerOpen(false)}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors",
                      isActive ? "bg-primary/10 text-primary font-medium" : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    {text}
                  </Link>
                );
              })}
            </nav>

            {/* Sessions list */}
            <SessionsList {...sessionListProps} onNavClick={() => setDrawerOpen(false)} />

            {/* Drawer footer */}
            <div className="border-t p-3 space-y-1 pb-safe">
              <button onClick={() => { setGuideOpen(true); setDrawerOpen(false); }} className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
                <HelpCircle className="h-4 w-4 shrink-0" />使用指南
              </button>
              <button onClick={toggle} className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
                {dark ? <Sun className="h-4 w-4 shrink-0" /> : <Moon className="h-4 w-4 shrink-0" />}
                {dark ? t.lightMode : t.darkMode}
              </button>
              <p className="text-xs text-muted-foreground/60 px-3 pt-1">{APP_VERSION}</p>
            </div>
          </div>
        </>
      )}

      <GlossaryPanel open={glossaryOpen} onClose={() => setGlossaryOpen(false)} />
      <WorkflowGuide open={guideOpen} onClose={() => setGuideOpen(false)} />
    </div>
  );
}
