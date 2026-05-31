import { useState } from "react";
import { TrendingUp, Globe, Sparkles, Users, UserCircle2, NotebookPen, Camera, LineChart, CalendarDays, GraduationCap } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { PortfolioModal } from "@/components/chat/PortfolioModal";
import { BriefingModal } from "@/components/chat/BriefingModal";

interface Example {
  title: string;
  desc: string;
  prompt: string;
}

interface Category {
  label: string;
  icon: React.ReactNode;
  color: string;
  examples: Example[];
}

const CATEGORIES: Category[] = [
  {
    label: "📸 图表识别分析",
    icon: <Camera className="h-4 w-4" />,
    color: "text-pink-500 border-pink-500/30 hover:border-pink-500/60 hover:bg-pink-500/5",
    examples: [
      {
        title: "K线图形态识别",
        desc: "上传K线截图，AI识别趋势形态与操作建议",
        prompt: "我上传了一张K线图截图，请帮我：\n1. 识别当前的图表形态（如头肩顶、双底、旗形等）\n2. 判断当前趋势方向和强度\n3. 找出关键支撑位和压力位（给出具体价格区间）\n4. 分析成交量配合情况\n5. 基于技术分析给出短期操作建议（买入/卖出/观望）\n6. 设定合理的止损和止盈目标位",
      },
      {
        title: "持仓截图分析",
        desc: "上传券商持仓截图，AI解读盈亏与风险",
        prompt: "我上传了我的持仓截图，请帮我：\n1. 解读当前各仓位的盈亏状况\n2. 分析持仓集中度是否合理\n3. 识别哪些仓位风险较高需要关注\n4. 给出整体组合的优化建议\n5. 指出需要重点跟踪的股票",
      },
      {
        title: "财报页面解读",
        desc: "上传财报页面截图，提取核心指标",
        prompt: "我上传了一张财报页面的截图，请帮我：\n1. 提取并解读核心财务指标（营收、净利润、EPS、毛利率等）\n2. 与上期和市场预期进行对比\n3. 指出这份财报的亮点和隐忧\n4. 评估这份财报对股价的潜在影响\n5. 给出是否值得长期持有的初步判断",
      },
    ],
  },
  {
    label: "💼 持仓健康诊断",
    icon: <TrendingUp className="h-4 w-4" />,
    color: "text-emerald-500 border-emerald-500/30 hover:border-emerald-500/60 hover:bg-emerald-500/5",
    examples: [
      {
        title: "组合风险全面诊断",
        desc: "分析Beta、相关性、集中度和分散化评分",
        prompt: "请对以下美股组合进行全面风险诊断：\nAAPL 100股 均价$165，MSFT 50股 均价$380，NVDA 30股 均价$450\n\n请分析：1) 组合加权Beta和波动特征 2) 与S&P500的相关性 3) 行业集中度评分 4) 最大回撤风险估计 5) 针对稳健型投资者的优化建议",
      },
      {
        title: "止盈止损方案设计",
        desc: "根据技术面和风险偏好，制定科学的出场策略",
        prompt: "我持有AAPL 100股，买入价$165，当前价格请你用yfinance获取。\n请帮我设计一套完整的止盈止损方案：\n1. 基于ATR的动态止损位 2. 关键支撑位参考止损 3. 分批止盈的价格梯度 4. 持仓期间需要关注的风险事件 5. 如果继续下跌的应对策略",
      },
      {
        title: "美股ETF组合优化",
        desc: "用现代投资组合理论优化ETF配置权重",
        prompt: "请帮我优化一个美股ETF组合，候选标的：SPY、QQQ、IWM、GLD、TLT、XLV、XLE。\n目标：年化波动率控制在15%以内，追求最大化夏普比率。\n回测2022-2024年，对比等权基准，输出最优权重和关键绩效指标。",
      },
    ],
  },
  {
    label: "📅 每日投资简报",
    icon: <CalendarDays className="h-4 w-4" />,
    color: "text-sky-500 border-sky-500/30 hover:border-sky-500/60 hover:bg-sky-500/5",
    examples: [
      {
        title: "美股盘前快报",
        desc: "开盘前了解市场动态、关注股票简评",
        prompt: `请为我生成今日（${new Date().toLocaleDateString("zh-CN")}）的美股盘前简报：\n\n1. 昨夜美股三大指数收盘情况及核心驱动\n2. 今日期货预告（标普/纳指期货)\n3. 重点关注：AAPL、NVDA、TSLA 技术面简评\n4. 今日财报日历（重要财报公司）\n5. 今日重要经济数据发布时间\n6. 今日操作建议与关注价位`,
      },
      {
        title: "行业板块轮动分析",
        desc: "分析当前资金流向，识别强势/弱势板块",
        prompt: "请分析当前美股11个GICS行业板块的轮动状况：\n1. 近1个月各板块涨跌排名\n2. 资金流入/流出趋势\n3. 与经济周期的对应关系\n4. 当前最强势和最弱势板块\n5. 基于板块轮动理论，未来1-2个月应重点关注哪些板块",
      },
      {
        title: "财报季前瞻",
        desc: "即将发布财报的公司，预期与风险提示",
        prompt: "目前即将进入财报季，请帮我分析：\n1. 本周/下周将发布财报的重要公司（科技巨头优先）\n2. 市场对各公司的盈利预期（EPS预期）\n3. 历史上同期股价反应规律\n4. 每家公司需要重点关注的核心指标\n5. 财报前后的期权波动率变化规律及交易建议",
      },
    ],
  },
  {
    label: "📚 美股基础学习",
    icon: <GraduationCap className="h-4 w-4" />,
    color: "text-violet-500 border-violet-500/30 hover:border-violet-500/60 hover:bg-violet-500/5",
    examples: [
      {
        title: "新手入门：买我第一只股票",
        desc: "从零开始，学会如何研究和选择第一只美股",
        prompt: "我是美股投资新手，想买我的第一只股票。请用最通俗的语言教我：\n1. 选股前需要考虑哪些因素（行业、公司基本面、估值）\n2. 如何看懂P/E、P/S、EPS等基本指标\n3. 如何判断一只股票当前是贵还是便宜\n4. 新手最应该避开的5个常见错误\n5. 推荐3-5只适合新手的入门级美股，并说明原因\n请用举例说明，避免使用太多专业术语。",
      },
      {
        title: "读懂一份财报",
        desc: "以Apple为例，学会看懂美股季报的核心内容",
        prompt: "请以Apple（AAPL）最近一季财报为例，教我如何看懂一份美股季报：\n1. 财报有哪几个核心部分，各部分关注什么\n2. 营收、净利润、EPS 怎么看，超预期意味着什么\n3. 'Guidance'（展望）为什么有时候比业绩更重要\n4. 毛利率、营业利润率如何判断公司质量\n5. 自由现金流为什么是最重要的指标之一\n尽量用大白话，配合具体数字说明。",
      },
      {
        title: "技术分析入门",
        desc: "学会K线、均线、RSI等基础技术指标的含义",
        prompt: "请用通俗易懂的方式教我技术分析基础知识：\n1. K线（蜡烛图）怎么读？红绿K线代表什么？\n2. 常见的K线形态有哪些，各有什么含义？\n3. 移动平均线（MA5/MA20/MA200）如何用来判断趋势？\n4. RSI指标的超买超卖怎么理解？\n5. 支撑位和压力位是什么，怎么找？\n请用具体的股票例子说明，并告诉我初学者最容易犯的误区。",
      },
    ],
  },
  {
    label: "🔬 策略回测研究",
    icon: <LineChart className="h-4 w-4" />,
    color: "text-red-400 border-red-500/30 hover:border-red-500/60 hover:bg-red-500/5",
    examples: [
      {
        title: "美股科技股最大分散化",
        desc: "FAANG+ 组合优化，最大化分散降低集中风险",
        prompt: "回测 AAPL、MSFT、GOOGL、AMZN、NVDA 的最大分散化组合，2024 年全年",
      },
      {
        title: "BTC 5 分钟 MACD 策略",
        desc: "分钟级加密货币回测，使用实时 OKX 数据",
        prompt: "回测 BTC-USDT 5 分钟 MACD 策略，fast=12 slow=26 signal=9，最近 30 天",
      },
      {
        title: "跨市场风险平价组合",
        desc: "A 股 + 加密 + 美股，风险均衡配置",
        prompt: "回测 000001.SZ、BTC-USDT 和 AAPL 的风险平价组合，2024 年全年，与等权基准对比",
      },
    ],
  },
  {
    label: "🔍 研究与基本面分析",
    icon: <Sparkles className="h-4 w-4" />,
    color: "text-amber-400 border-amber-500/30 hover:border-amber-500/60 hover:bg-amber-500/5",
    examples: [
      {
        title: "个股深度研究",
        desc: "全面分析某只美股的基本面、估值与前景",
        prompt: "请对 NVDA（英伟达）做一次深度基本面研究：\n1. 业务模式与核心竞争优势\n2. 近4个季度财务数据趋势（营收、净利润、毛利率）\n3. 当前估值分析（P/E、P/S、PEG 与行业对比）\n4. 主要风险因素（竞争、监管、估值泡沫）\n5. 分析师目标价区间和主流机构观点\n6. 综合评分：当前是否适合买入/持有/卖出，给出理由",
      },
      {
        title: "行业比较分析",
        desc: "横向比较同行业多只股票，找出最优选择",
        prompt: "请横向比较美国半导体行业的4只龙头：NVDA、AMD、INTC、AVGO\n对比维度：营收增速、毛利率、P/E估值、市场份额、未来增长催化剂\n最终给出综合排名，并说明在当前市场环境下，哪只股票的性价比最高",
      },
      {
        title: "宏观与利率影响分析",
        desc: "分析美联储政策和宏观环境对持仓的影响",
        prompt: "请分析当前美联储货币政策环境对美股各板块的影响：\n1. 当前利率水平和市场对降息的预期\n2. 高利率环境下哪些板块受益/受损\n3. 如果降息落地，资金会流向哪里\n4. 科技股、金融股、地产股各自的利率敏感度\n5. 基于宏观判断，给出未来3-6个月的配置建议",
      },
    ],
  },
  {
    label: "👥 多智能体分析团队",
    icon: <Users className="h-4 w-4" />,
    color: "text-violet-400 border-violet-500/30 hover:border-violet-500/60 hover:bg-violet-500/5",
    examples: [
      {
        title: "投资委员会评审",
        desc: "多智能体辩论：多空对立、风险审查、PM 最终决策",
        prompt: "[Swarm 团队模式] 使用 investment_committee 预设评估当前市场条件下是否做多 NVDA",
      },
      {
        title: "量化策略研究台",
        desc: "筛选 → 因子研究 → 回测 → 风险审计全流程",
        prompt: "[Swarm 团队模式] 使用 quant_strategy_desk 预设在沪深 300 成分股上寻找并回测最佳动量策略",
      },
    ],
  },
  {
    label: "📄 文档与网页研究",
    icon: <Globe className="h-4 w-4" />,
    color: "text-blue-400 border-blue-500/30 hover:border-blue-500/60 hover:bg-blue-500/5",
    examples: [
      {
        title: "解读财报 PDF",
        desc: "上传 PDF，对财务数据提问",
        prompt: "总结已上传财报中的核心财务指标、风险点和业绩展望",
      },
      {
        title: "网页研究：宏观展望",
        desc: "读取实时网页来源做宏观分析",
        prompt: "读取最新美联储会议纪要，总结对股市和加密市场的关键影响",
      },
    ],
  },
  {
    label: "📒 交易日志分析",
    icon: <NotebookPen className="h-4 w-4" />,
    color: "text-orange-400 border-orange-500/30 hover:border-orange-500/60 hover:bg-orange-500/5",
    examples: [
      {
        title: "分析我的交易记录",
        desc: "上传券商导出CSV，全面解读胜率、盈亏比、行为偏差",
        prompt: "分析我刚上传的交易日志 —— 完整画像，包括持仓统计、胜率、主要标的和分时分布",
      },
      {
        title: "诊断我的行为偏差",
        desc: "处置效应、过度交易、追涨、锚定 —— 严重程度 + 数字证据",
        prompt: "对我的交易日志做 4 项行为诊断（处置效应、过度交易、追涨、锚定），告诉我哪个偏差对我的盈亏影响最大",
      },
    ],
  },
  {
    label: "🔮 Shadow Account",
    icon: <UserCircle2 className="h-4 w-4" />,
    color: "text-emerald-400 border-emerald-500/30 hover:border-emerald-500/60 hover:bg-emerald-500/5",
    examples: [
      {
        title: "从日志训练我的 Shadow",
        desc: "从交易CSV提取规则，持久化Shadow档案",
        prompt: "从我刚上传的交易日志训练 Shadow Account —— 展示提取的规则，确认是否符合我的实际行为",
      },
      {
        title: "我究竟少赚了多少？",
        desc: "回测Shadow策略并归因实际PnL差距",
        prompt: "对美股市场做最近 90 天的 Shadow 回测，分解我的 PnL 在哪里偏离了 Shadow（规则违背、过早离场、错过信号）",
      },
    ],
  },
];

