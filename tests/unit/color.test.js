// Feature: ledgerly-expense-budget-visualizer, Property 6: Category Color Determinism
// Validates: Requirements 7.3

const fc = require('fast-check');
const { getCategoryColor, CATEGORY_PALETTE } = require('../../js/app.js');

describe('Property 6 — Category Color Determinism', () => {
  it('getCategoryColor(s) === getCategoryColor(s) — same input always same output', () => {
    fc.assert(
      fc.property(fc.string({ minLength: 1, maxLength: 50 }), (s) => {
        expect(getCategoryColor(s)).toBe(getCategoryColor(s));
      }),
      { numRuns: 100 }
    );
  });

  it('returned value is always a member of CATEGORY_PALETTE', () => {
    fc.assert(
      fc.property(fc.string({ minLength: 1, maxLength: 50 }), (s) => {
        const color = getCategoryColor(s);
        expect(CATEGORY_PALETTE).toContain(color);
      }),
      { numRuns: 100 }
    );
  });

  it('two calls with the same string return identical hex strings', () => {
    fc.assert(
      fc.property(fc.string({ minLength: 1, maxLength: 50 }), (s) => {
        const first  = getCategoryColor(s);
        const second = getCategoryColor(s);
        // Must be identical — no randomness allowed
        expect(first).toBe(second);
        // Must be a 7-character hex string like "#RRGGBB"
        expect(first).toMatch(/^#[0-9A-Fa-f]{6}$/);
      }),
      { numRuns: 100 }
    );
  });
});
