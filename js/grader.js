/**
 * grader.js
 * ----------------------------------------------------------------
 * 格雷厄姆评分引擎。
 * 输入：持仓数组 [{ticker, weight}] + 对应行情数据 + meta(含语言)
 * 输出：三项评分（安全边际/防御性/分散度）+ 逐项点评 + 建议 + 总结
 *
 * 所有面向用户的文案都通过 I18N.t() 读取，引擎本身不写死任何语言。
 * 评分逻辑是规则化的启发式方法，参考《聪明的投资者》核心原则，
 * 不是精确的金融模型，目的是给出方向性的、可解释的诊断。
 *
 * 评分校准说明（写给未来维护者）：
 * - 防御性评分以"最大单一持仓权重"为主导因子（占80分），持仓数量只是
 *   次要加分项（占20分）——如果颠倒过来，一个"持仓行数很多但有一只
 *   占了50%"的组合会被错误地打高分，这是早期版本踩过的坑。
 * - 分散度评分把 HHI（整体集中度）和"最大单一权重"各按50%混合，原因
 *   是单用HHI时，"三只股票各占33%"和"一只占52%+其余分散"的HHI数值
 *   可能很接近，但后者明显被单一标的主导，风险体感完全不同，HHI对此
 *   不敏感，需要额外的直接惩罚项来纠正。
 * ----------------------------------------------------------------
 */

