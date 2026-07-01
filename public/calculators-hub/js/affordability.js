/* Home Affordability Calculator */
(function (global) {
  const { formatUSD, formatPct, parseNum, loadInputs, saveInputs, monthlyPayment,
    suggestedRate, bindTooltips, bindLinkedSlider, inputRow, debounce } = global.LTH;

  const ID = 'affordability';

  const defaults = {
    income: 95000, debts: 450, cash: 60000,
    frontDti: 28, backDti: 36, credit: 'good',
    term: 30, rate: '', downPct: 10,
  };

  function calc(s) {
    const income = parseNum(s.income, 95000);
    const debts = parseNum(s.debts, 450);
    const cash = parseNum(s.cash, 60000);
    const front = parseNum(s.frontDti, 28) / 100;
    const back = parseNum(s.backDti, 36) / 100;
    const monthlyIncome = income / 12;
    const rate = s.rate !== '' ? parseNum(s.rate) : suggestedRate(s.credit);
    const term = parseInt(s.term, 10) || 30;
    const downPct = parseNum(s.downPct, 10) / 100;

    const maxFrontHousing = monthlyIncome * front;
    const maxBackHousing = monthlyIncome * back - debts;
    const maxHousing = Math.max(0, Math.min(maxFrontHousing, maxBackHousing));

    const r = rate / 100 / 12;
    const n = term * 12;
    const factor = r === 0 ? n : (Math.pow(1 + r, n) - 1) / (r * Math.pow(1 + r, n));
    const maxLoan = maxHousing * factor;
    const maxPrice = downPct < 1 ? maxLoan / (1 - downPct) : maxLoan;
    const actualDown = maxPrice * downPct;
    const affordable = actualDown <= cash;

    const frontResult = monthlyIncome > 0 ? (maxHousing / monthlyIncome) * 100 : 0;
    const backResult = monthlyIncome > 0 ? ((maxHousing + debts) / monthlyIncome) * 100 : 0;

    return {
      s, income, debts, cash, rate, term, downPct: downPct * 100,
      maxHousing, maxLoan, maxPrice: Math.round(maxPrice),
      actualDown, affordable, frontResult, backResult,
    };
  }

  function scenario(d, delta) {
    if (delta.down) {
      const newCash = d.cash + delta.down;
      const downPct = Math.min(50, (newCash / d.maxPrice) * 100);
      const loan = d.maxPrice * (1 - downPct / 100);
      const pi = monthlyPayment(loan, d.rate, d.term);
      return { label: `+${formatUSD(delta.down)} down`, pi, downPct };
    }
    if (delta.rate) {
      const loan = d.maxPrice * (1 - d.downPct / 100);
      const pi = monthlyPayment(loan, d.rate + delta.rate, d.term);
      return { label: `Rate ${delta.rate > 0 ? '+' : ''}${delta.rate}%`, pi, maxPrice: d.maxPrice };
    }
    return null;
  }

  function render() {
    const d = calc(loadInputs(ID, defaults));
    const sc1 = scenario(d, { down: 25000 });
    const sc2 = scenario(d, { rate: -0.5 });
    return `
      <div class="calc-panel" data-calc="${ID}">
        <div class="calc-header">
          <div><h2 class="calc-title">Home Affordability Calculator</h2>
            <p class="calc-subtitle">Find your comfortable price range using income, debts, and DTI guidelines.</p></div>
          <button type="button" class="btn-secondary btn-sm" id="af-preset">Typical Buyer</button>
        </div>
        <p class="calc-disclaimer">Estimates for educational purposes only. Lenders use additional criteria.</p>
        <div class="calc-grid">
          <div class="calc-inputs">
            ${inputRow('Gross Annual Income', 'af-income', { min: 20000, max: 500000, step: 1000, value: d.income, slider: true })}
            ${inputRow('Monthly Non-Housing Debts', 'af-debts', { min: 0, max: 5000, step: 50, value: d.debts, tip: 'Car loans, student loans, credit cards, etc.' })}
            ${inputRow('Available Cash / Down Payment', 'af-cash', { min: 0, max: 500000, step: 1000, value: d.cash, slider: true })}
            ${inputRow('Front-End DTI Target', 'af-front', { min: 20, max: 40, step: 1, value: d.s.frontDti, suffix: '%', tip: 'Housing costs ÷ gross income. Standard: 28%.' })}
            ${inputRow('Back-End DTI Target', 'af-back', { min: 25, max: 50, step: 1, value: d.s.backDti, suffix: '%', tip: 'All debts + housing ÷ income. Standard: 36%.' })}
            <div class="input-group"><label for="af-credit" class="input-label">Credit Score Range</label>
              <select id="af-credit" class="select-input">
                <option value="excellent" ${d.s.credit==='excellent'?'selected':''}>Excellent (740+)</option>
                <option value="good" ${d.s.credit==='good'?'selected':''}>Good (670–739)</option>
                <option value="fair" ${d.s.credit==='fair'?'selected':''}>Fair (580–669)</option>
                <option value="poor" ${d.s.credit==='poor'?'selected':''}>Below 580</option>
              </select></div>
            ${inputRow('Estimated Rate (blank = auto)', 'af-rate', { min: 3, max: 12, step: 0.125, value: d.s.rate })}
            <div class="input-group"><label for="af-term" class="input-label">Loan Term</label>
              <select id="af-term" class="select-input"><option value="30" ${d.term===30?'selected':''}>30 yr</option><option value="20" ${d.term===20?'selected':''}>20 yr</option><option value="15" ${d.term===15?'selected':''}>15 yr</option></select></div>
            ${inputRow('Planned Down Payment %', 'af-down', { min: 0, max: 50, step: 1, value: d.downPct, suffix: '%' })}
          </div>
          <div class="calc-outputs">
            <div class="result-hero">
              <span class="result-label">Maximum Affordable Home Price</span>
              <span class="result-value text-teal">${formatUSD(d.maxPrice)}</span>
              <span class="result-meta">Max loan: <strong>${formatUSD(d.maxLoan)}</strong> · Rate: <strong>${d.rate.toFixed(2)}%</strong></span>
            </div>
            <div class="metric-grid">
              <div class="metric-card"><span class="metric-label">Max Monthly Housing</span><span class="metric-value">${formatUSD(d.maxHousing)}</span></div>
              <div class="metric-card"><span class="metric-label">Front-End DTI</span><span class="metric-value">${formatPct(d.frontResult, 1)}</span></div>
              <div class="metric-card"><span class="metric-label">Back-End DTI</span><span class="metric-value">${formatPct(d.backResult, 1)}</span></div>
              <div class="metric-card"><span class="metric-label">Down Payment Needed</span><span class="metric-value">${formatUSD(d.actualDown)}</span></div>
            </div>
            <div class="guidance-card ${d.affordable ? 'guidance-ok' : 'guidance-warn'}">
              <h3>How much house can you comfortably afford?</h3>
              <p>${d.affordable
                ? `Based on a ${formatPct(d.s.frontDti, 0)} / ${formatPct(d.s.backDti, 0)} DTI framework, a home around ${formatUSD(d.maxPrice)} keeps housing near ${formatUSD(d.maxHousing)}/mo. Your available cash covers the ${formatPct(d.downPct, 0)} down payment.`
                : `Your target price requires ${formatUSD(d.actualDown)} down, but you have ${formatUSD(d.cash)} saved. Consider a lower price, larger down payment, or reducing monthly debts.`}</p>
            </div>
            <div class="scenario-row">
              <h3 class="section-label">What-If Scenarios</h3>
              ${sc1 ? `<div class="scenario-card"><strong>${sc1.label}</strong><p>Est. P&amp;I: ${formatUSD(sc1.pi)}/mo · Down: ${formatPct(sc1.downPct, 0)}</p></div>` : ''}
              ${sc2 ? `<div class="scenario-card"><strong>${sc2.label}</strong><p>Est. P&amp;I: ${formatUSD(sc2.pi)}/mo on same price</p></div>` : ''}
            </div>
            <div class="cta-strip"><a href="/local-lenders" class="btn-primary">Find Trusted Local Lenders</a></div>
          </div>
        </div>
      </div>`;
  }

  function mount(root) {
    bindTooltips(root);
    bindLinkedSlider('af-income', 'af-income-slider', () => {});
    bindLinkedSlider('af-cash', 'af-cash-slider', () => {});
    const recalc = () => {
      const data = {};
      root.querySelectorAll('input, select').forEach((el) => { data[el.id.replace('af-', '').replace(/-/g, (m, i, s) => i ? s[i+1].toUpperCase() : '')] = el.value; });
      saveInputs(ID, {
        income: document.getElementById('af-income')?.value,
        debts: document.getElementById('af-debts')?.value,
        cash: document.getElementById('af-cash')?.value,
        frontDti: document.getElementById('af-front')?.value,
        backDti: document.getElementById('af-back')?.value,
        credit: document.getElementById('af-credit')?.value,
        rate: document.getElementById('af-rate')?.value,
        term: document.getElementById('af-term')?.value,
        downPct: document.getElementById('af-down')?.value,
      });
      root.innerHTML = render();
      mount(root);
    };
    root.querySelectorAll('input, select').forEach((el) => {
      el.addEventListener('input', debounce(recalc, 120));
      el.addEventListener('change', recalc);
    });
    bindLinkedSlider('af-income', 'af-income-slider', recalc);
    bindLinkedSlider('af-cash', 'af-cash-slider', recalc);
    document.getElementById('af-preset')?.addEventListener('click', () => {
      saveInputs(ID, defaults);
      root.innerHTML = render(); mount(root);
    });
  }

  global.LTHCalculators = global.LTHCalculators || {};
  global.LTHCalculators[ID] = { id: ID, name: 'Home Affordability', render, mount };
})(window);