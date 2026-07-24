# Design Document

## Ledgerly Expense & Budget Visualizer

---

## Overview

Ledgerly is a pure client-side single-page application (SPA) for personal and small-team expense tracking in Indonesian Rupiah. The entire application lives in three files: `index.html`, `css/style.css`, and `js/app.js`. There is no build step, no backend, and no npm—Chart.js 4.x is loaded from a CDN `<script>` tag.

**Core design principle:** `app.js` maintains a single in-memory state object (`AppState`) that is the authoritative source of truth for all rendered UI. Every user action (add expense, delete, change budget, toggle theme, etc.) follows a strict cycle:

```
User Event → Mutate AppState → Persist to LocalStorage → Re-render affected UI regions
```

This one-way data flow keeps the code predictable and eliminates synchronisation bugs between the DOM and storage.

**Key design decisions:**

- **No virtual DOM, no reactivity framework.** UI re-renders are triggered explicitly by calling focused `render*()` functions. Each render function reads from `AppState` and writes to a designated DOM container.
- **Chart.js destroy/recreate strategy** is used on data changes rather than mutating existing chart datasets, avoiding Chart.js internal state issues on category additions/removals.
- **Deterministic color assignment** for categories uses a stable hash of the category name so colors remain consistent across re-renders and sessions.
- **CSS custom properties** power the theme system—a single `data-theme` attribute on `<html>` switches the entire color palette without JavaScript touching individual elements.

---

## Architecture

### File Interaction Overview

```
index.html
├── Loads css/style.css (layout, components, theme variables)
├── Loads Chart.js 4.x via CDN <script> (deferred, before app.js)
└── Loads js/app.js (deferred, entry point)

js/app.js
├── AppState (in-memory singleton)
├── Storage layer (read/write LocalStorage)
├── Computation layer (pure functions: sums, ratios, filters, sorts)
├── Render layer (render* functions, DOM mutation)
└── Event layer (event listeners, delegates, handlers)
```

### app.js Module Structure

`app.js` is organized into clearly delimited sections using comment banners:

```
// ─── CONSTANTS & CONFIG ───────────────────────────────────────────────────────
// ─── STATE ────────────────────────────────────────────────────────────────────
// ─── LOCAL STORAGE ────────────────────────────────────────────────────────────
// ─── COMPUTATION / PURE FUNCTIONS ─────────────────────────────────────────────
// ─── FORMATTING UTILITIES ─────────────────────────────────────────────────────
// ─── RENDER: HEADER ───────────────────────────────────────────────────────────
// ─── RENDER: DASHBOARD CARDS ──────────────────────────────────────────────────
// ─── RENDER: BUDGET PROGRESS BAR ──────────────────────────────────────────────
// ─── RENDER: INSIGHTS ─────────────────────────────────────────────────────────
// ─── RENDER: CHART ────────────────────────────────────────────────────────────
// ─── RENDER: TRANSACTION LIST ─────────────────────────────────────────────────
// ─── RENDER: MONTHLY SUMMARY ──────────────────────────────────────────────────
// ─── RENDER: CATEGORY MANAGER MODAL ──────────────────────────────────────────
// ─── EVENT HANDLERS ───────────────────────────────────────────────────────────
// ─── INIT ─────────────────────────────────────────────────────────────────────
```

### Initialization Sequence

```
DOMContentLoaded
  1. loadFromStorage()         — populate AppState from LocalStorage
  2. applyTheme()              — set data-theme on <html>, no flicker
  3. renderAll()               — render every UI region in order
  4. attachEventListeners()    — wire all event handlers
```

`renderAll()` calls each `render*()` function once; subsequent updates call only the affected subset.

---

## Components and Interfaces

### UI Sections (in DOM order)