const GrahamGrader = (() => {

  // ---- 安全边际评分：基于持仓加权PE ----
  function scoreMarginOfSafety(holdings, quotes) {
    let weightedPE = 0;
    let totalWeight = 0;
    holdings.forEach(h => {
      const q = quotes[h.ticker];
      if (q && q.peRatio) {
        weightedPE += q.peRatio * h.weight;
        totalWeight += h.weight;
      }
    });
    if (totalWeight === 0) return { score: 50, weightedPE: null };

    const avgPE = weightedPE / totalWeight;
    let score;
    if (avgPE <= 15) score = 90 + (15 - avgPE) * 0.6;
    else if (avgPE <= 25) score = 90 - (avgPE - 15) * 3.5;
    else if (avgPE <= 45) score = 55 - (avgPE - 25) * 2.0;
    else score = Math.max(5, 15 - (avgPE - 45) * 0.5);

    return { score: Math.round(Math.max(0, Math.min(100, score))), weightedPE: avgPE };
  }

  // ---- 防御性评分：以单一仓位集中度为主导因素，持仓数量为次要加分项 ----
  function scoreDefensiveness(holdings) {
    const n = holdings.length;
    const maxWeight = Math.max(...holdings.map(h => h.weight));

    let concentrationScore;
    if (maxWeight <= 10) concentrationScore = 80;
    else if (maxWeight <= 25) concentrationScore = 80 - (maxWeight - 10) * 2.4;
    else if (maxWeight <= 50) concentrationScore = 44 - (maxWeight - 25) * 1.4;
    else concentrationScore = Math.max(0, 9 - (maxWeight - 50) * 0.3);

    const countScore = Math.min(20, n * 4);

    const total = concentrationScore + countScore;
    return { score: Math.round(Math.max(0, Math.min(100, total))), maxWeight };
  }

  // ---- 分散度评分：HHI（整体集中度）与最大单一仓位惩罚的加权混合 ----
  function scoreDiversification(holdings) {
    const hhi = holdings.reduce((sum, h) => sum + Math.pow(h.weight, 2), 0);
    const hhiScore = Math.max(0, 100 - Math.sqrt(hhi) * 0.95);

    const maxWeight = Math.max(...holdings.map(h => h.weight));
    const maxWeightScore = Math.max(0, 100 - maxWeight * 1.5);

    const score = hhiScore * 0.5 + maxWeightScore * 0.5;
    return { score: Math.round(score), hhi };
  }

  // ---- 单条持仓点评 ----
  function reviewHolding(h, quote) {
    const ticker = h.ticker;
    const weight = h.weight;
    if (!quote) {
      return I18N.t('noDataNote', { ticker });
    }
    const pe = quote.peRatio;
    const chg = quote.yearChangePct;
    let valuationNote;
    if (pe == null) {
      valuationNote = I18N.t('peUnavailable');
    } else if (pe <= 15) {
      valuationNote = I18N.t('peGood', { pe: pe.toFixed(1) });
    } else if (pe <= 25) {
      valuationNote = I18N.t('peFair', { pe: pe.toFixed(1) });
    } else if (pe <= 40) {
      valuationNote = I18N.t('peHigh', { pe: pe.toFixed(1) });
    } else {
      valuationNote = I18N.t('peVeryHigh', { pe: pe.toFixed(1) });
    }

    let weightNote;
    if (weight >= 40) {
      weightNote = I18N.t('concentratedNote');
    } else if (weight >= 20) {
      weightNote = I18N.t('elevatedNote');
    } else {
      weightNote = I18N.t('moderateNote');
    }

    let trendNote = "";
    if (chg != null) {
      trendNote = chg >= 0
        ? I18N.t('trendUp', { pct: Math.abs(chg).toFixed(1) })
        : I18N.t('trendDown', { pct: Math.abs(chg).toFixed(1) });
    }

    const lang = I18N.getLang();
    if (lang === 'en') {
      return `${weight}% weight: ${valuationNote}, ${weightNote}${trendNote}.`;
    }
    return `${valuationNote}；${weightNote}${trendNote}。`;
  }

  // ---- 生成可执行建议 ----
  // 设计取舍说明：建议会给出具体的目标仓位百分比（锚定格雷厄姆原著中
  // 明确提到的边界值，如"防御型投资者单一标的不超过总资产的一定比例"）
  // 以及粗略的时间框架（"1-3个月内分批"），但不精确到"哪个月份、
  // 每批具体卖多少股"——后者属于交易时机决策，超出了规则化诊断工具
  // 应承担的范围，容易被理解为个性化的投资顾问意见。
  function generateActions(holdings, scores) {
    const actions = [];
    const maxH = holdings.reduce((a, b) => (a.weight > b.weight ? a : b));

    if (scores.defensive.maxWeight >= 35) {
      // 目标仓位：格雷厄姆对防御型投资者的边界大致在10%以内，
      // 这里给一个更现实的"过渡目标"（25%），而不是直接要求一步到位
      const targetWeight = 25;
      const reduction = Math.round(maxH.weight - targetWeight);
      actions.push(I18N.t('actionConcentration', {
        ticker: maxH.ticker,
        weight: maxH.weight,
        target: targetWeight,
        reduction
      }));
    }

    if (scores.margin.weightedPE && scores.margin.weightedPE > 30) {
      actions.push(I18N.t('actionHighPE', { pe: scores.margin.weightedPE.toFixed(1) }));
    } else if (scores.margin.weightedPE && scores.margin.weightedPE <= 20) {
      actions.push(I18N.t('actionGoodPE', { pe: scores.margin.weightedPE.toFixed(1) }));
    }

    if (scores.diversification.score < 40) {
      // 格雷厄姆原著对防御型投资者的债券配置建议区间是25%-75%，
      // 这里给一个保守但具体的起点（20%）而非空泛的"考虑增加"
      actions.push(I18N.t('actionLowDiv', { score: scores.diversification.score, bondTarget: 20 }));
    } else {
      actions.push(I18N.t('actionGoodDiv'));
    }

    return actions.slice(0, 3);
  }

  function generateSummary(holdings, scores, style) {
    const maxH = holdings.reduce((a, b) => (a.weight > b.weight ? a : b));
    const avgScore = Math.round((scores.margin.score + scores.defensive.score + scores.diversification.score) / 3);

    if (scores.defensive.maxWeight >= 40 && style === "defensive") {
      return I18N.t('summaryMismatch', { weight: maxH.weight, ticker: maxH.ticker });
    }
    if (scores.defensive.maxWeight >= 40) {
      return I18N.t('summaryConcentrated', { ticker: maxH.ticker, weight: maxH.weight });
    }
    if (avgScore >= 70) {
      return I18N.t('summaryHigh', { avg: avgScore });
    }
    if (avgScore <= 35) {
      return I18N.t('summaryLow', { avg: avgScore });
    }
    return I18N.t('summaryMid', { avg: avgScore });
  }

  function scoreToBand(score) {
    if (score >= 65) return "high";
    if (score >= 40) return "mid";
    return "low";
  }

  /**
   * 主入口：生成完整报告对象
   */
  function generateReport(holdings, quotes, meta) {
    const margin = scoreMarginOfSafety(holdings, quotes);
    const defensive = scoreDefensiveness(holdings);
    const diversification = scoreDiversification(holdings);
    const scores = { margin, defensive, diversification };

    const reviews = holdings.map(h => ({
      ticker: h.ticker,
      weight: h.weight,
      text: reviewHolding(h, quotes[h.ticker])
    }));

    const actions = generateActions(holdings, scores);
    const summary = generateSummary(holdings, scores, meta.style);

    const lang = I18N.getLang();
    const dateLocale = lang === 'en' ? 'en-US' : 'zh-CN';
    const dateOpts = lang === 'en'
      ? { year: "numeric", month: "long", day: "numeric" }
      : { year: "numeric", month: "long", day: "numeric" };

    return {
      date: new Date().toLocaleDateString(dateLocale, dateOpts),
      scores: {
        margin: { value: margin.score, band: scoreToBand(margin.score) },
        defensive: { value: defensive.score, band: scoreToBand(defensive.score) },
        diversification: { value: diversification.score, band: scoreToBand(diversification.score) }
      },
      reviews,
      actions,
      summary,
      meta
    };
  }

  return { generateReport };
})();
