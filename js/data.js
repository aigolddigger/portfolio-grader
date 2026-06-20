/**
 * data.js
 * ----------------------------------------------------------------
 * 行情数据获取层。
 *
 * 不再直接持有或调用 Financial Modeling Prep 的 API Key——Key 已经
 * 挪到了服务器端的 Serverless Function（见 /api/quote.js）。这个文件
 * 只负责调用本站自己的 /api/quote 接口，浏览器永远看不到真实 Key。
 *
 * 本地用 `python3 -m http.server` 这类纯静态服务器预览时，/api/quote
 * 是访问不到的（Serverless Function 只在 Vercel 部署后才存在），
 * 此时会自动退回到下面的演示数据，保证本地预览依然可用。
 * ----------------------------------------------------------------
 */

const MarketData = (() => {
  const QUOTE_ENDPOINT = "/api/quote";

  // 演示数据：当 /api/quote 不可用时使用（本地预览，或服务器端未配置 Key）
  const DEMO_DATA = {
    VOO:  { price: 602.95, peRatio: 27.7,  yearChangePct: 18.2, name: "Vanguard S&P 500 ETF" },
    QQQM: { price: 240.10, peRatio: 33.4,  yearChangePct: 27.0, name: "Invesco NASDAQ 100 ETF" },
    VGT:  { price: 690.30, peRatio: 36.8,  yearChangePct: 24.5, name: "Vanguard Information Technology ETF" },
    SMH:  { price: 659.88, peRatio: 44.5,  yearChangePct: 83.2, name: "VanEck Semiconductor ETF" },
    BABA: { price: 107.10, peRatio: 16.2,  yearChangePct: -5.2, name: "Alibaba Group Holding" },
    AAPL: { price: 213.40, peRatio: 29.1,  yearChangePct: 12.4, name: "Apple Inc." },
    TSLA: { price: 248.50, peRatio: 68.3,  yearChangePct: -8.1, name: "Tesla Inc." },
    NVDA: { price: 142.80, peRatio: 38.6,  yearChangePct: 91.5, name: "NVIDIA Corporation" },
  };

  function fallbackToDemo(tickers) {
    const result = {};
    tickers.forEach(t => { result[t] = DEMO_DATA[t] || null; });
    return { data: result, isDemo: true };
  }

  /**
   * 拉取一组 ticker 的行情快照，通过本站的 /api/quote 代理。
   * 返回 { TICKER: { price, peRatio, yearChangePct, name } }
   */
  async function fetchQuotes(tickers) {
    const symbols = tickers.join(",");

    try {
      const res = await fetch(`${QUOTE_ENDPOINT}?tickers=${encodeURIComponent(symbols)}`);
      if (!res.ok) {
        console.warn(`/api/quote 返回 ${res.status}，回退到演示数据`);
        return fallbackToDemo(tickers);
      }
      const json = await res.json();
      if (!Array.isArray(json)) {
        console.warn("/api/quote 返回格式异常，回退到演示数据");
        return fallbackToDemo(tickers);
      }

      const result = {};
      tickers.forEach(t => {
        const match = json.find(q => q.symbol === t.toUpperCase());
        result[t] = match ? {
          price: match.price,
          peRatio: match.pe,
          yearChangePct: match.changesPercentage,
          name: match.name
        } : null;
      });
      return { data: result, isDemo: false };
    } catch (err) {
      console.error("行情获取失败，回退到演示数据：", err);
      return fallbackToDemo(tickers);
    }
  }

  return { fetchQuotes };
})();
