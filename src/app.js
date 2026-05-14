/**
 * app.js — Dashboard orchestrator
 * Chịu trách nhiệm nạp dữ liệu, tính toán KPI và điều phối các biểu đồ.
 */
import * as d3 from 'd3';
import { loadListingsData } from './utils/dataLoader.js';
import { drawLollipop }    from './charts/lollipopChart.js';
import { drawLineChart }   from './charts/lineChart.js';
import { drawStackedBar }  from './charts/stackedBar.js';
import { drawResponseBar } from './charts/responseBar.js';

/**
 * Khởi tạo Dashboard
 */
export async function initDashboard() {
  const dashboard = document.querySelector('.dashboard');

  // Kiểm tra container chính
  if (!dashboard) {
    console.error('Dashboard container (.dashboard) không tồn tại trong HTML.');
    return;
  }

  try {
    // 1. Nạp dữ liệu
    const data = await loadListingsData();

    // Kiểm tra nếu không có dữ liệu
    if (!data || data.length === 0) {
      dashboard.innerHTML = `
        <div class="placeholder">
          <p>Không tìm thấy dữ liệu hoặc file CSV trống.</p>
        </div>
      `;
      return;
    }

    // Xóa placeholder cũ nếu có trước khi vẽ
    // dashboard.innerHTML = ''; 

    // 2. Tính toán & Hiển thị KPI bar
    renderKPIs(data);

    // 3. Khởi tạo các biểu đồ
    // Lưu ý: Các ID như #lollipop-svg đã được định nghĩa trong file index.html chúng ta đã merge
    drawLollipop(data,    'lollipop-svg');
    drawLineChart(data,   'line-svg');
    drawStackedBar(data,  'stacked-svg');
    drawResponseBar(data, 'response-svg');

  } catch (error) {
    console.error('Lỗi khi khởi tạo Dashboard:', error);
    dashboard.innerHTML = `
      <div class="placeholder">
        <p style="color: var(--threshold);">Đã xảy ra lỗi khi tải dữ liệu. Vui lòng kiểm tra console.</p>
      </div>
    `;
  }
}

/**
 * Tính toán và render các chỉ số KPI lên header
 */
function renderKPIs(data) {
  const kpiContainer = document.getElementById('kpi-bar');
  if (!kpiContainer) return;

  // Logic tính toán
  const totalHosts    = new Set(data.map(d => d.hostId)).size;
  const superhostPct  = Math.round(data.filter(d => d.isSuperhost).length / data.length * 100);
  const avgListings   = d3.mean(data, d => d.listingsCount)?.toFixed(1) ?? '—';
  
  const responseData  = data.filter(d => d.responseTime && d.responseTime !== 'N/A');
  const fastResponse  = responseData.filter(d => d.responseTime.toLowerCase().includes('within an hour')).length;
  const responseRate  = responseData.length > 0 ? Math.round(fastResponse / responseData.length * 100) : 0;

  // Cập nhật giao diện
  kpiContainer.innerHTML = `
    <div class="kpi-item">
      <span class="kpi-value">${superhostPct}%</span>
      <span class="kpi-label">Superhost</span>
    </div>
    <div class="kpi-item">
      <span class="kpi-value">${avgListings}</span>
      <span class="kpi-label">Phòng / Host TB</span>
    </div>
    <div class="kpi-item">
      <span class="kpi-value">${responseRate}%</span>
      <span class="kpi-label">Phản hồi nhanh</span>
    </div>
    <div class="kpi-item">
      <span class="kpi-value">${totalHosts.toLocaleString()}</span>
      <span class="kpi-label">Tổng Host</span>
    </div>
  `;
}