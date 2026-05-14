import * as d3 from 'd3';

export function drawQ7ReviewsArea(dataObj, containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  d3.select(container).selectAll('*').remove();

  const width = container.clientWidth || 900;
  const height = 450;
  const margin = { top: 40, right: 150, bottom: 60, left: 60 };
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

  // The new format: dataObj = { listings: ["id1", "id2"...], data: [ { month: 11, year: 2024, monthName: "Nov 2024", "id1": 10... }, ... ] }
  const data = dataObj.data;
  const keys = dataObj.listings;

  // Parse Month for X axis
  const parseDate = d3.timeParse("%b %Y");
  const formatDate = d3.timeFormat("%b '%y");

  const formattedData = data.map(d => {
    const obj = { ...d, date: parseDate(d.monthName) };
    return obj;
  });

  const svg = d3.select(container)
    .append('svg')
    .attr('width', width)
    .attr('height', height);

  const g = svg.append('g')
    .attr('transform', `translate(${margin.left},${margin.top})`);

  // SCALES
  const x = d3.scaleTime()
    .domain(d3.extent(formattedData, d => d.date))
    .range([0, innerWidth]);

  // STACK DATA
  const stack = d3.stack()
    .keys(keys)
    .order(d3.stackOrderNone)
    .offset(d3.stackOffsetNone);

  const series = stack(formattedData);

  const yMax = d3.max(series, s => d3.max(s, d => d[1])) || 10;

  const y = d3.scaleLinear()
    .domain([0, yMax * 1.05])
    .range([innerHeight, 0])
    .nice();

  const color = d3.scaleOrdinal(d3.schemeCategory10).domain(keys);

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

  // AREA GENERATOR with tension 0.4 (curveMonotoneX or curveCatmullRom.alpha(0.5))
  const area = d3.area()
    .x(d => x(d.data.date))
    .y0(d => y(d[0]))
    .y1(d => y(d[1]))
    .curve(d3.curveMonotoneX);

  // VẼ CÁC LAYER
  const paths = g.selectAll(".layer")
    .data(series)
    .join("path")
      .attr("class", "layer")
      .attr("fill", d => color(d.key))
      .attr("stroke", "#fff")
      .attr("stroke-width", 0.5)
      .attr("opacity", 0.85)
      .attr("d", area)
      .style("transition", "opacity 0.2s");

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

  const verticalLine = g.append("line")
    .attr("y1", 0)
    .attr("y2", innerHeight)
    .attr("stroke", "#adb5bd")
    .attr("stroke-width", 1)
    .attr("stroke-dasharray", "4,4")
    .style("visibility", "hidden");

  // Tương tác hover trên chart
  g.append("rect")
    .attr("width", innerWidth)
    .attr("height", innerHeight)
    .attr("fill", "transparent")
    .on("mousemove", function(event) {
      const [mx] = d3.pointer(event);
      const hoveredDate = x.invert(mx);
      
      // Tìm điểm gần nhất
      let closestData = formattedData[0];
      let minDist = Infinity;
      formattedData.forEach(d => {
        const dist = Math.abs(d.date - hoveredDate);
        if (dist < minDist) {
          minDist = dist;
          closestData = d;
        }
      });

      if (!closestData) return;

      const px = x(closestData.date);
      verticalLine.attr("x1", px).attr("x2", px).style("visibility", "visible");

      // Tính tổng reviews tháng đó
      const totalMonth = keys.reduce((sum, key) => sum + (closestData[key] || 0), 0);

      let breakdownHtml = "";
      keys.forEach(k => {
        if (closestData[k] > 0) {
          breakdownHtml += `
            <div style="display:flex; justify-content:space-between; margin-top:2px;">
              <span style="color:${color(k)}; font-weight: 500;">Listing ${k}:</span>
              <strong style="margin-left: 15px;">${closestData[k]}</strong>
            </div>
          `;
        }
      });

      tooltip.html(`
        <div style="font-weight:bold; margin-bottom:6px; border-bottom: 1px solid #ccc; padding-bottom:4px;">
          ${closestData.monthName}
        </div>
        <div style="display:flex; justify-content:space-between; margin-bottom: 6px; font-weight: bold; color: #333;">
          <span>Total Top 5:</span>
          <span>${totalMonth}</span>
        </div>
        ${breakdownHtml}
      `)
        .style("top", (event.pageY - 20) + "px")
        .style("left", (event.pageX + 15) + "px")
        .style("visibility", "visible");
    })
    .on("mouseleave", function() {
      verticalLine.style("visibility", "hidden");
      tooltip.style("visibility", "hidden");
      paths.attr("opacity", 0.85);
    });

  // Tương tác highlight layer khi hover vào layer
  paths.on("mouseover", function(event, d) {
    paths.attr("opacity", 0.2);
    d3.select(this).attr("opacity", 1).attr("stroke-width", 1.5);
  }).on("mouseleave", function() {
    paths.attr("opacity", 0.85).attr("stroke-width", 0.5);
  });

  // LEGEND
  const legendGroup = svg.append("g")
    .attr("transform", `translate(${width - margin.right + 20}, ${margin.top})`);
    
  legendGroup.append("text")
    .attr("font-size", "12px")
    .attr("font-weight", "600")
    .attr("y", -10)
    .text("Top 5 Listings");

  const legends = legendGroup.selectAll("g.legend-item")
    .data(keys)
    .join("g")
    .attr("class", "legend-item")
    .attr("transform", (d, i) => `translate(0, ${i * 20})`)
    .style("cursor", "pointer")
    .on("mouseover", function(event, key) {
      paths.attr("opacity", d => d.key === key ? 1 : 0.1);
    })
    .on("mouseleave", function() {
      paths.attr("opacity", 0.85);
    });

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
}
