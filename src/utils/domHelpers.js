/**
 * domHelpers.js — DOM utility helpers
 *
 * Small convenience wrappers for creating and manipulating
 * DOM elements used across chart and component modules.
 *
 * Usage:
 *   import { createChartCard } from '../utils/domHelpers.js';
 *   const card = createChartCard('bar-chart', 'Price Distribution', 'Average nightly rate by borough');
 *   document.querySelector('.dashboard').appendChild(card);
 */

/**
 * Create a chart card element and append it to a container.
 *
 * @param {string} id       - Unique ID for the inner chart container
 * @param {string} title    - Card heading text
 * @param {string} [description] - Optional subtitle text
 * @returns {{ card: HTMLElement, chartContainer: HTMLElement }}
 */
export function createChartCard(id, title, description = '') {
  const card = document.createElement('div');
  card.className = 'chart-card';

  const heading = document.createElement('h2');
  heading.className = 'chart-title';
  heading.textContent = title;
  card.appendChild(heading);

  if (description) {
    const desc = document.createElement('p');
    desc.className = 'chart-description';
    desc.textContent = description;
    card.appendChild(desc);
  }

  const chartContainer = document.createElement('div');
  chartContainer.id = id;
  card.appendChild(chartContainer);

  return { card, chartContainer };
}
