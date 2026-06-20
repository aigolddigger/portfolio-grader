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
 *     已无法访问。本文件改用新版 /stable/ 接口。
 *   - /stable/key-metrics 提供 earningsYield（盈利收益率），
 *     PE = 1 / earningsYield，服务器端换算好再传给前端。
 *
 * 容错设计（重要，这是这个文件存在的核心难点）：
 *   实测发现 FMP 免费层对不同 ticker 的支持程度不一致——
 *   ETF（如 VOO）在 key-metrics 接口上会返回 402（订阅范围不含此 symbol），
 *   近期新上市/分拆的个股（如 SPCX、SNDK）会因为 FMP 尚未收录完整财年
 *   数据而同样失败。这些都是"单个标的没有该数据"，不代表整个请求失败、
 *   不代表额度用尽，更不代表用户输入有误。
 *
 *   原先的实现里，任何一个 ticker 的请求失败会让整个 /api/quote 返回
 *   非 200 状态码，导致前端把整份报告（所有标的，包括正常的那些）一起
 *   回退成演示数据——这是过度敏感。本版本改为：每个 ticker 的 quote 和
 *   key-metrics 都独立请求、独立容错，单个标的拿不到数据就让该标的的
 *   对应字段为 null，不影响其他标的，也不影响整体响应状态码。
 *   只有当"全部 ticker 的 quote 都失败"时，才判定为系统性问题
 *   （例如 Key 失效、整体限流），这时才标记 quotaExceeded。
 * ----------------------------------------------------------------
 */

const FMP_BASE = "https://financialmodelingprep.com/stable";

async function fetchSingleQuote(ticker, apiKey) {
  try {
    const url = `${FMP_BASE}/quote?symbol=${ticker}&apikey=${apiKey}`;
    const res = await fetch(url);
    if (!res.ok) {
      return { symbol: ticker, ok: false, status: res.status, data: null };
    }
    const json = await res.json();
    const match = Array.isArray(json) ? json[0] : null;
    return { symbol: ticker, ok: !!match, status: res.status, data: match };
  } catch {
    return { symbol: ticker, ok: false, status: null, data: null };
  }
}

async function fetchSingleMetrics(ticker, apiKey) {
  try {
    const url = `${FMP_BASE}/key-metrics?symbol=${ticker}&period=annual&limit=1&apikey=${apiKey}`;
    const res = await fetch(url);
    if (!res.ok) {
      return { symbol: ticker, peRatio: null };
    }
    const json = await res.json();
    const latest = Array.isArray(json) ? json[0] : null;
    const earningsYield = latest?.earningsYield;
    const peRatio = (typeof earningsYield === "number" && earningsYield > 0)
      ? Math.round((1 / earningsYield) * 10) / 10
      : null;
    return { symbol: ticker, peRatio };
  } catch {
    return { symbol: ticker, peRatio: null };
  }
}

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
  const tickerList = [...new Set(sanitized.split(",").filter(Boolean))];

  try {
    // 每个 ticker 的 quote 和 key-metrics 都独立请求、独立容错
    const [quoteResults, metricsResults] = await Promise.all([
      Promise.all(tickerList.map(t => fetchSingleQuote(t, apiKey))),
      Promise.all(tickerList.map(t => fetchSingleMetrics(t, apiKey)))
    ]);

    // 只有当全部 ticker 的 quote 都失败、且失败原因是限额/权限类（401/402/403/429）时，
    // 才判定为系统性问题，标记 quotaExceeded，让前端整体回退演示数据
    const quotaStatusCodes = [401, 402, 403, 429];
    const allFailed = quoteResults.every(q => !q.ok);
    const allFailedDueToQuota = allFailed && quoteResults.every(q => quotaStatusCodes.includes(q.status));

    if (allFailed) {
      res.status(allFailedDueToQuota ? 429 : 502).json({
        error: "All ticker quote requests failed",
        quotaExceeded: allFailedDueToQuota
      });
      return;
    }

    // 正常路径：把价格和PE合并，单个标的没有数据时该字段为 null，不影响其他标的
    const merged = tickerList.map(ticker => {
      const q = quoteResults.find(r => r.symbol === ticker);
      const m = metricsResults.find(r => r.symbol === ticker);
      if (!q || !q.ok || !q.data) {
        // 这只标的的 quote 本身就拿不到（可能是新股/退市/代码错误），
        // 标记出来，前端可以展示"暂无法获取数据"而不是直接丢弃整份报告
        return { symbol: ticker, unavailable: true };
      }
      return {
        symbol: ticker,
        price: q.data.price,
        changePercentage: q.data.changePercentage,
        name: q.data.name,
        peRatio: m ? m.peRatio : null
      };
    });

    res.setHeader("Cache-Control", "s-maxage=60, stale-while-revalidate=120");
    res.status(200).json({ data: merged, quotaExceeded: false });
  } catch (err) {
    res.status(502).json({ error: "Failed to reach FMP" });
  }
}
