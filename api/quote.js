/**
 * api/quote.js
 * ----------------------------------------------------------------
 * Vercel Serverless Function（部署后路径为 /api/quote）。
 *
 * 这个文件存在的唯一目的：把 Financial Modeling Prep 的 API Key
 * 从浏览器里挪出来。前端只会调用本站自己的 /api/quote?tickers=VOO,BABA，
 * 由这个函数在服务器端附加上 Key 去请求 FMP，再把结果转发回去。
 * Key 本身存放在 Vercel 项目的环境变量 FMP_API_KEY 里，从不出现在
 * 任何浏览器可见的代码或网络请求中。
 *
 * 部署前需要在 Vercel 项目设置里添加环境变量：
 *   名称：FMP_API_KEY
 *   值：你的 Financial Modeling Prep API Key
 *
 * 数据源版本说明：
 *   - FMP 在 2025年8月31日 下线了旧版 /api/v3/ 接口体系，免费新用户
 *     已无法访问。本文件改用新版 /stable/ 接口，已实测确认免费层可访问。
 *   - /stable/batch-quote：一次请求拿全部 ticker 的价格、涨跌幅（不含PE）。
 *   - /stable/key-metrics：新版接口不直接提供 peRatio 字段，但提供
 *     earningsYield（盈利收益率），PE = 1 / earningsYield，这里在服务器端
 *     直接换算好再传给前端。这个接口只能按单个 symbol 查询，每个 ticker
 *     需要单独请求一次，用 Promise.all 并发执行以控制总耗时。
 *
 * 请求量提醒：一次报告生成 = 1次batch-quote + N次key-metrics（N=持仓数量），
 * 比纯 quote 接口的请求量明显更高，更容易触达 FMP 免费层 250次/天的额度。
 * ----------------------------------------------------------------
 */

const FMP_BASE = "https://financialmodelingprep.com/stable";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const apiKey = process.env.FMP_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: "FMP_API_KEY not configured on server" });
    return;
  }

  const tickersParam = req.query.tickers;
  if (!tickersParam || typeof tickersParam !== "string") {
    res.status(400).json({ error: "Missing tickers query parameter" });
    return;
  }

  const sanitized = tickersParam.toUpperCase().replace(/[^A-Z0-9.,]/g, "");
  if (!sanitized) {
    res.status(400).json({ error: "Invalid tickers parameter" });
    return;
  }
  const tickerList = sanitized.split(",").filter(Boolean);

  try {
    // 第一步：一次请求拿到全部 ticker 的价格、涨跌幅
    const quoteUrl = `${FMP_BASE}/batch-quote?symbols=${sanitized}&apikey=${apiKey}`;
    const quoteRes = await fetch(quoteUrl);

    if (!quoteRes.ok) {
      // 429/403 是最常见的限额/权限信号，明确标记出来，
      // 让前端能区分"额度用完"和其他类型的错误
      const isQuotaIssue = quoteRes.status === 429 || quoteRes.status === 403;
      res.status(quoteRes.status).json({
        error: `FMP quote request failed: ${quoteRes.status}`,
        quotaExceeded: isQuotaIssue
      });
      return;
    }
    const quoteData = await quoteRes.json();

    // 第二步：逐个 ticker 并发请求 key-metrics，换算出 PE
    const metricsResults = await Promise.all(
      tickerList.map(async (ticker) => {
        try {
          const metricsUrl = `${FMP_BASE}/key-metrics?symbol=${ticker}&period=annual&limit=1&apikey=${apiKey}`;
          const metricsRes = await fetch(metricsUrl);
          if (!metricsRes.ok) {
            return { symbol: ticker, peRatio: null, quotaExceeded: metricsRes.status === 429 || metricsRes.status === 403 };
          }
          const metricsJson = await metricsRes.json();
          const latest = Array.isArray(metricsJson) ? metricsJson[0] : null;
          const earningsYield = latest?.earningsYield;
          const peRatio = (typeof earningsYield === "number" && earningsYield > 0)
            ? Math.round((1 / earningsYield) * 10) / 10
            : null;
          return { symbol: ticker, peRatio, quotaExceeded: false };
        } catch {
          return { symbol: ticker, peRatio: null, quotaExceeded: false };
        }
      })
    );

    // 任意一个 key-metrics 请求因为限额被拒，整体标记为 quotaExceeded，
    // 前端据此显示"额度已用完"提示，而不是默默丢失 PE 数据
    const anyQuotaExceeded = metricsResults.some(m => m.quotaExceeded);

    // 把 PE 合并进原始 quote 数据里，前端只需要处理一份数组
    const merged = Array.isArray(quoteData) ? quoteData.map(q => {
      const metricsMatch = metricsResults.find(m => m.symbol === q.symbol);
      return { ...q, peRatio: metricsMatch ? metricsMatch.peRatio : null };
    }) : quoteData;

    res.setHeader("Cache-Control", "s-maxage=60, stale-while-revalidate=120");
    res.status(200).json({ data: merged, quotaExceeded: anyQuotaExceeded });
  } catch (err) {
    res.status(502).json({ error: "Failed to reach FMP" });
  }
}
