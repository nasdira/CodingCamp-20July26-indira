# Implementation Plan: Ledgerly Expense & Budget Visualizer

## Overview

Implement a pure client-side SPA in three files (`index.html`, `css/style.css`, `js/app.js`).
The build order follows the dependency chain: scaffolding → HTML skeleton → CSS design system →
`app.js` constants/state → storage layer → utilities → computation → render functions →
event handlers → toast/init → property-based tests.

---

## Tasks

- [x] 1. Project scaffolding — create the three source files
  - [x] 1.1 Create `index.html` with a valid HTML5 doctype, `<html lang="en">`, `<head>` (charset, viewport, title "Ledgerly"), and an empty `<body>`
    - Add the inline no-flicker theme script in `<head>` (reads `ledgerly_theme` from LocalStorage; sets `data-theme="dark"` on `<html>` synchronously before CSS parse)
    - Add `<link rel="stylesheet" href="css/style.css">` in `<head>`
    - Add Chart.js 4.x CDN `<script>` tag **before** `<script src="js/app.js" defer></script>`
    - _Requirements: 1.8, 14.1, 14.2, 14.5_
  - [x] 1.2 Create `css/style.css` as an empty file with a top comment banner
    - _Requirements: 14.5_
  - [x] 1.3 Create `js/app.js` as an empty file with the section comment banners listed in the design
    - _Requirements: 14.5_

- [x] 2. HTML skeleton — all semantic sections with correct IDs
  - [x] 2.1 Add `<header id="app-header">` containing: logo + "Ledgerly" h1, subtitle paragraph "Make every rupiah count.", month/year span, and theme toggle `<button>`
    - _Requirements: 1.1, 1.2, 1.3, 1.4_
  - [~] 2.2 Add `<main>` with child sections: `#dashboard-cards`, `#budget-progress`, `#insights`, `#expense-form` (with `#category-modal` dialog), `#chart-section` (with `<canvas id="spending-chart">`), `#transaction-list`, `#monthly-summary`, `#data-tools`
    - Each section needs its correct `id` attribute and semantic element (`<section>`, `<form>`, `<dialog>`)
    - Include all sub-elements: four card `<div>` placeholders in `#dashboard-cards`, progress bar `<div>` in `#budget-progress`, search/filter/sort controls in `#transaction-list`, month selector in `#monthly-summary`, "Export CSV" and "Clear All Data" buttons in `#data-tools`
    - Add `<div id="toast-container">` at the bottom of `<body>`
    - _Requirements: 2.1–2.4, 3.1, 3.7, 4.1–4.3, 5.1, 6.1, 7.1, 7.5, 8.1–8.9, 9.1, 10.1, 11.1, 13.7_

- [ ] 3. CSS design system — custom properties, typography, layout, components
  - [~] 3.1 Define CSS custom properties on `:root` for the light-mode palette (all 11 colors from Requirement 13.1) and override them under `[data-theme="dark"]` for the dark-mode palette (Requirement 13.2)
    - Add `--transition-theme: 100ms ease` and component transition vars (`--transition-ui: 200ms ease`)
    - _Requirements: 1.5, 1.6, 13.1, 13.2_
  - [x] 3.2 Write global resets (`*, *::before, *::after { box-sizing: border-box }`), `body` base styles (font stack per Requirement 13.3, background, color, min-width 360px), and `body`/`.card` theme transition rules
    - _Requirements: 13.3, 13.6, 13.8_
  - [x] 3.3 Write card styles (`.card`): background, border, border-radius 12–18px, shadow; write button styles (`.btn`, `.btn-primary`, `.btn-danger`, `.btn-ghost`): rounded corners 10–12px, transition 150–250ms; write badge styles (`.badge`): category color chip
    - _Requirements: 13.4, 13.5, 13.6_
  - [x] 3.4 Write responsive dashboard cards grid (`.dashboard-cards`: `repeat(auto-fit, minmax(200px, 1fr))`), two-pane main grid (`.main-grid`: single column; `@media (min-width:1024px)` two columns), and Remaining Balance font-size rule (≥ 1.5× other cards)
    - _Requirements: 2.6, 13.8_
  - [x] 3.5 Write styles for: progress bar (`.progress-bar`, `.progress-fill` with color transition), insights section, modal/dialog (`.modal`, focus-trap outline), toast (`.toast`, `.toast--success`, `.toast--error`, slide-in animation, auto-dismiss fade), and `#chart-canvas-wrapper` (min-height 200px, max-height 500px)
    - _Requirements: 3.1–3.4, 3.7, 5.9, 6.2, 7.6, 13.4, 13.6_


