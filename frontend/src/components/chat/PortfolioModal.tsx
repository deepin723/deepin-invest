import { useState } from "react";
import { X, Plus, Trash2, TrendingUp, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

interface Holding {
  symbol: string;
  shares: string;
  avgCost: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  onSubmit: (prompt: string) => void;
}

const EMPTY: Holding = { symbol: "", shares: "", avgCost: "" };

export function PortfolioModal({ open, onClose, onSubmit }: Props) {
  const [holdings, setHoldings] = useState<Holding[]>([
    { symbol: "", shares: "", avgCost: "" },
  ]);
  const [accountTotal, setAccountTotal] = useState("");
  const [riskTolerance, setRiskTolerance] = useState<"conservative" | "moderate" | "aggressive">("moderate");

  const addRow = () => setHoldings(h => [...h, { ...EMPTY }]);
  const removeRow = (i: number) => setHoldings(h => h.filter((_, idx) => idx !== i));
  const updateRow = (i: number, field: keyof Holding, value: string) =>
    setHoldings(h => h.map((r, idx) => idx === i ? { ...r, [field]: value } : r));

  // Calculate total invested amount (shares × avg cost)
  const totalInvested = holdings.reduce((sum, h) => {
    const s = parseFloat(h.shares);
    const c = parseFloat(h.avgCost);
    return sum + (isNaN(s) || isNaN(c) ? 0 : s * c);
  }, 0);

  const acctNum = parseFloat(accountTotal);
  const cashPct = acctNum > 0 && totalInvested > 0
    ? Math.max(0, ((acctNum - totalInvested) / acctNum * 100)).toFixed(1)
    : null;

  const handleSubmit = () => {
    const valid = holdings.filter(h => h.symbol.trim() && h.shares.trim());
    if (valid.length === 0) return;

    const riskLabel = { conservative: "保守型（低风险优先）", moderate: "稳健型（收益风险平衡）", aggressive: "激进型（追求高收益）" }[riskTolerance];
    const holdingsText = valid.map(h => {
      const posVal = h.avgCost && h.shares ? (parseFloat(h.shares) * parseFloat(h.avgCost)).toFixed(0) : null;
      const posPct = posVal && acctNum > 0 ? ` [账户占比约${(parseFloat(posVal) / acctNum * 100).toFixed(1)}%]` : "";
      return `- ${h.symbol.toUpperCase().trim()}：${h.shares}股${h.avgCost ? `，均价$${h.avgCost}${posVal ? `，持仓市值约$${posVal}` : ""}${posPct}` : ""}`;
    }).join("\n");
    const accountLine = accountTotal ? `账户总资金：$${accountTotal}${cashPct ? `（股票仓位约$${totalInvested.toFixed(0)}，现金约${cashPct}%）` : ""}` : "";

    const prompt = `请对我的美股持仓组合进行全面健康诊断，我的风险偏好是${riskLabel}。${accountLine ? `\n\n【账户情况】${accountLine}` : ""}

我目前持有以下仓位：
${holdingsText}

**重要提示：请在第一步先查出每只股票的下次财报日期！这是持仓管理最关键的信息。**

请逐项分析并给出专业建议：

0. **财报日期一览**（优先）— 列出每只股票的下次财报日期和距今天数，标注哪些在近30天内需要重点关注
1. **当前估值快照** — 用最新价格计算各仓位的浮盈浮亏（如有均价）${accountTotal ? `，以及占总资产的比例` : ""}
2. **持仓集中度** — 各仓位占组合的比重，是否过于集中在某行业/某股
3. **风险暴露** — 计算组合加权Beta，分析与S&P 500的相关性
4. **分散化评分** — 行业分布是否合理，给出0-10分及改进建议
5. **近期关键风险事件** — 财报日、分红除息日、可能影响股价的宏观事件
6. **个股技术面简评** — RSI、均线位置、趋势方向（一句话概括每只）
7. **持仓优化建议** — 建议减仓/加仓/对冲/观望的具体操作，并说明理由
8. **适合我风险偏好的调整方案** — 基于${riskLabel}给出具体的仓位调整建议

请用通俗语言，我是美股投资初学者。`;

    onSubmit(prompt);
    onClose();
    setHoldings([{ ...EMPTY }]);
  };

  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center p-0 sm:p-4" onClick={onClose}>
        <div className="bg-background rounded-t-2xl sm:rounded-2xl border shadow-2xl w-full sm:max-w-lg max-h-[92vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                <TrendingUp className="h-4 w-4 text-emerald-500" />
              </div>
              <div>
                <h2 className="font-semibold text-sm">持仓健康诊断</h2>
                <p className="text-xs text-muted-foreground">输入持仓，AI 生成全面诊断报告</p>
              </div>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-md hover:bg-muted text-muted-foreground transition-colors">
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Holdings input */}
          <div className="p-4 space-y-3">
            <div className="grid grid-cols-3 gap-2 text-xs font-medium text-muted-foreground px-1">
              <span>股票代码</span>
              <span>持有数量（股）</span>
              <span>持仓均价（$，可选）</span>
            </div>
            <div className="space-y-2 max-h-48 overflow-auto">
              {holdings.map((h, i) => (
                <div key={i} className="grid grid-cols-3 gap-2">
                  <input
                    value={h.symbol}
                    onChange={e => updateRow(i, "symbol", e.target.value.toUpperCase())}
                    placeholder="如 AAPL"
                    className="px-3 py-2 rounded-lg border bg-muted/30 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 uppercase"
                  />
                  <input
                    value={h.shares}
                    onChange={e => updateRow(i, "shares", e.target.value)}
                    placeholder="如 100"
                    type="number"
                    min="0"
                    className="px-3 py-2 rounded-lg border bg-muted/30 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />
                  <div className="flex gap-1">
                    <input
                      value={h.avgCost}
                      onChange={e => updateRow(i, "avgCost", e.target.value)}
                      placeholder="如 165.00"
                      type="number"
                      min="0"
                      step="0.01"
                      className="flex-1 px-3 py-2 rounded-lg border bg-muted/30 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                    />
                    {holdings.length > 1 && (
                      <button onClick={() => removeRow(i)} className="p-2 text-muted-foreground hover:text-danger rounded-lg hover:bg-muted transition-colors">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <button onClick={addRow} className="flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 transition-colors">
              <Plus className="h-3.5 w-3.5" /> 添加股票
            </button>

            {/* Account total */}
            <div className="pt-1 border-t">
              <div className="flex items-center gap-3 mt-3">
                <div className="flex-1">
                  <label className="text-xs font-medium text-muted-foreground block mb-1">
                    账户总资金（$）<span className="text-muted-foreground/60 font-normal">— 用于计算仓位占比，强烈建议填写</span>
                  </label>
                  <input
                    value={accountTotal}
                    onChange={e => setAccountTotal(e.target.value)}
                    placeholder="如 25000"
                    type="number" min="0"
                    className="w-full px-3 py-2 rounded-lg border bg-muted/30 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />
                </div>
              </div>
              {/* Cash position feedback */}
              {cashPct !== null && (
                <div className={cn(
                  "flex items-center gap-2 mt-2 px-3 py-2 rounded-lg border text-xs",
                  parseFloat(cashPct) < 10
                    ? "bg-amber-500/10 border-amber-500/25 text-amber-700 dark:text-amber-400"
                    : "bg-emerald-500/10 border-emerald-500/25 text-emerald-700 dark:text-emerald-400"
                )}>
                  {parseFloat(cashPct) < 10
                    ? <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                    : <span className="text-sm">✓</span>}
                  <span>
                    估算持仓市值约 <strong>${totalInvested.toFixed(0)}</strong>，
                    剩余现金约 <strong>{cashPct}%</strong>
                    {parseFloat(cashPct) < 10 ? " — ⚠️ 现金比例偏低，建议保持20-30%现金应对波动" : " — 现金储备充足"}
                  </span>
                </div>
              )}
            </div>

            {/* Risk tolerance */}
            <div className="pt-1">
              <p className="text-xs font-medium text-muted-foreground mb-2">我的风险偏好</p>
              <div className="grid grid-cols-3 gap-2">
                {([
                  ["conservative", "🛡️ 保守型", "追求稳定，规避波动"],
                  ["moderate", "⚖️ 稳健型", "收益与风险兼顾"],
                  ["aggressive", "🚀 激进型", "接受高波动求高收益"],
                ] as const).map(([val, label, desc]) => (
                  <button
                    key={val}
                    onClick={() => setRiskTolerance(val)}
                    className={`p-2 rounded-xl border text-left transition-colors ${riskTolerance === val ? "border-primary bg-primary/5" : "hover:bg-muted"}`}
                  >
                    <div className="text-xs font-medium">{label}</div>
                    <div className="text-[10px] text-muted-foreground mt-0.5">{desc}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-2 px-4 pb-4">
            <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm text-muted-foreground hover:bg-muted transition-colors">
              取消
            </button>
            <button
              onClick={handleSubmit}
              disabled={holdings.every(h => !h.symbol.trim())}
              className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium disabled:opacity-40 hover:opacity-90 transition-opacity"
            >
              开始诊断
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
