// Feature: ledgerly-expense-budget-visualizer
// Properties 2, 3, 4, 5, 9 — Computation correctness
// Validates: Requirements 2.1, 2.3, 2.4, 2.9, 3.1–3.4, 3.6, 3.7, 4.2, 4.6, 9.2

const fc = require('fast-check');
const {
  getTotalExpenses,
  getRemainingBalance,
  getBudgetRatio,
  getProgressBarColor,
  getLargestCategory,
  getMonthlyStats,
  daysInMonth,
} = require('../../js/app.js');

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Builds a Transaction object for a given month with a fixed day of "05". */
function makeTx(amount, month, category = 'Food') {
  return { id: 'tx_test', name: 'Test', amount, category, date: `${month}-05` };
}

// Arbitrary: non-negative safe integer amounts
const arbAmount = fc.integer({ min: 0, max: 999_999_999 });

// Arbitrary: budget ≥ 0
const arbBudget = fc.integer({ min: 0, max: 999_999_999 });

// Fixed test month
const FIXED_MONTH = '2025-03';

// ── Property 2: Remaining Balance Calculation ─────────────────────────────────
// Feature: ledgerly-expense-budget-visualizer, Property 2: Remaining Balance Calculation
// Validates: Requirements 2.1, 2.9

describe('Property 2 — Remaining Balance Calculation', () => {
  it('getRemainingBalance(budget, getTotalExpenses(txs)) === budget - sum(amounts)', () => {
    fc.assert(
      fc.property(
        arbBudget,
        fc.array(arbAmount, { minLength: 0, maxLength: 20 }),
        (budget, amounts) => {
          const txs = amounts.map(a => makeTx(a, FIXED_MONTH));
          const total = getTotalExpenses(txs, FIXED_MONTH);
          const remaining = getRemainingBalance(budget, total);
          const expected = budget - amounts.reduce((s, a) => s + a, 0);
          // Use toBeCloseTo to handle floating-point arithmetic
          expect(remaining).toBeCloseTo(expected, 5);
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ── Property 3: Total Expenses and Count Aggregation ─────────────────────────
// Feature: ledgerly-expense-budget-visualizer, Property 3: Total Expenses and Count Aggregation
// Validates: Requirements 2.3, 2.4

describe('Property 3 — Total Expenses and Count Aggregation', () => {
  it('getTotalExpenses equals arithmetic sum of amounts', () => {
    fc.assert(
      fc.property(
        fc.array(arbAmount, { minLength: 0, maxLength: 20 }),
        (amounts) => {
          const txs = amounts.map(a => makeTx(a, FIXED_MONTH));
          const total = getTotalExpenses(txs, FIXED_MONTH);
          const expected = amounts.reduce((s, a) => s + a, 0);
          expect(total).toBeCloseTo(expected, 5);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('count of matching transactions equals array length', () => {
    fc.assert(
      fc.property(
        fc.array(arbAmount, { minLength: 0, maxLength: 20 }),
        (amounts) => {
          const txs = amounts.map(a => makeTx(a, FIXED_MONTH));
          const count = txs.filter(tx => tx.date.startsWith(FIXED_MONTH)).length;
          expect(count).toBe(amounts.length);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('transactions from other months are NOT counted', () => {
    fc.assert(
      fc.property(
        fc.array(arbAmount, { minLength: 1, maxLength: 10 }),
        (amounts) => {
          // All transactions are in a DIFFERENT month
          const txs = amounts.map(a => makeTx(a, '2024-01'));
          const total = getTotalExpenses(txs, FIXED_MONTH);
          expect(total).toBe(0);
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ── Property 4: Budget Progress Ratio and Color Thresholds ───────────────────
// Feature: ledgerly-expense-budget-visualizer, Property 4: Budget Progress Ratio and Color Thresholds
// Validates: Requirements 3.1–3.4, 3.6, 3.7

describe('Property 4 — Budget Progress Ratio and Color Thresholds', () => {
  it('returns 0 when budget === 0 (no division by zero)', () => {
    fc.assert(
      fc.property(arbAmount, (expenses) => {
        expect(getBudgetRatio(expenses, 0)).toBe(0);
      }),
      { numRuns: 100 }
    );
  });

  it('returns totalExpenses / budget when budget > 0', () => {
    fc.assert(
      fc.property(
        arbAmount,
        fc.integer({ min: 1, max: 999_999_999 }),
        (expenses, budget) => {
          const ratio = getBudgetRatio(expenses, budget);
          expect(ratio).toBeCloseTo(expenses / budget, 10);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('display percentage Math.min(100, ratio*100) is always in [0, 100]', () => {
    fc.assert(
      fc.property(
        arbAmount,
        arbBudget,
        (expenses, budget) => {
          const ratio = getBudgetRatio(expenses, budget);
          const pct = Math.min(100, ratio * 100);
          expect(pct).toBeGreaterThanOrEqual(0);
          expect(pct).toBeLessThanOrEqual(100);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('getProgressBarColor returns #34C759 when ratio < 0.6', () => {
    fc.assert(
      fc.property(fc.float({ min: 0, max: 0.5999, noNaN: true }), (ratio) => {
        expect(getProgressBarColor(ratio)).toBe('#34C759');
      }),
      { numRuns: 100 }
    );
  });

  it('getProgressBarColor returns #FF9F0A when 0.6 <= ratio < 0.9', () => {
    fc.assert(
      fc.property(fc.float({ min: 0.6, max: 0.8999, noNaN: true }), (ratio) => {
        expect(getProgressBarColor(ratio)).toBe('#FF9F0A');
      }),
      { numRuns: 100 }
    );
  });

  it('getProgressBarColor returns #FF453A when ratio >= 0.9', () => {
    fc.assert(
      fc.property(fc.float({ min: 0.9, max: 2.0, noNaN: true }), (ratio) => {
        expect(getProgressBarColor(ratio)).toBe('#FF453A');
      }),
      { numRuns: 100 }
    );
  });
});

// ── Property 5: Largest Category with Tie-Breaking ───────────────────────────
// Feature: ledgerly-expense-budget-visualizer, Property 5: Largest Category with Tie-Breaking
// Validates: Requirements 4.2, 4.6

describe('Property 5 — Largest Category with Tie-Breaking', () => {
  // Generate transactions across 2 or 3 categories so ties are possible
  const arbCategory = fc.constantFrom('Alpha', 'Beta', 'Gamma');

  it('returned category has the maximum total; ties broken alphabetically first', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            amount:   fc.integer({ min: 1, max: 10_000 }),
            category: arbCategory,
          }),
          { minLength: 1, maxLength: 20 }
        ),
        (items) => {
          const txs = items.map((item, i) => ({
            id:       `tx_${i}`,
            name:     'Item',
            amount:   item.amount,
            category: item.category,
            date:     `${FIXED_MONTH}-05`,
          }));

          const result = getLargestCategory(txs, FIXED_MONTH);

          // Aggregate manually
          const totals = {};
          for (const tx of txs) {
            if (tx.date.startsWith(FIXED_MONTH)) {
              totals[tx.category] = (totals[tx.category] || 0) + tx.amount;
            }
          }

          const maxTotal = Math.max(...Object.values(totals));
          const tiedCategories = Object.keys(totals)
            .filter(c => totals[c] === maxTotal)
            .sort(); // ascending = alphabetically first

          // The returned category must be the alphabetically first among ties
          expect(result).toBe(tiedCategories[0]);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('returns null when no transactions exist for the month', () => {
    expect(getLargestCategory([], FIXED_MONTH)).toBeNull();
  });

  it('returns null when all transactions are in a different month', () => {
    const txs = [makeTx(100, '2024-01', 'Food')];
    expect(getLargestCategory(txs, FIXED_MONTH)).toBeNull();
  });
});

// ── Property 9: Monthly Daily Average Calculation ────────────────────────────
// Feature: ledgerly-expense-budget-visualizer, Property 9: Monthly Daily Average Calculation
// Validates: Requirements 9.2

describe('Property 9 — Monthly Daily Average Calculation', () => {
  // Generate YYYY-MM strings for years 2020–2026 and months 01–12
  const arbMonth = fc.tuple(
    fc.integer({ min: 2020, max: 2026 }),
    fc.integer({ min: 1, max: 12 })
  ).map(([year, month]) => `${year}-${String(month).padStart(2, '0')}`);

  it('dailyAverage === Math.round(total / daysInMonth(month))', () => {
    fc.assert(
      fc.property(
        arbMonth,
        fc.array(fc.integer({ min: 1, max: 100_000 }), { minLength: 0, maxLength: 20 }),
        (month, amounts) => {
          const txs = amounts.map(a => ({ id: 'x', name: 'T', amount: a, category: 'Food', date: `${month}-05` }));
          const stats = getMonthlyStats(txs, month);
          const total = amounts.reduce((s, a) => s + a, 0);
          const expected = Math.round(total / daysInMonth(month));
          expect(stats.dailyAverage).toBe(expected);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('daysInMonth("2024-02") === 29 (leap year)', () => {
    expect(daysInMonth('2024-02')).toBe(29);
  });

  it('daysInMonth("2023-02") === 28 (non-leap year)', () => {
    expect(daysInMonth('2023-02')).toBe(28);
  });

  it('daysInMonth("2025-01") === 31', () => {
    expect(daysInMonth('2025-01')).toBe(31);
  });
});
