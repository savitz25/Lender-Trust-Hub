/* HELOC / Home Equity Loan Calculator */
(function (global) {
  const { formatUSD, parseNum, loadInputs, saveInputs, monthlyPayment,
    inputRow, debounce } = global.LTH;

  const ID = 'heloc';

  const defaults = {
    homeValue: 550000, mortgageBal: 320000, drawAmount: 75000,
    maxLtv: 85, rate: 8.25, drawYears: 10, repayYears: 15, mode: 'heloc',
  };

  function calc(s) {
    const value = parseNum(s.homeValue);
    const mortgage = parseNum(s.mortgageBal);
    const equity = value - mortgage;
    const maxLtv = parseNum(s.maxLtv) / 100;
    const maxBorrow = Math.max(0, value * maxLtv - mortgage);
    const draw = Math.min(parseNum(s.drawAmount), maxBorrow);
    const rate = parseNum(s.rate);
    const drawY = parseInt(s.drawYears, 10);
    const repayY = parseInt(s.repayYears, 10);
    const ioPayment = draw * (rate / 100 / 12);
    const amortPayment = monthlyPayment(draw, rate, repayY);
    const totalInterestIO = ioPayment * drawY * 12 + (amortPayment * repayY * 12 - draw);
    const totalInterestAmort = amortPayment * repayY * 12 - draw;
    return { s, value, mortgage, equity, maxBorrow, draw, rate, drawY, repayY, ioPayment, amortPayment, totalInterestIO, totalInterestAmort };
  }

  function render() {
    const d = calc(loadInputs(ID, defaults));
    return `
      <div class="calc-panel" data-calc="${ID}">
        <div class="calc-header">
          <div><h2 class="calc-title">HELOC / Home Equity Calculator</h2>
            <p class="calc-subtitle">Estimate borrowing power and compare interest-only draw vs amortizing repayment.</p></div>
        </div>
        <p class="calc-disclaimer">Estimates only. Lenders set LTV limits, rates, and fees individually.</p>
        <div class="calc-grid">
          <div class="calc-inputs">
            ${inputRow('Current Home Value', 'he-value', { min: 50000, max: 3000000, step: 10000, value: d.value, slider: true })}
            ${inputRow('Existing Mortgage Balance', 'he-mort', { min: 0, max: 2000000, step: 5000, value: d.mortgage })}
            ${inputRow('Desired Draw Amount', 'he-draw', { min: 0, max: 500000, step: 5000, value: d.s.drawAmount, slider: true })}
            ${inputRow('Max Combined LTV', 'he-ltv', { min: 70, max: 90, step: 1, value: d.s.maxLtv, suffix: '%' })}
            ${inputRow('Interest Rate', 'he-rate', { min: 4, max: 14, step: 0.125, value: d.rate, suffix: '%' })}
            ${inputRow('Draw Period (years)', 'he-draw-y', { min: 5, max: 15, step: 1, value: d.drawY })}
            ${inputRow('Repayment Period (years)', 'he-repay-y', { min: 5, max: 30, step: 1, value: d.repayY })}
          </div>
          <div class="calc-outputs">
            <div class="result-hero">
              <span class="result-label">Estimated Borrowing Power</span>
              <span class="result-value text-teal">${formatUSD(d.maxBorrow)}</span>
              <span class="result-meta">Available equity: ${formatUSD(d.equity)}</span>
            </div>
            ${d.draw > d.maxBorrow ? '<p class="field-note pmi-alert">Draw exceeds max LTV — reduce amount.</p>' : ''}
            <div class="metric-grid">
              <div class="metric-card"><span class="metric-label">Interest-Only (Draw)</span><span class="metric-value">${formatUSD(d.ioPayment)}/mo</span></div>
              <div class="metric-card"><span class="metric-label">Fully Amortizing</span><span class="metric-value">${formatUSD(d.amortPayment)}/mo</span></div>
              <div class="metric-card"><span class="metric-label">Total Interest (IO→Amort)</span><span class="metric-value">${formatUSD(d.totalInterestIO)}</span></div>
              <div class="metric-card"><span class="metric-label">Total Interest (Amort only)</span><span class="metric-value">${formatUSD(d.totalInterestAmort)}</span></div>
            </div>
          </div>
        </div>
      </div>`;
  }

  function mount(root) {
    const recalc = () => {
      saveInputs(ID, {
        homeValue: document.getElementById('he-value')?.value,
        mortgageBal: document.getElementById('he-mort')?.value,
        drawAmount: document.getElementById('he-draw')?.value,
        maxLtv: document.getElementById('he-ltv')?.value,
        rate: document.getElementById('he-rate')?.value,
        drawYears: document.getElementById('he-draw-y')?.value,
        repayYears: document.getElementById('he-repay-y')?.value,
      });
      root.innerHTML = render(); mount(root);
    };
    ['he-value', 'he-draw'].forEach((id) => global.LTH.bindLinkedSlider(id, `${id}-slider`, recalc));
    root.querySelectorAll('input, select').forEach((el) => {
      el.addEventListener('input', debounce(recalc, 120));
      el.addEventListener('change', recalc);
    });
  }

  global.LTHCalculators = global.LTHCalculators || {};
  global.LTHCalculators[ID] = { id: ID, name: 'HELOC / Equity', render, mount };
})(window);