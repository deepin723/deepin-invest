import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, X, TrendingUp, TrendingDown, BookOpen, Pencil, CheckCircle2, Clock, BarChart3, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

export interface JournalEntry {
  id: string;
  date: string;
  symbol: string;
  side: "BUY" | "SELL";
  shares: number;
  price: number;
  thesis: string;
  stopLoss?: number;
  takeProfit?: string;
  status: "open" | "closed";
  exitPrice?: number;
  exitDate?: string;
  exitReason?: string;
  notes?: string;
  createdAt: number;
}

const STORAGE_KEY = "deepin-journal-v1";

function load(): JournalEntry[] {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"); }
  catch { return []; }
}
function save(entries: JournalEntry[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}
function genId() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }

interface EntryFormData {
  date: string; symbol: string; side: "BUY" | "SELL";
  shares: string; price: string; thesis: string;
  stopLoss: string; takeProfit: string; notes: string;
}

const EMPTY_FORM: EntryFormData = {
  date: new Date().toISOString().slice(0, 10),
  symbol: "", side: "BUY", shares: "", price: "",
  thesis: "", stopLoss: "", takeProfit: "", notes: "",
};

function EntryModal({ entry, onSave, onClose }: {
  entry?: JournalEntry | null;
  onSave: (data: EntryFormData) => void;
  onClose: () => void;
}) {
  const [form, setForm] = useState<EntryFormData>(
    entry ? {
      date: entry.date, symbol: entry.symbol, side: entry.side,
      shares: String(entry.shares), price: String(entry.price),
      thesis: entry.thesis, stopLoss: entry.stopLoss ? String(entry.stopLoss) : "",
      takeProfit: entry.takeProfit || "", notes: entry.notes || "",
    } : { ...EMPTY_FORM }
  );

  const set = (f: Partial<EntryFormData>) => setForm(p => ({ ...p, ...f }));
  const posValue = parseFloat(form.shares) * parseFloat(form.price);

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-background rounded-2xl border shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b sticky top-0 bg-background">
          <h2 className="font-semibold text-sm">{entry ? "编辑记录" : "记录新交易"}</h2>
          <button onClick={onClose} className="p-1.5 rounded-md hover:bg-muted text-muted-foreground"><X className="h-4 w-4" /></button>
        </div>
        <div className="p-4 space-y-3">
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="text-xs text-muted-foreground block mb-1">日期 *</label>
              <input type="date" value={form.date} onChange={e => set({ date: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border bg-muted/30 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">股票代码 *</label>
              <input value={form.symbol} onChange={e => set({ symbol: e.target.value.toUpperCase() })}
                placeholder="如 AAPL"
                className="w-full px-3 py-2 rounded-lg border bg-muted/30 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 uppercase" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">方向 *</label>
              <div className="flex rounded-lg border overflow-hidden">
                {(["BUY", "SELL"] as const).map(s => (
                  <button key={s} onClick={() => set({ side: s })}
                    className={cn("flex-1 py-2 text-xs font-medium transition-colors",
                      form.side === s
                        ? s === "BUY" ? "bg-emerald-500 text-white" : "bg-red-500 text-white"
                        : "text-muted-foreground hover:bg-muted")}>
                    {s === "BUY" ? "买入" : "卖出"}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-muted-foreground block mb-1">股数 *</label>
              <input value={form.shares} onChange={e => set({ shares: e.target.value })} type="number" min="0" placeholder="如 100"
                className="w-full px-3 py-2 rounded-lg border bg-muted/30 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">成交价（$）*</label>
              <input value={form.price} onChange={e => set({ price: e.target.value })} type="number" min="0" step="0.01" placeholder="如 165.50"
                className="w-full px-3 py-2 rounded-lg border bg-muted/30 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" />
            </div>
          </div>
          {!isNaN(posValue) && posValue > 0 && (
            <div className="text-xs text-muted-foreground px-1">
              交易金额：<strong className="text-foreground">${posValue.toFixed(2)}</strong>
            </div>
          )}

          <div>
            <label className="text-xs text-muted-foreground block mb-1">
              买入理由（投资逻辑）* <span className="text-muted-foreground/60">— 写清楚，3个月后会感谢自己</span>
            </label>
            <textarea value={form.thesis} onChange={e => set({ thesis: e.target.value })} rows={3}
              placeholder="例：NVDA的AI芯片在数据中心的需求仍在高速增长，2025年Blackwell出货预期超预期，当前PE合理。预计持有到年底。"
              className="w-full px-3 py-2 rounded-lg border bg-muted/30 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-muted-foreground block mb-1">止损价格（$）</label>
              <input value={form.stopLoss} onChange={e => set({ stopLoss: e.target.value })} type="number" min="0" step="0.01"
                placeholder="如 148.00"
                className="w-full px-3 py-2 rounded-lg border bg-muted/30 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">止盈目标或卖出条件</label>
              <input value={form.takeProfit} onChange={e => set({ takeProfit: e.target.value })}
                placeholder="如 $200，或财报后评估"
                className="w-full px-3 py-2 rounded-lg border bg-muted/30 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" />
            </div>
          </div>
          <div>
            <label className="text-xs text-muted-foreground block mb-1">附加备注（可选）</label>
            <input value={form.notes} onChange={e => set({ notes: e.target.value })}
              placeholder="如：分批买入第一批，还有1/3仓位等待回调"
              className="w-full px-3 py-2 rounded-lg border bg-muted/30 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" />
          </div>
          {form.side === "BUY" && !form.stopLoss && (
            <div className="flex items-start gap-2 px-3 py-2 rounded-lg bg-amber-500/10 border border-amber-500/25">
              <AlertTriangle className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <p className="text-xs text-amber-700 dark:text-amber-400">建议设置止损价格。没有止损计划的交易，亏损没有上限。</p>
            </div>
          )}
        </div>
        <div className="flex justify-end gap-2 px-4 pb-4">
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm text-muted-foreground hover:bg-muted">取消</button>
          <button
            onClick={() => {
              if (!form.symbol || !form.shares || !form.price || !form.thesis.trim()) return;
              onSave(form);
            }}
            disabled={!form.symbol || !form.shares || !form.price || !form.thesis.trim()}
            className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium disabled:opacity-40 hover:opacity-90">
            保存记录
          </button>
        </div>
      </div>
    </div>
  );
}

function CloseModal({ entry, onClose, onSave }: {
  entry: JournalEntry; onClose: () => void;
  onSave: (exitPrice: number, exitDate: string, exitReason: string) => void;
}) {
  const [exitPrice, setExitPrice] = useState("");
  const [exitDate, setExitDate] = useState(new Date().toISOString().slice(0, 10));
  const [exitReason, setExitReason] = useState("");

  const pnl = exitPrice && entry.price
    ? ((parseFloat(exitPrice) - entry.price) / entry.price * 100 * (entry.side === "BUY" ? 1 : -1))
    : null;
  const pnlDollar = exitPrice
    ? ((parseFloat(exitPrice) - entry.price) * entry.shares * (entry.side === "BUY" ? 1 : -1))
    : null;

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-background rounded-2xl border shadow-2xl w-full max-w-sm" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="font-semibold text-sm">平仓记录 — {entry.symbol}</h2>
          <button onClick={onClose} className="p-1.5 hover:bg-muted rounded-md text-muted-foreground"><X className="h-4 w-4" /></button>
        </div>
        <div className="p-4 space-y-3">
          <div className="text-xs text-muted-foreground bg-muted/30 rounded-lg px-3 py-2">
            买入价：<strong className="text-foreground">${entry.price}</strong> · 持有：<strong className="text-foreground">{entry.shares} 股</strong>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-muted-foreground block mb-1">平仓价格（$）*</label>
              <input value={exitPrice} onChange={e => setExitPrice(e.target.value)} type="number" min="0" step="0.01" placeholder="如 185.00"
                className="w-full px-3 py-2 rounded-lg border bg-muted/30 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">平仓日期</label>
              <input type="date" value={exitDate} onChange={e => setExitDate(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border bg-muted/30 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" />
            </div>
          </div>
          {pnl !== null && pnlDollar !== null && (
            <div className={cn("px-3 py-2 rounded-lg border text-sm font-medium flex items-center gap-2",
              pnl >= 0 ? "bg-emerald-500/10 border-emerald-500/25 text-emerald-600 dark:text-emerald-400" : "bg-red-500/10 border-red-500/25 text-red-600 dark:text-red-400")}>
              {pnl >= 0 ? <TrendingUp className="h-4 w-4 shrink-0" /> : <TrendingDown className="h-4 w-4 shrink-0" />}
              {pnl >= 0 ? "盈利" : "亏损"} {Math.abs(pnl).toFixed(2)}%（${Math.abs(pnlDollar).toFixed(2)}）
            </div>
          )}
          <div>
            <label className="text-xs text-muted-foreground block mb-1">平仓原因（复盘用）</label>
            <input value={exitReason} onChange={e => setExitReason(e.target.value)}
              placeholder="例：达到止盈目标 / 基本面变化 / 止损触发"
              className="w-full px-3 py-2 rounded-lg border bg-muted/30 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" />
          </div>
        </div>
        <div className="flex justify-end gap-2 px-4 pb-4">
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm text-muted-foreground hover:bg-muted">取消</button>
          <button onClick={() => exitPrice && onSave(parseFloat(exitPrice), exitDate, exitReason)}
            disabled={!exitPrice}
            className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium disabled:opacity-40 hover:opacity-90">
            确认平仓
          </button>
        </div>
      </div>
    </div>
  );
}

export function Journal({ onAnalyze }: { onAnalyze?: (prompt: string) => void }) {
  const [entries, setEntries] = useState<JournalEntry[]>(load);
  const [filter, setFilter] = useState<"open" | "closed" | "all">("all");
  const [addOpen, setAddOpen] = useState(false);
  const [editEntry, setEditEntry] = useState<JournalEntry | null>(null);
  const [closeEntry, setCloseEntry] = useState<JournalEntry | null>(null);

  useEffect(() => { save(entries); }, [entries]);

  const shown = entries.filter(e =>
    filter === "all" ? true : filter === "open" ? e.status === "open" : e.status === "closed"
  ).sort((a, b) => b.createdAt - a.createdAt);

  const addEntry = (form: EntryFormData) => {
    const e: JournalEntry = {
      id: genId(), date: form.date, symbol: form.symbol, side: form.side,
      shares: parseFloat(form.shares), price: parseFloat(form.price),
      thesis: form.thesis, stopLoss: form.stopLoss ? parseFloat(form.stopLoss) : undefined,
      takeProfit: form.takeProfit || undefined, notes: form.notes || undefined,
      status: "open", createdAt: Date.now(),
    };
    setEntries(prev => [e, ...prev]);
    setAddOpen(false);
  };

  const editSave = (form: EntryFormData) => {
    if (!editEntry) return;
    setEntries(prev => prev.map(e => e.id === editEntry.id ? {
      ...e, date: form.date, symbol: form.symbol, side: form.side,
      shares: parseFloat(form.shares), price: parseFloat(form.price),
      thesis: form.thesis, stopLoss: form.stopLoss ? parseFloat(form.stopLoss) : undefined,
      takeProfit: form.takeProfit || undefined, notes: form.notes || undefined,
    } : e));
    setEditEntry(null);
  };

  const closeTrade = (exitPrice: number, exitDate: string, exitReason: string) => {
    if (!closeEntry) return;
    setEntries(prev => prev.map(e => e.id === closeEntry.id ? {
      ...e, status: "closed", exitPrice, exitDate, exitReason,
    } : e));
    setCloseEntry(null);
  };

  const deleteEntry = (id: string) => setEntries(prev => prev.filter(e => e.id !== id));

  // Stats
  const closedEntries = entries.filter(e => e.status === "closed" && e.exitPrice);
  const wins = closedEntries.filter(e => {
    const pnl = (e.exitPrice! - e.price) * (e.side === "BUY" ? 1 : -1);
    return pnl > 0;
  });
  const winRate = closedEntries.length > 0 ? (wins.length / closedEntries.length * 100).toFixed(0) : null;
  const totalPnlDollar = closedEntries.reduce((sum, e) => {
    return sum + (e.exitPrice! - e.price) * e.shares * (e.side === "BUY" ? 1 : -1);
  }, 0);

  const openEntries = entries.filter(e => e.status === "open");

  const handleAiAnalysis = () => {
    if (!onAnalyze || entries.length === 0) return;
    const lines = entries.slice(0, 20).map(e => {
      const pnl = e.exitPrice
        ? `${((e.exitPrice - e.price) / e.price * 100 * (e.side === "BUY" ? 1 : -1)).toFixed(1)}%`
        : "持仓中";
      return `- ${e.date} ${e.side === "BUY" ? "买入" : "卖出"} ${e.symbol} ${e.shares}股@$${e.price}（${pnl}）理由：${e.thesis.slice(0, 50)}`;
    }).join("\n");

    const prompt = `请帮我深度分析以下 ${entries.length} 条交易记录，我是美股投资初学者，开户不久：

${lines}

请从以下角度给我诚实的复盘和建议：

1. **胜率与盈亏比分析** — 我的整体胜率如何？盈利的交易和亏损的交易有什么规律？
2. **行为偏差诊断** — 我有没有显现出以下偏差？处置效应（赢了就跑亏了死守）、FOMO追涨、确认偏见
3. **买入理由质量评估** — 我的投资逻辑是否清晰？有哪些是扎实的分析，哪些是情绪驱动？
4. **持仓时间分析** — 我是否有过早止盈或过晚止损的倾向？
5. **集中度风险** — 我是否在某些行业或股票上过度集中？
6. **最值得改进的3个习惯** — 基于以上分析，给我最具体的改进建议
7. **给初学者的鼓励** — 在严格分析之后，也请告诉我做得好的地方

请用直接、诚实但鼓励的语气，我希望通过这次复盘真正提升。`;
    onAnalyze(prompt);
  };

  return (
    <div className="flex flex-col h-full p-4 md:p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="font-bold text-lg flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" />
            交易日记
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">记录每一笔决策，让 AI 帮你复盘成长</p>
        </div>
        <button onClick={() => setAddOpen(true)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity">
          <Plus className="h-4 w-4" /> 新记录
        </button>
      </div>

      {/* Stats bar */}
      {entries.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          {[
            { label: "总记录", value: String(entries.length), icon: BarChart3, color: "text-primary" },
            { label: "持仓中", value: String(openEntries.length), icon: Clock, color: "text-sky-500" },
            { label: "胜率", value: winRate ? `${winRate}%` : "—", icon: CheckCircle2, color: winRate && parseInt(winRate) >= 50 ? "text-emerald-500" : "text-amber-500" },
            {
              label: "已实现盈亏", value: closedEntries.length > 0 ? `${totalPnlDollar >= 0 ? "+" : ""}$${totalPnlDollar.toFixed(0)}` : "—",
              icon: totalPnlDollar >= 0 ? TrendingUp : TrendingDown,
              color: totalPnlDollar >= 0 ? "text-emerald-500" : "text-red-500"
            },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="border rounded-xl p-3 space-y-1">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Icon className={cn("h-3.5 w-3.5", color)} />
                {label}
              </div>
              <div className={cn("text-lg font-bold tabular-nums", color)}>{value}</div>
            </div>
          ))}
        </div>
      )}

      {/* Filter + AI button */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <div className="flex gap-1">
          {(["all", "open", "closed"] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={cn("px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
                filter === f ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted")}>
              {f === "all" ? "全部" : f === "open" ? "持仓中" : "已平仓"}
            </button>
          ))}
        </div>
        {entries.length >= 2 && onAnalyze && (
          <button onClick={handleAiAnalysis}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium text-primary hover:bg-primary/5 transition-colors">
            ✨ AI 复盘分析
          </button>
        )}
      </div>

      {/* Entry list */}
      {shown.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center space-y-3 text-muted-foreground">
          <BookOpen className="h-12 w-12 opacity-20" />
          <div>
            <p className="font-medium">还没有交易记录</p>
            <p className="text-sm mt-1">点击「新记录」，记录你的每一笔交易和投资理由</p>
            <p className="text-xs mt-2 text-muted-foreground/60">3个月后，你会感谢今天写下的这些文字</p>
          </div>
        </div>
      ) : (
        <div className="space-y-2 overflow-auto flex-1">
          {shown.map(entry => {
            const pnlPct = entry.exitPrice
              ? ((entry.exitPrice - entry.price) / entry.price * 100 * (entry.side === "BUY" ? 1 : -1))
              : null;
            const pnlDollar = entry.exitPrice
              ? ((entry.exitPrice - entry.price) * entry.shares * (entry.side === "BUY" ? 1 : -1))
              : null;
            const daysSince = Math.floor((Date.now() - new Date(entry.date).getTime()) / 86400000);

            return (
              <div key={entry.id} className={cn(
                "border rounded-xl p-4 space-y-2 transition-colors",
                entry.status === "open" ? "border-l-4 border-l-sky-500/60" : "opacity-80"
              )}>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-sm">{entry.symbol}</span>
                    <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium",
                      entry.side === "BUY" ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : "bg-red-500/10 text-red-600 dark:text-red-400")}>
                      {entry.side === "BUY" ? "买入" : "卖出"}
                    </span>
                    <span className="text-xs text-muted-foreground">{entry.shares}股 @ ${entry.price}</span>
                    <span className="text-xs text-muted-foreground">·</span>
                    <span className="text-xs text-muted-foreground">{entry.date}（{daysSince}天前）</span>
                    {entry.status === "open" ? (
                      <span className="px-2 py-0.5 rounded-full text-xs bg-sky-500/10 text-sky-600 dark:text-sky-400">持仓中</span>
                    ) : pnlPct !== null ? (
                      <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium",
                        pnlPct >= 0 ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : "bg-red-500/10 text-red-600 dark:text-red-400")}>
                        {pnlPct >= 0 ? "+" : ""}{pnlPct.toFixed(2)}% (${pnlDollar! >= 0 ? "+" : ""}{pnlDollar!.toFixed(0)})
                      </span>
                    ) : null}
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button onClick={() => setEditEntry(entry)} className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors" title="编辑">
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    {entry.status === "open" && (
                      <button onClick={() => setCloseEntry(entry)} className="p-1.5 text-muted-foreground hover:text-sky-500 hover:bg-muted rounded-md transition-colors" title="记录平仓">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                    <button onClick={() => deleteEntry(entry.id)} className="p-1.5 text-muted-foreground hover:text-red-500 hover:bg-muted rounded-md transition-colors" title="删除">
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                  <span className="font-medium text-foreground/80">理由：</span>{entry.thesis}
                </p>

                <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                  {entry.stopLoss && (
                    <span className="text-red-500/80">🛑 止损 ${entry.stopLoss}</span>
                  )}
                  {entry.takeProfit && (
                    <span className="text-emerald-600/80">🎯 目标 {entry.takeProfit}</span>
                  )}
                  {entry.exitReason && (
                    <span>平仓原因：{entry.exitReason}</span>
                  )}
                  {entry.notes && (
                    <span className="text-muted-foreground/60">{entry.notes}</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {addOpen && <EntryModal onSave={addEntry} onClose={() => setAddOpen(false)} />}
      {editEntry && <EntryModal entry={editEntry} onSave={editSave} onClose={() => setEditEntry(null)} />}
      {closeEntry && <CloseModal entry={closeEntry} onSave={closeTrade} onClose={() => setCloseEntry(null)} />}
    </div>
  );
}

export function JournalWrapper() {
  const navigate = useNavigate();
  const handleAnalyze = (prompt: string) => {
    sessionStorage.setItem("deepin-pending-prompt", prompt);
    navigate("/agent");
  };
  return <Journal onAnalyze={handleAnalyze} />;
}
