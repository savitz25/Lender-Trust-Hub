/* Rent vs. Buy Analyzer */
(function (global) {
  const { formatUSD, parseNum, loadInputs, saveInputs, monthlyPayment,
    destroyCharts, CHART_COLORS, bindLinkedSlider, inputRow, debounce } = global.LTH;

  const ID = 'rent-vs-buy';
  let charts = [];

  const defaults = {
    homePrice: 425000, downPct: 20, rate: 6.75, term: 30,
    rent: 2200, rentIncrease: 3, appreciation: 3, investReturn: 7,
    maintenance: 1, horizon: 10, taxBenefit: 15,
  };

  function calc(s) {
    const price = parseNum(s.homePrice);
    const down = price * parseNum(s.downPct) / 100;
    const loan = price - down;
    const rate = parseNum(s.rate);
    const term = parseInt(s.term, 10);
    const pi = monthlyPayment(loan, rate, term);
    const horizon = parseInt(s.horizon, 10);
    const rent = parseNum(s.rent);
    const rentInc = parseNum(s.rentIncrease) / 100;
    const appr = parseNum(s.appreciation) / 100;
    const invest = parseNum(s.investReturn) / 100;
    const maint = parseNum(s.maintenance) / 100;
    const taxPct = parseNum(s.taxBenefit) / 100;

    const buyNet = [];
    const rentNet = [];
    let rentTotal = 0;
    let investBal = down;
    let homeVal = price;
    let loanBal = loan;
    const r = rate / 100 / 12;
    let breakEven = null;

    for (let y = 1; y <= horizon; y++) {
      for (let m = 0; m < 12; m++) {
        const interest = loanBal * r;
        const prin = pi - interest;
        loanBal = Math.max(0, loanBal - prin);
      }
      homeVal *= (1 + appr);
      const equity = homeVal - loanBal;
      const annualCost = pi * 12 + homeVal * maint - (pi * 12 * taxPct * 0.25);
      rentTotal += rent * Math.pow(1 + rentInc, y - 1) * 12;
      investBal = investBal * (1 + invest) + (pi * 12 + homeVal * maint) * 0; // renter invests monthly diff simplified
      const renterInvest = down * Math.pow(1 + invest, y) + (pi * 12 - rent * 12) * y * 0.5;
      buyNet.push({ year: y, netWorth: equity });
      rentNet.push({ year: y, netWorth: Math.max(0, renterInvest) });
      if (!breakEven && equity > rentNet[rentNet.length - 1].netWorth) breakEven = y;
    }

    const finalBuy = buyNet[buyNet.length - 1]?.netWorth || 0;
    const finalRent = rentNet[rentNet.length - 1]?.netWorth || 0;
    return { s, buyNet, rentNet, breakEven, finalBuy, finalRent, recommend: finalBuy > finalRent ? 'buy' : 'rent' };
  }

  function render() {
    const d = calc(loadInputs(ID, defaults));
    return `
      <div class="calc-panel" data-calc="${ID}">
        <div class="calc-header">
          <div><h2 class="calc-title">Rent vs. Buy Analyzer</h2>
            <p class="calc-subtitle">Compare net worth over time with clear assumptions on appreciation, rent, and returns.</p></div>
          <button type="button" class="btn-secondary btn-sm" id="rvb-preset">10-Year Horizon</button>
        </div>
        <p class="calc-disclaimer">Simplified model for education. Tax, closing costs, and opportunity cost vary.</p>
        <div class="calc-grid">
          <div class="calc-inputs">
            ${inputRow('Home Price', 'rvb-price', { min: 100000, max: 2000000, step: 10000, value: d.s.homePrice, slider: true })}
            ${inputRow('Down Payment %', 'rvb-down', { min: 0, max: 50, step: 1, value: d.s.downPct, suffix: '%' })}
            ${inputRow('Mortgage Rate', 'rvb-rate', { min: 2, max: 12, step: 0.125, value: d.s.rate, suffix: '%' })}
            ${inputRow('Monthly Rent', 'rvb-rent', { min: 500, max: 8000, step: 50, value: d.s.rent, slider: true })}
            ${inputRow('Annual Rent Increase', 'rvb-rent-inc', { min: 0, max: 10, step: 0.25, value: d.s.rentIncrease, suffix: '%' })}
            ${inputRow('Home Appreciation', 'rvb-appr', { min: -2, max: 10, step: 0.25, value: d.s.appreciation, suffix: '%' })}
            ${inputRow('Investment Return (if renting)', 'rvb-invest', { min: 0, max: 15, step: 0.5, value: d.s.investReturn, suffix: '%' })}
            ${inputRow('Annual Maintenance %', 'rvb-maint', { min: 0, max: 5, step: 0.1, value: d.s.maintenance, suffix: '%' })}
            <div class="input-group"><label for="rvb-horizon" class="input-label">Time Horizon</label>
              <select id="rvb-horizon" class="select-input">
                ${[5, 7, 10, 15, 30].map(h => `<option value="${h}" ${parseInt(d.s.horizon,10)===h?'selected':''}>${h} years</option>`).join('')}
              </select></div>
            ${inputRow('Tax Benefit Estimate', 'rvb-tax', { min: 0, max: 40, step: 1, value: d.s.taxBenefit, suffix: '%', tip: 'Rough % of interest deductible — simplified.' })}
          </div>
          <div class="calc-outputs">
            <div class="guidance-card ${d.recommend === 'buy' ? 'guidance-ok' : 'guidance-warn'}">
              <h3>${d.recommend === 'buy' ? 'Buying may build more wealth' : 'Renting may be favorable short-term'}</h3>
              <p>After ${d.s.horizon} years: Buy net worth ${formatUSD(d.finalBuy)} vs Rent ${formatUSD(d.finalRent)}.
              ${d.breakEven ? ` Break-even around year ${d.breakEven}.` : ''}</p>
            </div>
            <div class="chart-box chart-tall"><canvas id="rvb-chart"></canvas></div>
            <div class="metric-grid">
              <div class="metric-card"><span class="metric-label">Buy Net Worth</span><span class="metric-value">${formatUSD(d.finalBuy)}</span></div>
              <div class="metric-card"><span class="metric-label">Rent + Invest</span><span class="metric-value">${formatUSD(d.finalRent)}</span></div>
            </div>
          </div>
        </div>
      </div>`;
  }

  function mount(root) {
    const recalc = () => {
      saveInputs(ID, {
        homePrice: document.getElementById('rvb-price')?.value,
        downPct: document.getElementById('rvb-down')?.value,
        rate: document.getElementById('rvb-rate')?.value,
        term: 30,
        rent: document.getElementById('rvb-rent')?.value,
        rentIncrease: document.getElementById('rvb-rent-inc')?.value,
        appreciation: document.getElementById('rvb-appr')?.value,
        investReturn: document.getElementById('rvb-invest')?.value,
        maintenance: document.getElementById('rvb-maint')?.value,
        horizon: document.getElementById('rvb-horizon')?.value,
        taxBenefit: document.getElementById('rvb-tax')?.value,
      });
      root.innerHTML = render(); mount(root);
    };
    ['rvb-price', 'rvb-rent'].forEach((id) => bindLinkedSlider(id, `${id}-slider`, recalc));
    root.querySelectorAll('input, select').forEach((el) => {
      el.addEventListener('input', debounce(recalc, 120));
      el.addEventListener('change', recalc);
    });
    const d = calc(loadInputs(ID, defaults));
    destroyCharts(charts);
    const ctx = document.getElementById('rvb-chart');
    if (ctx && typeof Chart !== 'undefined') {
      charts = [new Chart(ctx, {
        type: 'line',
        data: {
          labels: d.buyNet.map((r) => `Yr ${r.year}`),
          datasets: [
            { label: 'Buy (Equity)', data: d.buyNet.map((r) => r.netWorth), borderColor: CHART_COLORS.teal, tension: 0.3 },
            { label: 'Rent + Invest', data: d.rentNet.map((r) => r.netWorth), borderColor: CHART_COLORS.navy, tension: 0.3 },
          ],
        },
        options: { responsive: true, maintainAspectRatio: false, scales: { y: { ticks: { callback: (v) => formatUSD(v) } } } },
      })];
    }
  }

  global.LTHCalculators = global.LTHCalculators || {};
  global.LTHCalculators[ID] = { id: ID, name: 'Rent vs. Buy', render, mount, destroy: () => destroyCharts(charts) };
})(window);