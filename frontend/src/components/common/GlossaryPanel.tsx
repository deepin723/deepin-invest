import { useState, useMemo } from "react";
import { X, Search, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";

interface Term {
  term: string;
  cn: string;
  def: string;
  example: string;
  category: string;
}

const TERMS: Term[] = [
  { term: "P/E Ratio", cn: "市盈率", category: "估值指标", def: "股价除以每股收益，衡量投资者为每1元盈利支付多少倍价格。市场平均约15-25倍，高于行业均值通常意味着高增长预期。", example: "AAPL P/E=28，即你为每$1盈利支付$28。纳斯达克科技股平均P/E通常在25-35区间。" },
  { term: "EPS", cn: "每股收益", category: "基本面", def: "公司净利润 ÷ 总股数。是衡量公司盈利能力最核心的指标，也是财报中最受关注的数字。", example: "AAPL 2023年EPS约$6.13，意味着你持有1股AAPL，对应$6.13的净利润。EPS超预期→股价通常上涨。" },
  { term: "Market Cap", cn: "市值", category: "基本面", def: "股价 × 总股数。将公司分为：超大盘（>$2000亿）、大盘（$100-2000亿）、中盘（$20-100亿）、小盘（<$20亿）。", example: "AAPL市值约$3万亿，属于超大盘股。小盘股波动更大、潜在收益更高但风险也更高。" },
  { term: "Beta", cn: "贝塔系数", category: "风险指标", def: "衡量股票相对S&P 500的波动敏感度。Beta=1与市场同步；>1更波动；<1更稳定；负值与市场反向。", example: "NVDA Beta≈2.0：大盘涨1%，NVDA约涨2%。防御性股票如JNJ Beta≈0.5，适合厌恶风险的投资者。" },
  { term: "Sharpe Ratio", cn: "夏普比率", category: "绩效指标", def: "超额收益 ÷ 波动率（=（策略收益 - 无风险利率）÷ 标准差）。衡量每单位风险赚取多少收益。>1良好，>2优秀。", example: "夏普比率1.5意味着承担1单位风险可获1.5倍超额收益。大多数散户策略夏普比率不足1。" },
  { term: "Max Drawdown", cn: "最大回撤", category: "风险指标", def: "从历史最高净值到最低点的最大跌幅百分比，衡量持有期内「最坏情况」的亏损深度。", example: "买在$100，最低跌到$70，最大回撤=-30%。要回本需涨42.9%（不是30%！）。" },
  { term: "Dividend Yield", cn: "股息率", category: "基本面", def: "年度每股股息 ÷ 当前股价，代表仅靠股息的年化回报。高股息股（>3%）常被视为「类债券」防御性投资。", example: "可口可乐（KO）股息率约3.3%，持有$10,000的KO每年可获约$330股息，且历史上60+年连续增股息。" },
  { term: "P/B Ratio", cn: "市净率", category: "估值指标", def: "股价 ÷ 每股净资产（账面价值）。P/B<1理论上低估，适合银行、地产等资产密集型行业估值。", example: "某银行P/B=0.8，意味着市场认为其价值低于账面资产，可能是低估机会，也可能是资产质量有问题。" },
  { term: "RSI", cn: "相对强弱指数", category: "技术指标", def: "0-100的动量震荡指标，基于近14日涨跌幅计算。通常：>70超买（可能回调），<30超卖（可能反弹），50为多空分界。", example: "某股RSI=78：短期涨幅过快，注意获利了结压力。但在强势趋势中RSI可长期维持在70+。" },
  { term: "MACD", cn: "移动平均收敛/发散", category: "技术指标", def: "由12日EMA-26日EMA=MACD线，再用9日EMA做信号线。金叉（MACD上穿信号线）=看涨信号，死叉=看跌信号。", example: "MACD金叉+成交量放大=较强买入信号。仅有金叉但无量配合，可信度打折。" },
  { term: "Moving Average", cn: "移动平均线", category: "技术指标", def: "以特定周期（5/20/50/200日）的均价连成曲线。多头排列（短期均线在长期均线上方）=上升趋势。", example: "股价站上200日均线=长期看涨；跌破200日均线=趋势转弱警示。50日均线是机构最常用的参考线。" },
  { term: "Support / Resistance", cn: "支撑位 / 压力位", category: "技术分析", def: "支撑位：历史多次止跌的价格区域（买方力量集中）。压力位：多次遇阻回落的价格区域（卖方力量集中）。", example: "某股多次在$100附近止跌，$100是强支撑。突破后支撑变压力（踏破之后变成新的阻力）。" },
  { term: "Volume", cn: "成交量", category: "技术分析", def: "单位时间内交易的股票数量。量价关系是判断趋势有效性的核心依据：量增价升=趋势强，缩量上涨=可疑。", example: "AAPL平均日成交量约6000万股，某日成交量突然达到1.5亿股，说明有重大事件驱动（财报/消息面）。" },
  { term: "Options Call", cn: "看涨期权", category: "衍生品", def: "赋予持有者在到期日前以约定的行权价买入标的股票的权利（非义务）。付权利金，最大亏损=权利金。", example: "买AAPL $200 Call，AAPL涨到$220→盈利$20/股（减权利金）；AAPL跌到$180→最大亏损=所付权利金。" },
  { term: "Options Put", cn: "看跌期权", category: "衍生品", def: "赋予持有者以约定行权价卖出标的股票的权利。常用于持仓对冲：持有股票同时买Put=给仓位买保险。", example: "持有100股AAPL，同时买1张$180 Put，即使AAPL大跌也能以$180卖出，锁定最大亏损。" },
  { term: "IV (Implied Volatility)", cn: "隐含波动率", category: "衍生品", def: "从期权市场价格反推的「市场预期波动率」。IV越高→期权越贵；财报前IV通常飙升，财报后骤降（Vol Crush）。", example: "NVDA财报前IV=90%，财报后即使业绩超预期，股价也可能因IV崩塌而下跌。这是期权交易的核心陷阱之一。" },
  { term: "Stop Loss", cn: "止损", category: "风险管理", def: "预设的退出价格，股票跌至该价格时自动卖出以限制损失。是职业交易者最重要的纪律之一。", example: "$100买入，设$90止损=接受最大10%亏损。常用方法：固定百分比止损、ATR止损、关键支撑位止损。" },
  { term: "Position Sizing", cn: "仓位管理", category: "风险管理", def: "每笔交易投入多少资金的决策。「2%法则」：单笔交易风险（止损×仓位）不超过总资金2%。", example: "总资金$100,000，2%风险=$2,000。止损10%，则仓位=$2,000÷10%=$20,000（占总资金20%）。" },
  { term: "Diversification", cn: "分散化", category: "投资策略", def: "通过投资不相关的资产、行业、地区降低非系统性风险。分散化不能消除系统性风险（如经济衰退对全市场的冲击）。", example: "持有科技（AAPL）+医疗（JNJ）+能源（XOM）+消费（MCD）+债券ETF，比全仓科技股风险低得多。" },
  { term: "Dollar-Cost Averaging", cn: "定期定额投资（定投）", category: "投资策略", def: "以固定金额定期（如每月）买入股票，无论涨跌，自动平摊买入成本。适合长期投资指数基金。", example: "每月$500买SPY，涨时买少，跌时自动买多，20年后均价约等于这20年市场均价。" },
  { term: "S&P 500", cn: "标普500指数", category: "市场基础", def: "美国最重要的股票指数，涵盖500家最大市值上市公司，代表美国约80%的股市总市值。", example: "巴菲特建议普通投资者定投S&P 500指数基金（如SPY、VOO），长期年化收益约10%。" },
  { term: "Nasdaq 100", cn: "纳斯达克100指数", category: "市场基础", def: "纳斯达克交易所最大100家非金融公司，科技股权重极高（AAPL、MSFT、NVDA等），代表科技创新公司。", example: "QQQ是追踪Nasdaq 100的ETF，科技牛市时涨幅通常远超S&P 500，但熊市跌幅也更大。" },
  { term: "Earnings Report", cn: "财报（季报/年报）", category: "市场基础", def: "上市公司每季度公布的财务业绩，包括营收、净利润、EPS、展望（Guidance）。是股价最大催化剂之一。", example: "NVDA财报如果EPS超预期20%且上调展望，通常会引发大涨。反之，哪怕「只」超预期5%也可能被卖出。" },
  { term: "Bull / Bear Market", cn: "牛市 / 熊市", category: "市场基础", def: "牛市：市场从低点上涨超20%的持续趋势。熊市：从高点下跌超20%。通常以S&P 500为基准判断。", example: "2009-2020年是美股历史最长牛市（11年）。2022年因美联储激进加息进入熊市，S&P 500全年跌约19%。" },
  { term: "ETF", cn: "交易所交易基金", category: "投资工具", def: "在交易所像股票一样交易的基金。可追踪指数（SPY追踪S&P500）、行业（XLK追踪科技行业）或主题。费用率极低。", example: "SPY（S&P500）、QQQ（纳指100）、VTI（全市场）、GLD（黄金）是美股最受欢迎的ETF。" },
  { term: "Short Selling", cn: "做空", category: "交易策略", def: "借入股票卖出，预期下跌后低价买回还券赚差价。做空亏损理论上无上限（股价可无限上涨）。", example: "2021年GME轧空事件：大量做空机构被散户抱团逼仓，被迫高价买回股票，造成巨额亏损。" },
  { term: "Sector Rotation", cn: "板块轮动", category: "市场概念", def: "资金从一个行业板块流向另一个板块的现象，通常与经济周期和利率环境密切相关。", example: "加息周期→资金从高估值成长科技股流向金融、能源等价值股；降息周期→科技、医疗、消费受益。" },
  { term: "P/S Ratio", cn: "市销率", category: "估值指标", def: "市值 ÷ 年度营收。适合评估尚未盈利但高速增长的科技公司（无法用P/E估值时的替代方法）。", example: "初创SaaS公司可能P/E无意义，但P/S=10-20倍是常见估值。P/S<2通常被认为较低估。" },
  { term: "Free Cash Flow", cn: "自由现金流", category: "基本面", def: "经营现金流 - 资本支出。代表公司可自由支配的真实现金，比净利润更难造假，是巴菲特最看重的指标。", example: "AAPL年自由现金流约$1000亿，这是它能回购股票、支付股息的底气所在。" },
  { term: "Forward P/E", cn: "预期市盈率", category: "估值指标", def: "以分析师对未来12个月的盈利预期计算的P/E，比历史P/E更能反映当前估值的合理性。", example: "某股历史P/E=30，但未来盈利预期增长30%，Forward P/E=23，估值比表面看起来更合理。" },

  // ── 新手最贵的错误 ────────────────────────────────────────────────────────
  { term: "Bid-Ask Spread", cn: "买卖价差", category: "新手必读", def: "买入价（Ask）与卖出价（Bid）之间的差距，是市场流动性的成本。每次交易你都要承担这个隐性费用——买入瞬间你就已经亏了这个差价。", example: "某股Bid=$99.90，Ask=$100.10，价差=$0.20（0.2%）。你以$100.10买入，立刻只能以$99.90卖出，账面即亏0.2%。流动性差的小盘股价差可以超过1%。" },
  { term: "Market Order vs Limit Order", cn: "市价单 vs 限价单", category: "新手必读", def: "市价单（Market Order）：立即以最优市价成交，但实际价格由市场决定，波动大时可能远偏离预期。限价单（Limit Order）：指定价格，只在该价格或更好价格才成交，可能无法立即成交。", example: "🚫 新手错误：波动剧烈时用市价单买NVDA，本以为$450买入，结果成交在$458（因为瞬间价格跳升）。✅ 正确做法：用限价单设置最高愿意支付的价格，超过就不买。" },
  { term: "Wash Sale Rule", cn: "亏损洗售规则（美国税法）", category: "新手必读", def: "美国IRS税法规定：如果你卖出一只亏损股票后，在前后30天内（共61天窗口期）买回同一股票，该亏损不能用于抵税。这是美国股票账户最容易踩的税务陷阱之一。", example: "你以$100买NVDA，跌到$80割肉，亏损$20本可抵税。但你3周后又以$85买回，触发Wash Sale，这$20亏损无法抵扣。等到次年才能重新计算成本。税务影响被大多数新手忽视！" },
  { term: "Pattern Day Trader (PDT) Rule", cn: "模式日内交易者规则", category: "新手必读", def: "美国FINRA规定：如果你在任意5个交易日内进行4次或以上「日内交易」（当日买入并卖出同一证券），账户余额必须保持在$25,000以上。低于此门槛将被限制交易。", example: "账户$5,000，周一买AAPL当天卖出（第1次），周二同样操作（第2次），周四同样（第3次），周五再来一次（第4次）→触发PDT，账户被限制！新手务必注意：非特别情况不要当天买卖。" },
  { term: "Ex-Dividend Date", cn: "除息日（股息截止日）", category: "新手必读", def: "在除息日或之后买入股票的投资者，无法获得当期股息。股价在除息日通常会下跌约等于股息金额的幅度（股息从股价中「扣除」）。很多新手以为除息日买入能拿到股息，结果反而买贵了。", example: "KO(可口可乐)宣布股息$0.46/股，除息日是周五。你周五买入100股，无法获得$46股息。更糟的是，股价周五可能下跌约$0.46，你「亏了」$46而没有收到任何股息。正确做法：在除息日前一天买入才能获得股息。" },
  { term: "Buy the Rumor, Sell the News", cn: "买谣言，卖新闻", category: "新手必读", def: "市场常见现象：好消息提前被预期并反映在股价中（谣言阶段股价上涨），当好消息真正公布时（新闻阶段），市场反而下跌。因为利好已充分定价，消息公布即是「兑现离场」的信号。", example: "NVDA财报前市场预期极好，股价已从$400涨到$500（谣言期）。财报公布：EPS超预期20%！但当晚股价下跌8%——因为「超预期」已经被股价消化，没有更多惊喜了。这让无数新手迷惑：好消息为什么跌？" },
  { term: "FOMO (Fear of Missing Out)", cn: "错失恐惧症", category: "新手必读", def: "投资中最危险的心理——看到一只股票已经涨了很多，害怕继续涨错过机会而冲动买入。FOMO通常在市场最疯狂时最强烈，也是导致「追高被套」的主要原因。", example: "NVDA从$200涨到$800，你一直没买。跌到$700时你忍不住了「再涨我就买不起了」，以$700买入。随后股价回调到$500，你被套住。FOMO让你在所有错误的时机买入。冷静的问题：如果没有看见这涨幅，你愿意在这个价格买吗？" },
  { term: "Anchoring Bias", cn: "锚定偏见", category: "新手必读", def: "投资者过度依赖某个「参考价格」（通常是买入价）进行决策，导致非理性行为。常见表现：亏损时死守「等它回本」，而不考虑当前持仓是否还有价值。", example: "你以$100买AAPL，现在$75。你说「我等它回到$100再卖」。但问题是：如果你今天手里有$75现金，你还会选择买AAPL吗？如果答案是否，说明你被锚定在买入价，做出了非理性决定。应该问：现在这笔钱放在哪里最值得？" },
  { term: "Confirmation Bias", cn: "确认偏见", category: "新手必读", def: "人们倾向于寻找和相信支持自己既有观点的信息，忽视相反证据。在投资中表现为：买了某只股票后，只看看涨的分析，忽视看空的声音。", example: "你买了TSLA，然后开始每天只看TSLA多头的分析帖子，对空头观点视而不见。这导致你无法客观评估持仓。专业做法：主动搜索和阅读「为什么TSLA会下跌」的分析，强迫自己听另一面的声音。" },
];

const CATEGORIES = [...new Set(TERMS.map(t => t.category))];

interface Props {
  open: boolean;
  onClose: () => void;
}

export function GlossaryPanel({ open, onClose }: Props) {
  const [search, setSearch] = useState("");
  const [selectedCat, setSelectedCat] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return TERMS.filter(t => {
      const matchCat = !selectedCat || t.category === selectedCat;
      const matchSearch = !q || t.term.toLowerCase().includes(q) || t.cn.includes(q) || t.def.includes(q);
      return matchCat && matchSearch;
    });
  }, [search, selectedCat]);

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/30 z-40" onClick={onClose} />

      {/* Panel */}
      <div className="fixed right-0 top-0 h-full w-full sm:w-[420px] bg-background border-l shadow-2xl z-50 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div>
            <h2 className="font-semibold text-base">📚 投资术语词典</h2>
            <p className="text-xs text-muted-foreground mt-0.5">美股投资必备 {TERMS.length} 个核心概念</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Search */}
        <div className="p-3 border-b space-y-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="搜索术语（中文/英文）..."
              className="w-full pl-8 pr-3 py-1.5 text-sm rounded-md border bg-muted/30 focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>
          {/* Category filter */}
          <div className="flex flex-wrap gap-1">
            <button
              onClick={() => setSelectedCat(null)}
              className={cn("px-2 py-0.5 rounded-full text-xs border transition-colors", !selectedCat ? "bg-primary text-primary-foreground border-primary" : "text-muted-foreground hover:bg-muted")}
            >
              全部
            </button>
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCat(selectedCat === cat ? null : cat)}
                className={cn("px-2 py-0.5 rounded-full text-xs border transition-colors", selectedCat === cat ? "bg-primary text-primary-foreground border-primary" : "text-muted-foreground hover:bg-muted")}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Terms list */}
        <div className="flex-1 overflow-auto">
          {filtered.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground text-sm">没有找到相关术语</div>
          ) : (
            <div className="divide-y">
              {filtered.map(item => {
                const isExpanded = expanded === item.term;
                return (
                  <div key={item.term} className="px-4 py-3">
                    <button
                      className="w-full text-left"
                      onClick={() => setExpanded(isExpanded ? null : item.term)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">{item.term}</span>
                          <span className="text-xs text-muted-foreground">{item.cn}</span>
                          <span className="px-1.5 py-0.5 rounded text-[10px] bg-muted text-muted-foreground">{item.category}</span>
                        </div>
                        {isExpanded ? <ChevronUp className="h-3.5 w-3.5 text-muted-foreground shrink-0" /> : <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" />}
                      </div>
                      {!isExpanded && (
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-1 text-left">{item.def}</p>
                      )}
                    </button>
                    {isExpanded && (
                      <div className="mt-2 space-y-2">
                        <p className="text-xs text-foreground/80 leading-relaxed">{item.def}</p>
                        <div className="bg-muted/40 rounded-md p-2.5">
                          <p className="text-[11px] text-muted-foreground font-medium mb-1">💡 举例说明</p>
                          <p className="text-xs text-foreground/70 leading-relaxed">{item.example}</p>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
