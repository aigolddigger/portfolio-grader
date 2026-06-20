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
 * ----------------------------------------------------------------
 */

export default async function handler(req, res) {
  // 只允许 GET，避免被当作其他用途的代理误用
  if (req.method !== "GET") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const apiKey = process.env.FMP_API_KEY;
  if (!apiKey) {
    // 服务器端没配置 Key 时明确报错，而不是静默失败，
    // 方便部署后第一时间发现配置遗漏
    res.status(500).json({ error: "FMP_API_KEY not configured on server" });
    return;
  }

  const tickersParam = req.query.tickers;
  if (!tickersParam || typeof tickersParam !== "string") {
    res.status(400).json({ error: "Missing tickers query parameter" });
    return;
  }

  // 基础校验：只允许字母、数字、点、逗号，防止把任意路径拼进 FMP 请求里
  const sanitized = tickersParam.toUpperCase().replace(/[^A-Z0-9.,]/g, "");
  if (!sanitized) {
    res.status(400).json({ error: "Invalid tickers parameter" });
    return;
  }

  const url = `https://financialmodelingprep.com/api/v3/quote/${sanitized}?apikey=${apiKey}`;

  try {
    const fmpRes = await fetch(url);
    if (!fmpRes.ok) {
      res.status(fmpRes.status).json({ error: `FMP request failed: ${fmpRes.status}` });
      return;
    }
    const data = await fmpRes.json();

    // 短缓存：行情数据没必要每个请求都打到 FMP，
    // 60秒内的重复请求直接复用 CDN 缓存结果，减少免费额度消耗
    res.setHeader("Cache-Control", "s-maxage=60, stale-while-revalidate=120");
    res.status(200).json(data);
  } catch (err) {
    res.status(502).json({ error: "Failed to reach FMP" });
  }
}
