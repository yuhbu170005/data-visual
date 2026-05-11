/**
 * dataLoader.js — Utility for loading datasets
 *
 * Wraps D3's fetch helpers so chart modules can load data
 * with a single, consistent call.
 *
 * Usage:
 *   import { loadCSV, loadJSON } from '../utils/dataLoader.js';
 *
 *   const data = await loadCSV('/data/hotels.csv');
 */

import * as d3 from 'd3';

/**
 * Load a CSV file from the public/data directory.
 *
 * @param {string} path - Path relative to the site root (e.g. '/data/hotels.csv')
 * @param {Function} [rowParser] - Optional D3 row conversion function
 * @returns {Promise<Array>}
 */
export async function loadCSV(path, rowParser) {
  return d3.csv(path, rowParser);
}

/**
 * Load a JSON file from the public/data directory.
 *
 * @param {string} path - Path relative to the site root (e.g. '/data/hotels.json')
 * @returns {Promise<any>}
 */
export async function loadJSON(path) {
  return d3.json(path);
}