| Section | DOM id / class | Owning render function |
|---|---|---|
| Header | `#app-header` | `renderHeader()` |
| Dashboard Cards | `#dashboard-cards` | `renderDashboardCards()` |
| Budget Progress Bar | `#budget-progress` | `renderBudgetProgress()` |
| Insights | `#insights` | `renderInsights()` |
| Expense Form | `#expense-form` | `renderExpenseForm()` (static HTML, only error states re-render) |
| Category Manager Modal | `#category-modal` | `renderCategoryModal()` |
| Spending Chart | `#chart-section` | `renderChart()` |
| Transaction List | `#transaction-list` | `renderTransactionList()` |
| Monthly Summary | `#monthly-summary` | `renderMonthlySummary()` |
| Data Tools | `#data-tools` | Static HTML, no render function needed |
| Toast Container | `#toast-container` | `showToast(message, type)` |

### Component Interfaces (JavaScript function signatures)

```js
// ── Formatting ──────────────────────────────────────────────────────────────
formatRupiah(amount: number): string
  // Returns "Rp" + period-separated thousands, e.g. formatRupiah(1250000) → "Rp1.250.000"
  // amount is treated as a whole-number integer (Math.round applied internally)

// ── Color ───────────────────────────────────────────────────────────────────
getCategoryColor(categoryName: string): string
  // Returns a hex color string deterministically from the category name
  // Uses a simple djb2-style hash over a fixed 12-color palette

// ── Computation ─────────────────────────────────────────────────────────────
getTotalExpenses(transactions: Transaction[], month: string): number
  // month format: "YYYY-MM"
getRemainingBalance(budget: number, totalExpenses: number): number
getBudgetRatio(totalExpenses: number, budget: number): number
  // Returns 0 if budget === 0, otherwise totalExpenses / budget (unbounded)
getProgressBarColor(ratio: number): string
  // Returns "#34C759" | "#FF9F0A" | "#FF453A"
getLargestCategory(transactions: Transaction[], month: string): string | null
  // Returns category name or null if no transactions
getMonthlyStats(transactions: Transaction[], month: string): MonthlyStats

// ── Render ───────────────────────────────────────────────────────────────────
renderHeader(): void
renderDashboardCards(): void
renderBudgetProgress(): void
renderInsights(): void
renderChart(): void
renderTransactionList(): void
renderMonthlySummary(): void
renderCategoryModal(): void
renderAll(): void

// ── State Mutations ──────────────────────────────────────────────────────────
addTransaction(tx: TransactionInput): void
  // Validates, saves, updates AppState, re-renders affected regions, shows toast
deleteTransaction(id: string): void
  // Shows confirm dialog, then removes, updates AppState, re-renders, shows toast
setBudget(amount: number): void
addCategory(name: string): boolean
  // Returns false if duplicate or limit reached
deleteCategory(name: string): boolean
  // Returns false if name is a default category or has associated transactions
setTheme(theme: 'light' | 'dark'): void
clearAllData(): void
exportCSV(): void

// ── Toast ────────────────────────────────────────────────────────────────────
showToast(message: string, type: 'success' | 'error'): void
  // Appends toast element; auto-dismisses after 4 seconds
```

---

## Data Models

### LocalStorage Keys

| Key | Value type | Description |
|---|---|---|
| `ledgerly_transactions` | JSON array of `Transaction` | All expense records |
| `ledgerly_budget` | JSON number | Monthly budget in Rupiah (single global value) |
| `ledgerly_categories` | JSON array of strings | All category names including defaults |
| `ledgerly_theme` | JSON string `"light"` or `"dark"` | Theme preference |

### Transaction Object

```json
{
  "id": "tx_1721234567890_a1b2c3",
  "name": "Lunch at warung",
  "amount": 35000,
  "category": "Food",
  "date": "2026-07-15"
}
```

| Field | Type | Constraints |
|---|---|---|
| `id` | string | Generated as `"tx_" + Date.now() + "_" + Math.random().toString(36).slice(2, 8)` — unique, stable |
| `name` | string | 1–100 characters, trimmed |
| `amount` | number | 0.01 to 999,999,999.99, stored as float |
| `category` | string | Must match an entry in `ledgerly_categories` |
| `date` | string | ISO 8601 `YYYY-MM-DD` |

### AppState (in-memory singleton)

```js
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
```

### Default Categories

```js
const DEFAULT_CATEGORIES = ['Food', 'Transport', 'Fun'];
```

