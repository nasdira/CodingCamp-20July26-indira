// ─── CONSTANTS & CONFIG ───────────────────────────────────────────────────────

const CONSTANTS = {
  STORAGE_KEYS: {
    TRANSACTIONS: 'ledgerly_transactions',
    BUDGET:       'ledgerly_budget',
    CATEGORIES:   'ledgerly_categories',
    THEME:        'ledgerly_theme',
  },
  MAX_CATEGORIES: 50,
  MAX_NAME_LENGTH: 100,
  AMOUNT_MIN: 0.01,
  AMOUNT_MAX: 999999999.99,
};

const DEFAULT_CATEGORIES = ['Food', 'Transport', 'Fun'];

const CATEGORY_PALETTE = [
  '#0A84FF', '#34C759', '#FF9F0A', '#FF453A', '#BF5AF2',
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
  '#DDA0DD', '#F0E68C',
];

// ─── STATE ────────────────────────────────────────────────────────────────────

const AppState = {
  transactions: [],      // Transaction[] — source of truth for all renders
  budget: 0,             // number — monthly budget in Rupiah
  categories: [],        // string[] — all category names (defaults + custom)
  theme: 'light',        // 'light' | 'dark'
  selectedMonth: '',     // string 'YYYY-MM' — for Monthly Summary section
  chartInstance: null,   // Chart | null — current Chart.js instance
  txFilter: {
    search: '',          // string — current search string
    category: 'all',     // string — 'all' or a category name
    sort: 'newest',      // 'newest' | 'oldest' | 'amount-high' | 'amount-low' | 'category-az'
  },
};

// ─── LOCAL STORAGE ────────────────────────────────────────────────────────────

/**
 * Displays a warning banner or toast when a LocalStorage key fails to load.
 * Satisfies Requirements 12.6 and 12.7.
 *
 * @param {string} key - The LocalStorage key that failed to parse.
 */
function showStorageWarning(key) {
  // Use showToast if available (defined later in the file via hoisting won't work for
  // function expressions, so we check and fall back to a banner).
  const message = `Warning: Saved data for "${key}" was corrupt and has been reset to its default.`;

  // Persistent warning banner approach — appended to <body> so it is always visible
  // regardless of which section has loaded. If a banner for this key already exists,
  // don't duplicate it.
  const bannerId = `storage-warning-${key.replace(/\W/g, '_')}`;
  if (document.getElementById(bannerId)) return;

  const banner = document.createElement('div');
  banner.id = bannerId;
  banner.setAttribute('role', 'alert');
  banner.style.cssText = [
    'position:fixed',
    'top:0',
    'left:0',
    'right:0',
    'z-index:9999',
    'background:#FF9F0A',
    'color:#1D1D1F',
    'padding:0.6rem 1rem',
    'font-size:0.875rem',
    'display:flex',
    'align-items:center',
    'gap:0.5rem',
  ].join(';');

  banner.innerHTML =
    `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">` +
    `<path d="M8 1L15 14H1L8 1Z" stroke="currentColor" stroke-width="1.5" fill="none"/>` +
    `<path d="M8 6v4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>` +
    `<circle cx="8" cy="11.5" r="0.75" fill="currentColor"/>` +
    `</svg>` +
    `<span>${message}</span>` +
    `<button onclick="this.parentElement.remove()" aria-label="Dismiss warning" ` +
    `style="margin-left:auto;background:none;border:none;cursor:pointer;font-size:1rem;color:inherit;">✕</button>`;

  // Insert at the very top of <body> (or append if body isn't ready yet)
  if (document.body) {
    document.body.insertBefore(banner, document.body.firstChild);
  } else {
    document.addEventListener('DOMContentLoaded', () => {
      document.body.insertBefore(banner, document.body.firstChild);
    });
  }
}

/**
 * Reads all four AppState keys from LocalStorage.
 * Each key is wrapped in its own try/catch so a failure in one does not
 * prevent the others from loading.
 *
 * On a parse failure the affected field is reset to its empty default and
 * showStorageWarning() is called with the failing key name.
 *
 * Satisfies Requirements 12.1–12.5, 12.6, 12.7.
 */
function loadFromStorage() {
  // ── ledgerly_transactions ────────────────────────────────────────────────
  try {
    const raw = localStorage.getItem(CONSTANTS.STORAGE_KEYS.TRANSACTIONS);
    AppState.transactions = raw ? JSON.parse(raw) : [];
  } catch (e) {
    AppState.transactions = [];
    showStorageWarning(CONSTANTS.STORAGE_KEYS.TRANSACTIONS);
  }

  // ── ledgerly_budget ──────────────────────────────────────────────────────
  try {
    const raw = localStorage.getItem(CONSTANTS.STORAGE_KEYS.BUDGET);
    AppState.budget = raw ? JSON.parse(raw) : 0;
  } catch (e) {
    AppState.budget = 0;
    showStorageWarning(CONSTANTS.STORAGE_KEYS.BUDGET);
  }

  // ── ledgerly_categories ──────────────────────────────────────────────────
  try {
    const raw = localStorage.getItem(CONSTANTS.STORAGE_KEYS.CATEGORIES);
    AppState.categories = raw ? JSON.parse(raw) : [...DEFAULT_CATEGORIES];
  } catch (e) {
    AppState.categories = [...DEFAULT_CATEGORIES];
    showStorageWarning(CONSTANTS.STORAGE_KEYS.CATEGORIES);
  }

  // ── ledgerly_theme ───────────────────────────────────────────────────────
  try {
    const raw = localStorage.getItem(CONSTANTS.STORAGE_KEYS.THEME);
    AppState.theme = raw ? JSON.parse(raw) : 'light';
  } catch (e) {
    AppState.theme = 'light';
    showStorageWarning(CONSTANTS.STORAGE_KEYS.THEME);
  }
}

