# Requirements Document

## Introduction

Ledgerly is a premium, client-side web application for personal and small-team expense tracking and budget management. It targets freelancers, small business owners, and teams who want a simple, visually rich way to monitor spending in Indonesian Rupiah. The application runs entirely in the browser using HTML, CSS, and Vanilla JavaScript, with all data persisted in the browser's Local Storage. No backend, authentication, or build tools are used.

The application subtitle is **"Make every rupiah count."**

---

## Glossary

- **Application**: The Ledgerly single-page web application.
- **Budget**: The user-defined monthly spending limit stored in Local Storage.
- **Category**: A label assigned to a transaction. Default categories are Food, Transport, and Fun; users may add custom categories.
- **Dashboard**: The top-level summary view of the current month's financial state.
- **Expense**: A single spending transaction with a name, amount, category, and date.
- **Local_Storage**: The browser's `localStorage` API used for all data persistence.
- **Remaining_Balance**: The computed value equal to the Monthly Budget minus the sum of all expense amounts for the current month.
- **Transaction**: Synonym for Expense within this document.
- **Toast**: A brief, non-blocking notification message displayed after a user action.
- **Chart**: The Chart.js doughnut chart rendering category-level spending.
- **Category_Manager**: The modal dialog used to add and delete categories.
- **CSV_Export**: A downloadable comma-separated values file of all transactions.
- **Dark_Mode**: An alternate color scheme optimised for low-light environments.
- **Light_Mode**: The default color scheme using the premium blue-and-white design system.
- **Month_Selector**: The control in the Monthly Summary section used to navigate between months.

---

## Requirements

### Requirement 1: Application Shell and Navigation Header

**User Story:** As a user, I want to see a clearly branded header so that I can immediately identify the application and access global controls.

#### Acceptance Criteria

1. THE Application SHALL display the logo and name "Ledgerly" in the header on every page load.
2. THE Application SHALL display the subtitle "Make every rupiah count." beneath the application name in the header.
3. THE Application SHALL display the name of the current calendar month and year (e.g., "July 2026") in the header, reflecting the device's local date at the time of page load.
4. THE Application SHALL provide a Light/Dark mode toggle button in the header that displays the label of the mode it will activate (e.g., showing "Dark" when the current mode is Light).
5. WHEN the user activates the Dark Mode toggle, THE Application SHALL switch all UI elements to the dark color scheme within 100 milliseconds without a page reload.
6. WHEN the user activates the Light Mode toggle, THE Application SHALL switch all UI elements to the light color scheme within 100 milliseconds without a page reload.
7. WHEN the theme preference is changed, THE Application SHALL save the value "dark" or "light" (respectively) to Local_Storage before the next user interaction.
8. WHEN the Application is loaded, THE Application SHALL read the saved theme preference from Local_Storage and apply it before rendering any visible content.
9. IF no theme preference is found in Local_Storage on load, THEN THE Application SHALL apply the light color scheme as the default.

---

### Requirement 2: Dashboard Summary Cards

**User Story:** As a user, I want to see a summary of my financial position at a glance so that I can quickly understand my spending status for the current month.

#### Acceptance Criteria

