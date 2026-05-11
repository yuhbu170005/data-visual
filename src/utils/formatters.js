/**
 * formatters.js — Number and text formatting helpers
 *
 * Centralizes D3 format strings and other display utilities so
 * every chart uses the same locale-aware formatters.
 *
 * Usage:
 *   import { formatCurrency, formatInteger } from '../utils/formatters.js';
 *   formatCurrency(299.5); // "$299.50"
 */

import * as d3 from 'd3';

/** Format a value as USD currency (e.g. "$1,299.00") */
export const formatCurrency = d3.format('$,.2f');

/** Format a large integer with thousands separator (e.g. "12,345") */
export const formatInteger = d3.format(',d');

/** Format a value as a percentage with one decimal place (e.g. "87.3%") */
export const formatPercent = d3.format('.1%');

/**
 * Truncate a string to a maximum length, appending "…" if trimmed.
 *
 * @param {string} str
 * @param {number} maxLength
 * @returns {string}
 */
export function truncate(str, maxLength = 30) {
  if (!str || str.length <= maxLength) return str;
  return str.slice(0, maxLength - 1) + '…';
}