function saveTransactions() {
  try {
    localStorage.setItem(CONSTANTS.STORAGE_KEYS.TRANSACTIONS, JSON.stringify(AppState.transactions));
  } catch (e) {
    showToast('Could not save expense. Browser storage may be full.', 'error');
    throw e; // caller skips form reset
  }
}

function saveBudget() {
  try {
    localStorage.setItem(CONSTANTS.STORAGE_KEYS.BUDGET, JSON.stringify(AppState.budget));
  } catch (e) {
    // silent fail for budget
  }
}

function saveCategories() {
  try {
    localStorage.setItem(CONSTANTS.STORAGE_KEYS.CATEGORIES, JSON.stringify(AppState.categories));
  } catch (e) {
    // silent fail
  }
}

function saveTheme() {
  try {
    localStorage.setItem(CONSTANTS.STORAGE_KEYS.THEME, JSON.stringify(AppState.theme));
  } catch (e) {
    // silent fail
  }
}

// ─── COMPUTATION / PURE FUNCTIONS ─────────────────────────────────────────────

/**
 * Returns the sum of all transaction amounts whose date falls within the given month.
 *
 * @param {Array<{amount: number, date: string}>} transactions - All transactions.
 * @param {string} month - Target month in "YYYY-MM" format.
 * @returns {number} Sum of matching transaction amounts.
 *
 * Validates: Requirements 2.1, 2.3
 */
function getTotalExpenses(transactions, month) {
  return transactions
    .filter(tx => tx.date.startsWith(month))
    .reduce((sum, tx) => sum + tx.amount, 0);
}

/**
 * Returns the remaining balance for the month.
 *
 * @param {number} budget - The monthly budget in Rupiah.
 * @param {number} totalExpenses - The total expenses for the month.
 * @returns {number} budget minus totalExpenses (may be negative).
 *
 * Validates: Requirements 2.1, 2.9
 */
function getRemainingBalance(budget, totalExpenses) {
  return budget - totalExpenses;
}

/**
 * Returns the ratio of total expenses to the monthly budget.
 * Returns 0 when budget is 0 to avoid division by zero.
 * The result is unbounded and may exceed 1.
 *
 * @param {number} totalExpenses - The total expenses for the month.
 * @param {number} budget - The monthly budget in Rupiah.
 * @returns {number} totalExpenses / budget, or 0 if budget === 0.
 *
 * Validates: Requirements 3.1, 3.6
 */
function getBudgetRatio(totalExpenses, budget) {
  if (budget === 0) return 0;
  return totalExpenses / budget;
}

/**
 * Returns the progress bar color based on the current budget ratio.
 *
 * - ratio < 0.6  → success green  (#34C759)
 * - 0.6 ≤ ratio < 0.9 → warning orange (#FF9F0A)
 * - ratio ≥ 0.9  → danger red    (#FF453A)
 *
 * @param {number} ratio - The budget ratio from getBudgetRatio().
 * @returns {string} A hex color string.
 *
 * Validates: Requirements 3.2, 3.3, 3.4
 */
function getProgressBarColor(ratio) {
  if (ratio < 0.6) return '#34C759';
  if (ratio < 0.9) return '#FF9F0A';
  return '#FF453A';
}

/**
 * Returns the category name with the highest total spending for the given month.
 * When two or more categories are tied, the one that comes first alphabetically
 * (case-sensitive ascending) is returned.
 * Returns null if no transactions exist for the month.
 *
 * @param {Array<{amount: number, date: string, category: string}>} transactions
 * @param {string} month - Target month in "YYYY-MM" format.
 * @returns {string|null} The category name, or null if no transactions exist.
 *
 * Validates: Requirements 4.2, 4.6
 */
function getLargestCategory(transactions, month) {
  const monthTxs = transactions.filter(tx => tx.date.startsWith(month));
  if (monthTxs.length === 0) return null;

  // Aggregate totals per category
  const totals = {};
  for (const tx of monthTxs) {
    totals[tx.category] = (totals[tx.category] || 0) + tx.amount;
  }

  // Find the category with the highest total; break ties alphabetically
  let largest = null;
  let largestTotal = -Infinity;
  for (const [category, total] of Object.entries(totals)) {
    if (
      total > largestTotal ||
      (total === largestTotal && category < largest)
    ) {
      largest = category;
      largestTotal = total;
    }
  }

  return largest;
}

/**
 * Returns the number of calendar days in the given month.
 * Correctly handles leap-year February.
 *
 * @param {string} month - Month in "YYYY-MM" format.
 * @returns {number} Number of days in the month.
 */
