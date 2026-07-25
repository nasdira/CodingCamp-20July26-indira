// Feature: ledgerly-expense-budget-visualizer, Property 10: CSV Export Data Round-Trip
// Validates: Requirements 10.2, 10.3

const fc = require('fast-check');
const { exportCSVString } = require('../../js/app.js');

/**
 * Simple CSV parser: splits on newlines, then parses each data row.
 * Handles double-quote wrapping and escaped quotes ("").
 *
 * Returns an array of { date, name, category, amount } objects.
 */
function parseCSV(csvString) {
  const lines = csvString.split('\n');
  // First line is the header — skip it
  const dataLines = lines.slice(1).filter(l => l.trim().length > 0);

  return dataLines.map(line => {
    // Tokenise: handle quoted fields containing commas
    const fields = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (inQuotes && line[i + 1] === '"') {
          // Escaped double-quote inside a quoted field
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (ch === ',' && !inQuotes) {
        fields.push(current);
        current = '';
      } else {
        current += ch;
      }
    }
    fields.push(current); // last field

    return {
      date:     fields[0],
      name:     fields[1],
      category: fields[2],
      amount:   parseFloat(fields[3]),
    };
  });
}

// Arbitrary: transaction with safe string name and category
const arbTx = fc.record({
  id:       fc.string({ minLength: 1, maxLength: 8 }),
  name:     fc.string({ minLength: 1, maxLength: 40 }).map(s => s.replace(/[\n\r]/g, ' ')),
  amount:   fc.float({ min: 0.01, max: 999_999, noNaN: true }),
  category: fc.constantFrom('Food', 'Transport', 'Fun', 'Health', 'Other'),
  date:     fc.tuple(
    fc.integer({ min: 2020, max: 2026 }),
    fc.integer({ min: 1, max: 12 }),
    fc.integer({ min: 1, max: 28 })
  ).map(([y, m, d]) =>
    `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`
  ),
});

describe('Property 10 — CSV Export Data Round-Trip', () => {
  it('CSV header is "Date,Item Name,Category,Amount"', () => {
    fc.assert(
      fc.property(
        fc.array(arbTx, { minLength: 1, maxLength: 10 }),
        (transactions) => {
          const csv = exportCSVString(transactions);
          const firstLine = csv.split('\n')[0];
          expect(firstLine).toBe('Date,Item Name,Category,Amount');
        }
      ),
      { numRuns: 100 }
    );
  });

  it('every transaction appears as a row with matching date, name, category, amount', () => {
    fc.assert(
      fc.property(
        fc.array(arbTx, { minLength: 1, maxLength: 15 }),
        (transactions) => {
          const csv = exportCSVString(transactions);
          const rows = parseCSV(csv);

          // Build a lookup map from the parsed rows by (date + name + category)
          for (const tx of transactions) {
            const match = rows.find(r =>
              r.date     === tx.date &&
              r.name     === tx.name &&
              r.category === tx.category &&
              Math.abs(r.amount - tx.amount) < 0.001
            );
            expect(match).toBeDefined();
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('rows are sorted by date ascending', () => {
    fc.assert(
      fc.property(
        fc.array(arbTx, { minLength: 2, maxLength: 15 }),
        (transactions) => {
          const csv = exportCSVString(transactions);
          const rows = parseCSV(csv);

          for (let i = 1; i < rows.length; i++) {
            expect(rows[i].date >= rows[i - 1].date).toBe(true);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('no extra rows: CSV row count equals transactions length', () => {
    fc.assert(
      fc.property(
        fc.array(arbTx, { minLength: 1, maxLength: 15 }),
        (transactions) => {
          const csv = exportCSVString(transactions);
          const rows = parseCSV(csv);
          expect(rows).toHaveLength(transactions.length);
        }
      ),
      { numRuns: 100 }
    );
  });
});
