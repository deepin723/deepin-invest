import { useState, useEffect } from "react";
import { X, CalendarDays, CheckCircle2, TrendingUp, BookOpen, BarChart3, ChevronRight, ChevronLeft, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

const GUIDE_KEY = "deepin-guide-shown-v1";

const STEPS = [
  {
    icon: <CalendarDays className="h-6 w-6 text-sky-500" />,
    bg: "bg-sky-500/10",
    step: "每天早上",
    time: "5 分钟",
    title: "生成今日市场简报",
    desc: "在开盘前了解你的持股相关新闻、大盘动态、今日重要事件（财报/经济数据）。知道市场在关注什么，让你不被突发新闻打个措手不及。",
    action: "点击「今日简报」按钮，设置你的关注股票，生成今日简报",
    tip: "💡 即使不打算今天操作，也要看一眼。投资最怕被突然的财报、利率数据打个措手不及。",
  },
  {
    icon: <CheckCircle2 className="h-6 w-6 text-amber-500" />,
    bg: "bg-amber-500/10",
    step: "准备买入前",
    time: "必做，不可省略",
    title: "运行交易前检查清单",
    desc: "在你准备买任何一只股票前，强制自己回答3个问题：为什么买？亏多少我会认输？什么时候卖？这不是限制你，这是在帮你过滤冲动交易。",
    action: "点击「+」菜单中的「交易前检查」，填写完三步，再让 AI 帮你审查",
    tip: "⚠️ 有研究表明，仅仅这一步就能让新手散户的亏损概率降低40%以上。很多钱是被冲动赔掉的，不是被市场赔掉的。",
  },
  {
    icon: <BookOpen className="h-6 w-6 text-violet-500" />,
    bg: "bg-violet-500/10",
    step: "买入后 2 分钟内",
    time: "趁热记录",
    title: "在交易日记写下你的决策",
    desc: "买完立刻记录：买入原因、止损价、止盈目标。不要等「等我想好了再写」——人类有一种能力叫事后合理化，会把错误的决策解释得很有道理。趁热写，真实。",
    action: "点击左侧导航「日记」，新建交易记录，填写你的投资理由",
    tip: "📔 这是最低成本的投资教育。3个月后回看，你会清楚看到自己的决策模式和错误规律。",
  },
  {
    icon: <TrendingUp className="h-6 w-6 text-emerald-500" />,
    bg: "bg-emerald-500/10",
    step: "每周一次",
    time: "10 分钟",
    title: "运行持仓健康诊断",
    desc: "查看你的组合：仓位是否过重？某只股票即将发财报？整体Beta风险是否在你能承受的范围内？定期体检比临时抱佛脚强。",
    action: "点击「持仓诊断」按钮，填入当前持仓和账户总额，获取全面报告",
    tip: "💼 重点关注报告中的「财报日期一览」——持仓过财报是新手最常见的意外亏损来源之一。",
  },
  {
    icon: <BarChart3 className="h-6 w-6 text-rose-500" />,
    bg: "bg-rose-500/10",
    step: "每月一次",
    time: "用 AI 复盘",
    title: "分析交易日记，找出规律",
    desc: "积累了10条以上的交易记录后，让 AI 帮你做深度复盘：你有没有处置效应？有没有追涨杀跌？盈利和亏损的交易有什么模式差异？",
    action: "打开「日记」页面，点击「AI 复盘分析」，获取你的个人交易行为报告",
    tip: "🔍 大多数散户的问题不是选股，而是行为：赢了跑太早，亏了拿太久。AI能帮你看清自己。",
  },
];

interface Props {
  open: boolean;
  onClose: () => void;
}

export function WorkflowGuide({ open, onClose }: Props) {
  const [step, setStep] = useState(0);
  const isLast = step === STEPS.length - 1;
  const current = STEPS[step];

  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
        <div className="bg-background rounded-2xl border shadow-2xl w-full max-w-lg" onClick={e => e.stopPropagation()}>
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="font-semibold text-sm">你的投资工作流</span>
              <span className="text-xs text-muted-foreground">— 5步建立专业习惯</span>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-md hover:bg-muted text-muted-foreground"><X className="h-4 w-4" /></button>
          </div>

          {/* Progress dots */}
          <div className="flex items-center justify-center gap-1.5 pt-4 px-4">
            {STEPS.map((_, i) => (
              <button key={i} onClick={() => setStep(i)}
                className={cn("h-1.5 rounded-full transition-all", i === step ? "w-6 bg-primary" : "w-1.5 bg-muted-foreground/30 hover:bg-muted-foreground/50")} />
            ))}
          </div>

          {/* Content */}
          <div className="p-6 space-y-4">
            <div className="flex items-start gap-4">
              <div className={cn("h-12 w-12 rounded-xl flex items-center justify-center shrink-0", current.bg)}>
                {current.icon}
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full">{current.step}</span>
                  <span className="text-xs text-muted-foreground">{current.time}</span>
                </div>
                <h3 className="font-semibold mt-1">{current.title}</h3>
              </div>
            </div>

            <p className="text-sm text-muted-foreground leading-relaxed">{current.desc}</p>

            <div className="bg-muted/40 rounded-xl p-3 space-y-1">
              <p className="text-xs font-medium text-foreground">如何操作：</p>
              <p className="text-xs text-muted-foreground leading-relaxed">{current.action}</p>
            </div>

            <div className="bg-primary/5 border border-primary/15 rounded-xl p-3">
              <p className="text-xs text-foreground/80 leading-relaxed">{current.tip}</p>
            </div>
          </div>

          {/* Step overview (mini) */}
          <div className="px-6 pb-3">
            <div className="flex items-center gap-1 overflow-x-auto pb-1">
              {STEPS.map((s, i) => (
                <button key={i} onClick={() => setStep(i)}
                  className={cn("flex items-center gap-1 px-2 py-1 rounded-lg text-xs whitespace-nowrap transition-colors shrink-0",
                    i === step ? "bg-primary/10 text-primary font-medium" : "text-muted-foreground hover:bg-muted"
                  )}>
                  <span className={cn("h-1.5 w-1.5 rounded-full", i <= step ? "bg-primary" : "bg-muted-foreground/40")} />
                  {s.step}
                </button>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-4 pb-4">
            <button onClick={() => step > 0 && setStep(s => s - 1)}
              className={cn("flex items-center gap-1 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:bg-muted transition-colors",
                step === 0 && "invisible")}>
              <ChevronLeft className="h-4 w-4" /> 上一步
            </button>
            {isLast ? (
              <button onClick={onClose}
                className="flex items-center gap-1.5 px-5 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity">
                开始使用 Deepin 🚀
              </button>
            ) : (
              <button onClick={() => setStep(s => s + 1)}
                className="flex items-center gap-1 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity">
                下一步 <ChevronRight className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

export function useWorkflowGuide() {
  const [shown, setShown] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const alreadySeen = localStorage.getItem(GUIDE_KEY);
    if (!alreadySeen) {
      // Delay so the page has time to load first
      const t = setTimeout(() => {
        setOpen(true);
        localStorage.setItem(GUIDE_KEY, "1");
      }, 800);
      return () => clearTimeout(t);
    }
  }, []);

  return { open, setOpen, shown, setShown };
}