function daysInMonth(month) {
  const parts = month.split('-');
  // Passing day 0 of the next month gives the last day of the current month
  return new Date(parseInt(parts[0]), parseInt(parts[1]), 0).getDate();
}

/**
 * Computes summary statistics for the given month.
 *
 * Returns:
 *   - total:           sum of all amounts for the month
 *   - count:           number of transactions for the month
 *   - largestCategory: category name with the highest total (or null)
 *   - dailyAverage:    total divided by calendar days in month, rounded to nearest Rupiah
 *
 * @param {Array<{amount: number, date: string, category: string}>} transactions
 * @param {string} month - Target month in "YYYY-MM" format.
 * @returns {{ total: number, count: number, largestCategory: string|null, dailyAverage: number }}
 *
 * Validates: Requirement 9.2
 */
function getMonthlyStats(transactions, month) {
  const monthTxs = transactions.filter(tx => tx.date.startsWith(month));
  const total = getTotalExpenses(transactions, month);
  const count = monthTxs.length;
  const largestCategory = getLargestCategory(transactions, month);
  const dailyAverage = Math.round(total / daysInMonth(month));
  return { total, count, largestCategory, dailyAverage };
}

// ─── FORMATTING UTILITIES ─────────────────────────────────────────────────────

/**
 * Returns a deterministic hex color for a category name using a djb2-style hash.
 * The same name always maps to the same palette slot regardless of render order
 * or page reload, satisfying Requirement 7.3.
 *
 * @param {string} categoryName - The category name to hash.
 * @returns {string} A hex color string from CATEGORY_PALETTE.
 */
function getCategoryColor(categoryName) {
  let hash = 5381;
  for (let i = 0; i < categoryName.length; i++) {
    hash = ((hash << 5) + hash) + categoryName.charCodeAt(i);
    hash |= 0; // Convert to 32-bit integer
  }
  const index = Math.abs(hash) % CATEGORY_PALETTE.length;
  return CATEGORY_PALETTE[index];
}

/**
 * Formats a number as Indonesian Rupiah.
 * Uses period (.) as thousands separator, no decimal places.
 *
 * Examples:
 *   formatRupiah(0)         → "Rp0"
 *   formatRupiah(50000)     → "Rp50.000"
 *   formatRupiah(1250000)   → "Rp1.250.000"
 *   formatRupiah(-250000)   → "Rp-250.000"  (negative shown for Remaining Balance)
 *
 * @param {number} amount - The numeric value. Decimal portion is discarded (Math.round).
 * @returns {string}
 */
function formatRupiah(amount) {
  const rounded = Math.round(amount);
  const abs = Math.abs(rounded);
  const sign = rounded < 0 ? '-' : '';
  const parts = abs.toString().split('').reverse();
  const grouped = [];
  for (let i = 0; i < parts.length; i++) {
    if (i > 0 && i % 3 === 0) grouped.push('.');
    grouped.push(parts[i]);
  }
  return `Rp${sign}${grouped.reverse().join('')}`;
}

// ─── RENDER: HEADER ───────────────────────────────────────────────────────────

/**
 * Populates `#app-header` with:
 *   - Inline SVG logo (bar chart icon)
 *   - h1 "Ledgerly"
 *   - Subtitle paragraph "Make every rupiah count."
 *   - Current month/year string (e.g. "July 2026")
 *   - Theme toggle button (#theme-toggle-btn) whose label shows the mode it WILL activate
 *
 * Replaces the innerHTML of the existing <header id="app-header"> element.
 *
 * Satisfies Requirements 1.1, 1.2, 1.3, 1.4
 */
function renderHeader() {
  const header = document.getElementById('app-header');
  if (!header) return;

  // Current month/year formatted as e.g. "July 2026"
  const currentMonthYear = new Date().toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  // The toggle button label shows the mode it WILL activate:
  // if current theme is 'light' → button says "Dark"
  // if current theme is 'dark'  → button says "Light"
  const toggleLabel = AppState.theme === 'light' ? 'Dark' : 'Light';

  // Inline bar-chart SVG logo
  const logoSVG = `
    <svg
      class="header-logo"
      width="36"
      height="36"
      viewBox="0 0 36 36"
      fill="none"
      aria-hidden="true"
      xmlns="http://www.w3.org/2000/svg"
    >
      <!-- Bar chart icon -->
      <rect x="4"  y="20" width="6" height="12" rx="2" fill="var(--color-primary)"/>
      <rect x="15" y="12" width="6" height="20" rx="2" fill="var(--color-primary)"/>
      <rect x="26" y="6"  width="6" height="26" rx="2" fill="var(--color-primary)"/>
      <!-- Baseline -->
      <rect x="2"  y="33" width="32" height="2"  rx="1" fill="var(--color-primary)"/>
    </svg>`;

  header.innerHTML = `
    <div class="header-brand">
      ${logoSVG}
      <div class="header-title-group">
        <h1 class="header-title">Ledgerly</h1>
        <p class="header-subtitle">Make every rupiah count.</p>
      </div>
    </div>
    <div class="header-meta">
      <span class="header-month" aria-label="Current month and year">${currentMonthYear}</span>
      <button
        id="theme-toggle-btn"
        class="btn btn-secondary"
        type="button"
        aria-label="Switch to ${toggleLabel} mode"
      >${toggleLabel}</button>
    </div>
  `;
}