- [x] 4. `app.js` constants, state, and config
  - [x] 4.1 Write the `// ─── CONSTANTS & CONFIG ───` section: define `CONSTANTS` object (LocalStorage keys, max category count 50, max name length 100, amount min/max), `DEFAULT_CATEGORIES` array, and `CATEGORY_PALETTE` array (12 hex colors from design)
    - _Requirements: 5.1, 6.3, 6.4, 12.1–12.4, 14.1_
  - [x] 4.2 Write the `// ─── STATE ───` section: declare `AppState` singleton with all fields from the design (`transactions`, `budget`, `categories`, `theme`, `selectedMonth`, `chartInstance`, `txFilter`)
    - _Requirements: 2.1–2.4, 8.7–8.9_

- [~] 5. LocalStorage layer
  - [~] 5.1 Write `loadFromStorage()`: read all four keys (`ledgerly_transactions`, `ledgerly_budget`, `ledgerly_categories`, `ledgerly_theme`) with individual try/catch blocks; initialize each `AppState` field to its empty default on parse failure; call `showStorageWarning()` for each failed key
    - _Requirements: 12.1–12.5, 12.6, 12.7_
  - [~] 5.2 Write `saveTransactions()`, `saveBudget()`, `saveCategories()`, `saveTheme()`: each wraps `localStorage.setItem` in try/catch; on quota error `saveTransactions` shows error toast and rethrows so the caller skips form reset
    - _Requirements: 5.6, 5.10, 12.1–12.4_

- [ ] 6. Formatting utilities and color helper
  - [~] 6.1 Write `formatRupiah(amount)`: apply `Math.round`, handle negative sign, split digits into groups of 3 separated by `.`, prefix with `"Rp"` — matching the hand-rolled algorithm from the design document exactly
    - _Requirements: 2.5, 9.4_
  - [~] 6.2 Write `getCategoryColor(categoryName)`: djb2-style hash loop over character codes, `Math.abs(hash) % CATEGORY_PALETTE.length`, return `CATEGORY_PALETTE[index]`
    - _Requirements: 7.3_


- [ ] 7. Computation / pure functions
  - [~] 7.1 Write `getTotalExpenses(transactions, month)`: filter by `date.startsWith(month)`, sum `.amount` values; write `getRemainingBalance(budget, totalExpenses)`: return `budget - totalExpenses`
    - _Requirements: 2.1, 2.3, 2.9_
  - [~] 7.2 Write `getBudgetRatio(totalExpenses, budget)`: return `0` when `budget === 0`, else `totalExpenses / budget` (unbounded); write `getProgressBarColor(ratio)`: return `#34C759` / `#FF9F0A` / `#FF453A` per thresholds 0.6 / 0.9
    - _Requirements: 3.1–3.4, 3.6_
  - [~] 7.3 Write `getLargestCategory(transactions, month)`: aggregate totals per category for the month; return the category name with the highest total, breaking ties alphabetically ascending; return `null` if no transactions
    - _Requirements: 4.2, 4.6_
  - [~] 7.4 Write `getMonthlyStats(transactions, month)`: compute total spending, transaction count, largest category, and daily average (`Math.round(total / daysInMonth(month))` — must handle leap-year February correctly); return a `MonthlyStats` object; include helper `daysInMonth(month)`
    - _Requirements: 9.2_


- [ ] 8. Render: Header
  - [~] 8.1 Write `renderHeader()`: populate `#app-header` with logo SVG, "Ledgerly" h1, subtitle, formatted current month/year string, and theme toggle button whose label text shows the mode it will activate (e.g., "Dark" when current theme is light)
    - _Requirements: 1.1, 1.2, 1.3, 1.4_

- [ ] 9. Render: Dashboard Cards
  - [~] 9.1 Write `renderDashboardCards()`: compute current-month values from `AppState`, build four card elements (Remaining Balance, Monthly Budget, Total Expenses, Number of Transactions); apply danger color to Remaining Balance when negative; render Remaining Balance value at ≥ 1.5× font size
    - Use `formatRupiah()` for all currency values
    - _Requirements: 2.1–2.6, 2.8, 2.9_

- [ ] 10. Render: Budget Progress Bar
  - [~] 10.1 Write `renderBudgetProgress()`: compute ratio via `getBudgetRatio`; set progress fill width to `Math.min(100, ratio * 100)%`; set fill color via `getProgressBarColor`; render integer percentage label adjacent to bar; handle zero-budget state (0% fill, no division)
    - _Requirements: 3.1–3.7_

