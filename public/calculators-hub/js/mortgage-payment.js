/* Mortgage Payment Calculator (PITI) */
(function (global) {
  const { formatUSD, formatPct, formatDate, parseNum, loadInputs, saveInputs,
    buildAmortSchedule, yearlySummary, calcPMI, monthlyPayment, exportCSV,
    bindTooltips, bindLinkedSlider, destroyCharts, CHART_COLORS, STATE_TAX_RATES,
    inputRow, debounce } = global.LTH;

  const ID = 'mortgage-payment';
  let charts = [];

  const defaults = {
    homePrice: 425000, downPct: 20, loanOverride: '',
    rate: 6.75, term: 30, startDate: new Date().toISOString().slice(0, 10),
    taxState: 'FL', taxAmount: 3780, taxMode: 'amount',
    insurance: 1800, hoa: 0, pmiManual: '', showAdvanced: false,
    extraMonthly: 0, lumpSum: 0, tableMode: 'monthly', showTable: false,
  };

  function getState() {
    const s = loadInputs(ID, defaults);
    const homePrice = parseNum(s.homePrice, 425000);
    const downPct = parseNum(s.downPct, 20);
    const down$ = homePrice * downPct / 100;
    let loan = s.loanOverride !== '' ? parseNum(s.loanOverride) : homePrice - down$;
    loan = Math.max(0, loan);
    const ltv = homePrice > 0 ? (loan / homePrice) * 100 : 0;
    const taxRate = STATE_TAX_RATES[s.taxState] ?? 1.1;
    const taxAnnual = s.taxMode === 'pct' ? homePrice * taxRate / 100 : parseNum(s.taxAmount, 3780);
    const insAnnual = parseNum(s.insurance, 1800);
    const hoa = parseNum(s.hoa, 0);
    const rate = parseNum(s.rate, 6.75);
    const term = parseInt(s.term, 10) || 30;
    const pmi = calcPMI(loan, homePrice, s.pmiManual === '' ? null : parseNum(s.pmiManual));
    const pi = monthlyPayment(loan, rate, term);
    const monthlyTax = taxAnnual / 12;
    const monthlyIns = insAnnual / 12;
    const piti = pi + monthlyTax + monthlyIns + hoa + pmi;
    const start = new Date(s.startDate || Date.now());
    const amort = buildAmortSchedule({
      principal: loan, annualRate: rate, years: term,
      extraMonthly: parseNum(s.extraMonthly), lumpSum: parseNum(s.lumpSum),
      startDate: start,
    });
    const baseAmort = buildAmortSchedule({ principal: loan, annualRate: rate, years: term, startDate: start });
    const interestSaved = baseAmort.totalInterest - amort.totalInterest;
    return {
      s, homePrice, downPct, down$, loan, ltv, taxAnnual, insAnnual, hoa,
      rate, term, pmi, pi, monthlyTax, monthlyIns, piti, start, amort,
      baseAmort, interestSaved,
    };
  }

  function render() {
    const d = getState();
    return `
      <div class="calc-panel" data-calc="${ID}">
        <div class="calc-header">
          <div>
            <h2 class="calc-title">Mortgage Payment Calculator</h2>
            <p class="calc-subtitle">Full PITI breakdown with taxes, insurance, PMI, amortization &amp; extra payments.</p>
          </div>
          <div class="calc-actions">
            <button type="button" class="btn-secondary btn-sm" id="mp-preset-fl">FL First-Time Buyer</button>
            <button type="button" class="btn-secondary btn-sm" id="mp-print">Print</button>
            <button type="button" class="btn-secondary btn-sm" id="mp-csv">Export CSV</button>
          </div>
        </div>
        <p class="calc-disclaimer">Estimates for educational purposes only. Actual rates, fees, and approvals vary.</p>

        <div class="calc-grid">
          <div class="calc-inputs">
            ${inputRow('Home Price', 'mp-home', { min: 50000, max: 3000000, step: 5000, value: d.homePrice, slider: true, tip: 'Purchase price of the property.' })}
            ${inputRow('Down Payment %', 'mp-down-pct', { min: 0, max: 50, step: 0.5, value: d.downPct, slider: true })}
            <div class="input-group"><label class="input-label">Down Payment $</label><div class="derived-value" id="mp-down-dollar">${formatUSD(d.down$)}</div></div>
            <div class="input-group"><label for="mp-loan" class="input-label">Loan Amount ${global.LTH.tooltipHTML('Auto-calculated; override if needed.')}</label>
              <input type="number" id="mp-loan" class="num-input" value="${d.s.loanOverride !== '' ? d.s.loanOverride : Math.round(d.loan)}" min="0"></div>
            ${inputRow('Interest Rate', 'mp-rate', { min: 2, max: 12, step: 0.125, value: d.rate, slider: true, suffix: '%' })}
            <div class="input-group"><label for="mp-term" class="input-label">Loan Term</label>
              <select id="mp-term" class="select-input"><option value="10" ${d.term===10?'selected':''}>10 years</option><option value="15" ${d.term===15?'selected':''}>15 years</option><option value="20" ${d.term===20?'selected':''}>20 years</option><option value="30" ${d.term===30?'selected':''}>30 years</option></select></div>
            <div class="input-group"><label for="mp-start" class="input-label">Start Date</label><input type="date" id="mp-start" class="num-input" value="${d.s.startDate}"></div>

            <details class="advanced-section" ${d.s.showAdvanced ? 'open' : ''} id="mp-advanced">
              <summary>Advanced: Taxes, Insurance, HOA &amp; PMI</summary>
              <div class="advanced-body">
                <div class="input-group"><label for="mp-tax-state" class="input-label">Property Tax — State Avg</label>
                  <select id="mp-tax-state" class="select-input">${Object.keys(STATE_TAX_RATES).map(k => `<option value="${k}" ${d.s.taxState===k?'selected':''}>${k} (${STATE_TAX_RATES[k]}%)</option>`).join('')}</select></div>
                ${inputRow('Annual Property Tax $', 'mp-tax', { min: 0, max: 50000, step: 100, value: Math.round(d.taxAnnual) })}
                ${inputRow('Annual Homeowners Insurance', 'mp-ins', { min: 0, max: 10000, step: 50, value: d.insAnnual })}
                ${inputRow('Monthly HOA', 'mp-hoa', { min: 0, max: 2000, step: 25, value: d.hoa })}
                ${inputRow('Monthly PMI (blank = auto)', 'mp-pmi', { min: 0, max: 1000, step: 5, value: d.s.pmiManual })}
                ${d.ltv > 80 ? '<p class="field-note pmi-alert">LTV &gt; 80% — PMI estimated. Put 20% down to remove.</p>' : ''}
              </div>
            </details>

            <details class="advanced-section" open>
              <summary>Extra Payment Simulator</summary>
              <div class="advanced-body">
                ${inputRow('Extra Monthly Payment', 'mp-extra', { min: 0, max: 5000, step: 50, value: d.s.extraMonthly, slider: true })}
                ${inputRow('One-Time Lump Sum', 'mp-lump', { min: 0, max: 100000, step: 1000, value: d.s.lumpSum })}
              </div>
            </details>
          </div>

          <div class="calc-outputs">
            <div class="result-hero">
              <span class="result-label">Estimated Monthly PITI</span>
              <span class="result-value" id="mp-piti">${formatUSD(d.piti)}</span>
              <span class="result-meta">Payoff: <strong id="mp-payoff">${formatDate(d.amort.payoffDate)}</strong></span>
            </div>
            <div class="metric-grid" id="mp-metrics">
              <div class="metric-card"><span class="metric-label">Principal &amp; Interest</span><span class="metric-value">${formatUSD(d.pi)}</span></div>
              <div class="metric-card"><span class="metric-label">Property Tax</span><span class="metric-value">${formatUSD(d.monthlyTax)}</span></div>
              <div class="metric-card"><span class="metric-label">Insurance</span><span class="metric-value">${formatUSD(d.monthlyIns)}</span></div>
              <div class="metric-card"><span class="metric-label">PMI</span><span class="metric-value">${formatUSD(d.pmi)}</span></div>
              <div class="metric-card"><span class="metric-label">Total Interest</span><span class="metric-value">${formatUSD(d.amort.totalInterest)}</span></div>
              <div class="metric-card"><span class="metric-label">Interest Saved</span><span class="metric-value text-teal">${formatUSD(Math.max(0, d.interestSaved))}</span></div>
            </div>
            <div class="chart-row">
              <div class="chart-box"><canvas id="mp-pie" aria-label="First month payment breakdown"></canvas></div>
              <div class="chart-box"><canvas id="mp-balance" aria-label="Remaining balance over time"></canvas></div>
            </div>
            <div class="cta-strip"><p>Ready to compare real offers?</p><a href="/local-lenders" class="btn-primary">Find Trusted Local Lenders</a></div>
            <div class="table-controls">
              <button type="button" class="btn-secondary btn-sm" id="mp-toggle-table">${d.s.showTable ? 'Hide' : 'Show'} Amortization Table</button>
              <select id="mp-table-mode" class="select-input select-sm"><option value="monthly">Monthly</option><option value="yearly">Yearly Summary</option></select>
            </div>
            <div id="mp-table-wrap" class="table-wrap ${d.s.showTable ? '' : 'hidden'}"></div>
          </div>
        </div>
      </div>`;
  }

  function updateCharts(d) {
    destroyCharts(charts);
    charts = [];
    const pieCtx = document.getElementById('mp-pie');
    const balCtx = document.getElementById('mp-balance');
    if (!pieCtx || !balCtx || typeof Chart === 'undefined') return;

    charts.push(new Chart(pieCtx, {
      type: 'doughnut',
      data: {
        labels: ['P&I', 'Tax', 'Insurance', 'PMI', 'HOA'],
        datasets: [{ data: [d.pi, d.monthlyTax, d.monthlyIns, d.pmi, d.hoa], backgroundColor: [CHART_COLORS.navy, CHART_COLORS.blue, CHART_COLORS.teal, CHART_COLORS.amber, CHART_COLORS.slate] }],
      },
      options: { plugins: { legend: { position: 'bottom' } }, responsive: true, maintainAspectRatio: false },
    }));

    const pts = d.amort.schedule.filter((_, i) => i % 6 === 0 || i === d.amort.schedule.length - 1);
    charts.push(new Chart(balCtx, {
      type: 'line',
      data: {
        labels: pts.map((r) => `Mo ${r.month}`),
        datasets: [
          { label: 'With Extras', data: pts.map((r) => r.balance), borderColor: CHART_COLORS.teal, tension: 0.3, fill: false },
          { label: 'Standard', data: d.baseAmort.schedule.filter((_, i) => i % 6 === 0 || i === d.baseAmort.schedule.length - 1).map((r) => r.balance), borderColor: CHART_COLORS.slate, borderDash: [4, 4], tension: 0.3, fill: false },
        ],
      },
      options: { responsive: true, maintainAspectRatio: false, scales: { y: { ticks: { callback: (v) => formatUSD(v) } } } },
    }));
  }

  function updateTable(d) {
    const wrap = document.getElementById('mp-table-wrap');
    if (!wrap || wrap.classList.contains('hidden')) return;
    const mode = document.getElementById('mp-table-mode')?.value || 'monthly';
    const rows = mode === 'yearly' ? yearlySummary(d.amort.schedule) : d.amort.schedule.slice(0, 360);
    const headers = mode === 'yearly'
      ? ['Year', 'Principal', 'Interest', 'End Balance']
      : ['Month', 'Payment', 'Principal', 'Interest', 'Balance'];
    wrap.innerHTML = `<table class="data-table"><thead><tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr></thead><tbody>${
      rows.map(r => mode === 'yearly'
        ? `<tr><td>${r.year}</td><td>${formatUSD(r.principal)}</td><td>${formatUSD(r.interest)}</td><td>${formatUSD(r.endBalance)}</td></tr>`
        : `<tr><td>${r.month}</td><td>${formatUSD(r.payment)}</td><td>${formatUSD(r.principal)}</td><td>${formatUSD(r.interest)}</td><td>${formatUSD(r.balance)}</td></tr>`
      ).join('')
    }</tbody></table>`;
  }

  function readForm() {
    const adv = document.getElementById('mp-advanced');
    return {
      homePrice: document.getElementById('mp-home')?.value,
      downPct: document.getElementById('mp-down-pct')?.value,
      loanOverride: document.getElementById('mp-loan')?.value,
      rate: document.getElementById('mp-rate')?.value,
      term: document.getElementById('mp-term')?.value,
      startDate: document.getElementById('mp-start')?.value,
      taxState: document.getElementById('mp-tax-state')?.value,
      taxAmount: document.getElementById('mp-tax')?.value,
      taxMode: 'amount',
      insurance: document.getElementById('mp-ins')?.value,
      hoa: document.getElementById('mp-hoa')?.value,
      pmiManual: document.getElementById('mp-pmi')?.value,
      showAdvanced: adv?.open,
      extraMonthly: document.getElementById('mp-extra')?.value,
      lumpSum: document.getElementById('mp-lump')?.value,
      showTable: !document.getElementById('mp-table-wrap')?.classList.contains('hidden'),
    };
  }

  function recalc() {
    saveInputs(ID, readForm());
    const root = document.querySelector(`[data-calc="${ID}"]`)?.parentElement;
    if (root) {
      root.innerHTML = render();
      mount(root);
    }
  }

  function mount(root) {
    bindTooltips(root);
    const fields = ['mp-home', 'mp-down-pct', 'mp-rate', 'mp-extra'];
    fields.forEach((id) => bindLinkedSlider(id, `${id.replace('mp-', 'mp-')}-slider`.replace('mp-home', 'mp-home').replace('mp-down-pct', 'mp-down-pct'), () => {}));
    bindLinkedSlider('mp-home', 'mp-home-slider', recalc);
    bindLinkedSlider('mp-down-pct', 'mp-down-pct-slider', recalc);
    bindLinkedSlider('mp-rate', 'mp-rate-slider', recalc);
    bindLinkedSlider('mp-extra', 'mp-extra-slider', recalc);

    root.querySelectorAll('input, select').forEach((el) => {
      el.addEventListener('change', debounce(recalc, 100));
      el.addEventListener('input', debounce(recalc, 150));
    });

    document.getElementById('mp-tax-state')?.addEventListener('change', () => {
      const st = document.getElementById('mp-tax-state').value;
      const hp = parseNum(document.getElementById('mp-home').value, 425000);
      document.getElementById('mp-tax').value = Math.round(hp * (STATE_TAX_RATES[st] || 1.1) / 100);
      recalc();
    });

    document.getElementById('mp-preset-fl')?.addEventListener('click', () => {
      saveInputs(ID, { ...defaults, homePrice: 385000, downPct: 10, rate: 6.85, taxState: 'FL', taxAmount: 3427, insurance: 2200, term: 30 });
      root.innerHTML = render(); mount(root);
    });

    document.getElementById('mp-toggle-table')?.addEventListener('click', () => {
      const wrap = document.getElementById('mp-table-wrap');
      wrap?.classList.toggle('hidden');
      const btn = document.getElementById('mp-toggle-table');
      if (btn) btn.textContent = wrap?.classList.contains('hidden') ? 'Show Amortization Table' : 'Hide Amortization Table';
      saveInputs(ID, { ...readForm(), showTable: !wrap?.classList.contains('hidden') });
      updateTable(getState());
    });

    document.getElementById('mp-table-mode')?.addEventListener('change', () => updateTable(getState()));

    document.getElementById('mp-csv')?.addEventListener('click', () => {
      const d = getState();
      const rows = [['Month', 'Payment', 'Principal', 'Interest', 'Balance'],
        ...d.amort.schedule.map(r => [r.month, r.payment.toFixed(2), r.principal.toFixed(2), r.interest.toFixed(2), r.balance.toFixed(2)])];
      exportCSV(rows, 'lendertrusthub-amortization.csv');
    });

    document.getElementById('mp-print')?.addEventListener('click', () => window.print());

    const d = getState();
    document.getElementById('mp-piti').textContent = formatUSD(d.piti);
    updateCharts(d);
    updateTable(d);
  }

  global.LTHCalculators = global.LTHCalculators || {};
  global.LTHCalculators[ID] = { id: ID, name: 'Mortgage Payment', render, mount, destroy: () => destroyCharts(charts) };
})(window);