// ─── RENDER: DASHBOARD CARDS ──────────────────────────────────────────────────

/**
 * Renders the four dashboard summary cards into #dashboard-cards.
 *
 * Cards rendered (in order):
 *   1. Remaining Balance  — budget minus current-month expenses; large font;
 *                           danger color when negative (Req 2.1, 2.6, 2.9)
 *   2. Monthly Budget     — AppState.budget (Req 2.2)
 *   3. Total Expenses     — sum of current-month transactions (Req 2.3)
 *   4. Number of Transactions — count of current-month transactions (Req 2.4)
 *
 * All currency values are formatted via formatRupiah() (Req 2.5).
 * Re-renders entirely via innerHTML on every call.
 *
 * Validates: Requirements 2.1–2.6, 2.8, 2.9
 */
function renderDashboardCards() {
  const container = document.getElementById('dashboard-cards');
  if (!container) return;

  // Current month in YYYY-MM format
  const currentMonth = new Date().toISOString().slice(0, 7);

  // Computed values
  const totalExpenses     = getTotalExpenses(AppState.transactions, currentMonth);
  const remainingBalance  = getRemainingBalance(AppState.budget, totalExpenses);
  const txCount           = AppState.transactions.filter(tx => tx.date.startsWith(currentMonth)).length;

  // Apply danger color to Remaining Balance when negative (Req 2.9)
  const balanceColorClass = remainingBalance < 0 ? ' text-danger' : '';

  container.innerHTML = `
    <div class="card dashboard-card">
      <p class="card__label">Remaining Balance</p>
      <p class="card__value card__value--large${balanceColorClass}">${formatRupiah(remainingBalance)}</p>
    </div>
    <div class="card dashboard-card">
      <p class="card__label">Monthly Budget</p>
      <p class="card__value">${formatRupiah(AppState.budget)}</p>
    </div>
    <div class="card dashboard-card">
      <p class="card__label">Total Expenses</p>
      <p class="card__value">${formatRupiah(totalExpenses)}</p>
    </div>
    <div class="card dashboard-card">
      <p class="card__label">Number of Transactions</p>
      <p class="card__value">${txCount}</p>
    </div>
  `;
}

// ─── RENDER: BUDGET PROGRESS BAR ──────────────────────────────────────────────

/**
 * Renders the budget progress bar into `#budget-progress`.
 *
 * Behavior:
 * - Computes total expenses for the current calendar month via getTotalExpenses().
 * - Computes the budget ratio via getBudgetRatio() (returns 0 when budget is 0,
 *   avoiding division by zero per Requirement 3.6).
 * - Caps the fill percentage at 100 so the bar never overflows (Requirement 3.1).
 * - Colors the fill via getProgressBarColor() (green / orange / red thresholds,
 *   Requirements 3.2–3.4).
 * - Displays an integer percentage label adjacent to the bar (Requirement 3.7).
 *
 * DOM structure written into #budget-progress:
 *   <div class="budget-progress-container">
 *     <div class="budget-progress-header">
 *       <span class="budget-progress-label">Budget Used</span>
 *       <span class="budget-progress-pct" aria-live="polite">62%</span>
 *     </div>
 *     <div class="progress-bar" role="progressbar" aria-valuenow="62"
 *          aria-valuemin="0" aria-valuemax="100" aria-label="Budget usage progress">
 *       <div class="progress-fill" style="width:62%;background-color:#34C759;"></div>
 *     </div>
 *   </div>
 *
 * Satisfies Requirements 3.1–3.7.
 */
function renderBudgetProgress() {
  const container = document.getElementById('budget-progress');
  if (!container) return;

  // Compute ratio for the current calendar month
  const currentMonth = new Date().toISOString().slice(0, 7); // "YYYY-MM"
  const total = getTotalExpenses(AppState.transactions, currentMonth);
  const ratio = getBudgetRatio(total, AppState.budget);

  // Cap the visual fill at 100 %; ratio may exceed 1 when over budget
  const fillPct = Math.min(100, ratio * 100);
  const color = getProgressBarColor(ratio);

  // Integer percentage shown in the label (floor, not round, per task spec)
  const labelPct = Math.floor(fillPct);

  container.innerHTML = `
    <div class="budget-progress-container">
      <div class="budget-progress-header">
        <span class="budget-progress-label">Budget Used</span>
        <span class="budget-progress-pct" aria-live="polite">${labelPct}%</span>
      </div>
      <div
        class="progress-bar"
        role="progressbar"
        aria-valuenow="${labelPct}"
        aria-valuemin="0"
        aria-valuemax="100"
        aria-label="Budget usage progress"
      >
        <div
          class="progress-fill"
          style="width:${fillPct}%;background-color:${color};"
        ></div>
      </div>
    </div>
  `;
}

// ─── RENDER: INSIGHTS ─────────────────────────────────────────────────────────

