import { useState } from "react";
import { X, Plus, Trash2, CalendarDays } from "lucide-react";

interface Props {
  open: boolean;
  onClose: () => void;
  onSubmit: (prompt: string) => void;
}

export function BriefingModal({ open, onClose, onSubmit }: Props) {
  const [watchlist, setWatchlist] = useState<string[]>(["AAPL", "NVDA", "TSLA"]);
  const [input, setInput] = useState("");
  const [focus, setFocus] = useState<"us" | "cn" | "crypto" | "all">("us");

  const addStock = () => {
    const sym = input.trim().toUpperCase();
    if (sym && !watchlist.includes(sym)) {
      setWatchlist(w => [...w, sym]);
    }
    setInput("");
  };

  const removeStock = (sym: string) => setWatchlist(w => w.filter(s => s !== sym));

  const handleSubmit = () => {
    if (watchlist.length === 0) return;

    const today = new Date().toLocaleDateString("zh-CN", { year: "numeric", month: "long", day: "numeric", weekday: "long" });
    const focusLabel = { us: "美股", cn: "A股", crypto: "加密货币", all: "全球市场" }[focus];
    const stockList = watchlist.join("、");

    const prompt = `请为我生成今日（${today}）的${focusLabel}投资简报，重点关注：${stockList}

请按以下结构输出简报：

## 🌍 今日宏观环境（2-3句话）
昨夜美股收盘情况、重要经济数据、美联储动态、地缘政治风险等宏观背景。

## 📊 关注个股快评
对以下每只股票分别给出：
${watchlist.map(s => `**${s}**：昨日涨跌幅 | 原因 | 技术面简评（RSI/均线/趋势）| 今日操作建议`).join("\n")}

## 📅 今日重要日程
- 即将发布的财报（今日/本周）
- 重要经济数据公布时间
- 美联储讲话或利率决议
- 其他可能影响市场的事件

## 🔄 板块轮动观察
当前哪些板块在吸筹？哪些板块资金在流出？对我的持股有何影响？

## 💡 今日操作建议（基于技术面）
针对关注的股票，给出具体的观察价位、支撑/压力位、以及"持有/关注买入机会/注意止损"的操作方向。

最后加一句免责声明：以上内容仅供学习参考，不构成投资建议。`;

    onSubmit(prompt);
    onClose();
  };

  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center p-0 sm:p-4" onClick={onClose}>
        <div className="bg-background rounded-t-2xl sm:rounded-2xl border shadow-2xl w-full sm:max-w-md max-h-[92vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-sky-500/10 flex items-center justify-center">
                <CalendarDays className="h-4 w-4 text-sky-500" />
              </div>
              <div>
                <h2 className="font-semibold text-sm">每日投资简报</h2>
                <p className="text-xs text-muted-foreground">设置关注股票，生成今日市场简报</p>
              </div>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-md hover:bg-muted text-muted-foreground transition-colors">
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="p-4 space-y-4">
            {/* Market focus */}
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-2">市场重点</p>
              <div className="grid grid-cols-4 gap-1.5">
                {([["us", "🇺🇸 美股"], ["cn", "🇨🇳 A股"], ["crypto", "₿ 加密"], ["all", "🌍 全市场"]] as const).map(([val, label]) => (
                  <button key={val} onClick={() => setFocus(val)}
                    className={`py-1.5 rounded-lg border text-xs font-medium transition-colors ${focus === val ? "border-primary bg-primary/5 text-primary" : "text-muted-foreground hover:bg-muted"}`}>
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Watchlist */}
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-2">关注股票</p>
              <div className="flex flex-wrap gap-1.5 mb-2 min-h-[28px]">
                {watchlist.map(sym => (
                  <span key={sym} className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-primary/8 border border-primary/20 text-xs font-medium">
                    {sym}
                    <button onClick={() => removeStock(sym)} className="text-muted-foreground hover:text-danger transition-colors">
                      <X className="h-2.5 w-2.5" />
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  value={input}
                  onChange={e => setInput(e.target.value.toUpperCase())}
                  onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addStock(); } }}
                  placeholder="输入股票代码，如 AAPL"
                  className="flex-1 px-3 py-2 rounded-lg border bg-muted/30 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 uppercase"
                />
                <button onClick={addStock} className="px-3 py-2 rounded-lg border bg-muted/30 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Quick add presets */}
            <div>
              <p className="text-xs text-muted-foreground mb-1.5">快速添加常见组合</p>
              <div className="flex flex-wrap gap-1.5">
                {[
                  { label: "科技七巨头", stocks: ["AAPL", "MSFT", "GOOGL", "AMZN", "NVDA", "META", "TSLA"] },
                  { label: "指数ETF", stocks: ["SPY", "QQQ", "IWM"] },
                  { label: "半导体", stocks: ["NVDA", "AMD", "INTC", "AVGO"] },
                ].map(preset => (
                  <button
                    key={preset.label}
                    onClick={() => setWatchlist(w => [...new Set([...w, ...preset.stocks])])}
                    className="px-2 py-1 rounded-lg border text-xs text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                  >
                    + {preset.label}
                  </button>
                ))}
                <button
                  onClick={() => setWatchlist([])}
                  className="px-2 py-1 rounded-lg border text-xs text-danger/70 hover:bg-danger/5 hover:text-danger transition-colors"
                >
                  <Trash2 className="h-3 w-3 inline mr-1" />清空
                </button>
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
              disabled={watchlist.length === 0}
              className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium disabled:opacity-40 hover:opacity-90 transition-opacity"
            >
              生成今日简报
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
