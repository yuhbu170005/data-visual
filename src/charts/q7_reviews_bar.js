import * as d3 from 'd3';

export function drawQ7ReviewsBar(data, containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  d3.select(container).selectAll('*').remove();

  const width = container.clientWidth || 900;
  const height = 450;
  const margin = { top: 40, right: 150, bottom: 60, left: 60 };
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

  // CÁC THẺ SELECT (FILTERS)
  const yearFilter = document.getElementById('q7-filter-year');
  const neighFilter = document.getElementById('q7-filter-neigh');
  const roomFilter = document.getElementById('q7-filter-room');

  // Khởi tạo các Option cho Filter nếu chưa có
  if (yearFilter && yearFilter.options.length === 0) {
    const years = [...new Set(data.map(d => d.year))].sort().reverse();
    years.forEach(y => yearFilter.add(new Option(y, y)));
  }
  if (neighFilter && neighFilter.options.length === 1) {
    const neighs = [...new Set(data.map(d => d.neighbourhood))].sort();
    neighs.forEach(n => neighFilter.add(new Option(n, n)));
  }
  if (roomFilter && roomFilter.options.length === 1) {
    const rooms = [...new Set(data.map(d => d.roomType))].sort();
    rooms.forEach(r => roomFilter.add(new Option(r, r)));
  }

  const currentYear = yearFilter ? yearFilter.value : data[0].year;
  const currentNeigh = neighFilter ? neighFilter.value : "All";
  const currentRoom = roomFilter ? roomFilter.value : "All";

  // Lọc dữ liệu theo năm, khu vực, loại phòng
  let filteredData = data.filter(d => d.year === currentYear);
  if (currentNeigh !== "All") filteredData = filteredData.filter(d => d.neighbourhood === currentNeigh);
  if (currentRoom !== "All") filteredData = filteredData.filter(d => d.roomType === currentRoom);

  // Chuẩn bị Dữ liệu trước tháng (để tính toán % tăng trưởng MoM)
  // Lấy dữ liệu năm trước hoặc tháng trước của tất cả các listing đang hiển thị
  const allListingsInView = new Set(filteredData.map(d => d.listingId));
  const previousData = data.filter(d => allListingsInView.has(d.listingId));

  function getPreviousMonthCount(listingId, year, monthStr) {
    let m = parseInt(monthStr, 10);
    let y = parseInt(year, 10);
    m -= 1;
    if (m === 0) {
      m = 12;
      y -= 1;
    }
    const prevMStr = m.toString().padStart(2, '0');
    const prevYStr = y.toString();
    const prevRecord = previousData.find(d => d.listingId === listingId && d.year === prevYStr && d.month === prevMStr);
    return prevRecord ? prevRecord.count : null;
  }

  // Khung 12 tháng cố định
  const months = ["01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12"];
  const monthLabels = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  // Nhóm theo Month -> Listing ID -> Count
  const groupedByMonth = d3.group(filteredData, d => d.month);
  
  // Transform data cho d3.stack()
  const stackData = months.map(m => {
    const obj = { month: m };
    const monthData = groupedByMonth.get(m) || [];
    monthData.forEach(d => {
      obj[d.listingId] = d.count;
    });
    return obj;
  });

  // Tìm tất cả Listing ID có mặt trong dữ liệu đã lọc
  const uniqueListings = [...allListingsInView];
  
  const stack = d3.stack()
    .keys(uniqueListings)
    .value((d, key) => d[key] || 0)
    .order(d3.stackOrderNone)
    .offset(d3.stackOffsetNone);

  const series = stack(stackData);

  const svg = d3.select(container)
    .append('svg')
    .attr('width', width)
    .attr('height', height);

  const g = svg.append('g')
    .attr('transform', `translate(${margin.left},${margin.top})`);

  // SCALES
  const x = d3.scaleBand()
    .domain(months)
    .range([0, innerWidth])
    .padding(0.2);

  const yMax = d3.max(series, s => d3.max(s, d => d[1])) || 10;
  
  const y = d3.scaleLinear()
    .domain([0, yMax * 1.05])
    .range([innerHeight, 0])
    .nice();

  // Bảng màu lặp lại nếu có quá nhiều listing
  const color = d3.scaleOrdinal(d3.schemeCategory10).domain(uniqueListings);

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
    .call(d3.axisBottom(x).tickFormat((d, i) => monthLabels[i]))
    .attr('color', '#333')
    .selectAll("text")
    .attr("font-size", "12px");

  g.append('g')
    .call(d3.axisLeft(y).ticks(6))
    .attr('color', '#333');

  g.append('text')
    .attr('transform', 'rotate(-90)')
    .attr('x', -innerHeight / 2)
    .attr('y', -45)
    .attr('text-anchor', 'middle')
    .attr('fill', '#333')
    .attr('font-size', '13px')
    .attr('font-weight', '500')
    .text('Count of Reviews');

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

  // VẼ STACKED BAR
  g.append("g")
    .selectAll("g")
    .data(series)
    .join("g")
      .attr("fill", d => color(d.key))
      .attr("stroke", "#fff")
      .attr("stroke-width", 0.5)
    .selectAll("rect")
    .data(d => d.map(item => { item.listingId = d.key; return item; }))
    .join("rect")
      .attr("x", d => x(d.data.month))
      .attr("y", d => y(d[1]))
      .attr("height", d => y(d[0]) - y(d[1]))
      .attr("width", x.bandwidth())
      .style("cursor", "pointer")
      .on("mouseover", function(event, d) {
        if(d[1] - d[0] === 0) return; // Ignore empty segments
        
        d3.select(this).attr("stroke", "#333").attr("stroke-width", 1.5).attr("opacity", 0.8);

        const count = d[1] - d[0];
        const monthIndex = months.indexOf(d.data.month);
        const monthName = monthLabels[monthIndex];
        
        const prevCount = getPreviousMonthCount(d.listingId, currentYear, d.data.month);
        
        let momHtml = "";
        if (prevCount === null || prevCount === 0) {
          momHtml = `<span style="color:#6c757d;">New / No prev data</span>`;
        } else {
          const pct = ((count - prevCount) / prevCount) * 100;
          const colorClass = pct >= 0 ? "color:#2e7d32;" : "color:#c62828;";
          const sign = pct > 0 ? "+" : "";
          momHtml = `<span style="font-weight:bold; ${colorClass}">${sign}${pct.toFixed(1)}%</span>`;
        }

        tooltip.html(`
          <div style="font-weight:bold; margin-bottom:4px; font-size:13px; color:${color(d.listingId)}">Listing ID: ${d.listingId}</div>
          <div style="margin-bottom:6px; border-bottom: 1px solid #eee; padding-bottom:4px;"><strong>Time:</strong> ${monthName} ${currentYear}</div>
          <div style="display:flex; justify-content:space-between; margin-top:2px;">
            <span>Reviews:</span>
            <strong>${count}</strong>
          </div>
          <div style="display:flex; justify-content:space-between; margin-top:2px;">
            <span>MoM Growth:</span>
            ${momHtml}
          </div>
        `)
          .style("top", (event.pageY - 20) + "px")
          .style("left", (event.pageX + 15) + "px")
          .style("visibility", "visible");
      })
      .on("mousemove", function(event) {
        tooltip.style("top", (event.pageY - 20) + "px").style("left", (event.pageX + 15) + "px");
      })
      .on("mouseleave", function(event, d) {
        d3.select(this).attr("stroke", "#fff").attr("stroke-width", 0.5).attr("opacity", 1);
        tooltip.style("visibility", "hidden");
      });

  // RIGHT LEGEND FOR LISTING IDS (MAX 10 to avoid overflow)
  const topListingsToShow = uniqueListings.slice(0, 15);
  
  const legendGroup = svg.append("g")
    .attr("transform", `translate(${width - margin.right + 20}, ${margin.top})`);
    
  legendGroup.append("text")
    .attr("font-size", "12px")
    .attr("font-weight", "600")
    .attr("y", -10)
    .text("Listings (Top 15)");

  const legends = legendGroup.selectAll("g")
    .data(topListingsToShow)
    .join("g")
    .attr("transform", (d, i) => `translate(0, ${i * 20})`);

  legends.append("rect")
    .attr("width", 12)
    .attr("height", 12)
    .attr("fill", d => color(d));

  legends.append("text")
    .attr("x", 20)
    .attr("y", 10)
    .attr("font-size", "11px")
    .attr("fill", "#333")
    .text(d => d);
    
  if (uniqueListings.length > 15) {
     legendGroup.append("text")
      .attr("x", 0)
      .attr("y", 15 * 20 + 10)
      .attr("font-size", "11px")
      .attr("font-style", "italic")
      .attr("fill", "#666")
      .text(`+ ${uniqueListings.length - 15} more...`);
  }
}
