// Feature: ledgerly-expense-budget-visualizer, Property 1: Rupiah Formatting Invariants
// Validates: Requirements 2.5, 9.4

const fc = require('fast-check');
const { formatRupiah } = require('../../js/app.js');

describe('Property 1 — Rupiah Formatting Invariants', () => {
  it('always starts with "Rp"', () => {
    fc.assert(
      fc.property(fc.integer({ min: -1_000_000_000, max: 1_000_000_000 }), (n) => {
        const result = formatRupiah(n);
        expect(result.startsWith('Rp')).toBe(true);
      }),
      { numRuns: 100 }
    );
  });

  it('never contains a comma character', () => {
    fc.assert(
      fc.property(fc.integer({ min: -1_000_000_000, max: 1_000_000_000 }), (n) => {
        const result = formatRupiah(n);
        expect(result.includes(',')).toBe(false);
      }),
      { numRuns: 100 }
    );
  });

  it('digits after removing period separators match Math.round(n).toString() digits', () => {
    fc.assert(
      fc.property(fc.integer({ min: -1_000_000_000, max: 1_000_000_000 }), (n) => {
        const result = formatRupiah(n);
        // Strip the "Rp" prefix and the optional "-" sign, then remove periods
        const suffix = result.slice(2).replace('-', '').replace(/\./g, '');
        const expected = Math.abs(Math.round(n)).toString();
        expect(suffix).toBe(expected);
      }),
      { numRuns: 100 }
    );
  });

  it('negative numbers include "-" immediately after "Rp"', () => {
    fc.assert(
      fc.property(fc.integer({ min: -1_000_000_000, max: -1 }), (n) => {
        const result = formatRupiah(n);
        expect(result.startsWith('Rp-')).toBe(true);
      }),
      { numRuns: 100 }
    );
  });

  it('non-negative numbers do NOT include "-"', () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 1_000_000_000 }), (n) => {
        const result = formatRupiah(n);
        expect(result.includes('-')).toBe(false);
      }),
      { numRuns: 100 }
    );
  });
});