These are always present in `AppState.categories` and cannot be deleted. On first load, if `ledgerly_categories` is absent from LocalStorage, `DEFAULT_CATEGORIES` is used to initialize.

### LocalStorage Read/Write Pattern

```js
// Read (with error handling per Requirement 12.6 and 12.7)
function loadFromStorage() {
  try {
    const raw = localStorage.getItem('ledgerly_transactions');
    AppState.transactions = raw ? JSON.parse(raw) : [];
  } catch (e) {
    AppState.transactions = [];
    showStorageWarning('transactions');
  }
  // ... repeated for each key
}

// Write (with error handling per Requirement 5.10)
function saveTransactions() {
  try {
    localStorage.setItem('ledgerly_transactions', JSON.stringify(AppState.transactions));
  } catch (e) {
    showToast('Could not save expense. Storage may be full.', 'error');
    throw e; // caller skips form reset
  }
}
```

---

## State Management

### Single Source of Truth

`AppState` is the only object that render functions read from. The DOM is always a derived view of `AppState`. No render function reads from LocalStorage directly.

### Update Propagation

Each mutation function follows this fixed pattern:

```
mutateAppState()  →  persistToLocalStorage()  →  renderAffectedRegions()
```

**Affected regions per action:**

| Action | Re-rendered regions |
|---|---|
| Add transaction | Dashboard Cards, Progress Bar, Insights, Chart, Transaction List, Monthly Summary |
| Delete transaction | Dashboard Cards, Progress Bar, Insights, Chart, Transaction List, Monthly Summary |
| Set budget | Dashboard Cards, Progress Bar, Insights |
| Add/delete category | Category Modal, Expense Form (category `<select>`) |
| Change theme | `data-theme` on `<html>` only (CSS handles the rest) |
| Change TX filter/search/sort | Transaction List only |
| Change month selector | Monthly Summary only |
| Clear all data | All regions |

### Filter State

`AppState.txFilter` stores the current search string, selected category, and sort order. `renderTransactionList()` reads `AppState.transactions` and applies filter/sort in-memory each time it is called. No filtered subset is stored in `AppState`.

### Monthly Context

The Dashboard (cards, progress, insights, chart, transaction list) always shows the **current calendar month** (`YYYY-MM` derived from `new Date()` at page load). The Monthly Summary section uses `AppState.selectedMonth`, which the user can change via the Month Selector.

---

## Chart.js Integration

### Initialization

Chart.js 4.x is loaded from CDN before `app.js`:

```html
<script src="https://cdn.jsdelivr.net/npm/chart.js@4/dist/chart.umd.min.js"></script>
<script src="js/app.js" defer></script>
```

`renderChart()` creates the chart the first time it is called if `AppState.chartInstance` is `null`.

### Destroy/Recreate Strategy

On every call to `renderChart()` (triggered by add/delete transaction or category change):

```js
function renderChart() {
  const currentMonthTxs = getTransactionsForMonth(AppState.transactions, currentMonth);

  if (currentMonthTxs.length === 0) {
    // Hide canvas, show empty-state message
    if (AppState.chartInstance) {
      AppState.chartInstance.destroy();
      AppState.chartInstance = null;
    }
    return;
  }

  // Aggregate spending by category
  const categoryTotals = aggregateByCategory(currentMonthTxs);

  // Destroy old instance before creating new one
  if (AppState.chartInstance) {
    AppState.chartInstance.destroy();
  }

  const ctx = document.getElementById('spending-chart').getContext('2d');
  AppState.chartInstance = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: categoryTotals.map(c => c.category),
      datasets: [{
        data: categoryTotals.map(c => c.total),
        backgroundColor: categoryTotals.map(c => getCategoryColor(c.category)),
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: { position: 'bottom' },
        tooltip: {
          callbacks: {
            label: ctx => `${ctx.label}: ${formatRupiah(ctx.raw)} (${ctx.parsed.toFixed(1)}%)`
          }
        }
      }
    }
  });
}
```

**Rationale for destroy/recreate:** When categories are added or removed, the dataset length changes. Mutating `chart.data.labels` and `chart.data.datasets[0].data` in place while keeping the Chart.js instance alive can leave orphan animations and ghost tooltip entries. Destroying and recreating on every data change is safe and imperceptible to the user at the data volumes Ledgerly targets.