/**
 * Renders textual spending insights into the #insights section.
 *
 * Insight rules (evaluated in order):
 *  1. If no current-month transactions AND budget === 0 → "No expenses recorded yet."
 *  2. If budget > 0 → "You have used X% of this month's budget." (floor)
 *  3. If ≥ 1 current-month transaction → "Your largest spending category is [name]."
 *  4. If total > budget → "You are RpX over budget."
 *
 * Satisfies Requirements 4.1–4.6
 */
function renderInsights() {
  const container = document.getElementById('insights');
  if (!container) return;

  const currentMonth = new Date().toISOString().slice(0, 7);
  const total = getTotalExpenses(AppState.transactions, currentMonth);
  const budget = AppState.budget;

  // Transactions that belong to the current month
  const currentMonthTxs = AppState.transactions.filter(tx => tx.date.startsWith(currentMonth));

  // Empty state: no transactions this month AND no budget set
  if (currentMonthTxs.length === 0 && budget === 0) {
    container.innerHTML = `
      <p class="insight insight--empty">No expenses recorded yet.</p>
    `;
    return;
  }

  const insights = [];

  // Insight 1: budget usage percentage (shown whenever budget > 0)
  if (budget > 0) {
    const usagePct = Math.floor(getBudgetRatio(total, budget) * 100);
    insights.push(`<p class="insight insight--usage">You have used ${usagePct}% of this month's budget.</p>`);
  }

  // Insight 2: largest spending category (shown whenever ≥ 1 transaction this month)
  if (currentMonthTxs.length > 0) {
    const largest = getLargestCategory(AppState.transactions, currentMonth);
    if (largest) {
      insights.push(`<p class="insight insight--category">Your largest spending category is ${largest}.</p>`);
    }
  }

  // Insight 3: over-budget warning (shown whenever total exceeds budget)
  if (total > budget) {
    const overAmount = formatRupiah(total - budget);
    insights.push(`<p class="insight insight--over-budget">You are ${overAmount} over budget.</p>`);
  }

  container.innerHTML = insights.join('');
}

// ─── RENDER: CHART ────────────────────────────────────────────────────────────

/**
 * Renders (or updates) the doughnut chart for the current calendar month.
 *
 * Behavior:
 * - Filters AppState.transactions to the current month (YYYY-MM).
 * - If no transactions exist: destroys any existing Chart instance, hides the
 *   canvas, and shows the #chart-empty-msg element.
 * - If transactions exist: destroys any existing Chart instance, aggregates
 *   spending by category, creates a new Chart.js doughnut instance with
 *   responsive sizing, a bottom legend, and Rupiah + percentage tooltips.
 * - Attaches a debounced ResizeObserver on #chart-canvas-wrapper (once) that
 *   calls AppState.chartInstance.resize() to handle viewport resizes.
 *
 * Satisfies Requirements 7.1–7.6.
 */
function renderChart() {
  const currentMonth = new Date().toISOString().slice(0, 7);
  const currentMonthTxs = AppState.transactions.filter(tx => tx.date.startsWith(currentMonth));
  const canvas = document.getElementById('spending-chart');
  const wrapper = document.getElementById('chart-canvas-wrapper');
  const emptyMsg = document.getElementById('chart-empty-msg');

  // ── Empty state ────────────────────────────────────────────────────────────
  if (currentMonthTxs.length === 0) {
    if (AppState.chartInstance) {
      AppState.chartInstance.destroy();
      AppState.chartInstance = null;
    }
    if (canvas) canvas.style.display = 'none';
    if (emptyMsg) emptyMsg.style.display = '';
    return;
  }

  // ── Non-empty: show canvas, hide empty message ─────────────────────────────
  if (canvas) canvas.style.display = '';
  if (emptyMsg) emptyMsg.style.display = 'none';

  // Aggregate spending by category
  const totalsMap = {};
  for (const tx of currentMonthTxs) {
    totalsMap[tx.category] = (totalsMap[tx.category] || 0) + tx.amount;
  }
  const categories = Object.keys(totalsMap);
  const amounts = categories.map(c => totalsMap[c]);
  const colors = categories.map(c => getCategoryColor(c));

  // Destroy previous instance before creating a new one (avoids Chart.js ghost state)
  if (AppState.chartInstance) {
    AppState.chartInstance.destroy();
  }

  const ctx = canvas.getContext('2d');
  const totalForMonth = currentMonthTxs.reduce((s, t) => s + t.amount, 0);

  AppState.chartInstance = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: categories,
      datasets: [{ data: amounts, backgroundColor: colors }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: { position: 'bottom' },
        tooltip: {
          callbacks: {
            label: tooltipCtx =>
              `${tooltipCtx.label}: ${formatRupiah(tooltipCtx.raw)} ` +
              `(${(tooltipCtx.parsed / totalForMonth * 100).toFixed(1)}%)`,
          },
        },
      },
    },
  });

  // ── ResizeObserver — viewport resize (Requirement 7.6) ────────────────────
  // Attach once per wrapper element; skip if already observed.
  if (wrapper && !wrapper._resizeObserver) {
    let resizeTimer;
    const ro = new ResizeObserver(() => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        if (AppState.chartInstance) AppState.chartInstance.resize();
      }, 200);
    });
    ro.observe(wrapper);
    wrapper._resizeObserver = ro;
  }
}

