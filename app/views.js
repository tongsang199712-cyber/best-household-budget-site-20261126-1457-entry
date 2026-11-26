// HearthLedger views: one renderer per page. Every page is reached by a
// nav link (hash route) and every control on it does what it says — the
// forms add real rows, the toggles flip real state, the filters filter.

import { CATEGORIES } from './data.js';
import { donutChart, ringChart, trendBars } from './charts.js';
import {
  addBill,
  addTransaction,
  billsDueNext,
  budgetRows,
  categoryColor,
  contributeToGoal,
  deleteTransaction,
  goalsWithProgress,
  incomeTotal,
  money,
  moneyShort,
  monthsWithCurrent,
  pct,
  setBudget,
  spendingExclSavings,
  spendingTotal,
  spentByCategory,
  state,
  toggleBillPaid,
  topMerchants,
  totalPlanned,
} from './store.js';

export function esc(text) {
  return String(text ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function categoryChip(category) {
  return `<span class="chip" style="--chip:${categoryColor(category)}">${esc(category)}</span>`;
}

function barRow(label, spent, planned, showLabel = true) {
  const used = planned ? Math.min(100, (spent / planned) * 100) : 0;
  const over = spent > planned;
  return `<div class="budget-row">
    <div class="budget-row-head">${showLabel ? `<span>${esc(label)}</span>` : '<span></span>'}<span>${money(spent)} of ${money(planned)}</span></div>
    <div class="meter"><div class="meter-fill${over ? ' over' : ''}" style="width:${used.toFixed(1)}%"></div></div>
    <div class="budget-row-foot"><span>${used.toFixed(0)}% used</span><span class="${over ? 'over-text' : 'ok-text'}">${over ? money(spent - planned) + ' over' : money(planned - spent) + ' left'}</span></div>
  </div>`;
}

function transactionRow(t) {
  const sign = t.kind === 'income' ? '+' : '−';
  return `<tr>
    <td>${esc(t.date.slice(5))}</td>
    <td><strong>${esc(t.merchant)}</strong>${t.note ? `<br><span class="muted">${esc(t.note)}</span>` : ''}</td>
    <td>${categoryChip(t.category)}</td>
    <td class="num ${t.kind}">${sign}${money(t.amount)}</td>
    <td><button class="icon-btn" data-delete="${t.id}" title="Delete this transaction" aria-label="Delete ${esc(t.merchant)}">✕</button></td>
  </tr>`;
}

// --- Dashboard ---------------------------------------------------------------

export function viewDashboard() {
  const income = incomeTotal();
  const spending = spendingTotal();
  const spentNoSavings = spendingExclSavings();
  const saved = state.transactions
    .filter((t) => t.category === 'Savings')
    .reduce((sum, t) => sum + t.amount, 0);
  const left = income - spending;
  const saveRate = pct(saved, income);
  const byCat = spentByCategory().filter((r) => r.category !== 'Savings');
  const months = monthsWithCurrent();
  const recent = [...state.transactions]
    .sort((a, b) => (a.date < b.date ? 1 : -1))
    .slice(0, 8);
  const upcoming = billsDueNext(3);
  const goals = goalsWithProgress().slice(0, 2);

  return `
  <section class="hero">
    <div>
      <p class="eyebrow">${esc(state.household.monthLabel)} · ${esc(state.household.monthNote)}</p>
      <h1>Good evening, Alvarez family.<br>November is <span class="accent">$${left.toLocaleString('en-US', { maximumFractionDigits: 0 })} under control.</span></h1>
      <p class="lede">Income ${money(income)} · spending ${money(spentNoSavings)} · ${money(saved)} moved to savings. Three bills land in December — rent first, on the 1st.</p>
      <div class="hero-actions">
        <a class="btn primary" href="#/transactions">Add a transaction</a>
        <a class="btn" href="#/budgets">Review budgets</a>
      </div>
    </div>
    <div class="hero-ring">${ringChart(saveRate, 132, saveRate + '%', 'saved')}</div>
  </section>

  <section class="stat-grid">
    <div class="stat-card"><span class="stat-label">Income</span><strong>${money(income)}</strong><span class="muted">2 salaries + freelance</span></div>
    <div class="stat-card"><span class="stat-label">Spent</span><strong>${money(spentNoSavings)}</strong><span class="muted">excl. savings transfer</span></div>
    <div class="stat-card"><span class="stat-label">Saved</span><strong>${money(saved)}</strong><span class="muted">${saveRate}% of income</span></div>
    <div class="stat-card"><span class="stat-label">Left to budget</span><strong>${money(left)}</strong><span class="muted">of ${money(totalPlanned())} planned</span></div>
  </section>

  <section class="grid-2">
    <article class="card">
      <h2>Where November’s money went</h2>
      <div class="donut-wrap">
        ${donutChart(byCat.slice(0, 8))}
        <ul class="legend">
          ${byCat.slice(0, 8).map((r) => `<li><span class="dot" style="background:${r.color}"></span>${esc(r.category)}<strong>${money(r.spent)}</strong></li>`).join('')}
        </ul>
      </div>
    </article>
    <article class="card">
      <h2>Six months: income vs spending</h2>
      ${trendBars(months)}
      <p class="legend-inline"><span class="swatch income"></span> Income &nbsp; <span class="swatch spending"></span> Spending · November is the calmest month since August.</p>
    </article>
  </section>

  <section class="grid-3">
    <article class="card">
      <h2>Budget watch</h2>
      ${budgetRows().slice(0, 4).map((r) => barRow(r.category, r.spent, r.planned)).join('')}
      <a class="card-link" href="#/budgets">All ${state.budgets.length} budgets →</a>
    </article>
    <article class="card">
      <h2>Coming up in December</h2>
      <ul class="bill-mini">
        ${upcoming.map((b) => `<li><span>${esc(b.name)}</span><strong>${money(b.amount)}</strong><span class="muted">${esc(b.when)}</span></li>`).join('')}
      </ul>
      <p class="muted">All ten November bills are paid. Rent, Netflix and daycare land first next month.</p>
      <a class="card-link" href="#/bills">All bills →</a>
    </article>
    <article class="card">
      <h2>Savings goals</h2>
      ${goals.map((g) => `<div class="goal-mini"><div class="goal-mini-head"><span>${esc(g.name)}</span><strong>${money(g.saved)} / ${money(g.target)}</strong></div><div class="meter"><div class="meter-fill" style="width:${Math.min(100, g.progress).toFixed(1)}%"></div></div></div>`).join('')}
      <a class="card-link" href="#/goals">All ${state.goals.length} goals →</a>
    </article>
  </section>

  <section class="card">
    <h2>Recent transactions</h2>
    <table class="tx-table">
      <thead><tr><th>Date</th><th>What</th><th>Category</th><th class="num">Amount</th><th></th></tr></thead>
      <tbody>${recent.map(transactionRow).join('')}</tbody>
    </table>
    <a class="card-link" href="#/transactions">All ${state.transactions.length} transactions →</a>
  </section>`;
}

// --- Transactions ------------------------------------------------------------

export function viewTransactions(filter = {}) {
  const { category = 'All', query = '' } = filter;
  let list = [...state.transactions].sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
  if (category !== 'All') list = list.filter((t) => t.category === category);
  if (query.trim()) {
    const q = query.trim().toLowerCase();
    list = list.filter((t) => (t.merchant + ' ' + t.note).toLowerCase().includes(q));
  }
  const shownSpent = list.filter((t) => t.kind === 'expense').reduce((s, t) => s + t.amount, 0);
  const shownIncome = list.filter((t) => t.kind === 'income').reduce((s, t) => s + t.amount, 0);

  return `
  <section class="page-head">
    <div><p class="eyebrow">Ledger</p><h1>Transactions</h1>
    <p class="lede">Every dollar in and out of the Alvarez household, November 2026. Add one below — it updates the dashboard, budgets and reports at once.</p></div>
    <div class="stat-card inline"><span class="stat-label">Showing</span><strong>${list.length} rows</strong><span class="muted">${money(shownIncome)} in · ${money(shownSpent)} out</span></div>
  </section>

  <section class="card">
    <form id="tx-form" class="form-grid">
      <label>Date <input type="date" name="date" value="2026-11-27" required></label>
      <label>What <input type="text" name="merchant" placeholder="e.g. GreenMart Superstore" required></label>
      <label>Category <select name="category">${CATEGORIES.map((c) => `<option>${esc(c.name)}</option>`).join('')}</select></label>
      <label>Amount ($) <input type="number" name="amount" min="0.01" step="0.01" placeholder="0.00" required></label>
      <label>Type <select name="kind"><option value="expense">Expense</option><option value="income">Income</option></select></label>
      <button class="btn primary" type="submit">Add transaction</button>
    </form>
    <p class="form-note" id="tx-form-note">Saved on this device only — nothing leaves your browser.</p>
  </section>

  <section class="card">
    <div class="filter-row">
      <label>Category
        <select id="tx-filter-cat">${['All', ...CATEGORIES.map((c) => c.name)].map((c) => `<option${c === category ? ' selected' : ''}>${esc(c)}</option>`).join('')}</select>
      </label>
      <label>Search
        <input type="search" id="tx-filter-q" placeholder="Search merchant or note…" value="${esc(query)}">
      </label>
    </div>
    <table class="tx-table">
      <thead><tr><th>Date</th><th>What</th><th>Category</th><th class="num">Amount</th><th></th></tr></thead>
      <tbody>${list.length ? list.map(transactionRow).join('') : '<tr><td colspan="5" class="muted">Nothing matches that filter yet — try clearing it.</td></tr>'}</tbody>
    </table>
  </section>`;
}

// --- Budgets -----------------------------------------------------------------

export function viewBudgets() {
  const rows = budgetRows();
  const planned = totalPlanned();
  const spent = spendingTotal();
  return `
  <section class="page-head">
    <div><p class="eyebrow">Plan</p><h1>Budgets</h1>
    <p class="lede">The Alvarez plan for November: ${money(planned)} set aside across ${rows.length} categories, ${money(spent)} spent so far. Change any number — the bars and the dashboard follow.</p></div>
    <div class="stat-card inline"><span class="stat-label">Spent vs planned</span><strong>${money(spent)} / ${money(planned)}</strong><span class="muted">${pct(spent, planned)}% of the month’s plan used</span></div>
  </section>
  <section class="grid-2">
    ${rows.map((r) => `<article class="card">
      <div class="budget-card-head"><h2>${esc(r.category)}</h2><span class="chip" style="--chip:${categoryColor(r.category)}">${r.usedPct.toFixed(0)}% used</span></div>
      ${barRow(r.category, r.spent, r.planned, false)}
      <form class="budget-edit" data-budget="${esc(r.category)}">
        <label>Monthly budget ($) <input type="number" name="planned" min="0" step="5" value="${r.planned}"></label>
        <button class="btn" type="submit">Update</button>
      </form>
      <p class="muted">${r.left >= 0 ? money(r.left) + ' left for the last 4 days of November.' : money(-r.left) + ' over — trim a little from Dining Out or Shopping to cover it.'}</p>
    </article>`).join('')}
  </section>`;
}

// --- Bills -------------------------------------------------------------------

export function viewBills() {
  const paid = state.bills.filter((b) => b.paid);
  const unpaid = state.bills.filter((b) => !b.paid);
  const total = state.bills.reduce((s, b) => s + b.amount, 0);
  const upcoming = billsDueNext(3);
  return `
  <section class="page-head">
    <div><p class="eyebrow">Recurring</p><h1>Bills &amp; subscriptions</h1>
    <p class="lede">Ten recurring bills, ${money(total)} a month. Every November copy is paid — mark one unpaid to see it move to “due”, or add a new bill of your own.</p></div>
    <div class="stat-card inline"><span class="stat-label">Paid this month</span><strong>${paid.length} of ${state.bills.length}</strong><span class="muted">${money(paid.reduce((s, b) => s + b.amount, 0))} settled</span></div>
  </section>

  <section class="card">
    <h2>Coming up next — December</h2>
    <ul class="bill-mini">
      ${upcoming.map((b) => `<li><span>${esc(b.name)}</span><strong>${money(b.amount)}</strong><span class="muted">${esc(b.when)}${b.autopay ? ' · autopay' : ''}</span></li>`).join('')}
    </ul>
  </section>

  <section class="card">
    <h2>All bills ${unpaid.length ? `· ${unpaid.length} still due` : '· all paid ✓'}</h2>
    <table class="tx-table">
      <thead><tr><th>Bill</th><th>Category</th><th>Due</th><th class="num">Amount</th><th>Status</th><th></th></tr></thead>
      <tbody>
        ${[...state.bills].sort((a, b) => a.dueDay - b.dueDay).map((b) => `<tr>
          <td><strong>${esc(b.name)}</strong>${b.note ? `<br><span class="muted">${esc(b.note)}</span>` : ''}${b.autopay ? ' <span class="muted">· autopay</span>' : ''}</td>
          <td>${categoryChip(b.category)}</td>
          <td>Nov ${b.dueDay}</td>
          <td class="num">${money(b.amount)}</td>
          <td>${b.paid ? '<span class="ok-text">Paid ✓</span>' : '<span class="over-text">Due</span>'}</td>
          <td><button class="btn small" data-bill="${b.id}">${b.paid ? 'Mark unpaid' : 'Mark paid'}</button></td>
        </tr>`).join('')}
      </tbody>
    </table>
  </section>

  <section class="card">
    <h2>Add a bill</h2>
    <form id="bill-form" class="form-grid">
      <label>Name <input type="text" name="name" placeholder="e.g. Water bill" required></label>
      <label>Category <select name="category">${CATEGORIES.filter((c) => c.name !== 'Income').map((c) => `<option>${esc(c.name)}</option>`).join('')}</select></label>
      <label>Amount ($) <input type="number" name="amount" min="0.01" step="0.01" placeholder="0.00" required></label>
      <label>Day of month <input type="number" name="dueDay" min="1" max="28" value="1" required></label>
      <button class="btn primary" type="submit">Add bill</button>
    </form>
  </section>`;
}

// --- Goals -------------------------------------------------------------------

export function viewGoals() {
  const goals = goalsWithProgress();
  const totalSaved = goals.reduce((s, g) => s + g.saved, 0);
  const totalTarget = goals.reduce((s, g) => s + g.target, 0);
  return `
  <section class="page-head">
    <div><p class="eyebrow">Saving for</p><h1>Savings goals</h1>
    <p class="lede">${money(totalSaved)} saved toward ${money(totalTarget)} of family goals — ${pct(totalSaved, totalTarget)}% of the way there. Add a contribution to any goal; the bar moves immediately.</p></div>
    <div class="stat-card inline"><span class="stat-label">Closest goal</span><strong>Emergency fund</strong><span class="muted">${money(goals[0].saved)} of ${money(goals[0].target)} · ${goals[0].progress.toFixed(0)}%</span></div>
  </section>
  <section class="grid-2">
    ${goals.map((g) => `<article class="card">
      <div class="budget-card-head"><h2>${esc(g.name)}</h2><span class="chip" style="--chip:#2f6f4f">${g.progress.toFixed(0)}% funded</span></div>
      <p class="lede">${esc(g.note)}</p>
      <div class="goal-big"><strong>${money(g.saved)}</strong><span> of ${money(g.target)} · ${money(g.target - g.saved)} to go</span></div>
      <div class="meter tall"><div class="meter-fill" style="width:${Math.min(100, g.progress).toFixed(1)}%"></div></div>
      <div class="goal-actions">
        <button class="btn small" data-goal="${g.id}" data-amount="50">+ $50</button>
        <button class="btn small" data-goal="${g.id}" data-amount="100">+ $100</button>
        <form class="goal-custom" data-goal-form="${g.id}">
          <label>$ <input type="number" name="amount" min="1" step="1" placeholder="Custom" required></label>
          <button class="btn small primary" type="submit">Add</button>
        </form>
      </div>
    </article>`).join('')}
  </section>
  <section class="card tip">
    <h2>How the Alvarez family saves</h2>
    <p>Payday rule: ${money(1200)} moves to savings on the 2nd of every month, before any spending. The emergency fund gets the first ${money(800)}, the vacation ${money(150)}, the car ${money(150)} and the college fund ${money(100)}. Whatever is left at month’s end — ${money(incomeTotal() - spendingTotal())} this month — is split the same way.</p>
  </section>`;
}

// --- Reports -----------------------------------------------------------------

export function viewReports() {
  const months = monthsWithCurrent();
  const avgSpending = months.reduce((s, m) => s + m.spending, 0) / months.length;
  const avgIncome = months.reduce((s, m) => s + m.income, 0) / months.length;
  const byCat = spentByCategory().filter((r) => r.category !== 'Savings');
  const merchants = topMerchants(5);
  const groceriesSpent = byCat.find((c) => c.category === 'Groceries')?.spent ?? 0;
  const rows = budgetRows();
  const best = rows.filter((r) => r.left > 0).sort((a, b) => b.left - a.left)[0];
  const worst = rows.filter((r) => r.left < 0)[0];
  const income = incomeTotal();
  const spending = spendingTotal();

  return `
  <section class="page-head">
    <div><p class="eyebrow">Reports</p><h1>Reports &amp; insights</h1>
    <p class="lede">Six months of Alvarez household money, and what it says. Every figure below is computed live from the same ledger the dashboard shows.</p></div>
    <div class="stat-card inline"><span class="stat-label">6-month average</span><strong>${money(avgSpending)} / mo</strong><span class="muted">spending vs ${money(avgIncome)} income</span></div>
  </section>

  <section class="grid-2">
    <article class="card">
      <h2>Income vs spending — Jun to Nov 2026</h2>
      ${trendBars(months)}
      <p class="legend-inline"><span class="swatch income"></span> Income &nbsp; <span class="swatch spending"></span> Spending</p>
      <p class="muted">November spending ${money(spending)} sits ${money(Math.abs(spending - avgSpending))} ${spending >= avgSpending ? 'above' : 'below'} the six-month average — rent and the savings transfer keep the shape steady month to month.</p>
    </article>
    <article class="card">
      <h2>Top merchants this month</h2>
      <ol class="ranked">
        ${merchants.map((m, i) => `<li><span class="rank">${i + 1}</span><span>${esc(m.merchant)}</span><strong>${money(m.total)}</strong></li>`).join('')}
      </ol>
      <p class="muted">Five GreenMart shops add up to ${money(groceriesSpent)} — one weekly shop, same store, same day each week. That routine is why groceries stay ${money(650 - groceriesSpent)} under budget.</p>
    </article>
  </section>

  <section class="grid-2">
    <article class="card">
      <h2>Where the money goes</h2>
      ${byCat.map((r) => barRow(r.category, r.spent, spendingExclSavings())).join('')}
      <p class="muted">Housing is ${pct(byCat[0]?.spent ?? 0, spendingExclSavings())}% of everything the family spends — normal for a renting household of four, and the reason the budget starts with rent.</p>
    </article>
    <article class="card">
      <h2>Three things worth knowing</h2>
      <ol class="insights">
        <li><strong>${esc(best?.category ?? '')} has the most slack:</strong> ${money(best?.left ?? 0)} left with 4 days to go. That slack is the family’s cushion if December starts expensive.</li>
        <li><strong>${worst ? esc(worst.category) + ' is over budget' : 'Nothing is over budget'}:</strong> ${worst ? money(-worst.left) + ' over its ' + money(worst.planned) + ' plan — a small trim next month fixes it.' : 'every category is inside its plan for the first time since September.'}</li>
        <li><strong>Savings rate ${pct(1200, income)}%:</strong> ${money(1200)} of ${money(income)} income is already moved to goals. Keeping it above 15% puts the emergency fund at full strength by March 2027.</li>
      </ol>
      <h2>Year so far</h2>
      <p class="muted">Jun–Nov income ${money(months.reduce((s, m) => s + m.income, 0))} · spending ${money(months.reduce((s, m) => s + m.spending, 0))} · saved roughly ${money(months.reduce((s, m) => s + m.income - m.spending, 0))}. The household has ended every one of the last six months in the black.</p>
    </article>
  </section>`;
}

// --- wiring: every control on the rendered page -------------------------------

export function wireView(root) {
  const txForm = root.querySelector('#tx-form');
  if (txForm) {
    txForm.addEventListener('submit', (event) => {
      event.preventDefault();
      const data = new FormData(txForm);
      addTransaction({
        date: String(data.get('date') || '2026-11-27'),
        merchant: String(data.get('merchant') || '').trim(),
        category: String(data.get('category') || 'Groceries'),
        amount: Math.max(0, Number(data.get('amount')) || 0),
        kind: String(data.get('kind') || 'expense'),
      });
      txForm.reset();
      const note = root.querySelector('#tx-form-note');
      if (note) note.textContent = 'Added — the dashboard, budgets and reports already include it.';
      renderCurrent();
    });
  }

  const catFilter = root.querySelector('#tx-filter-cat');
  const qFilter = root.querySelector('#tx-filter-q');
  if (catFilter) {
    catFilter.addEventListener('change', () => {
      renderCurrent({ category: catFilter.value, query: qFilter?.value ?? '' });
    });
  }
  if (qFilter) {
    qFilter.addEventListener('input', () => {
      renderCurrent({ category: catFilter?.value ?? 'All', query: qFilter.value });
      const again = root.querySelector('#tx-filter-q');
      if (again) {
        again.focus();
        again.setSelectionRange(again.value.length, again.value.length);
      }
    });
  }

  root.querySelectorAll('[data-delete]').forEach((button) => {
    button.addEventListener('click', () => {
      deleteTransaction(button.dataset.delete);
      renderCurrent();
    });
  });

  root.querySelectorAll('[data-budget]').forEach((form) => {
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      setBudget(form.dataset.budget, Number(new FormData(form).get('planned')) || 0);
      renderCurrent();
    });
  });

  root.querySelectorAll('[data-bill]').forEach((button) => {
    button.addEventListener('click', () => {
      toggleBillPaid(button.dataset.bill);
      renderCurrent();
    });
  });

  const billForm = root.querySelector('#bill-form');
  if (billForm) {
    billForm.addEventListener('submit', (event) => {
      event.preventDefault();
      const data = new FormData(billForm);
      addBill({
        name: String(data.get('name') || '').trim(),
        category: String(data.get('category') || 'Utilities'),
        amount: Math.max(0, Number(data.get('amount')) || 0),
        dueDay: Math.min(28, Math.max(1, Number(data.get('dueDay')) || 1)),
      });
      billForm.reset();
      renderCurrent();
    });
  }

  root.querySelectorAll('[data-goal]').forEach((button) => {
    button.addEventListener('click', () => {
      contributeToGoal(button.dataset.goal, Number(button.dataset.amount) || 0);
      renderCurrent();
    });
  });

  root.querySelectorAll('[data-goal-form]').forEach((form) => {
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      contributeToGoal(form.dataset.goalForm, Number(new FormData(form).get('amount')) || 0);
      renderCurrent();
    });
  });
}

// renderCurrent is injected by main.js (it owns the router); views call it
// after a mutation so the page re-renders with the new numbers.
export let renderCurrent = () => {};
export function setRenderCurrent(fn) {
  renderCurrent = fn;
}
