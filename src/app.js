/**
 * app.js — Dashboard orchestrator
 * Chịu trách nhiệm nạp dữ liệu, tính toán KPI và điều phối các biểu đồ.
 */
import * as d3 from 'd3';
import { loadListingsData, loadJSON } from './utils/dataLoader.js';
import { drawLollipop }    from './charts/lollipopChart.js';
import { initLineChart }   from './charts/lineChart.js';
import { initStackedBar }  from './charts/stackedBar.js';
import { initResponseBar } from './charts/responseBar.js';
import { drawQ2Monthly }   from './charts/q2_monthly.js';
import { drawQ3Sweetspot } from './charts/q3_sweetspot.js';
import { drawQ3Slope }     from './charts/q3_slope.js';
import { drawQ5Scatter }   from './charts/q5_scatter.js';
import { drawQ6SupplyDemand } from './charts/q6_supply_demand.js';
import { drawQ7ReviewsArea } from './charts/q7_reviews_area.js';
import { store } from './store.js';

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

    // Initialize Store
    store.setData(data);

    // 2. Nạp dữ liệu bổ sung & Tính toán KPI
    const kpiData = await loadJSON('/data/kpi.json');
    const q2Data = await loadJSON('/data/q2_monthly.json');
    const q3Data = await loadJSON('/data/q3_agg.json');
    const q5ScatterData = await loadJSON('/data/q5_scatter.json');
    const q6Data = await loadJSON('/data/q6_supply_demand.json');
    const q7Data = await loadJSON('/data/q7_reviews_area.json');

    // 3. Khởi tạo các biểu đồ mới
    drawQ2Monthly(q2Data, 'q2-monthly-svg');
    drawQ3Sweetspot(q3Data, 'q3-sweetspot-svg');
    drawQ3Slope(q3Data, 'q3-slope-svg');
    if(q5ScatterData) drawQ5Scatter(q5ScatterData, 'q5-chart-svg');
    drawQ6SupplyDemand(q6Data, 'q6-chart-svg');
    drawQ7ReviewsArea(q7Data, 'q7-chart-svg');
    
    // Add event listeners for Q6 filters
    const q6NeighFilter = document.getElementById('q6-filter-neigh');
    const q6RoomFilter = document.getElementById('q6-filter-room');
    if (q6NeighFilter) q6NeighFilter.addEventListener('change', () => drawQ6SupplyDemand(q6Data, 'q6-chart-svg'));
    if (q6RoomFilter) q6RoomFilter.addEventListener('change', () => drawQ6SupplyDemand(q6Data, 'q6-chart-svg'));

    // Q7 Stacked Area Chart - No filters needed

    // 4. Khởi tạo các biểu đồ cũ và áp dụng Cross-Filtering
    drawLollipop(store.getFilteredData(), 'lollipop-svg');
    const lineChart = initLineChart('line-svg');

    const stackedBar = initStackedBar('stacked-svg');
    const responseBar = initResponseBar('response-svg');

    // Đăng ký update chart vào store
    store.subscribe((filteredData) => {
      stackedBar.update(filteredData);
      responseBar.update(filteredData);
      lineChart.update(filteredData);
      renderKPIs(filteredData, kpiData);
    });

    // Initial render
    stackedBar.update(store.getFilteredData());
    responseBar.update(store.getFilteredData());
    lineChart.update(store.getFilteredData());
    renderKPIs(store.getFilteredData(), kpiData);

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
function renderKPIs(data, kpiData) {
  const kpiContainer = document.getElementById('kpi-bar');
  if (!kpiContainer) return;

  // 1. Tính toán KPIs từ dữ liệu đã lọc (dynamic)
  const totalListings = data.length;
  const totalEstRev   = d3.sum(data, d => (d.price || 0) * (365 - d.availability365));
  const avgOccupancy  = d3.mean(data, d => (365 - d.availability365) / 365) * 100 || 0;
  const avgPrice      = d3.mean(data, d => d.price) || 0;

  // KPIs cũ (Host related)
  const totalHosts    = new Set(data.map(d => d.hostId)).size;
  const superhostPct  = totalListings > 0 ? Math.round(data.filter(d => d.isSuperhost).length / totalListings * 100) : 0;
  
  const responseData  = data.filter(d => d.responseTime && d.responseTime !== 'N/A');
  const fastResponse  = responseData.filter(d => d.responseTime.toLowerCase().includes('within an hour')).length;
  const responseRate  = responseData.length > 0 ? Math.round(fastResponse / responseData.length * 100) : 0;

  // Formatting
  const fmtListings = d3.format(",")(totalListings);
  const fmtRev      = totalEstRev > 1e6 
                      ? "$" + d3.format(",.1f")(totalEstRev / 1e6) + "M"
                      : "$" + d3.format(",.0f")(totalEstRev / 1e3) + "K";
  const fmtPrice    = "$" + d3.format(",.0f")(avgPrice);

  // Cập nhật giao diện
  kpiContainer.innerHTML = `
    <div class="kpi-item kpi-item--primary">
      <span class="kpi-value">${fmtListings}</span>
      <span class="kpi-label">Tổng Listing</span>
    </div>
    <div class="kpi-item kpi-item--primary">
      <span class="kpi-value">${fmtRev}</span>
      <span class="kpi-label">Tổng Est Rev</span>
    </div>
    <div class="kpi-item kpi-item--primary">
      <span class="kpi-value">${fmtPrice}</span>
      <span class="kpi-label">Giá trung bình</span>
    </div>
    
    <div class="kpi-item kpi-item--circular" id="occupancy-kpi">
      <div class="circular-chart-wrapper"></div>
      <span class="kpi-label">Tỉ lệ lấp đầy</span>
    </div>

    <div class="kpi-divider"></div>

    <div class="kpi-item">
      <span class="kpi-value">${totalHosts}</span>
      <span class="kpi-label">Chủ nhà</span>
    </div>
    <div class="kpi-item">
      <span class="kpi-value">${superhostPct}%</span>
      <span class="kpi-label">Superhost</span>
    </div>
    <div class="kpi-item">
      <span class="kpi-value">${responseRate}%</span>
      <span class="kpi-label">Phản hồi <1h</span>
    </div>
  `;

  // Render circular chart cho Occupancy
  drawOccupancyCircle(avgOccupancy / 100, '#occupancy-kpi .circular-chart-wrapper');
}

