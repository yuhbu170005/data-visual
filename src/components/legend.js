/**
 * legend.js — Reusable chart legend component
 *
 * Renders a color legend for categorical or continuous scales.
 *
 * Usage:
 *   import { renderLegend } from '../components/legend.js';
 *
 *   renderLegend({
 *     container: '#legend',
 *     colorScale: myOrdinalScale,
 *     labels: ['Manhattan', 'Brooklyn', 'Queens', 'Bronx', 'Staten Island'],
 *   });
 */

/**
 * Render a categorical color legend inside a container element.
 *
 * @param {Object} options
 * @param {string}   options.container  - CSS selector for the legend container
 * @param {Function} options.colorScale - D3 color scale
 * @param {string[]} options.labels     - Array of label strings
 */
export function renderLegend({ container, colorScale, labels }) {
  // TODO: implement legend component
}
