/* Refinance Breakeven & Savings Calculator */
(function (global) {
  const { formatUSD, formatPct, parseNum, loadInputs, saveInputs, monthlyPayment,
    buildAmortSchedule, bindTooltips, bindLinkedSlider, destroyCharts, CHART_COLORS,
    inputRow, debounce } = global.LTH;

  const ID = 'refinance';
  let charts = [];

  const defaults = {
    balance: 285000, currentRate: 7.25, remainingYears: 27,
    newRate: 6.5, newTerm: 30, closingCosts: 6500, cashOut: 0,
  };

  function calc(s) {
    const balance = parseNum(s.balance) + parseNum(s.cashOut);
    const oldPay = monthlyPayment(parseNum(s.balance), parseNum(s.currentRate), parseNum(s.remainingYears));
    const newPay = monthlyPayment(balance, parseNum(s.newRate), parseInt(s.newTerm, 10));
    const monthlySavings = oldPay - newPay;
    const closing = parseNum(s.closingCosts);
    const breakeven = monthlySavings > 0 ? Math.ceil(closing / monthlySavings) : Infinity;
    const oldAmort = buildAmortSchedule({ principal: parseNum(s.balance), annualRate: parseNum(s.currentRate), years: parseNum(s.remainingYears) });
    const newAmort = buildAmortSchedule({ principal: balance, annualRate: parseNum(s.newRate), years: parseInt(s.newTerm, 10) });
    const interestSaved = oldAmort.totalInterest - newAmort.totalInterest;
    return { s, balance, oldPay, newPay, monthlySavings, annualSavings: monthlySavings * 12, breakeven, closing, oldAmort, newAmort, interestSaved };
  }

  function render() {
    const d = calc(loadInputs(ID, defaults));
    return `
      <div class="calc-panel" data-calc="${ID}">
        <div class="calc-header">
          <div><h2 class="calc-title">Refinance Breakeven &amp; Savings</h2>
            <p class="calc-subtitle">Compare your current loan vs a refinance — payments, breakeven, and lifetime interest.</p></div>
          <button type="button" class="btn-secondary btn-sm" id="rf-preset">0.75% Rate Drop</button>
        </div>
        <p class="calc-disclaimer">Estimates for educational purposes only. Closing costs and rates vary by lender.</p>
        <div class="calc-grid">
          <div class="calc-inputs">
            ${inputRow('Current Loan Balance', 'rf-balance', { min: 10000, max: 2000000, step: 5000, value: d.s.balance, slider: true })}
            ${inputRow('Current Rate', 'rf-cur-rate', { min: 2, max: 12, step: 0.125, value: d.s.currentRate, suffix: '%', slider: true })}
            ${inputRow('Remaining Term (years)', 'rf-rem', { min: 1, max: 30, step: 1, value: d.s.remainingYears })}
            ${inputRow('New Rate', 'rf-new-rate', { min: 2, max: 12, step: 0.125, value: d.s.newRate, suffix: '%', slider: true })}
            <div class="input-group"><label for="rf-new-term" class="input-label">New Term</label>
              <select id="rf-new-term" class="select-input"><option value="30" ${d.s.newTerm==30?'selected':''}>30 yr</option><option value="25" ${d.s.newTerm==25?'selected':''}>25 yr</option><option value="20" ${d.s.newTerm==20?'selected':''}>20 yr</option><option value="15" ${d.s.newTerm==15?'selected':''}>15 yr</option></select></div>
            ${inputRow('Closing Costs / Points', 'rf-closing', { min: 0, max: 25000, step: 250, value: d.s.closingCosts })}
            ${inputRow('Cash-Out Amount', 'rf-cashout', { min: 0, max: 200000, step: 1000, value: d.s.cashOut, tip: 'Added to new loan balance.' })}
          </div>
          <div class="calc-outputs">
            <div class="compare-banner">
              <div><span class="compare-label">Current</span><span class="compare-val">${formatUSD(d.oldPay)}/mo</span></div>
              <div class="compare-arrow">→</div>
              <div><span class="compare-label">New</span><span class="compare-val text-teal">${formatUSD(d.newPay)}/mo</span></div>
            </div>
            <div class="metric-grid">
              <div class="metric-card"><span class="metric-label">Monthly Savings</span><span class="metric-value ${d.monthlySavings >= 0 ? 'text-teal' : 'text-rose'}">${formatUSD(d.monthlySavings)}</span></div>
              <div class="metric-card"><span class="metric-label">Annual Savings</span><span class="metric-value">${formatUSD(d.annualSavings)}</span></div>
              <div class="metric-card"><span class="metric-label">Breakeven</span><span class="metric-value">${d.breakeven === Infinity ? 'N/A' : `${d.breakeven} mo`}</span></div>
              <div class="metric-card"><span class="metric-label">Lifetime Interest Saved</span><span class="metric-value">${formatUSD(Math.max(0, d.interestSaved))}</span></div>
            </div>
            <div class="chart-box chart-tall"><canvas id="rf-chart" aria-label="Payment comparison"></canvas></div>
            <div class="summary-table">
              <table class="data-table"><thead><tr><th></th><th>Current</th><th>New</th></tr></thead>
              <tbody>
                <tr><td>Monthly P&amp;I</td><td>${formatUSD(d.oldPay)}</td><td>${formatUSD(d.newPay)}</td></tr>
                <tr><td>Total Interest</td><td>${formatUSD(d.oldAmort.totalInterest)}</td><td>${formatUSD(d.newAmort.totalInterest)}</td></tr>
                <tr><td>Payoff (months)</td><td>${d.oldAmort.payoffMonths}</td><td>${d.newAmort.payoffMonths}</td></tr>
              </tbody></table>
            </div>
            <div class="cta-strip"><a href="/local-lenders" class="btn-primary">Find Trusted Local Lenders</a></div>
          </div>
        </div>
      </div>`;
  }

  function mount(root) {
    bindTooltips(root);
    const recalc = () => {
      saveInputs(ID, {
        balance: document.getElementById('rf-balance')?.value,
        currentRate: document.getElementById('rf-cur-rate')?.value,
        remainingYears: document.getElementById('rf-rem')?.value,
        newRate: document.getElementById('rf-new-rate')?.value,
        newTerm: document.getElementById('rf-new-term')?.value,
        closingCosts: document.getElementById('rf-closing')?.value,
        cashOut: document.getElementById('rf-cashout')?.value,
      });
      root.innerHTML = render(); mount(root);
    };
    ['rf-balance', 'rf-cur-rate', 'rf-new-rate'].forEach((id) => bindLinkedSlider(id, `${id}-slider`, recalc));
    root.querySelectorAll('input, select').forEach((el) => {
      el.addEventListener('input', debounce(recalc, 120));
      el.addEventListener('change', recalc);
    });
    document.getElementById('rf-preset')?.addEventListener('click', () => {
      saveInputs(ID, { ...defaults, currentRate: 7.25, newRate: 6.5 });
      root.innerHTML = render(); mount(root);
    });
    const d = calc(loadInputs(ID, defaults));
    destroyCharts(charts);
    const ctx = document.getElementById('rf-chart');
    if (ctx && typeof Chart !== 'undefined') {
      charts = [new Chart(ctx, {
        type: 'bar',
        data: {
          labels: ['Monthly Payment', 'Total Interest (k)'],
          datasets: [
            { label: 'Current', data: [d.oldPay, d.oldAmort.totalInterest / 1000], backgroundColor: CHART_COLORS.slate },
            { label: 'New', data: [d.newPay, d.newAmort.totalInterest / 1000], backgroundColor: CHART_COLORS.teal },
          ],
        },
        options: { responsive: true, maintainAspectRatio: false },
      })];
    }
  }

  global.LTHCalculators = global.LTHCalculators || {};
  global.LTHCalculators[ID] = { id: ID, name: 'Refinance Savings', render, mount, destroy: () => destroyCharts(charts) };
})(window);