### Responsive Config

- `responsive: true` and `maintainAspectRatio: true` let Chart.js resize within its container.
- The container `#chart-canvas-wrapper` is styled with `min-height: 200px; max-height: 500px` in CSS.
- A `ResizeObserver` on the chart container calls `AppState.chartInstance.resize()` within 500ms of a viewport resize to satisfy Requirement 7.6.

---

## Event Flow

### Form Submission (Add Expense)

```
User submits #expense-form
  → handler calls validateForm()
      → IF invalid: renderFieldErrors(), return
      → IF valid:
          addTransaction({ name, amount, category, date })
            → generate id
            → push to AppState.transactions
            → saveTransactions()          (may throw → show error toast, return)
            → resetForm()
            → renderDashboardCards()
            → renderBudgetProgress()
            → renderInsights()
            → renderChart()
            → renderTransactionList()
            → renderMonthlySummary()
            → showToast('Expense added!', 'success')
```

### Delete Transaction

```
User clicks delete button [data-id="tx_..."]
  → handler shows native confirm() dialog
      → IF cancelled: no-op
      → IF confirmed:
          deleteTransaction(id)
            → filter from AppState.transactions
            → saveTransactions()
            → renderDashboardCards()
            → renderBudgetProgress()
            → renderInsights()
            → renderChart()
            → renderTransactionList()
            → renderMonthlySummary()
            → showToast('Transaction deleted.', 'success')
```

### Category Manager

```
User clicks "Manage Categories"
  → openCategoryModal()
      → renderCategoryModal()   (populates modal list)
      → modal.showModal()       (or add .visible class)

User submits new category in modal
  → addCategory(name)
      → validate (non-empty, non-duplicate, count < 50)
      → IF invalid: show inline error in modal
      → IF valid:
          push to AppState.categories
          saveCategories()
          renderCategoryModal()
          updateExpenseFormCategorySelect()

User clicks delete button on category in modal
  → deleteCategory(name)
      → guard: not a default, no transactions reference it
      → filter from AppState.categories
      → saveCategories()
      → renderCategoryModal()
      → updateExpenseFormCategorySelect()
      → showToast('Category deleted.', 'success')

User closes modal
  → modal.close() / remove .visible
  → restoreFocus('#manage-categories-btn')
```

### Theme Toggle

```
User clicks theme toggle button
  → current theme = AppState.theme
  → newTheme = current === 'light' ? 'dark' : 'light'
  → setTheme(newTheme)
      → AppState.theme = newTheme
      → document.documentElement.setAttribute('data-theme', newTheme)
      → saveTheme()
      → update button label text
```

### CSV Export

```
User clicks "Export CSV"
  → IF AppState.transactions.length === 0: showToast('No transactions to export.', 'error'), return
  → sort all transactions by date ascending
  → build CSV string: header row + data rows
  → create Blob with type 'text/csv;charset=utf-8;'
  → create temporary <a> element with object URL, trigger .click()
  → revoke object URL
```

---

## Rupiah Formatting Function

```js
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
```

**Design note:** `Intl.NumberFormat` with `{ style: 'currency', currency: 'IDR' }` produces `Rp50.000` in some browsers but `IDR 50.000` or `Rp 50,000` in others depending on locale settings. A hand-rolled formatter is used to guarantee the exact `Rp50.000` format across all browsers and locales as required by Requirement 2.5.

---

## Category Color Palette

### Deterministic Color Assignment

Each category name is mapped to a color from a fixed 12-color palette using a djb2-style hash. This guarantees:
- The same category always gets the same color regardless of render order (Requirement 7.3).
- No two adjacent categories in a small list will collide (palette is large enough for default + 9 custom categories before cycling).

