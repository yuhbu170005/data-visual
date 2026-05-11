/**
 * app.js — Dashboard orchestrator
 *
 * Responsible for coordinating chart rendering and layout.
 * Import individual chart modules here and call their init functions.
 *
 * Example (once charts are implemented):
 *   import { initBarChart } from './charts/barChart.js';
 *   initBarChart('#bar-chart', data);
 */

/**
 * Initializes the dashboard.
 * Add chart initialization calls here as charts are built.
 */
export function initDashboard() {
  const dashboard = document.querySelector('.dashboard');

  if (!dashboard) {
    console.error('Dashboard container not found.');
    return;
  }

  // Placeholder message shown until charts are added
  dashboard.innerHTML = `
    <div class="placeholder">
      <p>Dashboard ready. Add charts in <code>src/app.js</code>.</p>
    </div>
  `;
}
