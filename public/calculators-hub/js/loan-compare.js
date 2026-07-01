/* Side-by-Side Loan Comparison */
(function (global) {
  const { formatUSD, formatDate, parseNum, loadInputs, saveInputs, monthlyPayment,
    buildAmortSchedule, destroyCharts, CHART_COLORS, bindLinkedSlider, inputRow, debounce } = global.LTH;

  const ID = 'loan-compare';
  let charts = [];

  const defaults = {
    price: 400000,
    s1: { down: 20, rate: 6.5, term: 30, points: 0 },
    s2: { down: 10, rate: 6.25, term: 30, points: 1 },
    s3: { down: 20, rate: 6.0, term: 15, points: 0 },
    showThird: false,
  };

  function scenario(price, cfg) {
    const down$ = price * parseNum(cfg.down) / 100;
    const loan = price - down$ + parseNum(cfg.points) * 1000;
    const rate = parseNum(cfg.rate);
    const term = parseInt(cfg.term, 10);
    const pay = monthlyPayment(loan, rate, term);
    const amort = buildAmortSchedule({ principal: loan, annualRate: rate, years: term });
    return { label: `${cfg.down}% down · ${rate}% · ${term}yr`, down$, loan, rate, term, pay, amort };
  }

  function calc(s) {
    const price = parseNum(s.price);
    const scenarios = [scenario(price, s.s1), scenario(price, s.s2)];
    if (s.showThird) scenarios.push(scenario(price, s.s3));
    return { s, price, scenarios };
  }

  function render() {
    const d = calc(loadInputs(ID, defaults));
    const sc = (n, cfg, prefix) => `
      <fieldset class="scenario-fieldset"><legend>Scenario ${n}</legend>
        ${inputRow('Down %', `${prefix}-down`, { min: 0, max: 50, step: 1, value: cfg.down, suffix: '%' })}
        ${inputRow('Rate', `${prefix}-rate`, { min: 2, max: 12, step: 0.125, value: cfg.rate, suffix: '%' })}
        <div class="input-group"><label for="${prefix}-term" class="input-label">Term</label>
          <select id="${prefix}-term" class="select-input"><option value="30" ${cfg.term==30?'selected':''}>30</option><option value="20" ${cfg.term==20?'selected':''}>20</option><option value="15" ${cfg.term==15?'selected':''}>15</option></select></div>
        ${inputRow('Points Cost ($)', `${prefix}-points`, { min: 0, max: 10000, step: 250, value: cfg.points })}
      </fieldset>`;

    return `
      <div class="calc-panel" data-calc="${ID}">
        <div class="calc-header">
          <div><h2 class="calc-title">Loan Comparison Tool</h2>
            <p class="calc-subtitle">Compare 2–3 loan scenarios side by side — payments, interest, and total cost.</p></div>
        </div>
        <p class="calc-disclaimer">Estimates for educational purposes only.</p>
        <div class="calc-grid">
          <div class="calc-inputs">
            ${inputRow('Home Price', 'lc-price', { min: 100000, max: 2000000, step: 10000, value: d.price, slider: true })}
            ${sc(1, d.s.s1, 'lc-s1')}
            ${sc(2, d.s.s2, 'lc-s2')}
            <label class="checkbox-label"><input type="checkbox" id="lc-s3-toggle" ${d.s.showThird ? 'checked' : ''}> Compare 3rd scenario</label>
            <div id="lc-s3-wrap" class="${d.s.showThird ? '' : 'hidden'}">${sc(3, d.s.s3, 'lc-s3')}</div>
          </div>
          <div class="calc-outputs">
            <div class="chart-box chart-tall"><canvas id="lc-chart"></canvas></div>
            <table class="data-table compare-table">
              <thead><tr><th>Metric</th>${d.scenarios.map((_, i) => `<th>Scenario ${i + 1}</th>`).join('')}</tr></thead>
              <tbody>
                <tr><td>Monthly P&amp;I</td>${d.scenarios.map(s => `<td>${formatUSD(s.pay)}</td>`).join('')}</tr>
                <tr><td>Loan Amount</td>${d.scenarios.map(s => `<td>${formatUSD(s.loan)}</td>`).join('')}</tr>
                <tr><td>Total Interest</td>${d.scenarios.map(s => `<td>${formatUSD(s.amort.totalInterest)}</td>`).join('')}</tr>
                <tr><td>Total Cost</td>${d.scenarios.map(s => `<td>${formatUSD(s.amort.totalCost)}</td>`).join('')}</tr>
                <tr><td>Payoff Date</td>${d.scenarios.map(s => `<td>${formatDate(s.amort.payoffDate)}</td>`).join('')}</tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>`;
  }

  function readForm() {
    const rd = (p) => ({
      down: document.getElementById(`${p}-down`)?.value,
      rate: document.getElementById(`${p}-rate`)?.value,
      term: document.getElementById(`${p}-term`)?.value,
      points: document.getElementById(`${p}-points`)?.value,
    });
    return {
      price: document.getElementById('lc-price')?.value,
      s1: rd('lc-s1'), s2: rd('lc-s2'), s3: rd('lc-s3'),
      showThird: document.getElementById('lc-s3-toggle')?.checked,
    };
  }

  function mount(root) {
    const recalc = () => { saveInputs(ID, readForm()); root.innerHTML = render(); mount(root); };
    bindLinkedSlider('lc-price', 'lc-price-slider', recalc);
    root.querySelectorAll('input, select').forEach((el) => {
      el.addEventListener('input', debounce(recalc, 120));
      el.addEventListener('change', recalc);
    });
    const d = calc(loadInputs(ID, defaults));
    destroyCharts(charts);
    const ctx = document.getElementById('lc-chart');
    if (ctx && typeof Chart !== 'undefined') {
      charts = [new Chart(ctx, {
        type: 'bar',
        data: {
          labels: d.scenarios.map((s, i) => `Scenario ${i + 1}`),
          datasets: [
            { label: 'Monthly Payment', data: d.scenarios.map(s => s.pay), backgroundColor: CHART_COLORS.navy },
            { label: 'Total Interest (÷1000)', data: d.scenarios.map(s => s.amort.totalInterest / 1000), backgroundColor: CHART_COLORS.teal },
          ],
        },
        options: { responsive: true, maintainAspectRatio: false },
      })];
    }
  }

  global.LTHCalculators = global.LTHCalculators || {};
  global.LTHCalculators[ID] = { id: ID, name: 'Loan Compare', render, mount, destroy: () => destroyCharts(charts) };
})(window);