// ─── RENDER: TRANSACTION LIST ─────────────────────────────────────────────────

/**
 * Renders the transaction list for the current calendar month into #transaction-list.
 *
 * Steps:
 *  1. Update the search/filter/sort controls to reflect AppState.txFilter values.
 *  2. Filter AppState.transactions to the current month (YYYY-MM).
 *  3. If AppState.transactions is completely empty → show "No expenses recorded yet."
 *  4. Apply search filter (case-insensitive name substring match on txFilter.search).
 *  5. Apply category filter (txFilter.category !== 'all').
 *  6. Apply sort (newest/oldest/amount-high/amount-low/category-az).
 *  7. If filtered results are empty → show "No transactions found."
 *  8. Otherwise render each transaction item with:
 *     - Category badge with background color from getCategoryColor()
 *     - Item name
 *     - Date in YYYY-MM-DD format
 *     - Category name
 *     - formatRupiah(amount)
 *     - Delete button with data-id="${tx.id}" and class btn-delete-tx
 *
 * Also updates the category filter <select> options to reflect AppState.categories.
 *
 * Satisfies Requirements 8.1–8.11.
 */
function renderTransactionList() {
  const listContainer = document.getElementById('transaction-list');
  if (!listContainer) return;

  // ── 1. Sync filter controls to AppState.txFilter ──────────────────────────
  const searchInput = document.getElementById('tx-search');
  const categoryFilter = document.getElementById('tx-category-filter');
  const sortSelect = document.getElementById('tx-sort');

  if (searchInput) searchInput.value = AppState.txFilter.search;
  if (sortSelect) sortSelect.value = AppState.txFilter.sort;

  // Rebuild the category filter options to stay in sync with AppState.categories
  if (categoryFilter) {
    const currentCatFilter = AppState.txFilter.category;
    categoryFilter.innerHTML = '<option value="all">All Categories</option>';
    AppState.categories.forEach(cat => {
      const opt = document.createElement('option');
      opt.value = cat;
      opt.textContent = cat;
      categoryFilter.appendChild(opt);
    });
    categoryFilter.value = currentCatFilter;
  }

  // ── 2. Restrict to current calendar month ────────────────────────────────
  const currentMonth = new Date().toISOString().slice(0, 7); // "YYYY-MM"
  const monthTxs = AppState.transactions.filter(tx => tx.date.startsWith(currentMonth));

  // ── 3. Empty state — no transactions at all ───────────────────────────────
  if (AppState.transactions.length === 0) {
    listContainer.innerHTML =
      '<p class="tx-list-empty">No expenses recorded yet.</p>';
    return;
  }

  // ── 4. Search filter ──────────────────────────────────────────────────────
  const searchTerm = AppState.txFilter.search.toLowerCase();
  let filtered = searchTerm
    ? monthTxs.filter(tx => tx.name.toLowerCase().includes(searchTerm))
    : monthTxs.slice();

  // ── 5. Category filter ────────────────────────────────────────────────────
  if (AppState.txFilter.category !== 'all') {
    filtered = filtered.filter(tx => tx.category === AppState.txFilter.category);
  }

  // ── 6. Sort ───────────────────────────────────────────────────────────────
  const sort = AppState.txFilter.sort;
  filtered.sort((a, b) => {
    switch (sort) {
      case 'newest':
        return b.date.localeCompare(a.date);
      case 'oldest':
        return a.date.localeCompare(b.date);
      case 'amount-high':
        return b.amount - a.amount;
      case 'amount-low':
        return a.amount - b.amount;
      case 'category-az':
        return a.category.localeCompare(b.category);
      default:
        return b.date.localeCompare(a.date); // default: newest
    }
  });

  // ── 7. No results after filtering ────────────────────────────────────────
  if (filtered.length === 0) {
    listContainer.innerHTML =
      '<p class="tx-list-empty">No transactions found.</p>';
    return;
  }

  // ── 8. Render transaction items ───────────────────────────────────────────
  const items = filtered.map(tx => {
    const badgeColor = getCategoryColor(tx.category);
    return `
      <div class="tx-item" data-id="${tx.id}">
        <span
          class="tx-category-badge"
          style="background-color:${badgeColor};"
          aria-label="Category: ${tx.category}"
        ></span>
        <div class="tx-details">
          <span class="tx-name">${tx.name}</span>
          <span class="tx-meta">
            <span class="tx-date">${tx.date}</span>
            &middot;
            <span class="tx-category">${tx.category}</span>
          </span>
        </div>
        <span class="tx-amount">${formatRupiah(tx.amount)}</span>
        <button
          type="button"
          class="btn btn-danger btn-delete-tx"
          data-id="${tx.id}"
          aria-label="Delete transaction: ${tx.name}"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
            <path d="M2 2l10 10M12 2L2 12" stroke="currentColor" stroke-width="1.75" stroke-linecap="round"/>
          </svg>
        </button>
      </div>
    `;
  });

  listContainer.innerHTML = items.join('');
}

// ─── RENDER: MONTHLY SUMMARY ──────────────────────────────────────────────────