- [ ] 11. Render: Insights
  - [~] 11.1 Write `renderInsights()`: compute usage %; show "You have used X% of this month's budget." (floor); show "Your largest spending category is [name]." when ≥ 1 transaction exists; show "You are RpX.XXX over budget." when total > budget; show "No expenses recorded yet." when no transactions and no budget
    - _Requirements: 4.1–4.6_


- [ ] 12. Render: Expense Form — static HTML and category select population
  - [~] 12.1 Write the static HTML for `#expense-form` inside `index.html` (or inject via `renderExpenseForm()`): Item Name input (maxlength 100), Amount input, Category `<select>`, Date input, "Manage Categories" button, and submit button; wire inline error message `<span>` elements under each required field
    - _Requirements: 5.1, 5.3, 5.4, 6.1_
  - [~] 12.2 Write `updateExpenseFormCategorySelect()`: rebuild the `<select>` options from `AppState.categories`; called after add/delete category and after `loadFromStorage()`
    - _Requirements: 5.2, 6.5, 6.8_

- [ ] 13. Render: Chart
  - [~] 13.1 Write `renderChart()`: get current-month transactions from `AppState`; if empty — destroy existing instance, hide canvas, show "No expenses recorded yet." message; if non-empty — destroy old instance, aggregate by category, create new `Chart` (doughnut, `responsive: true`, `maintainAspectRatio: true`, legend bottom, tooltip with `formatRupiah` + 1 decimal %)
    - Attach a `ResizeObserver` on `#chart-canvas-wrapper` that calls `AppState.chartInstance.resize()` (debounced within 500ms) to satisfy viewport-resize requirement
    - _Requirements: 7.1–7.6_

- [ ] 14. Render: Transaction List
  - [~] 14.1 Write `renderTransactionList()`: read `AppState.transactions` and `AppState.txFilter`; apply search (case-insensitive name substring), category filter, and sort (newest/oldest/amount-high/amount-low/category-az) in memory; render each item with category badge (colored via `getCategoryColor`), name, date (YYYY-MM-DD), category name, `formatRupiah(amount)`, and delete button with `data-id`; show "No transactions found." on empty results; show "No expenses recorded yet." when `AppState.transactions` is empty
    - _Requirements: 8.1–8.11_


- [ ] 15. Render: Monthly Summary
  - [~] 15.1 Write `renderMonthlySummary()`: populate Month Selector `<select>` with all months that have at least one transaction (default to current month); display stats for `AppState.selectedMonth` via `getMonthlyStats`; render category breakdown rows (sorted descending by total, each with category name, `formatRupiah` total, percentage with 1 decimal place, and proportional progress bar); show "No data available for this month." when no transactions in selected month
    - _Requirements: 9.1–9.5_

- [ ] 16. Render: Category Manager Modal
  - [~] 16.1 Write `renderCategoryModal()`: populate the `<dialog id="category-modal">` with the full category list; show a delete button only for non-default categories that have zero associated transactions; show inline error message area for add-category validation; disable the add input when category count reaches 50 and show a limit message
    - _Requirements: 6.2, 6.3, 6.4, 6.6, 6.7, 6.10_

