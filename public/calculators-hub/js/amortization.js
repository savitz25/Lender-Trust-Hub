/* Amortization & Payoff Planner */
(function (global) {
  const { formatUSD, formatDate, parseNum, loadInputs, saveInputs, buildAmortSchedule,
    yearlySummary, exportCSV, bindTooltips, bindLinkedSlider, destroyCharts, CHART_COLORS,
    inputRow, debounce } = global.LTH;

  const ID = 'amortization';
  let charts = [];

  const defaults = { principal: 320000, rate: 6.5, term: 30, extraMonthly: 200, lumpSum: 10000, lumpMonth: 12 };

  function calc(s) {
    const principal = parseNum(s.principal);
    const rate = parseNum(s.rate);
    const term = parseInt(s.term, 10);
    const extra = parseNum(s.extraMonthly);
    const lump = parseNum(s.lumpSum);
    const lumpMonth = parseInt(s.lumpMonth, 10) || 1;
    const base = buildAmortSchedule({ principal, annualRate: rate, years: term });
    const adj = buildAmortSchedule({ principal, annualRate: rate, years: term, extraMonthly: extra, lumpSum: lump, lumpMonth });
    return { s, principal, rate, term, extra, lump, lumpMonth, base, adj, saved: base.totalInterest - adj.totalInterest };
  }

  function render() {
    const d = calc(loadInputs(ID, defaults));
    return `
      <div class="calc-panel" data-calc="${ID}">
        <div class="calc-header">
          <div><h2 class="calc-title">Amortization &amp; Payoff Planner</h2>
            <p class="calc-subtitle">Model extra payments and see payoff acceleration in real time.</p></div>
          <div class="calc-actions">
            <button type="button" class="btn-secondary btn-sm" id="am-print">Print</button>
            <button type="button" class="btn-secondary btn-sm" id="am-csv">Export CSV</button>
          </div>
        </div>
        <p class="calc-disclaimer">Estimates for educational purposes only.</p>
        <div class="calc-grid">
          <div class="calc-inputs">
            ${inputRow('Loan Amount', 'am-principal', { min: 10000, max: 2000000, step: 5000, value: d.principal, slider: true })}
            ${inputRow('Interest Rate', 'am-rate', { min: 2, max: 12, step: 0.125, value: d.rate, suffix: '%', slider: true })}
            <div class="input-group"><label for="am-term" class="input-label">Term</label>
              <select id="am-term" class="select-input"><option value="30" ${d.term===30?'selected':''}>30 yr</option><option value="20" ${d.term===20?'selected':''}>20 yr</option><option value="15" ${d.term===15?'selected':''}>15 yr</option></select></div>
            ${inputRow('Extra Monthly Payment', 'am-extra', { min: 0, max: 3000, step: 25, value: d.extra, slider: true })}
            ${inputRow('One-Time Lump Sum', 'am-lump', { min: 0, max: 100000, step: 500, value: d.lump })}
            ${inputRow('Lump Sum Month #', 'am-lump-mo', { min: 1, max: 360, step: 1, value: d.lumpMonth })}
          </div>
          <div class="calc-outputs">
            <div class="metric-grid">
              <div class="metric-card"><span class="metric-label">Standard Payoff</span><span class="metric-value">${formatDate(d.base.payoffDate)}</span></div>
              <div class="metric-card"><span class="metric-label">Accelerated Payoff</span><span class="metric-value text-teal">${formatDate(d.adj.payoffDate)}</span></div>
              <div class="metric-card"><span class="metric-label">Months Saved</span><span class="metric-value">${d.base.payoffMonths - d.adj.payoffMonths}</span></div>
              <div class="metric-card"><span class="metric-label">Interest Saved</span><span class="metric-value text-teal">${formatUSD(d.saved)}</span></div>
            </div>
            <div class="chart-box chart-tall"><canvas id="am-chart"></canvas></div>
            <div class="table-wrap table-scroll"><table class="data-table" id="am-table"><thead><tr><th>Year</th><th>Principal</th><th>Interest</th><th>Balance</th></tr></thead><tbody>
              ${yearlySummary(d.adj.schedule).map(r => `<tr><td>${r.year}</td><td>${formatUSD(r.principal)}</td><td>${formatUSD(r.interest)}</td><td>${formatUSD(r.endBalance)}</td></tr>`).join('')}
            </tbody></table></div>
          </div>
        </div>
      </div>`;
  }

  function mount(root) {
    bindTooltips(root);
    const recalc = () => {
      saveInputs(ID, {
        principal: document.getElementById('am-principal')?.value,
        rate: document.getElementById('am-rate')?.value,
        term: document.getElementById('am-term')?.value,
        extraMonthly: document.getElementById('am-extra')?.value,
        lumpSum: document.getElementById('am-lump')?.value,
        lumpMonth: document.getElementById('am-lump-mo')?.value,
      });
      root.innerHTML = render(); mount(root);
    };
    ['am-principal', 'am-rate', 'am-extra'].forEach((id) => bindLinkedSlider(id, `${id}-slider`, recalc));
    root.querySelectorAll('input, select').forEach((el) => {
      el.addEventListener('input', debounce(recalc, 100));
      el.addEventListener('change', recalc);
    });
    document.getElementById('am-csv')?.addEventListener('click', () => {
      const d = calc(loadInputs(ID, defaults));
      exportCSV([['Month', 'Payment', 'Principal', 'Interest', 'Balance'],
        ...d.adj.schedule.map(r => [r.month, r.payment.toFixed(2), r.principal.toFixed(2), r.interest.toFixed(2), r.balance.toFixed(2)])],
        'lendertrusthub-payoff-plan.csv');
    });
    document.getElementById('am-print')?.addEventListener('click', () => window.print());
    const d = calc(loadInputs(ID, defaults));
    destroyCharts(charts);
    const ctx = document.getElementById('am-chart');
    if (ctx && typeof Chart !== 'undefined') {
      const pts = d.adj.schedule.filter((_, i) => i % 12 === 0);
      charts = [new Chart(ctx, {
        type: 'line',
        data: {
          labels: pts.map((r) => `Yr ${r.year}`),
          datasets: [
            { label: 'With Extras', data: pts.map((r) => r.balance), borderColor: CHART_COLORS.teal, tension: 0.3 },
            { label: 'Standard', data: d.base.schedule.filter((_, i) => i % 12 === 0).map((r) => r.balance), borderColor: CHART_COLORS.slate, borderDash: [5, 5], tension: 0.3 },
          ],
        },
        options: { responsive: true, maintainAspectRatio: false, scales: { y: { ticks: { callback: (v) => formatUSD(v) } } } },
      })];
    }
  }

  global.LTHCalculators = global.LTHCalculators || {};
  global.LTHCalculators[ID] = { id: ID, name: 'Payoff Planner', render, mount, destroy: () => destroyCharts(charts) };
})(window);