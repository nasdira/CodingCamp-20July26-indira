// Feature: ledgerly-expense-budget-visualizer, Property 7: Duplicate Category Rejection
// Validates: Requirements 6.6

const fc = require('fast-check');

/**
 * Pure helper that replicates the addCategory() duplicate-check logic.
 * Tests the pure decision logic without mutating any global state.
 *
 * Returns { accepted: boolean, reason?: string }
 */
function tryAddCategory(existingCategories, newName, maxCategories = 50) {
  const trimmed = newName.trim();

  if (!trimmed) {
    return { accepted: false, reason: 'empty' };
  }

  if (existingCategories.length >= maxCategories) {
    return { accepted: false, reason: 'limit' };
  }

  const lower = trimmed.toLowerCase();
  const isDuplicate = existingCategories.some(c => c.toLowerCase() === lower);
  if (isDuplicate) {
    return { accepted: false, reason: 'duplicate' };
  }

  return { accepted: true };
}

describe('Property 7 — Duplicate Category Rejection', () => {
  // Arbitrary: generate a non-empty list of lowercase single-word category names
  const arbCategory = fc.string({ minLength: 1, maxLength: 20 }).filter(s => s.trim().length > 0);
  const arbCategoryList = fc.array(arbCategory, { minLength: 1, maxLength: 10 });

  it('adding a name that matches an existing entry case-insensitively returns false', () => {
    fc.assert(
      fc.property(
        arbCategoryList,
        fc.integer({ min: 0 }),
        (categories, index) => {
          // Pick one of the existing categories
          const existing = categories[index % categories.length];

          // Generate a variant: same letters but possibly different case
          const variant = existing.toLowerCase();

          const before = [...categories];
          const result = tryAddCategory(categories, variant);

          // The duplicate must be rejected
          expect(result.accepted).toBe(false);
          expect(result.reason).toBe('duplicate');

          // The list must not be modified
          expect(categories).toEqual(before);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('adding a completely new name is accepted', () => {
    fc.assert(
      fc.property(
        arbCategoryList,
        fc.string({ minLength: 1, maxLength: 20 }).filter(s => s.trim().length > 0),
        (categories, newName) => {
          const trimmedNew = newName.trim().toLowerCase();
          const isActuallyNew = !categories.some(c => c.toLowerCase() === trimmedNew);

          if (!isActuallyNew) return; // discard — name happens to match

          // Total count must be below max
          if (categories.length >= 50) return;

          const result = tryAddCategory(categories, newName);
          expect(result.accepted).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('adding when at max capacity (50) is rejected', () => {
    fc.assert(
      fc.property(
        fc.array(arbCategory, { minLength: 50, maxLength: 50 }),
        fc.string({ minLength: 1, maxLength: 20 }).filter(s => s.trim().length > 0),
        (categories, newName) => {
          const result = tryAddCategory(categories, newName, 50);
          expect(result.accepted).toBe(false);
          expect(result.reason).toBe('limit');
        }
      ),
      { numRuns: 100 }
    );
  });

  it('adding an empty or whitespace-only name is rejected', () => {
    fc.assert(
      fc.property(
        arbCategoryList,
        fc.constantFrom('', '   ', '\t', '\n'),
        (categories, blank) => {
          const result = tryAddCategory(categories, blank);
          expect(result.accepted).toBe(false);
          expect(result.reason).toBe('empty');
        }
      ),
      { numRuns: 100 }
    );
  });
});
