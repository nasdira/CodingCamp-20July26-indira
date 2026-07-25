// Feature: ledgerly-expense-budget-visualizer, Property 8: Transaction Search Filter Completeness
// Validates: Requirements 8.7

const fc = require('fast-check');
const { filterTransactions } = require('../../js/app.js');

// Arbitrary: generate a transaction with a name field
const arbTx = fc.record({
  id:       fc.string({ minLength: 1, maxLength: 8 }),
  name:     fc.string({ minLength: 1, maxLength: 30 }),
  amount:   fc.integer({ min: 1, max: 100_000 }),
  category: fc.constantFrom('Food', 'Transport', 'Fun'),
  date:     fc.constant('2025-03-05'),
});

describe('Property 8 — Transaction Search Filter Completeness', () => {
  it('every result contains the search string (case-insensitive)', () => {
    fc.assert(
      fc.property(
        fc.array(arbTx, { minLength: 1, maxLength: 20 }),
        fc.string({ minLength: 1, maxLength: 10 }),
        (transactions, q) => {
          const filter = { search: q, category: 'all', sort: 'newest' };
          const results = filterTransactions(transactions, filter);

          const lower = q.toLowerCase();
          for (const tx of results) {
            expect(tx.name.toLowerCase()).toContain(lower);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('every matching transaction in the input appears in the result', () => {
    fc.assert(
      fc.property(
        fc.array(arbTx, { minLength: 1, maxLength: 20 }),
        fc.string({ minLength: 1, maxLength: 10 }),
        (transactions, q) => {
          const filter = { search: q, category: 'all', sort: 'newest' };
          const results = filterTransactions(transactions, filter);
          const resultIds = new Set(results.map(tx => tx.id));

          const lower = q.toLowerCase();
          for (const tx of transactions) {
            if (tx.name.toLowerCase().includes(lower)) {
              expect(resultIds.has(tx.id)).toBe(true);
            }
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('empty search string returns all transactions', () => {
    fc.assert(
      fc.property(
        fc.array(arbTx, { minLength: 0, maxLength: 20 }),
        (transactions) => {
          const filter = { search: '', category: 'all', sort: 'newest' };
          const results = filterTransactions(transactions, filter);
          expect(results).toHaveLength(transactions.length);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('no false negatives: count of results equals number of matching transactions', () => {
    fc.assert(
      fc.property(
        fc.array(arbTx, { minLength: 1, maxLength: 20 }),
        fc.string({ minLength: 1, maxLength: 5 }),
        (transactions, q) => {
          const filter = { search: q, category: 'all', sort: 'newest' };
          const results = filterTransactions(transactions, filter);

          const lower = q.toLowerCase();
          const expectedCount = transactions.filter(tx =>
            tx.name.toLowerCase().includes(lower)
          ).length;

          expect(results).toHaveLength(expectedCount);
        }
      ),
      { numRuns: 100 }
    );
  });
});
