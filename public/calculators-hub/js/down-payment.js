/* Down Payment Savings Goal Planner */
(function (global) {
  const { formatUSD, parseNum, loadInputs, saveInputs, destroyCharts, CHART_COLORS,
    inputRow, debounce } = global.LTH;

  const ID = 'down-payment';
  let charts = [];

  const defaults = {
    mode: 'target', homePrice: 400000, downPct: 20,
    targetAmount: 80000, currentSavings: 15000,
    monthlyContrib: 500, annualReturn: 4, targetYears: 3,
  };

  function calc(s) {
    const target = s.mode === 'target'
      ? parseNum(s.targetAmount)
      : parseNum(s.homePrice) * parseNum(s.downPct) / 100;
    let balance = parseNum(s.currentSavings);
    const monthly = parseNum(s.monthlyContrib);
    const annualR = parseNum(s.annualReturn) / 100;
    const monthlyR = annualR / 12;
    const targetYears = parseNum(s.targetYears);
    const months = [];
    let m = 0;
    while (balance < target && m < 600) {
      m++;
      const earnings = balance * monthlyR;
      balance += monthly + earnings;
      months.push({ month: m, balance, contrib: monthly * m, earnings: balance - parseNum(s.currentSavings) - monthly * m });
    }
    const monthsToGoal = months.length;
    const requiredMonthly = targetYears > 0
      ? (target - parseNum(s.currentSavings) * Math.pow(1 + annualR, targetYears)) /
        (((Math.pow(1 + monthlyR, targetYears * 12) - 1) / monthlyR) || targetYears * 12)
      : monthly;
    return { s, target, balance, months, monthsToGoal, requiredMonthly: Math.max(0, requiredMonthly), monthly };
  }

  function render() {
    const d = calc(loadInputs(ID, defaults));
    const years = (d.monthsToGoal / 12).toFixed(1);
    return `
      <div class="calc-panel" data-calc="${ID}">
        <div class="calc-header">
          <div><h2 class="calc-title">Down Payment Savings Planner</h2>
            <p class="calc-subtitle">Project your timeline to reach a down payment goal with contributions and growth.</p></div>
        </div>
        <p class="calc-disclaimer">Investment returns are not guaranteed. Savings estimates only.</p>
        <div class="calc-grid">
          <div class="calc-inputs">
            <div class="input-group"><label for="dp-mode" class="input-label">Goal Type</label>
              <select id="dp-mode" class="select-input">
                <option value="target" ${d.s.mode==='target'?'selected':''}>Fixed target amount</option>
                <option value="percent" ${d.s.mode==='percent'?'selected':''}>% of home price</option>
              </select></div>
            <div id="dp-target-fields" class="${d.s.mode==='percent'?'hidden':''}">
              ${inputRow('Target Down Payment', 'dp-target', { min: 1000, max: 500000, step: 1000, value: d.s.targetAmount, slider: true })}
            </div>
            <div id="dp-percent-fields" class="${d.s.mode==='target'?'hidden':''}">
              ${inputRow('Home Price', 'dp-home', { min: 50000, max: 2000000, step: 10000, value: d.s.homePrice })}
              ${inputRow('Down Payment %', 'dp-pct', { min: 3, max: 50, step: 1, value: d.s.downPct, suffix: '%' })}
            </div>
            ${inputRow('Current Savings', 'dp-current', { min: 0, max: 500000, step: 500, value: d.s.currentSavings, slider: true })}
            ${inputRow('Monthly Contribution', 'dp-monthly', { min: 0, max: 10000, step: 50, value: d.monthly, slider: true })}
            ${inputRow('Expected Annual Return', 'dp-return', { min: 0, max: 12, step: 0.25, value: d.s.annualReturn, suffix: '%' })}
            ${inputRow('Target Timeline (years) — reverse calc', 'dp-years', { min: 1, max: 15, step: 0.5, value: d.s.targetYears })}
          </div>
          <div class="calc-outputs">
            <div class="result-hero">
              <span class="result-label">Goal: ${formatUSD(d.target)}</span>
              <span class="result-value text-teal">${d.monthsToGoal < 600 ? `${years} years` : '50+ years'}</span>
              <span class="result-meta">At ${formatUSD(d.monthly)}/mo contribution</span>
            </div>
            <div class="metric-grid">
              <div class="metric-card"><span class="metric-label">Required Monthly (for timeline)</span><span class="metric-value">${formatUSD(d.requiredMonthly)}</span></div>
              <div class="metric-card"><span class="metric-label">Projected Balance</span><span class="metric-value">${formatUSD(d.balance)}</span></div>
            </div>
            <div class="chart-box"><canvas id="dp-chart"></canvas></div>
          </div>
        </div>
      </div>`;
  }

  function mount(root) {
    const recalc = () => {
      saveInputs(ID, {
        mode: document.getElementById('dp-mode')?.value,
        targetAmount: document.getElementById('dp-target')?.value,
        homePrice: document.getElementById('dp-home')?.value,
        downPct: document.getElementById('dp-pct')?.value,
        currentSavings: document.getElementById('dp-current')?.value,
        monthlyContrib: document.getElementById('dp-monthly')?.value,
        annualReturn: document.getElementById('dp-return')?.value,
        targetYears: document.getElementById('dp-years')?.value,
      });
      root.innerHTML = render(); mount(root);
    };
    ['dp-target', 'dp-current', 'dp-monthly'].forEach((id) => global.LTH.bindLinkedSlider(id, `${id}-slider`, recalc));
    root.querySelectorAll('input, select').forEach((el) => {
      el.addEventListener('input', debounce(recalc, 120));
      el.addEventListener('change', recalc);
    });
    const d = calc(loadInputs(ID, defaults));
    destroyCharts(charts);
    const ctx = document.getElementById('dp-chart');
    if (ctx && typeof Chart !== 'undefined') {
      const pts = d.months.filter((_, i) => i % 3 === 0 || i === d.months.length - 1);
      charts = [new Chart(ctx, {
        type: 'line',
        data: {
          labels: pts.map((p) => `Mo ${p.month}`),
          datasets: [{ label: 'Savings Balance', data: pts.map((p) => p.balance), borderColor: CHART_COLORS.teal, fill: true, backgroundColor: 'rgba(5,150,105,0.1)', tension: 0.3 }],
        },
        options: { responsive: true, maintainAspectRatio: false, scales: { y: { ticks: { callback: (v) => formatUSD(v) } } } },
      })];
    }
  }

  global.LTHCalculators = global.LTHCalculators || {};
  global.LTHCalculators[ID] = { id: ID, name: 'Down Payment Planner', render, mount, destroy: () => destroyCharts(charts) };
})(window);