```js
const CATEGORY_PALETTE = [
  '#0A84FF', '#34C759', '#FF9F0A', '#FF453A', '#BF5AF2',
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
  '#DDA0DD', '#F0E68C',
];

function getCategoryColor(categoryName) {
  let hash = 5381;
  for (let i = 0; i < categoryName.length; i++) {
    hash = ((hash << 5) + hash) + categoryName.charCodeAt(i);
    hash |= 0; // Convert to 32-bit integer
  }
  const index = Math.abs(hash) % CATEGORY_PALETTE.length;
  return CATEGORY_PALETTE[index];
}
```

Default color assignments (by hash):
- Food → deterministic slot from palette
- Transport → deterministic slot from palette
- Fun → deterministic slot from palette

Custom categories receive whatever slot their name hashes to. Two different category names may theoretically land on the same color (hash collision), but this is acceptable given the 12-color palette and typical usage (3–15 categories).

---

## Responsive Layout Strategy

### CSS Grid / Flexbox Breakpoints

The layout uses a mobile-first approach with two breakpoints:

| Breakpoint | Width | Layout |
|---|---|---|
| Mobile | < 640px | Single column, full-width sections |
| Tablet | 640px – 1023px | Two-column dashboard cards grid |
| Desktop | ≥ 1024px | Three or four-column dashboard cards grid, side-by-side chart+form |

**Dashboard Cards:** CSS Grid with `repeat(auto-fit, minmax(200px, 1fr))` — automatically fills available columns.

**Main Content:** A CSS Grid with two columns on ≥ 1024px (form left, chart right), collapsing to single column below.

```css
/* Dashboard cards: auto-fit responsive grid */
.dashboard-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
}

/* Main two-pane layout */
.main-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.5rem;
}

@media (min-width: 1024px) {
  .main-grid {
    grid-template-columns: 1fr 1fr;
  }
}
```

**Transaction List and Monthly Summary:** Full-width single-column stacked below the main grid on all breakpoints.

**Minimum viewport:** 360px — all elements have `max-width: 100%; box-sizing: border-box` to prevent overflow.

---

## Dark/Light Theme Implementation

### CSS Custom Properties Approach

All colors are defined as CSS custom properties on `:root` (light mode default) and overridden via `[data-theme="dark"]` on the `<html>` element:

```css
:root {
  --color-bg: #F5F9FF;
  --color-card-bg: #FFFFFF;
  --color-primary-text: #1D1D1F;
  --color-secondary-text: #6E6E73;
  --color-primary: #0A84FF;
  --color-deep-blue: #0066CC;
  --color-soft-blue: #EAF4FF;
  --color-border: #D9E7F5;
  --color-success: #34C759;
  --color-warning: #FF9F0A;
  --color-danger: #FF453A;
  --transition-theme: 100ms ease;
}

[data-theme="dark"] {
  --color-bg: #0B1220;
  --color-card-bg: #111C2E;
  --color-primary-text: #F5F7FA;
  --color-secondary-text: #AAB7C7;
  --color-primary: #0A84FF;
  --color-border: #22334D;
}

/* All components use vars only — never hard-coded hex values */
body { background-color: var(--color-bg); color: var(--color-primary-text); }
.card { background: var(--color-card-bg); border: 1px solid var(--color-border); }
```

**Theme switch transition:** `transition: background-color var(--transition-theme), color var(--transition-theme)` applied to `body` and cards ensures the ≤100ms switch required by Requirements 1.5 and 1.6.

**No-flicker on load:** Theme is applied in a synchronous script at the top of `<head>` (before CSS paint):

```html
<head>
  <script>
    // Inline script — runs before CSS parse to prevent flash of wrong theme
    (function() {
      const saved = localStorage.getItem('ledgerly_theme');
      if (saved === 'dark') document.documentElement.setAttribute('data-theme', 'dark');
    })();
  </script>
  <link rel="stylesheet" href="css/style.css">
</head>
```

This satisfies Requirement 1.8 (apply before visible content).

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

---

### Property 1: Rupiah Formatting Invariants

*For any* non-negative integer `n`, `formatRupiah(n)` must:
(a) begin with the prefix `"Rp"`,
(b) contain no comma characters,
(c) have every group of digits (reading right to left) separated by a period after the first three digits,
(d) produce the same digit sequence as `n.toString()` when all period separators are removed from the suffix.

