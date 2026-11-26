// HearthLedger seed data: one fictional household, November 2026.
// Every figure is invented for this demo household — no real person's data.
// The store (store.js) loads this seed on first visit and then keeps the
// household's own edits in localStorage, so every control stays working.

export const HOUSEHOLD = {
  name: 'The Alvarez Family',
  tagline: 'Two adults, two kids, one shared wallet — Maple Street, Nov 2026',
  members: [
    { name: 'Maya Alvarez', role: 'Designer · Northwind Studio' },
    { name: 'Jon Alvarez', role: 'Driver · City Transit Authority' },
    { name: 'Sofia Alvarez', role: 'Age 8 · 3rd grade' },
    { name: 'Leo Alvarez', role: 'Age 5 · Kindergarten' },
  ],
  monthLabel: 'November 2026',
  monthNote: 'Month in progress · day 26 of 30',
  currency: 'USD',
};

export const CATEGORIES = [
  { name: 'Housing', color: '#1d4d3b' },
  { name: 'Groceries', color: '#5b8c5a' },
  { name: 'Utilities', color: '#3e7ca6' },
  { name: 'Transport', color: '#c96f4a' },
  { name: 'Dining Out', color: '#e8a13c' },
  { name: 'Kids & School', color: '#8a6fb8' },
  { name: 'Health', color: '#c25b7a' },
  { name: 'Entertainment', color: '#4a9b8e' },
  { name: 'Shopping', color: '#7a6a53' },
  { name: 'Personal', color: '#96833f' },
  { name: 'Savings', color: '#2f6f4f' },
  { name: 'Income', color: '#2f6f4f' },
];

// Monthly budget targets for November 2026, in dollars.
export const BUDGETS = [
  { category: 'Housing', planned: 1850 },
  { category: 'Groceries', planned: 650 },
  { category: 'Utilities', planned: 400 },
  { category: 'Transport', planned: 350 },
  { category: 'Dining Out', planned: 300 },
  { category: 'Kids & School', planned: 450 },
  { category: 'Health', planned: 200 },
  { category: 'Entertainment', planned: 150 },
  { category: 'Shopping', planned: 150 },
  { category: 'Personal', planned: 150 },
  { category: 'Savings', planned: 1200 },
];

// Every transaction of November 2026, newest first in the file is not
// required — the views sort by date. kind: 'expense' or 'income'.
export const TRANSACTIONS = [
  { id: 't01', date: '2026-11-01', merchant: 'Maple Court Apartments', category: 'Housing', amount: 1850.0, kind: 'expense', note: 'Monthly rent' },
  { id: 't02', date: '2026-11-01', merchant: 'Northwind Studio — Maya’s salary', category: 'Income', amount: 4200.0, kind: 'income', note: 'Payday' },
  { id: 't03', date: '2026-11-01', merchant: 'City Transit Authority — Jon’s salary', category: 'Income', amount: 2650.0, kind: 'income', note: 'Payday' },
  { id: 't04', date: '2026-11-02', merchant: 'Transfer to emergency savings', category: 'Savings', amount: 1200.0, kind: 'expense', note: 'Automatic transfer on payday' },
  { id: 't05', date: '2026-11-02', merchant: 'GreenMart Superstore', category: 'Groceries', amount: 142.36, kind: 'expense', note: 'Weekly shop' },
  { id: 't06', date: '2026-11-03', merchant: 'Shell — Fuel', category: 'Transport', amount: 48.2, kind: 'expense', note: 'Jon’s commute car' },
  { id: 't07', date: '2026-11-04', merchant: 'City Power & Light', category: 'Utilities', amount: 132.4, kind: 'expense', note: 'October electricity' },
  { id: 't08', date: '2026-11-05', merchant: 'Netflix', category: 'Entertainment', amount: 15.49, kind: 'expense', note: 'Standard plan' },
  { id: 't09', date: '2026-11-06', merchant: 'GreenMart Superstore', category: 'Groceries', amount: 86.1, kind: 'expense', note: 'Midweek top-up' },
  { id: 't10', date: '2026-11-07', merchant: 'Little Dragons Daycare', category: 'Kids & School', amount: 380.0, kind: 'expense', note: 'Leo, November' },
  { id: 't11', date: '2026-11-08', merchant: 'Corner Bakery & Cafe', category: 'Dining Out', amount: 24.5, kind: 'expense', note: 'Saturday breakfast' },
  { id: 't12', date: '2026-11-08', merchant: 'Spotify', category: 'Entertainment', amount: 11.99, kind: 'expense', note: 'Family plan' },
  { id: 't13', date: '2026-11-09', merchant: 'Riverside Pharmacy', category: 'Health', amount: 42.8, kind: 'expense', note: 'Leo’s allergy medicine' },
  { id: 't14', date: '2026-11-10', merchant: 'NorthFiber Internet', category: 'Utilities', amount: 79.0, kind: 'expense', note: '300 Mbps plan' },
  { id: 't15', date: '2026-11-11', merchant: 'Metro Transit — Monthly pass', category: 'Transport', amount: 56.0, kind: 'expense', note: 'Maya’s bus pass' },
  { id: 't16', date: '2026-11-12', merchant: 'GreenMart Superstore', category: 'Groceries', amount: 118.75, kind: 'expense', note: 'Weekly shop' },
  { id: 't17', date: '2026-11-13', merchant: 'Marco’s Pizzeria', category: 'Dining Out', amount: 38.9, kind: 'expense', note: 'Friday pizza night' },
  { id: 't18', date: '2026-11-13', merchant: 'Sharp Cuts Barbershop', category: 'Personal', amount: 35.0, kind: 'expense', note: 'Jon + Leo haircuts' },
  { id: 't19', date: '2026-11-14', merchant: 'Freelance — Logo design (Maya)', category: 'Income', amount: 480.0, kind: 'income', note: 'Side project, paid by bank transfer' },
  { id: 't20', date: '2026-11-15', merchant: 'City Water Department', category: 'Utilities', amount: 64.2, kind: 'expense', note: 'Water + sewer' },
  { id: 't21', date: '2026-11-16', merchant: 'Stride Rite Kids', category: 'Kids & School', amount: 74.99, kind: 'expense', note: 'Sofia’s winter shoes' },
  { id: 't22', date: '2026-11-17', merchant: 'Shell — Fuel', category: 'Transport', amount: 52.1, kind: 'expense', note: '' },
  { id: 't23', date: '2026-11-18', merchant: 'BrightMobile', category: 'Utilities', amount: 112.0, kind: 'expense', note: 'Two lines, unlimited' },
  { id: 't24', date: '2026-11-19', merchant: 'GreenMart Superstore', category: 'Groceries', amount: 97.4, kind: 'expense', note: 'Weekly shop' },
  { id: 't25', date: '2026-11-20', merchant: 'Cineplex — Movie night', category: 'Entertainment', amount: 46.0, kind: 'expense', note: 'Family of four, matinee' },
  { id: 't26', date: '2026-11-21', merchant: 'IronWorks Gym', category: 'Health', amount: 45.0, kind: 'expense', note: 'Maya’s membership' },
  { id: 't27', date: '2026-11-22', merchant: 'The Book Nook', category: 'Shopping', amount: 31.5, kind: 'expense', note: 'Two picture books for Sofia' },
  { id: 't28', date: '2026-11-23', merchant: 'GreenMart Superstore', category: 'Groceries', amount: 88.2, kind: 'expense', note: 'Thanksgiving groceries' },
  { id: 't29', date: '2026-11-24', merchant: 'Beacon Auto Insurance', category: 'Transport', amount: 148.0, kind: 'expense', note: 'Monthly premium' },
  { id: 't30', date: '2026-11-25', merchant: 'Harbor & Vine Restaurant', category: 'Dining Out', amount: 62.4, kind: 'expense', note: 'Anniversary dinner' },
  { id: 't31', date: '2026-11-26', merchant: 'Riverside Pharmacy', category: 'Health', amount: 28.6, kind: 'expense', note: 'Vitamins' },
];