1. THE Dashboard SHALL display a "Remaining Balance" summary card showing the computed Remaining_Balance (defined as Monthly Budget minus Total Expenses) for the current month.
2. THE Dashboard SHALL display a "Monthly Budget" summary card showing the user-defined Budget for the current month, or Rp0 if no budget has been set.
3. THE Dashboard SHALL display a "Total Expenses" summary card showing the sum of all expense amounts for the current month, or Rp0 if no expenses exist.
4. THE Dashboard SHALL display a "Number of Transactions" summary card showing the count of all expenses recorded for the current month, or 0 if no expenses exist.
5. THE Application SHALL format all currency values as Indonesian Rupiah using the pattern "Rp" followed by a period-separated thousands grouping (e.g., Rp50.000, Rp1.250.000).
6. THE Application SHALL render the Remaining Balance card with a font size at least 1.5× larger than the font size used by the other three summary cards.
7. WHEN the user sets or updates the Monthly Budget, THE Application SHALL recompute and re-render the Remaining_Balance card within 500 milliseconds.
8. WHEN an Expense is added or deleted, THE Application SHALL recompute and re-render all four summary cards within 500 milliseconds.
9. IF the computed Remaining_Balance is negative, THEN THE Dashboard SHALL render the Remaining Balance card value in the danger color (#FF453A) distinct from the color used when Remaining_Balance is zero or positive.

---

### Requirement 3: Budget Progress Bar

**User Story:** As a user, I want a visual indicator of how much of my budget I have consumed so that I can take corrective action before overspending.

#### Acceptance Criteria

1. THE Dashboard SHALL display a horizontal budget-progress bar that fills proportionally to the ratio of Total Expenses to the Monthly Budget, capped at 100% fill when expenses exceed the budget.
2. WHILE the ratio of Total Expenses to Monthly Budget is less than 60%, THE Application SHALL render the progress bar in the success color (#34C759).
3. WHILE the ratio of Total Expenses to Monthly Budget is at least 60% and less than 90%, THE Application SHALL render the progress bar in the warning color (#FF9F0A).
4. WHILE the ratio of Total Expenses to Monthly Budget is 90% or greater, THE Application SHALL render the progress bar in the danger color (#FF453A).
5. WHEN an Expense is added or deleted, THE Application SHALL recompute and re-render the progress bar within 500 milliseconds.
6. IF the Monthly Budget is zero or unset, THEN THE Application SHALL display the progress bar at 0% fill without dividing by zero.
7. THE Dashboard SHALL display a numeric percentage label adjacent to the progress bar showing the current fill percentage as a whole number.

---

### Requirement 4: Data-Driven Insights

**User Story:** As a user, I want automated textual insights about my spending so that I can understand patterns without manually analysing numbers.

#### Acceptance Criteria

1. THE Dashboard SHALL display a textual insight showing the percentage of the monthly budget consumed, expressed as a whole number rounded down (e.g., "You have used 62% of this month's budget.").
2. WHEN at least one Expense exists for the current month, THE Dashboard SHALL display a textual insight naming the category with the highest total spending for the current month (e.g., "Your largest spending category is Food.").
3. WHILE the Total Expenses exceed the Monthly Budget, THE Dashboard SHALL display a textual insight showing the exact overspent amount rounded to the nearest whole Rupiah in Rupiah format (e.g., "You are Rp250.000 over budget.").
4. WHEN an Expense is added or deleted or the Budget is updated, THE Application SHALL recompute and re-render all insights within 500 milliseconds.
5. WHEN no Expenses exist for the current month and no Budget has been set, THE Dashboard SHALL display the insight "No expenses recorded yet." in place of the usage and category insights.
6. IF two or more categories are tied for highest total spending in the current month, THEN THE Application SHALL display the category name that comes first alphabetically in the largest-spending-category insight.

---

### Requirement 5: Expense Entry Form

**User Story:** As a user, I want to record a new expense quickly so that I can keep my spending log up to date.

#### Acceptance Criteria

1. THE Application SHALL provide a form with the following required fields: Item Name (text, maximum 100 characters), Amount (numeric, range 0.01 to 999,999,999.99), Category (select), and Transaction Date (date).
2. THE Application SHALL populate the Category select with all default categories (Food, Transport, Fun) and any user-created custom categories.
3. THE Application SHALL set the Transaction Date field default value to the current date on each form reset.
4. WHEN the user submits the form with any required field empty, THE Application SHALL display an inline error message adjacent to each empty required field and SHALL NOT save the expense.
5. WHEN the user submits the form with an Amount value outside the range 0.01 to 999,999,999.99, THE Application SHALL display an inline error message on the Amount field and SHALL NOT save the expense.
6. WHEN the user submits the form with all fields valid, THE Application SHALL save the Expense object to Local_Storage within 500 milliseconds.
7. WHEN an Expense is successfully saved, THE Application SHALL update the Dashboard summary cards, progress bar, insights, Chart, and Transaction list within 500 milliseconds.
8. WHEN an Expense is successfully saved, THE Application SHALL reset the form fields to their default empty state with the date reset to today.
9. WHEN an Expense is successfully saved, THE Application SHALL display a Toast notification confirming the successful save that remains visible for at least 3 seconds and auto-dismisses within 5 seconds.
10. IF Local_Storage throws an error during save, THEN THE Application SHALL not reset the form and SHALL display an error message informing the user the expense could not be saved.

---

### Requirement 6: Category Management

**User Story:** As a user, I want to create and remove spending categories so that I can organise my expenses according to my own habits.

#### Acceptance Criteria

1. THE Application SHALL provide a "Manage Categories" button on the Expense Entry Form.
2. WHEN the user activates the "Manage Categories" button, THE Application SHALL open the Category_Manager modal dialog.
3. THE Category_Manager SHALL display a list of all current categories, up to a maximum of 50 categories total.
4. THE Category_Manager SHALL provide an input field (maximum 50 characters) and a submit button to add a new custom category.
5. WHEN the user submits a non-empty, non-duplicate category name in the Category_Manager, THE Application SHALL add the new category to Local_Storage and update the Category select in the Expense Entry Form within 500 milliseconds.
6. WHEN the user submits an empty or duplicate (case-insensitive match) category name in the Category_Manager, THE Application SHALL display an inline error message identifying the reason and SHALL NOT add the category.
7. THE Category_Manager SHALL display a delete button for each non-default category (excluding Food, Transport, Fun) that has no associated transactions.
8. WHEN the user activates a category delete button, THE Application SHALL remove that category from Local_Storage, display a Toast confirming the deletion, and update the Category select in the Expense Entry Form within 500 milliseconds.
9. WHEN the user closes the Category_Manager modal, THE Application SHALL restore focus to the "Manage Categories" button.
10. WHEN the total number of categories reaches 50, THE Application SHALL display an error message in the Category_Manager and disable the add input until a category is deleted.

---

### Requirement 7: Spending Chart

**User Story:** As a user, I want a visual breakdown of my spending by category so that I can identify which areas consume the most of my budget.

#### Acceptance Criteria

1. THE Application SHALL render a responsive doughnut chart showing total spending per category for the current calendar month (first day to last day of the current month).
2. WHEN an Expense is added or deleted, THE Application SHALL update the Chart data and re-render the chart within 500 milliseconds without a page reload.
3. THE Application SHALL assign a consistent color to each category such that the same category always uses the same color across chart renders.
4. THE Chart SHALL display category labels and their percentage values rounded to one decimal place adjacent to or within each chart segment.
5. WHEN no Expenses exist for the current month, THE Application SHALL hide the Chart canvas and display the message "No expenses recorded yet." in its place.
6. THE Chart container SHALL maintain a minimum height of 200px and a maximum height of 500px, re-scaling to fit its container width within 500 milliseconds of a viewport resize.

---

### Requirement 8: Transaction List

**User Story:** As a user, I want to view, search, filter, and sort all recorded transactions so that I can find and manage individual expenses.

#### Acceptance Criteria

1. THE Application SHALL display all expenses for the current month in a scrollable list ordered by newest date first by default.
2. THE Application SHALL render each transaction list item with: a category badge, the item name, the transaction date in YYYY-MM-DD format, the category name, and the amount formatted as Indonesian Rupiah.
3. THE Application SHALL render a delete button on each transaction list item.
4. WHEN the user activates a transaction delete button, THE Application SHALL display a confirmation dialog before deleting.
5. WHEN the user cancels the confirmation dialog, THE Application SHALL close the dialog and take no further action.
6. WHEN the user confirms deletion, THE Application SHALL remove the expense from Local_Storage and re-render the Dashboard, Chart, and Transaction list within 500 milliseconds.
7. THE Application SHALL provide a search input that filters the transaction list to show only items whose name contains the search string (case-insensitive); an empty search string SHALL show all transactions.
8. THE Application SHALL provide a category filter control with a default "All Categories" option that shows all transactions when selected, plus one option per category.
9. THE Application SHALL provide a sort control defaulting to "Newest First" with the following options: Newest First, Oldest First, Amount High-to-Low, Amount Low-to-High, Category A-Z.
10. WHEN the user changes the search input, category filter, or sort control, THE Application SHALL re-render the transaction list within 500 milliseconds without a page reload.
11. WHEN the active search or filter combination matches no transactions, THE Application SHALL display the message "No transactions found." in the list area.

---

### Requirement 9: Monthly Summary View

**User Story:** As a user, I want to review the spending summary for any past or current month so that I can track financial trends over time.

#### Acceptance Criteria

1. THE Application SHALL provide a Month_Selector control that allows the user to select any month for which at least one transaction exists, defaulting to the current month.
2. WHEN the user selects a month in the Month_Selector, THE Application SHALL display the following for that month within 500 milliseconds: total spending, transaction count, largest spending category, daily average spending (total spending divided by the number of calendar days in the selected month, rounded to the nearest whole Rupiah), and a category breakdown.
3. THE Application SHALL display the category breakdown as a list of rows sorted by total amount descending, each showing: category name, total amount, percentage of monthly total (rounded to one decimal place), and a proportional progress bar scaled to the category with the highest total.
4. THE Application SHALL format all currency values in the Monthly Summary using the Indonesian Rupiah format.
5. WHEN the selected month has no transactions, THE Application SHALL display the message "No data available for this month." in the Monthly Summary section.

---

### Requirement 10: Data Export

**User Story:** As a user, I want to export my transaction data as a CSV file so that I can analyse it in a spreadsheet application.

#### Acceptance Criteria

1. THE Application SHALL provide an "Export CSV" button in the Data Tools section.
2. WHEN the user activates the "Export CSV" button, THE Application SHALL generate a CSV file containing all transactions across all months, sorted by date ascending.
3. THE CSV file SHALL include the following columns with a header row: Date (YYYY-MM-DD format), Item Name, Category, Amount (plain numeric value without currency symbol).
4. WHEN the user activates the "Export CSV" button, THE Application SHALL trigger a browser file download of the generated CSV without a page reload.
5. IF no transactions exist, THEN THE Application SHALL display the message "No transactions to export." instead of generating a CSV file.

---

### Requirement 11: Clear All Data

**User Story:** As a user, I want to reset the application to a clean state so that I can start fresh or remove test data.

#### Acceptance Criteria

1. THE Application SHALL provide a "Clear All Data" button in the Data Tools section.
2. WHEN the user activates the "Clear All Data" button, THE Application SHALL display a confirmation dialog containing: a description stating that all transactions, the budget, and custom categories will be permanently deleted and cannot be recovered; a "Confirm" button; and a "Cancel" button.
3. WHEN the user activates the "Confirm" button in the confirmation dialog, THE Application SHALL remove all transactions, the budget value, and all custom categories from Local_Storage.
4. WHEN the clear-all action completes, THE Application SHALL re-render all sections of the UI to reflect the empty state within 500 milliseconds.
5. WHEN the user activates the "Cancel" button in the confirmation dialog, THE Application SHALL close the dialog and take no further action.

---

### Requirement 12: Local Storage Persistence

**User Story:** As a user, I want all my data to persist across browser sessions so that I do not lose my records when I close or refresh the page.

#### Acceptance Criteria

1. THE Application SHALL persist the Monthly Budget value in Local_Storage under a consistent key.
2. THE Application SHALL persist all Expense objects (including item name, amount, category, and date) in Local_Storage under a consistent key.
3. THE Application SHALL persist all custom Category names in Local_Storage under a consistent key.
4. THE Application SHALL persist the user's theme preference (light or dark) in Local_Storage under a consistent key.
5. WHEN the Application is loaded, THE Application SHALL read all persisted data from Local_Storage and render the Dashboard, Chart, Transaction list, and Monthly Summary with the restored data before any input controls become interactive.
6. IF Local_Storage is unavailable or throws an error on read, THEN THE Application SHALL display a warning banner informing the user that data cannot be saved, while all other application functions remain operational.
7. IF persisted data in Local_Storage is malformed or fails JSON parsing, THEN THE Application SHALL discard the malformed value, initialize that data store to its empty default, and display a warning message to the user.

---

### Requirement 13: Design System and Visual Quality

**User Story:** As a user, I want a visually polished and consistent interface so that the application feels professional and trustworthy.

#### Acceptance Criteria

1. THE Application SHALL use the following color palette in Light Mode: Primary Blue #0A84FF, Deep Blue #0066CC, Soft Blue #EAF4FF, Background #F5F9FF, Card Background #FFFFFF, Primary Text #1D1D1F, Secondary Text #6E6E73, Border #D9E7F5, Success #34C759, Warning #FF9F0A, Danger #FF453A.
2. THE Application SHALL use the following color palette in Dark Mode: Background #0B1220, Card Background #111C2E, Primary Text #F5F7FA, Secondary Text #AAB7C7, Blue Accent #0A84FF, Borders #22334D.
3. THE Application SHALL apply the font stack: -apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Segoe UI", Roboto, Helvetica, Arial, sans-serif throughout all UI elements.
4. THE Application SHALL apply rounded corners of 12px to 18px on cards and modals.
5. THE Application SHALL apply rounded corners of 10px to 12px on buttons.
6. THE Application SHALL apply CSS transitions of 150ms to 250ms on interactive elements for hover and state changes.
7. THE Application SHALL use inline SVG icons for all iconographic elements rather than external icon fonts or emoji.
8. THE Application SHALL render the layout responsively on viewport widths from 360px to 1440px such that: no horizontal scrollbar appears, all form controls are reachable and activatable, and all text remains readable without zooming.

---

### Requirement 14: Technical Constraints

**User Story:** As a developer, I want the application to be built with a constrained technology set so that it remains dependency-free and portable.

#### Acceptance Criteria

1. THE Application SHALL be implemented using only HTML, CSS, and Vanilla JavaScript with no frontend frameworks (React, Vue, Angular, Svelte, or equivalent).
2. THE Application SHALL load Chart.js version 4.x exclusively from a CDN `<script>` tag with no local copy or npm installation.
3. THE Application SHALL NOT use any CSS framework (Tailwind, Bootstrap, or equivalent).
4. THE Application SHALL NOT require a backend server, build tool, or Node.js runtime to function.
5. THE Application SHALL be structured as exactly the following files: `index.html`, `css/style.css`, and `js/app.js`.
6. THE Application SHALL produce correct visual output and complete all user interactions without JavaScript errors in the browser console when run in current versions of Chrome, Firefox, Safari, and Edge.