/**
 * Renders the Monthly Summary section.
 *
 * Behavior:
 * 1. Collects all unique months that have at least one transaction, sorted
 *    descending (newest first), and populates `<select id="month-selector">`.
 *    - If AppState.selectedMonth is in the list it is pre-selected.
 *    - Otherwise AppState.selectedMonth is reset to the current calendar month.
 * 2. Reads stats for the selected month via getMonthlyStats().
 * 3. If no transactions exist for the selected month, renders the empty-state
 *    message "No data available for this month." in #monthly-summary-content.
 * 4. Otherwise renders:
 *    - Four stat items: total spending, transaction count, largest category,
 *      daily average.
 *    - A category breakdown table sorted by total descending, each row showing
 *      category name, formatRupiah total, percentage (1 decimal place), and a
 *      proportional progress bar (width relative to the top category).
 *
 * Satisfies Requirements 9.1–9.5.
 */
function renderMonthlySummary() {
  const select = document.getElementById('month-selector');
  const content = document.getElementById('monthly-summary-content');
  if (!select || !content) return;

  // ── 1. Collect unique months that have transactions, sorted newest first ──
  const months = [...new Set(
    AppState.transactions.map(tx => tx.date.slice(0, 7))
  )].sort().reverse();

  // Determine the effective selected month
  const currentMonth = new Date().toISOString().slice(0, 7);
  if (!AppState.selectedMonth || !months.includes(AppState.selectedMonth)) {
    // Default to current month if it has transactions, otherwise the newest
    // month that does, or current month as a fallback for the empty state
    AppState.selectedMonth = months.includes(currentMonth)
      ? currentMonth
      : (months[0] || currentMonth);
  }

  // ── 2. Populate the <select> ───────────────────────────────────────────────
  select.innerHTML = '';
  if (months.length === 0) {
    // No transactions at all — add a placeholder option for the current month
    const opt = document.createElement('option');
    opt.value = currentMonth;
    opt.textContent = formatMonthLabel(currentMonth);
    select.appendChild(opt);
  } else {
    months.forEach(m => {
      const opt = document.createElement('option');
      opt.value = m;
      opt.textContent = formatMonthLabel(m);
      if (m === AppState.selectedMonth) opt.selected = true;
      select.appendChild(opt);
    });
  }

  // ── 3. Get stats for the selected month ───────────────────────────────────
  const selectedMonthTxs = AppState.transactions.filter(
    tx => tx.date.startsWith(AppState.selectedMonth)
  );

  if (selectedMonthTxs.length === 0) {
    content.innerHTML = `<p class="empty-state-text">No data available for this month.</p>`;
    return;
  }

  const stats = getMonthlyStats(AppState.transactions, AppState.selectedMonth);

  // ── 4a. Build category breakdown ─────────────────────────────────────────
  const totalsMap = {};
  for (const tx of selectedMonthTxs) {
    totalsMap[tx.category] = (totalsMap[tx.category] || 0) + tx.amount;
  }

  // Sort categories by total descending
  const sortedCategories = Object.entries(totalsMap)
    .sort((a, b) => b[1] - a[1]);

  const maxCategoryTotal = sortedCategories.length > 0 ? sortedCategories[0][1] : 1;
  const monthTotal = stats.total || 1; // guard against division by zero

  const breakdownRows = sortedCategories.map(([cat, total]) => {
    const pct = (total / monthTotal * 100).toFixed(1);
    const barWidth = (total / maxCategoryTotal * 100).toFixed(2);
    const color = getCategoryColor(cat);
    return `
      <div class="summary-breakdown-row">
        <div class="summary-breakdown-name">${cat}</div>
        <div class="summary-breakdown-amount">${formatRupiah(total)}</div>
        <div class="summary-breakdown-pct">${pct}%</div>
        <div class="summary-breakdown-bar-track" role="presentation">
          <div
            class="summary-breakdown-bar-fill"
            style="width:${barWidth}%;background-color:${color};"
          ></div>
        </div>
      </div>`;
  }).join('');

  // ── 4b. Render stats + breakdown ─────────────────────────────────────────
  content.innerHTML = `
    <div class="monthly-stats">
      <div class="monthly-stat-item">
        <span class="monthly-stat-label">Total Spending</span>
        <span class="monthly-stat-value">${formatRupiah(stats.total)}</span>
      </div>
      <div class="monthly-stat-item">
        <span class="monthly-stat-label">Transactions</span>
        <span class="monthly-stat-value">${stats.count}</span>
      </div>
      <div class="monthly-stat-item">
        <span class="monthly-stat-label">Largest Category</span>
        <span class="monthly-stat-value">${stats.largestCategory || '—'}</span>
      </div>
      <div class="monthly-stat-item">
        <span class="monthly-stat-label">Daily Average</span>
        <span class="monthly-stat-value">${formatRupiah(stats.dailyAverage)}</span>
      </div>
    </div>
    <div class="summary-breakdown" aria-label="Category breakdown">
      <div class="summary-breakdown-header">
        <span>Category</span>
        <span>Total</span>
        <span>Share</span>
        <span></span>
      </div>
      ${breakdownRows}
    </div>
  `;
}

/**
 * Formats a "YYYY-MM" string as a human-readable month label, e.g. "July 2026".
 *
 * @param {string} month - Month string in "YYYY-MM" format.
 * @returns {string} Formatted label.
 */
