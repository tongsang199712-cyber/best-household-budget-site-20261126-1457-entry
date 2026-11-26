// HearthLedger entry point: hash router + nav. Routes are plain links, so
// every page of the site is one click from every other page:
//   #/               Dashboard
//   #/transactions   Ledger
//   #/budgets        Budgets
//   #/bills          Bills & subscriptions
//   #/goals          Savings goals
//   #/reports        Reports & insights

import { setRenderCurrent, viewBills, viewBudgets, viewDashboard, viewGoals, viewReports, viewTransactions, wireView } from './views.js';
import { resetDemo, state } from './store.js';

const ROUTES = [
  { path: '#/', label: 'Dashboard', render: () => viewDashboard() },
  { path: '#/transactions', label: 'Transactions', render: (filter) => viewTransactions(filter) },
  { path: '#/budgets', label: 'Budgets', render: () => viewBudgets() },
  { path: '#/bills', label: 'Bills', render: () => viewBills() },
  { path: '#/goals', label: 'Goals', render: () => viewGoals() },
  { path: '#/reports', label: 'Reports', render: () => viewReports() },
];

const view = document.getElementById('view');
const nav = document.getElementById('main-nav');
let txFilter = { category: 'All', query: '' };

function currentRoute() {
  const hash = location.hash || '#/';
  return ROUTES.find((r) => r.path === hash) ?? ROUTES[0];
}

export function render(filter) {
  const route = currentRoute();
  if (route.path === '#/transactions' && filter) txFilter = filter;
  if (route.path !== '#/transactions') txFilter = { category: 'All', query: '' };
  view.innerHTML = route.render(txFilter);
  wireView(view);
  nav.querySelectorAll('a').forEach((a) => {
    a.classList.toggle('active', a.getAttribute('href') === route.path);
    if (a.getAttribute('href') === route.path) a.setAttribute('aria-current', 'page');
    else a.removeAttribute('aria-current');
  });
  const heading = view.querySelector('h1');
  if (heading) document.title = `${heading.textContent.trim()} · HearthLedger — Household Budget`;
  window.scrollTo(0, 0);
}

setRenderCurrent((filter) => render(filter));

document.getElementById('reset-demo').addEventListener('click', () => {
  resetDemo();
  render();
});

window.addEventListener('hashchange', () => render());
render();

document.getElementById('household-name').textContent = state.household.name;
document.getElementById('year').textContent = String(new Date().getFullYear());
