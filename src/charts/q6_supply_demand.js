import * as d3 from 'd3';
import { store } from '../store.js';

export function drawQ6SupplyDemand(data, containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  d3.select(container).selectAll('*').remove();

  const width = container.clientWidth || 900;
  const height = 450;
  const margin = { top: 40, right: 120, bottom: 60, left: 60 };
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

  // FILTERS
  const neighFilter = document.getElementById('q6-filter-neigh');
  const roomFilter = document.getElementById('q6-filter-room');

  if (neighFilter && neighFilter.options.length === 1) {
    const neighs = [...new Set(data.map(d => d.neighbourhood))].sort();
    neighs.forEach(n => neighFilter.add(new Option(n, n)));
  }

  if (roomFilter && roomFilter.options.length === 1) {
    const rooms = [...new Set(data.map(d => d.roomType))].sort();
    rooms.forEach(r => roomFilter.add(new Option(r, r)));
  }

  // Khởi tạo trạng thái filter
  const currentNeigh = neighFilter ? neighFilter.value : "All";
  const currentRoom = roomFilter ? roomFilter.value : "All";

  // Lọc dữ liệu ban đầu
  let filteredData = data;
  if (currentNeigh !== "All") filteredData = filteredData.filter(d => d.neighbourhood === currentNeigh);
  if (currentRoom !== "All") filteredData = filteredData.filter(d => d.roomType === currentRoom);

  // Nhóm theo tháng và phòng để vẽ
  const parseDate = d3.timeParse("%Y-%m");
  const formatDate = d3.timeFormat("%b %Y");

  // Gom dữ liệu theo tháng cho Total Availability
  const monthAgg = d3.rollup(filteredData, 
    v => ({
      available: d3.sum(v, d => d.available),
      booked: d3.sum(v, d => d.booked)
    }),
    d => d.month
  );

  const monthsList = Array.from(monthAgg.keys()).sort();
  const timeline = monthsList.map(m => ({
    monthStr: m,
    date: parseDate(m),
    available: monthAgg.get(m).available,
    booked: monthAgg.get(m).booked,
    totalSupply: monthAgg.get(m).available + monthAgg.get(m).booked
  }));

  // Gom dữ liệu Booking theo từng Room Type
  const roomAgg = d3.rollup(filteredData,
    v => d3.sum(v, d => d.booked),
    d => d.roomType,
    d => d.month
  );

  const roomSeries = [];
  roomAgg.forEach((monthMap, roomType) => {
    const points = monthsList.map(m => ({
      date: parseDate(m),
      booked: monthMap.get(m) || 0,
      roomType: roomType
    }));
    roomSeries.push({ roomType, points });
  });

  const svg = d3.select(container)
    .append('svg')
    .attr('width', width)
    .attr('height', height);

  const g = svg.append('g')
    .attr('transform', `translate(${margin.left},${margin.top})`);

  // SCALES
  const x = d3.scaleTime()
    .domain(d3.extent(timeline, d => d.date))
    .range([0, innerWidth]);

  const maxSupply = d3.max(timeline, d => d.totalSupply) || 10;
  const y = d3.scaleLinear()
    .domain([0, maxSupply * 1.1])
    .range([innerHeight, 0])
    .nice();

  const color = d3.scaleOrdinal(d3.schemeTableau10)
    .domain([...new Set(data.map(d => d.roomType))]);

  // AXES
  g.append('g')
    .attr('class', 'grid')
    .attr('color', '#eee')
    .selectAll('line')
    .data(y.ticks(6))
    .join('line')
    .attr('x1', 0).attr('x2', innerWidth)
    .attr('y1', d => y(d)).attr('y2', d => y(d));

  g.append('g')
    .attr('transform', `translate(0,${innerHeight})`)
    .call(d3.axisBottom(x).ticks(d3.timeMonth.every(1)).tickFormat(formatDate))
    .attr('color', '#333')
    .selectAll("text")
    .attr("transform", "rotate(-45)")
    .style("text-anchor", "end")
    .attr("dx", "-0.8em")
    .attr("dy", "0.15em");

  g.append('g')
    .call(d3.axisLeft(y).ticks(6).tickFormat(d3.format(".2s")))
    .attr('color', '#333');

  g.append('text')
    .attr('transform', 'rotate(-90)')
    .attr('x', -innerHeight / 2)
    .attr('y', -45)
    .attr('text-anchor', 'middle')
    .attr('fill', '#333')
    .attr('font-size', '13px')
    .attr('font-weight', '500')
    .text('Nights (Count)');

  // BACKGROUND AREA: Total Supply (Available + Booked) vs Available
  const areaSupply = d3.area()
    .x(d => x(d.date))
    .y0(innerHeight)
    .y1(d => y(d.totalSupply))
    .curve(d3.curveMonotoneX);

  const areaAvailable = d3.area()
    .x(d => x(d.date))
    .y0(innerHeight)
    .y1(d => y(d.available))
    .curve(d3.curveMonotoneX);

  // Khu vực đại diện cho Toàn bộ Nguồn cung (Total Supply)
  g.append("path")
    .datum(timeline)
    .attr("fill", "#f1f3f5")
    .attr("d", areaSupply);

  // Khu vực đại diện cho Phòng Trống (Available/Unused Supply)
  g.append("path")
    .datum(timeline)
    .attr("fill", "#e9ecef")
    .attr("d", areaAvailable);

  // LINES: Booked demand by Room Type
  const line = d3.line()
    .x(d => x(d.date))
    .y(d => y(d.booked))
    .curve(d3.curveMonotoneX);

  g.selectAll('.room-line')
    .data(roomSeries)
    .join('path')
    .attr('class', 'room-line')
    .attr('fill', 'none')
    .attr('stroke', d => color(d.roomType))
    .attr('stroke-width', 2.5)
    .attr('d', d => line(d.points));

  // TOOLTIP INTERACTION
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

  const verticalLine = g.append("line")
    .attr("y1", 0)
    .attr("y2", innerHeight)
    .attr("stroke", "#adb5bd")
    .attr("stroke-width", 1)
    .attr("stroke-dasharray", "4,4")
    .style("visibility", "hidden");

  g.append("rect")
    .attr("width", innerWidth)
    .attr("height", innerHeight)
    .attr("fill", "transparent")
    .on("mousemove", function(event) {
      const [mx] = d3.pointer(event);
      const hoveredDate = x.invert(mx);
      
      // Tìm tháng gần nhất
      let closestData = timeline[0];
      let minDist = Infinity;
      timeline.forEach(d => {
        const dist = Math.abs(d.date - hoveredDate);
        if (dist < minDist) {
          minDist = dist;
          closestData = d;
        }
      });

      if (!closestData) return;

      const px = x(closestData.date);
      verticalLine.attr("x1", px).attr("x2", px).style("visibility", "visible");

      const occRate = closestData.totalSupply > 0 
        ? ((closestData.booked / closestData.totalSupply) * 100).toFixed(1) 
        : 0;

      let roomBreakdown = "";
      roomSeries.forEach(s => {
        const pt = s.points.find(p => p.date.getTime() === closestData.date.getTime());
        if (pt && pt.booked > 0) {
          roomBreakdown += `<div style="display:flex; justify-content:space-between; margin-top:2px;">
            <span style="color:${color(s.roomType)}">${s.roomType} (Booked):</span>
            <strong>${d3.format(",")(pt.booked)}</strong>
          </div>`;
        }
      });

      tooltip.html(`
        <div style="font-weight:bold; margin-bottom:6px; border-bottom: 1px solid #ccc; padding-bottom:4px;">
          ${formatDate(closestData.date)}
        </div>
        <div style="display:flex; justify-content:space-between;">
          <span>Total Supply (Nights):</span>
          <strong>${d3.format(",")(closestData.totalSupply)}</strong>
        </div>
        <div style="display:flex; justify-content:space-between; color:#495057;">
          <span>Unused Availability:</span>
          <strong>${d3.format(",")(closestData.available)}</strong>
        </div>
        <div style="display:flex; justify-content:space-between; margin-bottom: 6px;">
          <span>Total Booked:</span>
          <strong>${d3.format(",")(closestData.booked)}</strong>
        </div>
        <div style="display:flex; justify-content:space-between; font-weight: bold; margin-bottom: 6px;">
          <span>Occupancy Rate:</span>
          <span>${occRate}%</span>
        </div>
        ${roomBreakdown ? '<div style="margin-top:6px; padding-top:4px; border-top:1px solid #eee;">' + roomBreakdown + '</div>' : ''}
      `)
        .style("top", (event.pageY - 20) + "px")
        .style("left", (event.pageX + 15) + "px")
        .style("visibility", "visible");
    })
    .on("mouseleave", function() {
      verticalLine.style("visibility", "hidden");
      tooltip.style("visibility", "hidden");
    });

  // LEGEND HTML
  const legendContainer = d3.select(container).append("div")
    .attr("class", "legend")
    .style("display", "flex")
    .style("flex-wrap", "wrap")
    .style("gap", "1.5rem")
    .style("margin-top", "1rem")
    .style("padding-left", margin.left + "px");

  legendContainer.append("div")
    .style("font-weight", "600")
    .style("font-size", "13px")
    .style("margin-right", "8px")
    .text("Booked by Room Type:");

  roomSeries.forEach(s => {
    const item = legendContainer.append("div").attr("class", "legend-item");
    item.append("span").attr("class", "legend-dot").style("background", color(s.roomType));
    item.append("span").text(s.roomType);
  });
  
  const bgLegend = legendContainer.append("div").style("display", "flex").style("gap", "1rem").style("margin-left", "auto");
  
  const supItem = bgLegend.append("div").attr("class", "legend-item");
  supItem.append("span").attr("class", "legend-rect").style("background", "#f1f3f5").style("border", "1px solid #ccc");
  supItem.append("span").text("Total Supply");

  const availItem = bgLegend.append("div").attr("class", "legend-item");
  availItem.append("span").attr("class", "legend-rect").style("background", "#e9ecef").style("border", "1px solid #ccc");
  availItem.append("span").text("Unused Availability");

  // Sync with global store
  store.subscribe((_, filters) => {
    if (roomFilter && roomFilter.value !== (filters.roomType || "All")) {
      roomFilter.value = filters.roomType || "All";
      drawQ6SupplyDemand(data, containerId); // Redraw for simplicity in this complex chart
    }
  });
}
