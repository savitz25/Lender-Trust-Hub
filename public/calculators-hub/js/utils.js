/* LenderTrustHub Calculators Hub — Shared Utilities */
(function (global) {
  'use strict';

  const STATE_TAX_RATES = {
    FL: 0.89, NJ: 2.13, CA: 0.75, TX: 1.6, NY: 1.62, National: 1.1,
  };

  const CREDIT_RATE_MAP = {
    excellent: 6.25, good: 6.75, fair: 7.5, poor: 8.5,
  };

  function debounce(fn, ms) {
    let t;
    return (...args) => {
      clearTimeout(t);
      t = setTimeout(() => fn(...args), ms);
    };
  }

  function clamp(n, min, max) {
    return Math.min(max, Math.max(min, n));
  }

  function parseNum(val, fallback = 0) {
    const n = parseFloat(String(val).replace(/[^0-9.-]/g, ''));
    return Number.isFinite(n) ? n : fallback;
  }

  function formatUSD(n, decimals = 0) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(n || 0);
  }

  function formatPct(n, decimals = 2) {
    return `${(n || 0).toFixed(decimals)}%`;
  }

  function formatDate(d) {
    return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric', day: 'numeric' });
  }

  function monthlyPayment(principal, annualRate, years) {
    const p = Math.max(0, principal);
    const r = annualRate / 100 / 12;
    const n = years * 12;
    if (p === 0) return 0;
    if (r === 0) return p / n;
    return (p * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
  }

  function calcPMI(loanAmount, homePrice, manualPMI, ltvThreshold = 80) {
    if (manualPMI != null && manualPMI >= 0) return manualPMI;
    const ltv = homePrice > 0 ? (loanAmount / homePrice) * 100 : 100;
    if (ltv <= ltvThreshold) return 0;
    return (loanAmount * 0.005) / 12;
  }

  function buildAmortSchedule(opts) {
    const {
      principal, annualRate, years,
      extraMonthly = 0, lumpSum = 0, lumpMonth = 1,
      startDate = new Date(),
    } = opts;
    const r = annualRate / 100 / 12;
    const maxMonths = years * 12 + 360;
    const basePay = monthlyPayment(principal, annualRate, years);
    let balance = principal;
    const schedule = [];
    let totalInterest = 0;
    let totalPrincipal = 0;

    for (let m = 1; m <= maxMonths && balance > 0.005; m++) {
      const interest = balance * r;
      let extra = extraMonthly;
      if (m === lumpMonth && lumpSum > 0) extra += lumpSum;
      let principalPaid = basePay - interest + extra;
      const payment = interest + Math.min(principalPaid, balance);
      if (principalPaid > balance) principalPaid = balance;
      balance -= principalPaid;
      totalInterest += interest;
      totalPrincipal += principalPaid;

      const d = new Date(startDate);
      d.setMonth(d.getMonth() + m - 1);
      schedule.push({
        month: m, year: Math.ceil(m / 12),
        date: d, payment, interest,
        principal: principalPaid, balance: Math.max(0, balance),
        cumulativeInterest: totalInterest,
      });
    }

    const payoffDate = schedule.length
      ? schedule[schedule.length - 1].date
      : new Date(startDate);

    return {
      schedule, basePay, totalInterest, totalPrincipal,
      payoffDate, payoffMonths: schedule.length,
      totalCost: principal + totalInterest,
    };
  }

  function yearlySummary(schedule) {
    const years = {};
    schedule.forEach((row) => {
      const y = row.year;
      if (!years[y]) years[y] = { year: y, interest: 0, principal: 0, endBalance: 0 };
      years[y].interest += row.interest;
      years[y].principal += row.principal;
      years[y].endBalance = row.balance;
    });
    return Object.values(years);
  }

  function suggestedRate(creditKey) {
    return CREDIT_RATE_MAP[creditKey] ?? 6.75;
  }

  function saveInputs(id, data) {
    try { localStorage.setItem(`lth-calc-${id}`, JSON.stringify(data)); } catch (_) { /* noop */ }
  }

  function loadInputs(id, defaults) {
    try {
      const raw = localStorage.getItem(`lth-calc-${id}`);
      return raw ? { ...defaults, ...JSON.parse(raw) } : { ...defaults };
    } catch (_) {
      return { ...defaults };
    }
  }

  function exportCSV(rows, filename) {
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  function copyToClipboard(text) {
    navigator.clipboard?.writeText(text).catch(() => {
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    });
  }

  function tooltipHTML(text) {
    return `<button type="button" class="info-tip" aria-label="More information" data-tip="${text.replace(/"/g, '&quot;')}">?</button>`;
  }

  function bindTooltips(root) {
    root.querySelectorAll('.info-tip').forEach((btn) => {
      if (btn.dataset.bound) return;
      btn.dataset.bound = '1';
      btn.addEventListener('click', () => {
        const existing = document.getElementById('tip-popover');
        if (existing) { existing.remove(); return; }
        const pop = document.createElement('div');
        pop.id = 'tip-popover';
        pop.className = 'tip-popover';
        pop.setAttribute('role', 'tooltip');
        pop.textContent = btn.dataset.tip;
        btn.parentElement.appendChild(pop);
        setTimeout(() => document.addEventListener('click', function handler(e) {
          if (!pop.contains(e.target) && e.target !== btn) {
            pop.remove();
            document.removeEventListener('click', handler);
          }
        }), 0);
      });
    });
  }

  function inputRow(label, id, opts = {}) {
    const { type = 'number', min, max, step, value, tip, suffix, slider } = opts;
    const sid = slider ? `${id}-slider` : '';
    return `
      <div class="input-group">
        <label for="${id}" class="input-label">${label} ${tip ? tooltipHTML(tip) : ''}</label>
        <div class="input-row">
          ${slider ? `<input type="range" id="${sid}" min="${min}" max="${max}" step="${step}" value="${value}" aria-label="${label} slider" class="range-input">` : ''}
          <input type="${type}" id="${id}" ${min != null ? `min="${min}"` : ''} ${max != null ? `max="${max}"` : ''} ${step != null ? `step="${step}"` : ''} value="${value}" class="num-input" inputmode="decimal">
          ${suffix ? `<span class="input-suffix">${suffix}</span>` : ''}
        </div>
      </div>`;
  }

  function bindLinkedSlider(inputId, sliderId, onChange) {
    const input = document.getElementById(inputId);
    const slider = document.getElementById(sliderId);
    if (!input) return;
    const sync = (fromSlider) => {
      if (fromSlider && slider) input.value = slider.value;
      if (!fromSlider && slider) slider.value = input.value;
      onChange?.();
    };
    input.addEventListener('input', debounce(() => sync(false), 80));
    slider?.addEventListener('input', () => sync(true));
  }

  function destroyCharts(charts) {
    (charts || []).forEach((c) => { try { c.destroy(); } catch (_) { /* noop */ } });
  }

  const CHART_COLORS = {
    navy: '#0F172A', teal: '#059669', emerald: '#10B981',
    blue: '#3B82F6', slate: '#94A3B8', amber: '#F59E0B',
    rose: '#F43F5E', indigo: '#6366F1',
  };

  global.LTH = {
    STATE_TAX_RATES, CREDIT_RATE_MAP, CHART_COLORS,
    debounce, clamp, parseNum, formatUSD, formatPct, formatDate,
    monthlyPayment, calcPMI, buildAmortSchedule, yearlySummary,
    suggestedRate, saveInputs, loadInputs, exportCSV, copyToClipboard,
    tooltipHTML, bindTooltips, inputRow, bindLinkedSlider, destroyCharts,
  };
})(window);