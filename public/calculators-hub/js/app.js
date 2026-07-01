/* LenderTrustHub Calculators Hub — App Router */
(function () {
  'use strict';

  const CALC_META = [
    { id: 'mortgage-payment', icon: '🏠', title: 'Mortgage Payment', benefit: 'Full PITI breakdown with taxes, PMI, and amortization.', featured: true },
    { id: 'affordability', icon: '📊', title: 'Home Affordability', benefit: 'Find your max price using income, debts, and DTI ratios.' },
    { id: 'refinance', icon: '🔄', title: 'Refinance Savings', benefit: 'Breakeven analysis and lifetime interest comparison.' },
    { id: 'amortization', icon: '📅', title: 'Payoff Planner', benefit: 'Model extra payments and accelerate your payoff.' },
    { id: 'loan-compare', icon: '⚖️', title: 'Loan Compare', benefit: 'Side-by-side comparison of 2–3 loan scenarios.' },
    { id: 'rent-vs-buy', icon: '🏘️', title: 'Rent vs. Buy', benefit: 'Net worth comparison over your chosen time horizon.' },
    { id: 'heloc', icon: '🏦', title: 'HELOC / Equity', benefit: 'Borrowing power and payment scenarios for home equity.' },
    { id: 'down-payment', icon: '💰', title: 'Down Payment Planner', benefit: 'Timeline to reach your savings goal with growth.' },
    { id: 'rental-property', icon: '📈', title: 'Rental Cash Flow', benefit: 'Cap rate, cash-on-cash, and 5-year investor projection.' },
  ];

  const DISCLAIMER = 'These tools provide estimates for educational purposes only. Actual rates, fees, terms, and approvals vary by lender, credit profile, property, and market conditions. Always consult a licensed mortgage professional.';

  let activeCalc = null;
  let activeMount = null;

  function $(sel) { return document.querySelector(sel); }

  function renderHub() {
    return `
      <section id="hub-view" class="hub-section" aria-label="Calculator directory">
        <div class="calc-grid-cards">
          ${CALC_META.map((c) => `
            <article class="calc-card ${c.featured ? 'calc-card-featured' : ''}" data-launch="${c.id}">
              <div class="calc-card-icon" aria-hidden="true">${c.icon}</div>
              <h3 class="calc-card-title">${c.title}</h3>
              <p class="calc-card-benefit">${c.benefit}</p>
              <button type="button" class="btn-primary btn-block launch-btn" data-id="${c.id}">Launch Calculator</button>
            </article>
          `).join('')}
          <article class="calc-card calc-card-placeholder">
            <div class="calc-card-icon" aria-hidden="true">🔍</div>
            <h3 class="calc-card-title">Lender Directory</h3>
            <p class="calc-card-benefit">Search vetted mortgage lenders and brokers by state/county — coming soon.</p>
            <a href="/local-lenders" class="btn-secondary btn-block">Browse Lenders</a>
          </article>
        </div>
      </section>`;
  }

  function showHub() {
    if (activeCalc?.destroy) activeCalc.destroy();
    activeCalc = null;
    const main = $('#main-content');
    main.innerHTML = renderHub();
    $('#calc-view')?.remove();
    $('#back-bar')?.classList.add('hidden');
    document.title = 'Mortgage Calculators | Lender Trust Hub';
    history.replaceState({ view: 'hub' }, '', '#hub');
    bindHub();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function showCalculator(id) {
    const calc = window.LTHCalculators?.[id];
    if (!calc) return;
    if (activeCalc?.destroy) activeCalc.destroy();
    activeCalc = calc;

    let view = $('#calc-view');
    if (!view) {
      view = document.createElement('section');
      view.id = 'calc-view';
      view.className = 'calc-view-section';
      $('#main-content').appendChild(view);
    }
    $('#hub-view')?.remove();
    view.innerHTML = calc.render();
    $('#back-bar')?.classList.remove('hidden');
    document.title = `${calc.name} Calculator | Lender Trust Hub`;
    history.pushState({ view: 'calc', id }, '', `#${id}`);
    calc.mount(view);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function bindHub() {
    document.querySelectorAll('.launch-btn, .calc-card[data-launch]').forEach((el) => {
      el.addEventListener('click', (e) => {
        const id = e.currentTarget.dataset.id || e.currentTarget.dataset.launch;
        if (id) showCalculator(id);
      });
      if (el.classList.contains('calc-card')) {
        el.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            showCalculator(el.dataset.launch);
          }
        });
        el.setAttribute('tabindex', '0');
        el.setAttribute('role', 'button');
      }
    });
  }

  function initFromHash() {
    const hash = location.hash.replace('#', '');
    if (hash && hash !== 'hub' && window.LTHCalculators?.[hash]) {
      showCalculator(hash);
    } else {
      showHub();
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    $('#back-btn')?.addEventListener('click', showHub);
    $('#explore-btn')?.addEventListener('click', () => {
      document.getElementById('main-content')?.scrollIntoView({ behavior: 'smooth' });
    });
    window.addEventListener('popstate', (e) => {
      if (e.state?.view === 'calc' && e.state.id) showCalculator(e.state.id);
      else showHub();
    });
    initFromHash();
  });

  window.LTHApp = { showHub, showCalculator, DISCLAIMER };
})();