For any negative integer `n`, `formatRupiah(n)` must additionally contain a `-` sign immediately after `"Rp"`.

**Validates: Requirements 2.5, 9.4**

---

### Property 2: Remaining Balance Calculation

*For any* budget value `B ≥ 0` and any array of transactions `T` belonging to a given month, `getRemainingBalance(B, getTotalExpenses(T, month))` must equal exactly `B − sum(T[i].amount)`.

**Validates: Requirements 2.1, 2.9**

---

### Property 3: Total Expenses and Transaction Count Aggregation

*For any* array of transactions `T` with dates in month `M`, `getTotalExpenses(T, M)` must equal the arithmetic sum of all `T[i].amount` values, and the count of transactions for month `M` must equal the number of elements in `T` whose date falls in `M`.

**Validates: Requirements 2.3, 2.4**

---

### Property 4: Budget Progress Ratio — Capping and Color Thresholds

*For any* `totalExpenses ≥ 0` and `budget ≥ 0`:
- If `budget === 0`, `getBudgetRatio(totalExpenses, budget)` must return `0` (no division by zero).
- If `budget > 0`, `getBudgetRatio` must return `totalExpenses / budget` (unbounded, may exceed 1).
- The progress bar fill percentage displayed to the user must be `Math.min(100, ratio × 100)`, always in `[0, 100]`.
- `getProgressBarColor(ratio)` must return `"#34C759"` when `ratio < 0.6`, `"#FF9F0A"` when `0.6 ≤ ratio < 0.9`, and `"#FF453A"` when `ratio ≥ 0.9`.

**Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.6, 3.7**

---

### Property 5: Largest Spending Category with Tie-Breaking

*For any* non-empty array of transactions `T` in a given month, `getLargestCategory(T, month)` must return the category name whose transactions sum to the greatest total. When two or more categories are tied for the highest total, the function must return the category name that sorts first alphabetically (case-sensitive ascending lexicographic order).

**Validates: Requirements 4.2, 4.6**

---

### Property 6: Category Color Determinism

*For any* category name string `s`, repeated calls to `getCategoryColor(s)` must return the identical hex color string. The returned value must be a member of the fixed `CATEGORY_PALETTE` array and must not vary between page loads or re-renders.

**Validates: Requirements 7.3**

---

### Property 7: Duplicate Category Rejection

*For any* existing category list `C` (case-insensitively normalized), attempting to add any string `s` such that `s.trim().toLowerCase()` equals the normalized form of any element already in `C` must cause `addCategory` to return `false` and leave `AppState.categories` unchanged.

**Validates: Requirements 6.6**

---

### Property 8: Transaction Search Filter Completeness

*For any* non-empty search string `q` and transaction list `T`, every transaction returned by the filter must have its `name` field contain `q` (case-insensitive substring match), and every transaction in `T` whose name contains `q` (case-insensitive) must appear in the results. When `q` is empty, all transactions in `T` must be returned.

**Validates: Requirements 8.7**

---

### Property 9: Monthly Daily Average Calculation

*For any* selected month `M` (formatted `YYYY-MM`) and array of transactions `T` whose dates fall within `M`, the daily average spending reported by `getMonthlyStats` must equal `getTotalExpenses(T, M) / daysInMonth(M)` rounded to the nearest whole Rupiah, where `daysInMonth(M)` is the correct number of calendar days in that month (accounting for leap years in February).

**Validates: Requirements 9.2**

---

### Property 10: CSV Export Data Round-Trip

*For any* non-empty array of transactions `T` (across any months), generating a CSV via `exportCSV(T)` and then parsing the resulting CSV string must recover a row for every transaction in `T` — with the same `date` (YYYY-MM-DD), `name`, `category`, and `amount` (numeric) values — sorted by date ascending, with no additional rows inserted.

**Validates: Requirements 10.2, 10.3**

---

## Error Handling

### LocalStorage Unavailability (Requirement 12.6)

If `localStorage` is unavailable (e.g., private browsing with storage blocked, quota exceeded), a persistent warning banner is shown at the top of the page:

```
⚠ Data cannot be saved in this browser session. Please enable cookies or use a different browser.
```