/**
 * Vẽ vòng tròn Donut hiển thị tỉ lệ lấp đầy
 */
function drawOccupancyCircle(rate, selector) {
  const container = d3.select(selector);
  container.selectAll("*").remove(); // Xóa cũ trước khi vẽ mới
  const width = 60;
  const height = 60;
  const strokeWidth = 6;
  const radius = Math.min(width, height) / 2;

  // Đặt chữ phần trăm ở giữa
  container.append("div")
    .attr("class", "circular-text")
    .text(d3.format(".1%")(rate))
    .style("position", "absolute")
    .style("top", "50%")
    .style("left", "50%")
    .style("transform", "translate(-50%, -50%)")
    .style("font-size", "14px")
    .style("font-weight", "700")
    .style("color", "#2ca02c");

  container.style("position", "relative").style("width", width + "px").style("height", height + "px");

  const svg = container.append("svg")
    .attr("width", width)
    .attr("height", height)
    .append("g")
    .attr("transform", `translate(${width / 2},${height / 2})`);

  const arcBg = d3.arc()
    .innerRadius(radius - strokeWidth)
    .outerRadius(radius)
    .startAngle(0)
    .endAngle(2 * Math.PI);

  svg.append("path")
    .attr("d", arcBg)
    .attr("fill", "rgba(255,255,255,0.2)");

  svg.append("path")
    .attr("fill", "#2ca02c")
    .transition()
    .duration(1200)
    .ease(d3.easeCubicOut)
    .attrTween("d", function() {
      const interpolate = d3.interpolate(0, rate * 2 * Math.PI);
      return function(t) {
        const tempArc = d3.arc()
          .innerRadius(radius - strokeWidth)
          .outerRadius(radius)
          .startAngle(0)
          .endAngle(interpolate(t))
          .cornerRadius(strokeWidth / 2);
        return tempArc();
      };
    });
}