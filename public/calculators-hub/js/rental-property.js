/* Rental Property / Investment Cash Flow Analyzer */
(function (global) {
  const { formatUSD, formatPct, parseNum, loadInputs, saveInputs, monthlyPayment,
    destroyCharts, CHART_COLORS, inputRow, debounce } = global.LTH;

  const ID = 'rental-property';
  let charts = [];

  const defaults = {
    purchasePrice: 325000, downPct: 25, rate: 7.0, term: 30,
    monthlyRent: 2400, vacancy: 5, expenses: 35, appreciation: 3,
  };

  function calc(s) {
    const price = parseNum(s.purchasePrice);
    const down = price * parseNum(s.downPct) / 100;
    const loan = price - down;
    const rate = parseNum(s.rate);
    const term = parseInt(s.term, 10);
    const pi = monthlyPayment(loan, rate, term);
    const rent = parseNum(s.monthlyRent);
    const vacancy = parseNum(s.vacancy) / 100;
    const expPct = parseNum(s.expenses) / 100;
    const appr = parseNum(s.appreciation) / 100;
    const grossAnnual = rent * 12;
    const effectiveRent = grossAnnual * (1 - vacancy);
    const operating = effectiveRent * expPct;
    const noi = effectiveRent - operating;
    const cashFlow = (noi / 12) - pi;
    const capRate = price > 0 ? (noi / price) * 100 : 0;
    const cashInvested = down + price * 0.03;
    const coc = cashInvested > 0 ? ((cashFlow * 12) / cashInvested) * 100 : 0;
    const projection = [];
    let val = price;
    let bal = loan;
    const r = rate / 100 / 12;
    for (let y = 1; y <= 5; y++) {
      for (let m = 0; m < 12; m++) {
        const interest = bal * r;
        bal = Math.max(0, bal - (pi - interest));
      }
      val *= (1 + appr);
      const yrRent = rent * Math.pow(1.02, y - 1) * 12 * (1 - vacancy);
      const yrExp = yrRent * expPct;
      projection.push({ year: y, cashFlow: (yrRent - yrExp) / 12 - pi, equity: val - bal });
    }
    return { s, price, down, loan, pi, rent, noi, cashFlow, capRate, coc, projection, cashInvested };
  }

  function render() {
    const d = calc(loadInputs(ID, defaults));
    return `
      <div class="calc-panel" data-calc="${ID}">
        <div class="calc-header">
          <div><h2 class="calc-title">Rental Property Cash Flow Analyzer</h2>
            <p class="calc-subtitle">Evaluate cap rate, cash-on-cash return, and a 5-year projection for investment properties.</p></div>
          <button type="button" class="btn-secondary btn-sm" id="rp-preset">Starter Rental</button>
        </div>
        <p class="calc-disclaimer">Simplified investor model. Excludes depreciation, taxes, and transaction costs.</p>
        <div class="calc-grid">
          <div class="calc-inputs">
            ${inputRow('Purchase Price', 'rp-price', { min: 50000, max: 2000000, step: 5000, value: d.price, slider: true })}
            ${inputRow('Down Payment %', 'rp-down', { min: 15, max: 50, step: 1, value: d.s.downPct, suffix: '%' })}
            ${inputRow('Interest Rate', 'rp-rate', { min: 4, max: 12, step: 0.125, value: d.s.rate, suffix: '%' })}
            ${inputRow('Monthly Rent', 'rp-rent', { min: 500, max: 15000, step: 50, value: d.rent, slider: true })}
            ${inputRow('Vacancy Rate', 'rp-vac', { min: 0, max: 25, step: 1, value: d.s.vacancy, suffix: '%' })}
            ${inputRow('Operating Expenses % of Rent', 'rp-exp', { min: 20, max: 60, step: 1, value: d.s.expenses, suffix: '%', tip: 'Insurance, taxes, maintenance, management.' })}
            ${inputRow('Annual Appreciation', 'rp-appr', { min: -2, max: 10, step: 0.5, value: d.s.appreciation, suffix: '%' })}
          </div>
          <div class="calc-outputs">
            <div class="metric-grid">
              <div class="metric-card"><span class="metric-label">Monthly Cash Flow</span><span class="metric-value ${d.cashFlow >= 0 ? 'text-teal' : 'text-rose'}">${formatUSD(d.cashFlow)}</span></div>
              <div class="metric-card"><span class="metric-label">Cap Rate</span><span class="metric-value">${formatPct(d.capRate, 2)}</span></div>
              <div class="metric-card"><span class="metric-label">Cash-on-Cash Return</span><span class="metric-value">${formatPct(d.coc, 2)}</span></div>
              <div class="metric-card"><span class="metric-label">NOI (Annual)</span><span class="metric-value">${formatUSD(d.noi)}</span></div>
            </div>
            <div class="chart-box chart-tall"><canvas id="rp-chart"></canvas></div>
            <table class="data-table"><thead><tr><th>Year</th><th>Monthly CF</th><th>Equity</th></tr></thead><tbody>
              ${d.projection.map(r => `<tr><td>${r.year}</td><td>${formatUSD(r.cashFlow)}</td><td>${formatUSD(r.equity)}</td></tr>`).join('')}
            </tbody></table>
          </div>
        </div>
      </div>`;
  }

  function mount(root) {
    const recalc = () => {
      saveInputs(ID, {
        purchasePrice: document.getElementById('rp-price')?.value,
        downPct: document.getElementById('rp-down')?.value,
        rate: document.getElementById('rp-rate')?.value,
        term: 30,
        monthlyRent: document.getElementById('rp-rent')?.value,
        vacancy: document.getElementById('rp-vac')?.value,
        expenses: document.getElementById('rp-exp')?.value,
        appreciation: document.getElementById('rp-appr')?.value,
      });
      root.innerHTML = render(); mount(root);
    };
    ['rp-price', 'rp-rent'].forEach((id) => global.LTH.bindLinkedSlider(id, `${id}-slider`, recalc));
    root.querySelectorAll('input, select').forEach((el) => {
      el.addEventListener('input', debounce(recalc, 120));
      el.addEventListener('change', recalc);
    });
    document.getElementById('rp-preset')?.addEventListener('click', () => {
      saveInputs(ID, defaults);
      root.innerHTML = render(); mount(root);
    });
    const d = calc(loadInputs(ID, defaults));
    destroyCharts(charts);
    const ctx = document.getElementById('rp-chart');
    if (ctx && typeof Chart !== 'undefined') {
      charts = [new Chart(ctx, {
        type: 'bar',
        data: {
          labels: d.projection.map((r) => `Year ${r.year}`),
          datasets: [
            { label: 'Monthly Cash Flow', data: d.projection.map((r) => r.cashFlow), backgroundColor: CHART_COLORS.teal },
            { label: 'Equity (÷1000)', data: d.projection.map((r) => r.equity / 1000), backgroundColor: CHART_COLORS.navy },
          ],
        },
        options: { responsive: true, maintainAspectRatio: false },
      })];
    }
  }

  global.LTHCalculators = global.LTHCalculators || {};
  global.LTHCalculators[ID] = { id: ID, name: 'Rental Cash Flow', render, mount, destroy: () => destroyCharts(charts) };
})(window);