function formatMonthLabel(month) {
  // Append "-01" to get a valid date; use UTC to avoid timezone day-shift
  const d = new Date(month + '-02'); // day 2 avoids off-by-one in UTC-behind zones
  return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

// ─── RENDER: CATEGORY MANAGER MODAL ──────────────────────────────────────────

/**
 * Populates `<dialog id="category-modal">` with the full category management UI.
 *
 * Behavior:
 * - Lists all AppState.categories with a colored badge per category.
 * - Shows a delete button (class `btn-delete-cat`, data-category="{name}") only
 *   for non-default categories that have zero associated transactions.
 * - Provides an add-category form: input `#new-category-input` (maxlength 50),
 *   a submit button, and an error span `#category-modal-error class="field-error"`.
 * - When AppState.categories.length >= 50: disables the add input and shows
 *   the limit message "Category limit reached (50). Delete a category to add more."
 *
 * Satisfies Requirements 6.2, 6.3, 6.4, 6.6, 6.7, 6.10
 */
function renderCategoryModal() {
  const modal = document.getElementById('category-modal');
  if (!modal) return;

  const atLimit = AppState.categories.length >= CONSTANTS.MAX_CATEGORIES;

  // Build the category list rows
  const categoryRows = AppState.categories.map(catName => {
    const color = getCategoryColor(catName);
    const isDefault = DEFAULT_CATEGORIES.includes(catName);
    const hasTransactions = AppState.transactions.some(tx => tx.category === catName);
    const canDelete = !isDefault && !hasTransactions;

    const deleteBtn = canDelete
      ? `<button
           type="button"
           class="btn btn-danger btn-sm btn-delete-cat"
           data-category="${catName}"
           aria-label="Delete category ${catName}"
         >
           <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
             <path d="M2 3.5h10M5.5 3.5V2.5a.5.5 0 0 1 .5-.5h2a.5.5 0 0 1 .5.5v1M6 6.5v3M8 6.5v3M3 3.5l.7 7a.5.5 0 0 0 .5.5h5.6a.5.5 0 0 0 .5-.5l.7-7"
               stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/>
           </svg>
           Delete
         </button>`
      : '';

    return `
      <li class="category-list-item">
        <span class="category-badge" style="background-color:${color};" aria-hidden="true"></span>
        <span class="category-name">${catName}</span>
        ${isDefault ? '<span class="category-tag-default">Default</span>' : ''}
        ${deleteBtn}
      </li>`;
  }).join('');

  // Limit state: disable input and show message when at 50 categories
  const limitMessage = atLimit
    ? `<p class="field-error category-limit-msg" role="alert">
         Category limit reached (50). Delete a category to add more.
       </p>`
    : '';

  modal.innerHTML = `
    <div class="modal-content">
      <div class="modal-header">
        <h2 class="modal-title">Manage Categories</h2>
        <button
          id="modal-close-btn"
          type="button"
          class="btn btn-secondary btn-icon"
          aria-label="Close category manager"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d="M3 3l10 10M13 3L3 13"
              stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
          </svg>
        </button>
      </div>

      <ul class="category-list" aria-label="Category list">
        ${categoryRows}
      </ul>

      <form id="add-category-form" class="add-category-form" novalidate>
        <div class="form-group">
          <label for="new-category-input" class="form-label">Add New Category</label>
          <div class="add-category-row">
            <input
              id="new-category-input"
              type="text"
              class="form-input"
              placeholder="Category name"
              maxlength="50"
              autocomplete="off"
              ${atLimit ? 'disabled' : ''}
              aria-describedby="category-modal-error"
            />
            <button
              type="submit"
              class="btn btn-primary"
              ${atLimit ? 'disabled' : ''}
            >Add</button>
          </div>
          ${limitMessage}
          <span id="category-modal-error" class="field-error" role="alert" aria-live="polite"></span>
        </div>
      </form>
    </div>
  `;
}

/**
 * Rebuilds the Category <select> in the expense form to reflect the current
 * AppState.categories list.
 *
 * - Preserves the selected value if the category still exists after the update.
 * - Adds a disabled placeholder option as the first item.
 *
 * Called after addCategory() or deleteCategory() mutates AppState.categories.
 *
 * Satisfies Requirements 5.2, 6.5, 6.8.
 */
function updateExpenseFormCategorySelect() {
  const select = document.getElementById('category');
  if (!select) return;
  const currentValue = select.value;
  select.innerHTML = '';
  // Add a placeholder option
  const placeholder = document.createElement('option');
  placeholder.value = '';
  placeholder.textContent = 'Select a category';
  placeholder.disabled = true;
  select.appendChild(placeholder);
  // Add one option per category
  AppState.categories.forEach(cat => {
    const opt = document.createElement('option');
    opt.value = cat;
    opt.textContent = cat;
    select.appendChild(opt);
  });
  // Restore previously selected value if still available
  if (currentValue && AppState.categories.includes(currentValue)) {
    select.value = currentValue;
  }
}

// ─── EVENT HANDLERS ───────────────────────────────────────────────────────────

// ─── INIT ─────────────────────────────────────────────────────────────────────