// Recurring bills. dueDay is the day of the month; paid means November's
// copy is settled. December's copies are shown as "coming up".
export const BILLS = [
  { id: 'b01', name: 'Rent — Maple Court Apartments', category: 'Housing', amount: 1850.0, dueDay: 1, paid: true, autopay: true, note: 'Due the 1st, auto-debit' },
  { id: 'b02', name: 'Netflix', category: 'Entertainment', amount: 15.49, dueDay: 5, paid: true, autopay: true, note: 'Standard plan' },
  { id: 'b03', name: 'Little Dragons Daycare', category: 'Kids & School', amount: 380.0, dueDay: 7, paid: true, autopay: false, note: 'Leo, monthly' },
  { id: 'b04', name: 'Spotify Family', category: 'Entertainment', amount: 11.99, dueDay: 8, paid: true, autopay: true, note: '' },
  { id: 'b05', name: 'NorthFiber Internet', category: 'Utilities', amount: 79.0, dueDay: 10, paid: true, autopay: true, note: '300 Mbps' },
  { id: 'b06', name: 'City Power & Light', category: 'Utilities', amount: 132.4, dueDay: 15, paid: true, autopay: false, note: 'Electricity' },
  { id: 'b07', name: 'BrightMobile', category: 'Utilities', amount: 112.0, dueDay: 18, paid: true, autopay: true, note: 'Two lines' },
  { id: 'b08', name: 'City Water Department', category: 'Utilities', amount: 64.2, dueDay: 20, paid: true, autopay: false, note: 'Water + sewer' },
  { id: 'b09', name: 'IronWorks Gym', category: 'Health', amount: 45.0, dueDay: 21, paid: true, autopay: true, note: 'Maya’s membership' },
  { id: 'b10', name: 'Beacon Auto Insurance', category: 'Transport', amount: 148.0, dueDay: 25, paid: true, autopay: true, note: 'Monthly premium' },
];

// Savings goals.
export const GOALS = [
  { id: 'g1', name: 'Emergency fund', target: 10000, saved: 6400, note: 'Six months of essentials — the safety net first.' },
  { id: 'g2', name: 'Family vacation — Seaside 2027', target: 2400, saved: 1150, note: 'A week by the sea next summer, Sofia’s pick.' },
  { id: 'g3', name: 'New car down payment', target: 5000, saved: 2050, note: 'Replacing the 2014 sedan before next winter.' },
  { id: 'g4', name: 'Kids’ college fund', target: 25000, saved: 3800, note: 'Slow and steady — $150 a month since 2023.' },
];

// Six months of history. November's spending is filled in at load time
// from the transaction list, so the chart can never disagree with it.
export const MONTHS = [
  { month: 'Jun 2026', income: 7120, spending: 4890 },
  { month: 'Jul 2026', income: 7210, spending: 5120 },
  { month: 'Aug 2026', income: 7050, spending: 4780 },
  { month: 'Sep 2026', income: 7330, spending: 5010 },
  { month: 'Oct 2026', income: 7190, spending: 4960 },
  { month: 'Nov 2026', income: 7330, spending: null },
];
