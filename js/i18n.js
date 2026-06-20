/**
 * i18n.js
 * ----------------------------------------------------------------
 * 全站文案字典。所有界面文字都从这里读取，新增语言只需要
 * 在 DICT 里添加一个新的语言键，不需要改动其他文件。
 * ----------------------------------------------------------------
 */

const I18N = (() => {
  const DICT = {
    zh: {
      brandName: "持仓体检",
      navPrinciples: "原则",
      navHow: "怎么用",
      langToggle: "EN",

      heroEyebrow: "PORTFOLIO GRADER · 基于《聪明的投资者》",
      heroTitleLine1: "你的持仓，",
      heroTitleHighlight: "经得起检验吗",
      heroSub: "输入持仓代码和权重，生成基于格雷厄姆价值投资原则的体检报告 — 不是买卖建议，而是一面镜子。",
      heroCta: "开始体检",

      principlesEyebrow: "三条准绳",
      p1Title: "安全边际",
      p1Body: "以明显低于内在价值的价格买入，给判断失误留出缓冲。",
      p2Title: "市场先生",
      p2Body: "市场报价是仆人，不是主人。短期波动是机会，不是行动指南。",
      p3Title: "分散与纪律",
      p3Body: "防御型投资者持有足够分散的资产，单一标的不应主宰命运。",

      graderEyebrow: "输入持仓",
      graderTitle: "填入代码与权重，开始体检",
      colTicker: "股票 / ETF 代码",
      colWeight: "占比 %",
      scopeHint: "目前仅支持美股及美股 ETF 代码（含中概股 ADR，如 BABA），暂不支持 A 股 / 港股代码",
      addRow: "+ 添加一行",
      weightTotal: "权重合计",
      fundLabel: "资金规模（万元，可选）",
      fundPlaceholder: "例如 100",
      styleLabel: "投资风格",
      styleDefensive: "防御型",
      styleAggressive: "进取型",
      styleUnsure: "不确定",
      examplesLabel: "快速试用",
      exTech: "科技 ETF 组合",
      exMixed: "中美混合持仓",
      exSingle: "单一重仓股",
      generateBtn: "生成持仓体检报告",
      generating: "生成中 …",
      formNote: "数据来自公开行情接口，存在延迟与误差 · 不构成投资建议",
      alertEmpty: "请至少输入一只持仓",

      reportDemo: "演示数据",
      quotaExceededBanner: "今日免费行情额度已用完，当前展示的是演示数据，请明天再来获取实时数据。",
      reportTitle: "持仓体检报告",
      scoreMargin: "安全边际",
      scoreDefensive: "防御性",
      scoreDiversification: "分散度",
      bandHigh: "良好",
      bandMid: "中等",
      bandLow: "偏弱",
      reviewHeader: "逐项持仓点评",
      actionsHeader: "可执行建议",
      summaryHeader: "一句话总结",
      disclaimerDemo: "当前使用演示数据，并非实时行情。",
      disclaimerLive: "数据来自公开行情接口，可能存在延迟。",
      disclaimerFixed: "本报告基于规则化的格雷厄姆式启发法生成，内容仅供参考，不构成投资建议，不对任何投资决策负责。",
      loadingText: "正在获取实时行情并生成报告 …",
      errorText: "生成失败，请稍后重试。",

      howEyebrow: "怎么用",
      how1: "输入你的持仓代码和占比，权重无需精确到小数点。",
      how2: "系统拉取当日行情与估值数据，比对格雷厄姆的核心准绳。",
      how3: "生成三项评分与逐条点评，附带一句话总结，方便分享。",

      footerText: "持仓体检是一个免费工具，基于本杰明·格雷厄姆《聪明的投资者》中的价值投资原则。所有内容仅供参考，不构成投资建议。",

      gaugeHigh: "高估",
      gaugeLow: "低估",
      gaugeCaption: "安全边际 — 价格与价值的距离",

      weightLabel: "占比",
      concentratedNote: "属于高度集中持仓，单一标的风险主导整个组合",
      elevatedNote: "权重偏高，需关注集中度风险",
      moderateNote: "权重相对适中",
      peUnavailable: "估值数据不可用",
      peGood: "市盈率约{pe}倍，处于格雷厄姆安全边际偏好区间",
      peFair: "市盈率约{pe}倍，估值合理但安全边际有限",
      peHigh: "市盈率约{pe}倍，估值偏高，安全边际不足",
      peVeryHigh: "市盈率高达{pe}倍，处于历史高估区间，安全边际趋近于零",
      trendUp: "，近期累计上涨约{pct}%",
      trendDown: "，近期累计下跌约{pct}%",
      noDataNote: "未能获取 {ticker} 的实时数据，建议人工核实其估值水平和近期走势后再纳入判断。",

      actionConcentration: "单一标的 {ticker} 占比高达 {weight}%，远超格雷厄姆对防御型投资者的分散建议。建议把仓位逐步降至 25% 以内（即减持约 {reduction} 个百分点），通常分 1-3 个月、多批次完成，避免单次集中调整对价格造成冲击，具体每批比例和时点可结合自身税务和市场情况决定。",
      actionHighPE: "组合加权市盈率约 {pe} 倍，处于历史偏高区间。新增资金建议分批定投而非一次性加仓，等待更好的安全边际。",
      actionGoodPE: "组合加权市盈率约 {pe} 倍，估值相对友好，符合格雷厄姆\u201c合理价格买入\u201d的基本要求。",
      actionLowDiv: "持仓集中度偏高（分散度评分 {score}/100）。格雷厄姆对防御型投资者建议债券/现金类资产占比在 25%-75% 之间，若你目前接近 0%，可以先以 {bondTarget}% 左右作为起点，未来 1-3 个月内逐步建立，而非一次性大额配置。",
      actionGoodDiv: "组合分散度尚可，建议保持纪律，避免因短期市场情绪追加单一热门标的的仓位。",

      summaryMismatch: "自称\u201c防御型\u201d，结果 {weight}% 押在 {ticker} 一只标的上 — 格雷厄姆看了估计会沉默",
      summaryConcentrated: "{ticker} 一只标的占了 {weight}%，这不是分散投资，这是信仰投资",
      summaryHigh: "三项评分平均 {avg} 分，这份持仓配得上格雷厄姆的认可",
      summaryLow: "平均分仅 {avg}，这份持仓更接近投机，而非格雷厄姆式投资",
      summaryMid: "平均分 {avg} 分，中规中矩，仍有优化空间"
    },

    en: {
      brandName: "Portfolio Grader",
      navPrinciples: "Principles",
      navHow: "How it works",
      langToggle: "中文",

      heroEyebrow: "PORTFOLIO GRADER · BASED ON THE INTELLIGENT INVESTOR",
      heroTitleLine1: "Does your portfolio ",
      heroTitleHighlight: "hold up to scrutiny?",
      heroSub: "Enter your tickers and weights to generate a checkup grounded in Graham's value investing principles — not a buy or sell signal, a mirror.",
      heroCta: "Start the checkup",

      principlesEyebrow: "Three tenets",
      p1Title: "Margin of safety",
      p1Body: "Buy meaningfully below intrinsic value, leaving room for error in judgment.",
      p2Title: "Mr. Market",
      p2Body: "The market's quote is a servant, not a master. Short-term swings are opportunity, not instruction.",
      p3Title: "Diversification & discipline",
      p3Body: "A defensive investor holds enough spread that no single position decides the outcome.",

      graderEyebrow: "Enter your holdings",
      graderTitle: "Add tickers and weights to begin",
      colTicker: "Ticker / ETF",
      colWeight: "Weight %",
      scopeHint: "Currently supports US-listed stocks and ETFs only (including China ADRs like BABA). A-shares and Hong Kong tickers aren't supported yet.",
      addRow: "+ Add a row",
      weightTotal: "Total weight",
      fundLabel: "Portfolio size (optional)",
      fundPlaceholder: "e.g. 1,000,000",
      styleLabel: "Investing style",
      styleDefensive: "Defensive",
      styleAggressive: "Aggressive",
      styleUnsure: "Not sure",
      examplesLabel: "Try an example",
      exTech: "Tech ETF mix",
      exMixed: "US + China mix",
      exSingle: "Concentrated bet",
      generateBtn: "Generate checkup report",
      generating: "Generating …",
      formNote: "Data from public market feeds, may be delayed · not investment advice",
      alertEmpty: "Add at least one holding first",

      reportDemo: "Demo data",
      quotaExceededBanner: "Today's free data quota has been used up. Showing demo data for now — please check back tomorrow for live quotes.",
      reportTitle: "Portfolio checkup report",
      scoreMargin: "Margin of safety",
      scoreDefensive: "Defensiveness",
      scoreDiversification: "Diversification",
      bandHigh: "good",
      bandMid: "fair",
      bandLow: "weak",
      reviewHeader: "Holding by holding",
      actionsHeader: "What to consider",
      summaryHeader: "In one line",
      disclaimerDemo: "Currently showing demo data, not live quotes.",
      disclaimerLive: "Data from public market feeds and may be delayed.",
      disclaimerFixed: "This report is generated by a rule-based Graham-style heuristic. It's for reference only, not investment advice, and carries no responsibility for any decision made from it.",
      loadingText: "Fetching live quotes and building your report …",
      errorText: "Something went wrong. Please try again.",

      howEyebrow: "How it works",
      how1: "Enter your tickers and weights. Weights don't need to be exact.",
      how2: "We pull today's quotes and valuation data and check them against Graham's core tenets.",
      how3: "You get three scores, holding-by-holding notes, and a one-line summary worth sharing.",

      footerText: "Portfolio Grader is a free tool built on the value investing principles in Benjamin Graham's The Intelligent Investor. Content is for reference only and is not investment advice.",

      gaugeHigh: "overvalued",
      gaugeLow: "undervalued",
      gaugeCaption: "Margin of safety — distance between price and value",

      weightLabel: "weight",
      concentratedNote: "a heavily concentrated position — this single holding dominates the portfolio's risk",
      elevatedNote: "an elevated weight worth watching for concentration risk",
      moderateNote: "a moderate weight",
      peUnavailable: "valuation data unavailable",
      peGood: "trades around {pe}x earnings, within Graham's preferred margin-of-safety range",
      peFair: "trades around {pe}x earnings — reasonable, but margin of safety is limited",
      peHigh: "trades around {pe}x earnings — elevated, with limited margin of safety",
      peVeryHigh: "trades at {pe}x earnings — a historically rich valuation with little margin of safety left",
      trendUp: ", up roughly {pct}% recently",
      trendDown: ", down roughly {pct}% recently",
      noDataNote: "Live data for {ticker} wasn't available. Worth checking its valuation and recent performance manually.",

      actionConcentration: "{ticker} alone makes up {weight}% of the portfolio, well past what Graham would suggest for a defensive investor. Consider trimming it toward 25% or below (roughly {reduction} percentage points), typically spread across 1-3 months in several moves rather than one large sale — the exact pace and timing depend on your own tax situation and market conditions.",
      actionHighPE: "The portfolio's weighted P/E is around {pe}x, in historically elevated territory. New money is better deployed gradually rather than all at once, while waiting for a better margin of safety.",
      actionGoodPE: "The portfolio's weighted P/E is around {pe}x, a reasonably friendly valuation that meets Graham's basic bar for buying at a fair price.",
      actionLowDiv: "Concentration is on the high side (diversification score {score}/100). Graham suggests defensive investors keep bonds/cash somewhere between 25%-75% of the portfolio. If you're near 0% today, {bondTarget}% is a reasonable starting point to build toward over the next 1-3 months, rather than allocating it all at once.",
      actionGoodDiv: "Diversification is reasonable. Stay disciplined and avoid chasing a single hot name on short-term sentiment.",

      summaryMismatch: "Labeled \"defensive,\" yet {weight}% rides on {ticker} alone — Graham would probably go quiet on this one",
      summaryConcentrated: "{ticker} alone is {weight}% of the portfolio — that's not diversification, that's conviction",
      summaryHigh: "Average score of {avg} across the board — this portfolio would earn Graham's nod",
      summaryLow: "Average score of just {avg} — closer to speculation than Graham-style investing",
      summaryMid: "Average score of {avg} — solid but room to improve"
    }
  };

  let current = "zh";

  function t(key, vars) {
    let str = (DICT[current] && DICT[current][key]) || DICT.zh[key] || key;
    if (vars) {
      Object.keys(vars).forEach(k => {
        str = str.replace(`{${k}}`, vars[k]);
      });
    }
    return str;
  }

  function setLang(lang) {
    if (DICT[lang]) current = lang;
  }

  function getLang() {
    return current;
  }

  return { t, setLang, getLang };
})();
