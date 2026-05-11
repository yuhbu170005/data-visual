/**
 * tooltip.js — Reusable tooltip component
 *
 * A lightweight, accessible tooltip that can be attached to any
 * D3 chart. It follows the mouse cursor and displays data details.
 *
 * Usage:
 *   import { createTooltip } from '../components/tooltip.js';
 *
 *   const tooltip = createTooltip();
 *
 *   // Inside a D3 event handler:
 *   selection
 *     .on('mouseover', (event, d) => tooltip.show(event, `<strong>${d.name}</strong><br/>$${d.price}`))
 *     .on('mousemove', (event) => tooltip.move(event))
 *     .on('mouseout', () => tooltip.hide());
 */

/**
 * Creates and manages a floating tooltip element.
 *
 * @returns {{ show: Function, move: Function, hide: Function, remove: Function }}
 */
export function createTooltip() {
  // TODO: implement tooltip component
  return {
    show: (_event, _html) => {},
    move: (_event) => {},
    hide: () => {},
    remove: () => {},
  };
}