const CAPABILITY_CHIPS = [
  "📸 K线图AI识别分析",
  "💼 持仓健康诊断",
  "📅 每日投资简报",
  "📚 投资术语词典",
  "🔬 策略回测引擎",
  "🇺🇸 美股 · 🇨🇳 A股 · ₿ 加密",
  "📄 财报PDF解读",
  "🔍 基本面深度研究",
  "👥 多智能体分析团队",
  "📒 交易行为诊断",
  "🔮 Shadow Account回测",
  "💾 跨会话持久记忆",
];

interface Props {
  onExample: (s: string) => void;
}

export function WelcomeScreen({ onExample }: Props) {
  const { t } = useI18n();
  const [portfolioOpen, setPortfolioOpen] = useState(false);
  const [briefingOpen, setBriefingOpen] = useState(false);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4 md:space-y-8 text-center px-4 md:px-0">
      {/* Header */}
      <div className="space-y-4">
        <div className="h-16 w-16 mx-auto rounded-2xl bg-gradient-to-br from-sky-500 to-emerald-500 flex items-center justify-center shadow-lg">
          <LineChart className="h-8 w-8 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-sky-500 to-emerald-500 bg-clip-text text-transparent">
            Deepin
          </h2>
          <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto leading-relaxed">
            你的美股投资 AI 研究伙伴 · 从数据到决策，每一步都有 AI 陪你想清楚
          </p>
        </div>

        {/* Quick action buttons */}
        <div className="flex items-center justify-center gap-2 flex-wrap">
          <button
            onClick={() => setPortfolioOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500 text-white text-sm font-medium hover:bg-emerald-600 transition-colors shadow-sm"
          >
            <TrendingUp className="h-3.5 w-3.5" />
            持仓诊断
          </button>
          <button
            onClick={() => setBriefingOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-sky-500 text-white text-sm font-medium hover:bg-sky-600 transition-colors shadow-sm"
          >
            <CalendarDays className="h-3.5 w-3.5" />
            今日简报
          </button>
          <button
            onClick={() => onExample("我是美股投资新手，请帮我制定一个系统的学习路径，包括：1. 美股投资的基础知识清单 2. 每个阶段应该掌握的技能 3. 推荐的学习顺序 4. 常见的新手误区 5. 如何选择适合自己风险偏好的股票")}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <GraduationCap className="h-3.5 w-3.5" />
            新手入门
          </button>
          <button
            onClick={() => onExample("请用通俗易懂的方式解释以下美股投资常见术语，每个给出定义、公式（如有）和实际案例：P/E比率、EPS、Beta、夏普比率、最大回撤、止损、仓位管理")}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            📚 术语速查
          </button>
        </div>
      </div>

      {/* Capability chips */}
      <div className="flex flex-wrap justify-center gap-2 max-w-lg">
        {CAPABILITY_CHIPS.map((chip) => (
          <span
            key={chip}
            className="px-2.5 py-1 text-xs rounded-full border border-border/60 text-muted-foreground bg-muted/30"
          >
            {chip}
          </span>
        ))}
      </div>

      {/* Example categories grid */}
      <div className="w-full max-w-2xl text-left space-y-4">
        <p className="text-xs text-muted-foreground px-1">{t.examples}</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {CATEGORIES.map((cat) => (
            <div key={cat.label} className="space-y-2">
              <div className={`flex items-center gap-1.5 text-xs font-medium px-1 ${cat.color.split(" ").filter(c => c.startsWith("text-")).join(" ")}`}>
                {cat.icon}
                <span>{cat.label}</span>
              </div>
              <div className="space-y-1.5">
                {cat.examples.map((ex) => (
                  <button
                    key={ex.title}
                    onClick={() => onExample(ex.prompt)}
                    className={`block w-full text-left px-3 py-2.5 rounded-xl border transition-colors ${cat.color}`}
                  >
                    <span className="text-sm font-medium text-foreground leading-snug">
                      {ex.title}
                    </span>
                    <span className="block text-xs text-muted-foreground mt-0.5 leading-snug">
                      {ex.desc}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <PortfolioModal open={portfolioOpen} onClose={() => setPortfolioOpen(false)} onSubmit={onExample} />
      <BriefingModal open={briefingOpen} onClose={() => setBriefingOpen(false)} onSubmit={onExample} />
    </div>
  );
}