- [ ] 17. Event handlers — all user interactions wired
  - [~] 17.1 Wire expense form submit: call `validateForm()` (check required fields, amount range 0.01–999,999,999.99); on invalid show inline errors; on valid call `addTransaction()` → generate `id` (`"tx_" + Date.now() + "_" + Math.random().toString(36).slice(2,8)`), push to `AppState.transactions`, call `saveTransactions()` (rethrow on quota error), reset form with today's date, re-render Dashboard Cards / Progress Bar / Insights / Chart / Transaction List / Monthly Summary, show success toast; clear per-field error on `input` event
    - _Requirements: 5.1–5.9_
  - [~] 17.2 Wire delete transaction: event delegation on `#transaction-list` for `[data-id]` delete buttons; show `confirm()` dialog; on confirm call `deleteTransaction(id)` → filter `AppState.transactions`, call `saveTransactions()`, re-render affected regions, show success toast; on cancel no-op
    - _Requirements: 8.3–8.6_
  - [~] 17.3 Wire category modal: "Manage Categories" button opens modal via `dialog.showModal()` and calls `renderCategoryModal()`; add-category form submit calls `addCategory(name)` (validate non-empty, case-insensitive non-duplicate, count < 50) → push to `AppState.categories`, `saveCategories()`, re-render modal and category select; delete-category button calls `deleteCategory(name)` (guard default + no transactions) → filter `AppState.categories`, `saveCategories()`, re-render modal and category select, show toast; close/cancel restores focus to "Manage Categories" button
    - _Requirements: 6.1–6.10_
  - [~] 17.4 Wire theme toggle: on click derive `newTheme` from `AppState.theme`; call `setTheme(newTheme)` → set `AppState.theme`, `document.documentElement.setAttribute('data-theme', newTheme)`, `saveTheme()`, update button label text
    - _Requirements: 1.4–1.8_

  - [~] 17.5 Wire budget input: on `change`/`blur` on the budget input, parse value, call `setBudget(amount)` → update `AppState.budget`, `saveBudget()`, re-render Dashboard Cards / Progress Bar / Insights
    - _Requirements: 2.7, 3.5, 4.4_
  - [~] 17.6 Wire search, category filter, and sort controls: on `input`/`change` events update `AppState.txFilter` fields and call `renderTransactionList()`; no LocalStorage write needed for filter state
    - _Requirements: 8.7–8.10_
  - [~] 17.7 Wire month selector: on `change` update `AppState.selectedMonth` and call `renderMonthlySummary()`
    - _Requirements: 9.1, 9.2_
  - [~] 17.8 Wire CSV export button: if `AppState.transactions.length === 0` show error toast and return; otherwise sort all transactions by date ascending, build CSV string (header: Date,Item Name,Category,Amount; data rows with plain numeric amount), create `Blob`, create temporary `<a>` with object URL, trigger `.click()`, revoke URL
    - _Requirements: 10.1–10.5_
  - [~] 17.9 Wire "Clear All Data" button: show `confirm()` dialog with description of permanent deletion; on confirm call `clearAllData()` → clear all four LocalStorage keys, reset `AppState` to empty defaults, call `renderAll()`, show success toast; on cancel no-op
    - _Requirements: 11.1–11.5_

- [ ] 18. Toast notification system
  - [~] 18.1 Write `showToast(message, type)`: create `<div class="toast toast--{type}">` with message text, append to `#toast-container`, set `setTimeout` to remove element after 4000ms; ensure toast is visible for ≥ 3s and removed within 5s
    - _Requirements: 5.9_

- [ ] 19. Initialization — DOMContentLoaded boot sequence
  - [~] 19.1 Write `renderAll()`: calls `renderHeader()`, `renderDashboardCards()`, `renderBudgetProgress()`, `renderInsights()`, `renderChart()`, `updateExpenseFormCategorySelect()`, `renderTransactionList()`, `renderMonthlySummary()`, `renderCategoryModal()` in order
    - _Requirements: 12.5_
  - [~] 19.2 Write `DOMContentLoaded` handler: call `loadFromStorage()`, `applyTheme()` (set `data-theme` on `<html>`), `renderAll()`, `attachEventListeners()`; initialize `AppState.selectedMonth` to current `YYYY-MM`; set default date on expense form to today
    - _Requirements: 1.8, 1.9, 12.5_

- [~] 20. Checkpoint — verify full integration before tests
  - Open `index.html` in a browser, confirm: header renders with current month, all four dashboard cards show Rp0/0, theme toggle switches theme, adding an expense updates all regions, delete works with confirm dialog, category manager opens and closes restoring focus, CSV export and clear-all work. Ensure no JS console errors. Ask the user if questions arise.


