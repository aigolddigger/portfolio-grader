/**
 * app.js
 * ----------------------------------------------------------------
 * 页面交互逻辑：动态持仓行、权重校验、示例数据、语言切换、报告渲染。
 * ----------------------------------------------------------------
 */

(() => {
  const listEl = document.getElementById("holdings-list");
  const addRowBtn = document.getElementById("add-row");
  const weightTotalEl = document.getElementById("weight-total");
  const generateBtn = document.getElementById("generate-btn");
  const reportSection = document.getElementById("report-section");
  const reportOutput = document.getElementById("report-output");
  const langToggle = document.getElementById("lang-toggle");

  let lastReport = null; // 保留最近一次报告状态，语言切换时可重渲染

  const EXAMPLES = {
    tech: [["VOO", 30], ["QQQM", 25], ["VGT", 20], ["SMH", 15], ["BABA", 10]],
    mixed: [["AAPL", 20], ["BABA", 20], ["TSLA", 15], ["VOO", 30], ["SMH", 15]],
    single: [["NVDA", 60], ["VOO", 40]]
  };

  function createRow(ticker = "", weight = "") {
    const row = document.createElement("div");
    row.className = "holding-row";

    const tickerInput = document.createElement("input");
    tickerInput.type = "text";
    tickerInput.placeholder = "VOO";
    tickerInput.value = ticker;
    tickerInput.setAttribute("aria-label", "ticker");
    tickerInput.maxLength = 10;

    const weightInput = document.createElement("input");
    weightInput.type = "number";
    weightInput.placeholder = "0";
    weightInput.value = weight;
    weightInput.min = "0";
    weightInput.max = "100";
    weightInput.setAttribute("aria-label", "weight");
    weightInput.addEventListener("input", updateWeightTotal);

    const removeBtn = document.createElement("button");
    removeBtn.type = "button";
    removeBtn.className = "row-remove";
    removeBtn.setAttribute("aria-label", "remove");
    removeBtn.textContent = "×";
    removeBtn.addEventListener("click", () => { row.remove(); updateWeightTotal(); });

    row.appendChild(tickerInput);
    row.appendChild(weightInput);
    row.appendChild(removeBtn);
    listEl.appendChild(row);
    return row;
  }

  function updateWeightTotal() {
    const weightInputs = listEl.querySelectorAll('input[type="number"]');
    let total = 0;
    weightInputs.forEach(inp => { total += parseFloat(inp.value) || 0; });
    total = Math.round(total);
    weightTotalEl.textContent = total + "%";
    weightTotalEl.classList.toggle("warn", total > 0 && total !== 100);
  }

  function loadExample(key) {
    listEl.innerHTML = "";
    EXAMPLES[key].forEach(([t, w]) => createRow(t, w));
    updateWeightTotal();
  }

  function collectHoldings() {
    const rows = listEl.querySelectorAll(".holding-row");
    const holdings = [];
    rows.forEach(row => {
      const inputs = row.querySelectorAll("input");
      const ticker = inputs[0].value.trim().toUpperCase();
      const weight = parseFloat(inputs[1].value) || 0;
      if (ticker && weight > 0) holdings.push({ ticker, weight });
    });
    return holdings;
  }

  function bandLabel(band) {
    return { high: I18N.t('bandHigh'), mid: I18N.t('bandMid'), low: I18N.t('bandLow') }[band];
  }

  function renderReport(report, isDemo) {
    const { date, scores, reviews, actions, summary } = report;

    const scoreCell = (label, s) => `
      <div class="score-cell">
        <div class="score-label">${label}</div>
        <div class="score-num ${s.band}">${s.value}<span style="font-size:14px">/100</span></div>
      </div>`;

    const reviewRow = r => `
      <tr>
        <td class="tk">${r.ticker}</td>
        <td class="rv">${r.text}</td>
      </tr>`;

    const actionItem = (a, i) => `<li data-n="${String(i + 1).padStart(2, "0")}">${a}</li>`;

    reportOutput.innerHTML = `
      <div class="report-card">
        <p class="report-date">${date}${isDemo ? " · " + I18N.t('reportDemo') : ""}</p>
        <h3 class="report-title">${I18N.t('reportTitle')}</h3>

        <div class="score-grid">
          ${scoreCell(I18N.t('scoreMargin') + ' · ' + bandLabel(scores.margin.band), scores.margin)}
          ${scoreCell(I18N.t('scoreDefensive') + ' · ' + bandLabel(scores.defensive.band), scores.defensive)}
          ${scoreCell(I18N.t('scoreDiversification') + ' · ' + bandLabel(scores.diversification.band), scores.diversification)}
        </div>

        <div class="report-block">
          <h4>${I18N.t('reviewHeader')}</h4>
          <table class="holding-table">${reviews.map(reviewRow).join("")}</table>
        </div>

        <div class="report-block">
          <h4>${I18N.t('actionsHeader')}</h4>
          <ul class="action-list">${actions.map(actionItem).join("")}</ul>
        </div>

        <div class="report-block">
          <h4>${I18N.t('summaryHeader')}</h4>
          <p class="summary-quote">${summary}</p>
        </div>

        <p class="report-disclaimer">
          ${isDemo ? I18N.t('disclaimerDemo') : I18N.t('disclaimerLive')}
          ${I18N.t('disclaimerFixed')}
        </p>
      </div>
    `;

    reportSection.hidden = false;
  }

  function renderLoading() {
    reportOutput.innerHTML = `<div class="report-card"><p class="report-loading">${I18N.t('loadingText')}</p></div>`;
    reportSection.hidden = false;
    reportSection.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  async function handleGenerate() {
    const holdings = collectHoldings();
    if (holdings.length === 0) {
      alert(I18N.t('alertEmpty'));
      return;
    }

    const fundSize = document.getElementById("fund-size").value;
    const style = document.getElementById("invest-style").value;
    const meta = { fundSize, style };

    generateBtn.disabled = true;
    generateBtn.textContent = I18N.t('generating');
    renderLoading();

    try {
      const tickers = holdings.map(h => h.ticker);
      const { data: quotes, isDemo } = await MarketData.fetchQuotes(tickers);
      const report = GrahamGrader.generateReport(holdings, quotes, meta);
      lastReport = { holdings, quotes, meta, isDemo }; // 保存原始输入，供语言切换后重新生成文案
      renderReport(report, isDemo);
    } catch (err) {
      console.error(err);
      reportOutput.innerHTML = `<div class="report-card"><p class="report-loading">${I18N.t('errorText')}</p></div>`;
    } finally {
      generateBtn.disabled = false;
      generateBtn.textContent = I18N.t('generateBtn');
    }
  }

  // ---- 语言切换：重写所有 data-i18n 标记的文案，并在有报告时重新生成报告文案 ----
  function applyTranslations() {
    document.querySelectorAll("[data-i18n]").forEach(el => {
      el.textContent = I18N.t(el.dataset.i18n);
    });
    document.querySelectorAll("[data-i18n-placeholder]").forEach(el => {
      el.placeholder = I18N.t(el.dataset.i18nPlaceholder);
    });
    document.documentElement.lang = I18N.getLang() === "en" ? "en" : "zh-CN";

    if (lastReport) {
      const report = GrahamGrader.generateReport(lastReport.holdings, lastReport.quotes, lastReport.meta);
      renderReport(report, lastReport.isDemo);
    }
  }

  function toggleLang() {
    const next = I18N.getLang() === "zh" ? "en" : "zh";
    I18N.setLang(next);
    applyTranslations();
  }

  // ---- wire up ----
  addRowBtn.addEventListener("click", () => createRow());
  generateBtn.addEventListener("click", handleGenerate);
  langToggle.addEventListener("click", toggleLang);
  document.querySelectorAll(".chip").forEach(chip => {
    chip.addEventListener("click", () => loadExample(chip.dataset.example));
  });

  loadExample("tech");
})();
