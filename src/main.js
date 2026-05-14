/**
 * main.js — Application entry point
 */
import './styles/main.css';
import { initDashboard } from './app.js';

// Đảm bảo DOM đã sẵn sàng trước khi chạy logic D3
document.addEventListener('DOMContentLoaded', () => {
  initDashboard().catch(err => {
    console.error("Dashboard initialization failed:", err);
  });
});