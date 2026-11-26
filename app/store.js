// HearthLedger store: loads the seed data (data.js), keeps the household's
// edits in localStorage, and answers every "how much?" question the views
// ask — income, spending, per-category totals, bills due, goal progress.
// Nothing here touches the network; if localStorage is unavailable (a
// sandboxed preview, private mode) the site keeps working in memory.

import { BUDGETS, BILLS, CATEGORIES, GOALS, HOUSEHOLD, MONTHS, TRANSACTIONS } from './data.js';

const STORAGE_KEY = 'hearthledger-v1';

function freshState() {
  return {
    household: HOUSEHOLD,
    budgets: structuredClone(BUDGETS),
    transactions: structuredClone(TRANSACTIONS),
    bills: structuredClone(BILLS),
    goals: structuredClone(GOALS),
    months: structuredClone(MONTHS),
  };
}

function readStored() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || !Array.isArray(parsed.transactions)) return null;
    return parsed;
  } catch {
    return null;
  }
}

export const state = readStored() ?? freshState();

export function saveState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Storage full or blocked: the in-memory state still works.
  }
}

export function resetDemo() {
  const fresh = freshState();
  state.budgets = fresh.budgets;
  state.transactions = fresh.transactions;
  state.bills = fresh.bills;
  state.goals = fresh.goals;
  state.months = fresh.months;
  saveState();
}

// --- money -----------------------------------------------------------------

export function money(amount) {
  return '$' + amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function moneyShort(amount) {
  if (amount >= 1000) return '$' + (amount / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
  return '$' + Math.round(amount);
}

export function pct(part, whole) {
  if (!whole) return 0;
  return Math.round((part / whole) * 100);
}

// --- totals ----------------------------------------------------------------

export function incomeTotal(list = state.transactions) {
  return list.filter((t) => t.kind === 'income').reduce((sum, t) => sum + t.amount, 0);
}

export function spendingTotal(list = state.transactions) {
  return list.filter((t) => t.kind === 'expense').reduce((sum, t) => sum + t.amount, 0);
}

// Spending without the monthly savings transfer — the money the household
// actually spent, as opposed to moved to savings.
export function spendingExclSavings(list = state.transactions) {
  return list
    .filter((t) => t.kind === 'expense' && t.category !== 'Savings')
    .reduce((sum, t) => sum + t.amount, 0);
}

export function categoryColor(name) {
  return CATEGORIES.find((c) => c.name === name)?.color ?? '#7a6a53';
}

export function spentByCategory(list = state.transactions) {
  const totals = new Map();
  for (const t of list) {
    if (t.kind !== 'expense') continue;
    totals.set(t.category, (totals.get(t.category) ?? 0) + t.amount);
  }
  return [...totals.entries()]
    .map(([category, spent]) => ({ category, spent, color: categoryColor(category) }))
    .sort((a, b) => b.spent - a.spent);
}

export function budgetRows() {
  const spent = new Map(spentByCategory().map((r) => [r.category, r.spent]));
  return state.budgets.map((b) => {
    const used = spent.get(b.category) ?? 0;
    return { ...b, spent: used, left: b.planned - used, usedPct: b.planned ? (used / b.planned) * 100 : 0 };
  });
}

export function totalPlanned() {
  return state.budgets.reduce((sum, b) => sum + b.planned, 0);
}

// November's history row always agrees with the transaction list.
export function monthsWithCurrent() {
  const months = state.months.map((m) => ({ ...m }));
  const current = months[months.length - 1];
  current.spending = spendingTotal();
  return months;
}

export function topMerchants(limit = 5) {
  const totals = new Map();
  for (const t of state.transactions) {
    if (t.kind !== 'expense' || t.category === 'Savings') continue;
    totals.set(t.merchant, (totals.get(t.merchant) ?? 0) + t.amount);
  }
  return [...totals.entries()]
    .map(([merchant, total]) => ({ merchant, total }))
    .sort((a, b) => b.total - a.total)
    .slice(0, limit);
}

export function billsDueNext(limit = 3) {
  // Every November bill is paid; the next copies fall in December.
  return state.bills
    .slice()
    .sort((a, b) => a.dueDay - b.dueDay)
    .slice(0, limit)
    .map((b) => ({ ...b, when: `Dec ${b.dueDay}` }));
}

export function goalsWithProgress() {
  return state.goals.map((g) => ({ ...g, progress: g.target ? (g.saved / g.target) * 100 : 0 }));
}

// --- mutations (every control on the site goes through these) ---------------

export function addTransaction({ date, merchant, category, amount, kind }) {
  const id = 'u' + Date.now().toString(36);
  state.transactions.push({ id, date, merchant, category, amount, kind, note: '' });
  saveState();
  return id;
}

export function deleteTransaction(id) {
  const index = state.transactions.findIndex((t) => t.id === id);
  if (index !== -1) state.transactions.splice(index, 1);
  saveState();
}

export function setBudget(category, planned) {
  const row = state.budgets.find((b) => b.category === category);
  if (row) row.planned = Math.max(0, planned);
  saveState();
}

export function toggleBillPaid(id) {
  const bill = state.bills.find((b) => b.id === id);
  if (bill) bill.paid = !bill.paid;
  saveState();
}

export function addBill({ name, category, amount, dueDay }) {
  const id = 'b' + Date.now().toString(36);
  state.bills.push({ id, name, category, amount, dueDay, paid: false, autopay: false, note: '' });
  saveState();
  return id;
}

export function contributeToGoal(id, amount) {
  const goal = state.goals.find((g) => g.id === id);
  if (!goal) return;
  goal.saved = Math.min(goal.target, goal.saved + amount);
  saveState();
}
