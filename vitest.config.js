// vitest.config.js
// Uses CommonJS require to avoid needing "type": "module" in package.json.
// app.js exports via module.exports guard; test files use require().
const { defineConfig } = require('vitest/config');

module.exports = defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.js'],
    globals: true,
  },
});