- [~] 21. Property-based tests — fast-check, 10 correctness properties
  - [~] 21.1 Set up test infrastructure: create `tests/` directory structure (`tests/unit/`, `tests/integration/`); initialise a minimal `package.json` with `fast-check` as a dev dependency; add a `jest.config.js` (or `vitest.config.js`) configured for ES modules; export all pure functions from `js/app.js` under a `// ─── EXPORTS FOR TESTING ───` banner using a guard (`if (typeof module !== 'undefined') module.exports = { ... }`)
    - _Requirements: 14.1, 14.4_
  - [~] 21.2 Write property test for **Property 1 — Rupiah Formatting Invariants** in `tests/unit/format.test.js`
    - Generate arbitrary integers with `fc.integer()`; assert: starts with "Rp", no commas, digits after removing periods match `n.toString()`, negatives include "-" after "Rp"
    - `{ numRuns: 100 }`
    - **Validates: Requirements 2.5, 9.4**
  - [~] 21.3 Write property test for **Property 2 — Remaining Balance Calculation** in `tests/unit/computation.test.js`
    - Generate `budget ≥ 0` and array of transaction amounts; assert `getRemainingBalance(budget, getTotalExpenses(txs, month)) === budget - sum(amounts)`
    - **Validates: Requirements 2.1, 2.9**
  - [~] 21.4 Write property test for **Property 3 — Total Expenses and Count Aggregation** in `tests/unit/computation.test.js`
    - Generate transaction arrays with dates in a fixed month; assert `getTotalExpenses` equals arithmetic sum and count equals array length
    - **Validates: Requirements 2.3, 2.4**
  - [~] 21.5 Write property test for **Property 4 — Budget Progress Ratio and Color Thresholds** in `tests/unit/computation.test.js`
    - Generate `totalExpenses ≥ 0` and `budget ≥ 0`; assert zero-safe ratio; assert display % clamped to [0,100]; assert color boundaries at 0.6 and 0.9
    - **Validates: Requirements 3.1–3.4, 3.6, 3.7**
  - [~] 21.6 Write property test for **Property 5 — Largest Category with Tie-Breaking** in `tests/unit/computation.test.js`
    - Generate non-empty transaction arrays; assert returned category has the maximum total; assert tie-breaking is alphabetically first (case-sensitive ascending)
    - **Validates: Requirements 4.2, 4.6**
  - [~] 21.7 Write property test for **Property 6 — Category Color Determinism** in `tests/unit/color.test.js`
    - Generate arbitrary non-empty strings; assert `getCategoryColor(s) === getCategoryColor(s)` (idempotent); assert returned value is a member of `CATEGORY_PALETTE`
    - **Validates: Requirements 7.3**
  - [~] 21.8 Write property test for **Property 7 — Duplicate Category Rejection** in `tests/unit/categories.test.js`
    - Generate a non-empty category list and a string that matches one entry case-insensitively after trim; assert `addCategory` returns `false` and `AppState.categories` is unchanged
    - **Validates: Requirements 6.6**
  - [~] 21.9 Write property test for **Property 8 — Transaction Search Filter Completeness** in `tests/unit/filter.test.js`
    - Generate transaction arrays and search strings; assert every result contains `q` (case-insensitive) and every matching transaction in the input appears in the result; assert empty `q` returns all
    - **Validates: Requirements 8.7**
  - [~] 21.10 Write property test for **Property 9 — Monthly Daily Average Calculation** in `tests/unit/computation.test.js`
    - Generate `YYYY-MM` month strings (including leap-year February months); assert `getMonthlyStats(...).dailyAverage === Math.round(total / daysInMonth(month))`; verify leap-year February has 29 days
    - **Validates: Requirements 9.2**
  - [~] 21.11 Write property test for **Property 10 — CSV Export Data Round-Trip** in `tests/unit/csv.test.js`
    - Generate non-empty transaction arrays; call `exportCSV()` capture, parse CSV; assert every transaction appears as a row with matching date/name/category/amount; assert rows sorted by date ascending; assert no extra rows
    - **Validates: Requirements 10.2, 10.3**

- [~] 22. Final checkpoint — all tests passing
  - Run `npx jest --runInBand` (or `npx vitest --run`) and confirm all 10 property tests pass with 100 iterations each. Ensure no JS console errors when opening `index.html` in Chrome, Firefox, Safari, and Edge. Ask the user if questions arise.


---

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP
- Every task references specific requirements for traceability
- The two checkpoints (tasks 20 and 22) ensure incremental validation at key milestones
- Property tests validate universal correctness properties; they complement, not replace, example-based integration testing
- All pure functions in `js/app.js` must be exported under a conditional `module.exports` guard so they can be imported by the test suite without breaking the browser build
- The inline theme script in `<head>` must execute before `css/style.css` is parsed to eliminate any flash of wrong theme

---

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "1.2", "1.3"] },
    { "id": 1, "tasks": ["2.1", "2.2", "3.1", "3.2", "4.1", "4.2"] },
    { "id": 2, "tasks": ["3.3", "3.4", "3.5", "5.1", "5.2", "6.1", "6.2"] },
    { "id": 3, "tasks": ["7.1", "7.2", "7.3", "7.4", "12.1", "12.2"] },
    { "id": 4, "tasks": ["8.1", "9.1", "10.1", "11.1", "13.1", "14.1", "15.1", "16.1"] },
    { "id": 5, "tasks": ["17.1", "17.2", "17.3", "17.4", "17.5", "17.6", "17.7", "17.8", "17.9", "18.1"] },
    { "id": 6, "tasks": ["19.1", "19.2"] },
    { "id": 7, "tasks": ["21.1"] },
    { "id": 8, "tasks": ["21.2", "21.3", "21.4", "21.5", "21.6", "21.7", "21.8", "21.9", "21.10", "21.11"] }
  ]
}
```
