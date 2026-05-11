/**
 * main.js — Application entry point
 *
 * Bootstraps the application by importing global styles
 * and initializing the dashboard.
 */

import './styles/main.css';
import { initDashboard } from './app.js';

// Initialize the dashboard once the DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  initDashboard();
});