All application functions (UI rendering, in-session data entry) continue to work with `AppState`; data simply will not persist.

### Malformed JSON (Requirement 12.7)

Each `loadFromStorage()` key is wrapped in its own try/catch. If JSON.parse throws:
- That data store is reset to its empty default (empty array, 0 for budget, `'light'` for theme).
- A non-blocking inline warning is shown under the relevant section header explaining that saved data was corrupt and has been reset.

### Storage Quota Exceeded (Requirement 5.10)

If `localStorage.setItem()` throws (quota exceeded):
- The form is not reset.
- A toast with type `'error'` is shown: `"Could not save expense. Browser storage may be full."`
- `AppState` is not mutated (the transaction is not added in memory either, keeping memory and storage in sync).

### Validation Errors (Requirement 5.4, 5.5)

Inline error messages appear below each invalid field. Error messages are cleared on the next `input` event for that field, not on form submit. This gives immediate feedback when the user corrects a field.

### Division by Zero (Requirement 3.6)

`getBudgetRatio(totalExpenses, budget)` returns `0` when `budget === 0`. No NaN or Infinity values reach the UI layer.

---

## Testing Strategy

### Overview

Ledgerly has significant pure-function logic that is well-suited to property-based testing, and a UI layer that requires example-based and integration tests. The dual approach covers both.

### Property-Based Testing

**Library:** [fast-check](https://github.com/dubzzz/fast-check) — the standard PBT library for JavaScript/TypeScript, runs in Node.js with no framework dependency.

**Configuration:** Each property test runs a minimum of **100 iterations** (fast-check default is 100; set `{ numRuns: 100 }` explicitly).

**Tag format:** Each test must include a comment referencing the design property:

```js
// Feature: ledgerly-expense-budget-visualizer, Property 1: Rupiah Formatting Invariants
```

**Property tests to implement:**

| Test | Design Property | Function under test |
|---|---|---|
| Rupiah formatting invariants | Property 1 | `formatRupiah` |
| Remaining balance calculation | Property 2 | `getRemainingBalance`, `getTotalExpenses` |
| Total expenses & count aggregation | Property 3 | `getTotalExpenses` |
| Budget progress ratio & color | Property 4 | `getBudgetRatio`, `getProgressBarColor` |
| Largest category + tie-breaking | Property 5 | `getLargestCategory` |
| Category color determinism | Property 6 | `getCategoryColor` |
| Duplicate category rejection | Property 7 | `addCategory` validation logic |
| Search filter completeness | Property 8 | transaction filter function |
| Monthly daily average | Property 9 | `getMonthlyStats` |
| CSV data round-trip | Property 10 | `exportCSV` + CSV parser |

### Unit / Example-Based Tests

Focused on:
- Header rendering (logo, subtitle, month/year display)
- Theme toggle: DOM attribute change, LocalStorage write, button label update
- Dashboard card renders `Rp0` when no data
- Form validation: empty fields, amount out of range, duplicate categories
- Delete confirmation dialog: cancel = no-op, confirm = deletion
- LocalStorage malformed JSON: reset + warning shown
- Zero-expense empty states: chart hidden, "No expenses recorded yet." messages
- Toast auto-dismiss timing (≥ 3s visible, ≤ 5s auto-dismiss)
- Category Manager: add/delete flow, max-50 enforcement, focus restore on close

### Integration / Smoke Tests

- Full add-expense flow: form → AppState → LocalStorage → all UI regions updated
- Page reload with existing LocalStorage data: all regions hydrated correctly
- Export CSV with no data: shows error toast instead of download
- Clear All Data: confirm flow removes all LocalStorage keys, UI resets

### Test File Location

```
tests/
  unit/
    format.test.js       (Property 1 — formatRupiah)
    computation.test.js  (Properties 2–5, 9)
    color.test.js        (Property 6)
    categories.test.js   (Property 7)
    filter.test.js       (Property 8)
    csv.test.js          (Property 10)
  integration/
    app.test.js          (add/delete/clear flows)
```

Run with: `node --experimental-vm-modules node_modules/.bin/jest` (or vitest with `--run` flag for single-pass CI).
