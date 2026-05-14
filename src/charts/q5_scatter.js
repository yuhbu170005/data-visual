import * as d3 from 'd3';
import { store } from '../store.js';

export function drawQ5Scatter(data, containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  d3.select(container).selectAll('*').remove();

  const width = container.clientWidth || 900;
  const height = 550;
  const margin = { top: 20, right: 30, bottom: 60, left: 80 };
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

  // POPULATE FILTERS
  const roomFilter = document.getElementById('q5-filter-room');
  const neighFilter = document.getElementById('q5-filter-neigh');
  const priceFilter = document.getElementById('q5-filter-price');

  if (roomFilter && roomFilter.options.length === 1) {
    const rooms = [...new Set(data.map(d => d.roomType))].sort();
    rooms.forEach(r => roomFilter.add(new Option(r, r)));
  }

  if (neighFilter && neighFilter.options.length === 1) {
    // Only top 20 neighbourhoods for dropdown to keep it manageable
    const neighCounts = d3.rollup(data, v => v.length, d => d.neighbourhood);
    const neighs = [...neighCounts.keys()].sort((a, b) => neighCounts.get(b) - neighCounts.get(a)).slice(0, 30);
    neighs.forEach(n => neighFilter.add(new Option(n, n)));
  }

  const svg = d3.select(container)
    .append('svg')
    .attr('width', width)
    .attr('height', height);

  // Vùng clipping để khi zoom các chấm không đè lên trục
  svg.append("defs").append("clipPath")
    .attr("id", "clip-q5")
    .append("rect")
    .attr("width", innerWidth)
    .attr("height", innerHeight);

  const g = svg.append('g')
    .attr('transform', `translate(${margin.left},${margin.top})`);

  // SCALES (Initial)
  const x = d3.scaleLinear()
    .domain([0, d3.max(data, d => d.price) * 1.05])
    .range([0, innerWidth]);

  const y = d3.scaleLinear()
    .domain([0, d3.max(data, d => d.revenue) * 1.05])
    .range([innerHeight, 0]);

  const sizeScale = d3.scaleSqrt()
    .domain([0, d3.max(data, d => d.reviews)])
    .range([2, 12]);

  const color = d3.scaleOrdinal(d3.schemeTableau10)
    .domain([...new Set(data.map(d => d.roomType))]);

  // AXES
  const xAxis = d3.axisBottom(x).tickFormat(d => `$${d}`);
  const yAxis = d3.axisLeft(y).tickFormat(d => `$${d3.format(".2s")(d)}`);

  const gX = g.append('g')
    .attr('class', 'axis x-axis')
    .attr('transform', `translate(0,${innerHeight})`)
    .call(xAxis);

  const gY = g.append('g')
    .attr('class', 'axis y-axis')
    .call(yAxis);

  // LABELS
  g.append('text')
    .attr('x', innerWidth / 2)
    .attr('y', innerHeight + 45)
    .attr('text-anchor', 'middle')
    .attr('fill', '#333')
    .attr('font-size', '13px')
    .text('Listing Price (USD)');

  g.append('text')
    .attr('transform', 'rotate(-90)')
    .attr('x', -innerHeight / 2)
    .attr('y', -60)
    .attr('text-anchor', 'middle')
    .attr('fill', '#333')
    .attr('font-size', '13px')
    .text('Estimated Revenue (Last 365 Days)');

  // TOOLTIP
  const tooltip = d3.select("body").append("div")
    .attr("class", "tooltip")
    .style("position", "absolute")
    .style("visibility", "hidden")
    .style("background", "rgba(255, 255, 255, 0.95)")
    .style("border", "1px solid #ccc")
    .style("padding", "10px")
    .style("border-radius", "6px")
    .style("pointer-events", "none")
    .style("box-shadow", "0 4px 15px rgba(0,0,0,0.1)")
    .style("font-size", "12px")
    .style("z-index", "1000");

  // DOTS GROUP with Clipping
  const dotsGroup = g.append('g')
    .attr("clip-path", "url(#clip-q5)");

  let dots = dotsGroup.selectAll('circle')
    .data(data)
    .join('circle')
    .attr('cx', d => x(d.price))
    .attr('cy', d => y(d.revenue))
    .attr('r', d => sizeScale(d.reviews))
    .attr('fill', d => color(d.roomType))
    .attr('opacity', 0.6)
    .attr('stroke', '#fff')
    .attr('stroke-width', 0.5)
    .style("cursor", "pointer")
    .on('mouseover', function(event, d) {
      d3.select(this)
        .attr('stroke', '#333')
        .attr('stroke-width', 1.5)
        .attr('opacity', 1);

      tooltip.html(`
        <div style="font-weight:bold; margin-bottom:4px; font-size:13px; color:${color(d.roomType)}">${d.roomType}</div>
        <div style="margin-bottom:6px; border-bottom: 1px solid #ccc; padding-bottom:6px;"><strong>Listing ID:</strong> ${d.id}</div>
        <div><strong>Neighbourhood:</strong> ${d.neighbourhood}</div>
        <div><strong>Price:</strong> $${d.price}</div>
        <div><strong>Revenue (1yr):</strong> $${d3.format(",")(Math.round(d.revenue))}</div>
        <div><strong>Reviews:</strong> ${d.reviews}</div>
      `)
        .style("top", (event.pageY - 20) + "px")
        .style("left", (event.pageX + 15) + "px")
        .style("visibility", "visible");
    })
    .on('mousemove', function(event) {
      tooltip.style("top", (event.pageY - 20) + "px")
             .style("left", (event.pageX + 15) + "px");
    })
    .on('mouseleave', function(event, d) {
      d3.select(this)
        .attr('stroke', '#fff')
        .attr('stroke-width', 0.5)
        .attr('opacity', 0.6);
      tooltip.style("visibility", "hidden");
    });

  // ZOOM BEHAVIOR
  const zoom = d3.zoom()
    .scaleExtent([0.5, 20])  // Limit zoom
    .extent([[0, 0], [innerWidth, innerHeight]])
    .on("zoom", (event) => {
      // Rescale axes
      const newX = event.transform.rescaleX(x);
      const newY = event.transform.rescaleY(y);
      
      // Update axes
      gX.call(xAxis.scale(newX));
      gY.call(yAxis.scale(newY));

      // Update dots position
      dots
        .attr('cx', d => newX(d.price))
        .attr('cy', d => newY(d.revenue));
    });

  // Áp dụng zoom vào một rect ẩn lót nền để bắt sự kiện chuột
  svg.insert("rect", ":first-child")
    .attr("width", width)
    .attr("height", height)
    .attr("fill", "transparent")
    .style("cursor", "crosshair")
    .call(zoom);

  // LỌC DỮ LIỆU
  function updateFilters() {
    const rVal = roomFilter ? roomFilter.value : "All";
    const nVal = neighFilter ? neighFilter.value : "All";
    const pVal = priceFilter ? priceFilter.value : "All";

    dots.style("display", d => {
      let match = true;
      if (rVal !== "All" && d.roomType !== rVal) match = false;
      if (nVal !== "All" && d.neighbourhood !== nVal) match = false;
      
      if (pVal !== "All") {
        if (pVal === "0-100" && d.price > 100) match = false;
        if (pVal === "101-300" && (d.price <= 100 || d.price > 300)) match = false;
        if (pVal === "301-1000" && (d.price <= 300 || d.price > 1000)) match = false;
        if (pVal === "1000+" && d.price <= 1000) match = false;
      }
      return match ? "block" : "none";
    });
  }

  if (roomFilter) roomFilter.addEventListener('change', updateFilters);
  if (neighFilter) neighFilter.addEventListener('change', updateFilters);
  if (priceFilter) priceFilter.addEventListener('change', updateFilters);

  // Sync with global store
  store.subscribe((_, filters) => {
    if (roomFilter) {
      roomFilter.value = filters.roomType || "All";
      updateFilters();
    }
  });

  // LEGEND HTML
  const legendContainer = d3.select(container).append("div")
    .attr("class", "legend")
    .style("display", "flex")
    .style("flex-wrap", "wrap")
    .style("gap", "1.5rem")
    .style("margin-top", "1rem")
    .style("padding-left", margin.left + "px");

  const roomTypes = [...new Set(data.map(d => d.roomType))];
  
  legendContainer.append("div")
    .style("font-weight", "600")
    .style("font-size", "13px")
    .style("margin-right", "8px")
    .text("Room Type:");

  roomTypes.forEach(rt => {
    const item = legendContainer.append("div")
      .attr("class", "legend-item");
      
    item.append("span")
      .attr("class", "legend-dot")
      .style("background", color(rt));
      
    item.append("span")
      .text(rt);
  });
}
