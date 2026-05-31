import { useState } from "react";
import { X, AlertTriangle, CheckCircle2, ChevronRight, ChevronLeft, Info } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  open: boolean;
  onClose: () => void;
  onSubmit: (prompt: string) => void;
}

interface FormData {
  symbol: string;
  amount: string;
  accountTotal: string;
  reason: string;
  maxLoss: string;
  exitCondition: string;
  earningsDate: string;
}

const EMPTY: FormData = {
  symbol: "", amount: "", accountTotal: "",
  reason: "", maxLoss: "10", exitCondition: "", earningsDate: "",
};

function RedFlag({ text }: { text: string }) {
  return (
    <div className="flex items-start gap-2 px-3 py-2 rounded-lg bg-amber-500/10 border border-amber-500/25 text-amber-700 dark:text-amber-400">
      <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
      <p className="text-xs">{text}</p>
    </div>
  );
}

function GoodSign({ text }: { text: string }) {
  return (
    <div className="flex items-start gap-2 px-3 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/25 text-emerald-700 dark:text-emerald-400">
      <CheckCircle2 className="h-3.5 w-3.5 shrink-0 mt-0.5" />
      <p className="text-xs">{text}</p>
    </div>
  );
}

export function TradePreCheckModal({ open, onClose, onSubmit }: Props) {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormData>({ ...EMPTY });

  const set = (field: keyof FormData, value: string) =>
    setForm(f => ({ ...f, [field]: value }));

  const positionPct = (() => {
    const amt = parseFloat(form.amount);
    const tot = parseFloat(form.accountTotal);
    if (!amt || !tot || tot <= 0) return null;
    return ((amt / tot) * 100).toFixed(1);
  })();

  const stopLossPrice = (() => {
    if (!form.amount || !form.maxLoss) return null;
    // We don't have a stock price, but we can show stop loss amount
    const amt = parseFloat(form.amount);
    const pct = parseFloat(form.maxLoss);
    if (!amt || !pct) return null;
    return (amt * (1 - pct / 100)).toFixed(0);
  })();

  const redFlags: string[] = [];
  const goodSigns: string[] = [];

  if (positionPct !== null) {
    const pct = parseFloat(positionPct);
    if (pct > 25) redFlags.push(`单只股票占仓 ${positionPct}%，对新手而言风险较高。专业建议：单只股票不超过总资金 20%。`);
    else if (pct > 20) redFlags.push(`仓位占比 ${positionPct}%，略高于建议的 20% 上限，请确认你对这只股票有足够把握。`);
    else goodSigns.push(`仓位占比 ${positionPct}%，仓位管理合理。`);
  }

  if (form.reason.trim().length > 10) goodSigns.push("你有明确的买入理由，这是好的交易纪律。");
  else if (form.reason.trim().length > 0) redFlags.push("买入理由过于模糊，无法评估逻辑是否成立。");

  if (form.maxLoss) {
    const pct = parseFloat(form.maxLoss);
    if (pct > 20) redFlags.push(`止损设置为 ${pct}%，亏损容忍度偏高。新手建议将单笔亏损控制在 10-15% 以内。`);
    else goodSigns.push(`止损意识良好，设定了 ${pct}% 的亏损上限。`);
  }

  if (form.exitCondition.trim().length > 5) goodSigns.push("你有明确的退出条件，这是区分投资和赌博的关键。");
  else redFlags.push("还没有设定退出条件——你需要在买入前就想好什么时候卖。");

  const canProceed0 = form.symbol.trim() && form.amount.trim() && form.accountTotal.trim();
  const canProceed1 = form.reason.trim().length > 5;

  const handleSubmit = () => {
    const sym = form.symbol.toUpperCase().trim();
    const posStr = positionPct ? `$${form.amount}（占账户总资金 $${form.accountTotal} 的 ${positionPct}%）` : `$${form.amount}`;
    const stopStr = stopLossPrice
      ? `下跌 ${form.maxLoss}% 时止损，即亏损约 $${(parseFloat(form.amount) * parseFloat(form.maxLoss) / 100).toFixed(0)}`
      : `可接受最大亏损 ${form.maxLoss}%`;

    const warningsText = redFlags.length > 0
      ? `\n⚠️ 预检查发现的风险点：\n${redFlags.map(f => `- ${f}`).join("\n")}\n请在分析中重点回应这些风险。\n`
      : "";

    const earningsLine = form.earningsDate.trim()
      ? `我已知悉下次财报日期：${form.earningsDate}`
      : `请在分析第一步先帮我查询 ${sym} 的下次财报日期，这很重要。`;

    const prompt = `我在考虑买入 ${sym} 股票，请帮我做一次完整的交易前审查。

【我的交易计划】
- 准备投入：${posStr}
- 买入理由：${form.reason}
- 风险控制：${stopStr}
- 退出条件：${form.exitCondition || "待你建议"}
- 财报情况：${earningsLine}
${warningsText}
请按以下顺序逐步分析：

**1. 财报日期警示**（首要）
告诉我 ${sym} 的下次财报日期是什么时候，距今多少天。持仓过财报有哪些风险？是否建议在财报前减仓或观望？

**2. 仓位合理性评估**
${positionPct ? `我打算投入账户 ${positionPct}% 的资金在这只股票上。` : ""}对一个开户不久的初学者，这样的仓位分配是否合理？

**3. 买入逻辑审查**
评估我的买入理由："${form.reason}"
- 这个逻辑是否成立？有什么我没想到的漏洞？
- 市场上是否有人持相反观点？他们的依据是什么？

**4. 当前技术面与进场时机**
- 现在买入是否是一个好的时机（RSI、均线位置、近期趋势）？
- 有没有更好的等待价位？
- 关键支撑位在哪里？

**5. 综合决策建议**
给我明确的建议：现在买入 / 等待更好价位 / 暂时观望，并说明原因。

**6. 如果我决定买入，给我具体执行方案**
- 分批建仓建议（一次买入还是分多次？）
- 具体止损价位设置
- 止盈目标与计划
- 持仓期间需要监控的关键指标

请用通俗易懂的语言，我是美股投资初学者。`;

    onSubmit(prompt);
    onClose();
    setStep(0);
    setForm({ ...EMPTY });
  };

  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center p-0 sm:p-4" onClick={onClose}>
        <div className="bg-background rounded-t-2xl sm:rounded-2xl border shadow-2xl w-full sm:max-w-lg max-h-[92vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
                <CheckCircle2 className="h-4 w-4 text-amber-500" />
              </div>
              <div>
                <h2 className="font-semibold text-sm">交易前检查清单</h2>
                <p className="text-xs text-muted-foreground">买入前先想清楚这几个问题</p>
              </div>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-md hover:bg-muted text-muted-foreground transition-colors">
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Step indicator */}
          <div className="flex items-center gap-1.5 px-4 pt-4">
            {["基本信息", "投资逻辑", "风险确认"].map((label, i) => (
              <div key={i} className="flex items-center gap-1.5 flex-1">
                <div className={cn(
                  "h-6 w-6 rounded-full flex items-center justify-center text-xs font-medium shrink-0",
                  i < step ? "bg-primary text-primary-foreground" :
                  i === step ? "bg-primary text-primary-foreground" :
                  "bg-muted text-muted-foreground"
                )}>
                  {i < step ? "✓" : i + 1}
                </div>
                <span className={cn("text-xs", i === step ? "text-foreground font-medium" : "text-muted-foreground")}>{label}</span>
                {i < 2 && <div className={cn("flex-1 h-px", i < step ? "bg-primary/60" : "bg-border")} />}
              </div>
            ))}
          </div>

          {/* Step content */}
          <div className="p-4 space-y-3 min-h-[280px]">
            {step === 0 && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground block mb-1">股票代码 *</label>
                    <input
                      value={form.symbol}
                      onChange={e => set("symbol", e.target.value.toUpperCase())}
                      placeholder="如 AAPL、NVDA"
                      className="w-full px-3 py-2 rounded-lg border bg-muted/30 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 uppercase"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground block mb-1">准备投入金额（$）*</label>
                    <input
                      value={form.amount}
                      onChange={e => set("amount", e.target.value)}
                      placeholder="如 5000"
                      type="number" min="0"
                      className="w-full px-3 py-2 rounded-lg border bg-muted/30 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-1">
                    账户总资金（$）*
                    <span className="ml-1 text-muted-foreground/60">— 用于计算仓位占比</span>
                  </label>
                  <input
                    value={form.accountTotal}
                    onChange={e => set("accountTotal", e.target.value)}
                    placeholder="如 25000"
                    type="number" min="0"
                    className="w-full px-3 py-2 rounded-lg border bg-muted/30 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />
                </div>

                {/* Position size live feedback */}
                {positionPct && (
                  <div className={cn(
                    "flex items-center gap-2 px-3 py-2.5 rounded-lg border text-sm",
                    parseFloat(positionPct) > 25 ? "bg-red-500/10 border-red-500/25 text-red-600 dark:text-red-400" :
                    parseFloat(positionPct) > 20 ? "bg-amber-500/10 border-amber-500/25 text-amber-600 dark:text-amber-400" :
                    "bg-emerald-500/10 border-emerald-500/25 text-emerald-600 dark:text-emerald-400"
                  )}>
                    {parseFloat(positionPct) > 20
                      ? <AlertTriangle className="h-4 w-4 shrink-0" />
                      : <CheckCircle2 className="h-4 w-4 shrink-0" />}
                    <span>
                      这笔投资将占你账户的 <strong>{positionPct}%</strong>
                      {parseFloat(positionPct) > 25 ? " — ⚠️ 仓位偏重，建议不超过 20%" :
                       parseFloat(positionPct) > 20 ? " — 略超建议上限 20%" :
                       " — 仓位合理"}
                    </span>
                  </div>
                )}

                <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/30 border">
                  <Info className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-0.5" />
                  <p className="text-xs text-muted-foreground">
                    专业建议：新手单只股票仓位不超过总资金的 <strong>20%</strong>，留足现金应对波动和更好的机会。
                  </p>
                </div>
              </>
            )}

            {step === 1 && (
              <>
                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-1">
                    用一句话说清楚：你为什么要买这只股票？*
                  </label>
                  <textarea
                    value={form.reason}
                    onChange={e => set("reason", e.target.value)}
                    placeholder="例：苹果即将推出AI功能，我认为会带动iPhone换机潮，推动收入增长"
                    rows={3}
                    className="w-full px-3 py-2 rounded-lg border bg-muted/30 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none"
                  />
                  <p className="text-xs text-muted-foreground mt-1">💡 如果你无法用一句话说清楚，可能你还没想清楚。</p>
                </div>

                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-1">
                    你的退出条件是什么？（达到什么情况你会卖出）
                  </label>
                  <textarea
                    value={form.exitCondition}
                    onChange={e => set("exitCondition", e.target.value)}
                    placeholder="例：涨到$200就卖出一半；或者iPhone出货数据不及预期时清仓"
                    rows={2}
                    className="w-full px-3 py-2 rounded-lg border bg-muted/30 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-1">
                    你知道下次财报日期吗？（选填，不知道AI会帮你查）
                  </label>
                  <input
                    value={form.earningsDate}
                    onChange={e => set("earningsDate", e.target.value)}
                    placeholder="如 2025年8月1日，或不知道"
                    className="w-full px-3 py-2 rounded-lg border bg-muted/30 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />
                  <p className="text-xs text-muted-foreground mt-1">⚠️ 持仓过财报像是打开盲盒——新手建议财报前做好应对预案。</p>
                </div>
              </>
            )}

            {step === 2 && (
              <>
                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-1">
                    如果股价下跌，你能接受的最大亏损是多少？
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      value={form.maxLoss}
                      onChange={e => set("maxLoss", e.target.value)}
                      type="number" min="1" max="50" step="1"
                      className="w-24 px-3 py-2 rounded-lg border bg-muted/30 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                    />
                    <span className="text-sm text-muted-foreground">%</span>
                    {form.amount && form.maxLoss && (
                      <span className="text-sm text-muted-foreground">
                        = 亏损约 <strong className="text-foreground">
                          ${(parseFloat(form.amount) * parseFloat(form.maxLoss) / 100).toFixed(0)}
                        </strong>
                      </span>
                    )}
                  </div>
                </div>

                {/* Pre-check summary */}
                <div className="space-y-2 pt-1">
                  <p className="text-xs font-medium text-muted-foreground">预检查结果</p>
                  {redFlags.map((f, i) => <RedFlag key={i} text={f} />)}
                  {goodSigns.map((g, i) => <GoodSign key={i} text={g} />)}
                  {redFlags.length === 0 && goodSigns.length > 0 && (
                    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/5 border border-primary/20">
                      <CheckCircle2 className="h-3.5 w-3.5 text-primary shrink-0" />
                      <p className="text-xs text-primary font-medium">看起来你已经想清楚了，可以进行深度分析。</p>
                    </div>
                  )}
                </div>

                <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/30 border">
                  <Info className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-0.5" />
                  <p className="text-xs text-muted-foreground">
                    AI 将基于以上信息帮你做完整的交易前审查，包括：财报日期查询、仓位合理性、买入逻辑漏洞、技术面时机、具体执行方案。
                  </p>
                </div>
              </>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-4 pb-4">
            <button
              onClick={() => step > 0 ? setStep(s => s - 1) : onClose()}
              className="flex items-center gap-1 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:bg-muted transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
              {step === 0 ? "取消" : "上一步"}
            </button>
            {step < 2 ? (
              <button
                onClick={() => setStep(s => s + 1)}
                disabled={step === 0 ? !canProceed0 : !canProceed1}
                className="flex items-center gap-1 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium disabled:opacity-40 hover:opacity-90 transition-opacity"
              >
                下一步 <ChevronRight className="h-4 w-4" />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                className="flex items-center gap-1 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity"
              >
                开始 AI 审查 <ChevronRight className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
