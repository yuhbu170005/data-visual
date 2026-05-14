import * as d3 from 'd3';

export function drawQ2Monthly(data, containerId) {
    const width = 960;
    const height = 620;
    const margin = { top: 60, right: 40, bottom: 150, left: 80 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    d3.select(`#${containerId}`).selectAll("*").remove();
    const svg = d3.select(`#${containerId}`)
      .append("svg")
      .attr("viewBox", `0 0 ${width} ${height}`)
      .style("width", "100%")
      .style("height", "auto");


    const g = svg.append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // Title & Subtitle
    svg.append("text")
      .attr("class", "title")
      .attr("x", margin.left)
      .attr("y", 25)
      .text("Monthly Est. Revenue by Borough");

    svg.append("text")
      .attr("class", "subtitle")
      .attr("x", margin.left)
      .attr("y", 45)
      .text("Calendar period: Nov 2025 – Nov 2026 · Booked days × nightly price");

    // Tooltip
    const tooltip = d3.select("body").append("div")
      .attr("class", "tooltip");

    // Colors & Order
    const stackOrder = ["Staten Island", "Queens", "Brooklyn", "Bronx", "Manhattan"];
    const legendOrder = ["Manhattan", "Bronx", "Brooklyn", "Queens", "Staten Island"]; // top-down

    const colorScale = d3.scaleOrdinal()
      .domain(["Manhattan", "Bronx", "Brooklyn", "Queens", "Staten Island"])
      .range(["#e15759", "#1f77b4", "#ff7f0e", "#76b7b2", "#2ca02c"]);

    // Load Data
    
      
      // Sort data by month_index
      data.sort((a, b) => a.month_index - b.month_index);

      // Helper function to get total revenue
      const totalRev = d => d3.sum(stackOrder, k => d[k] || 0);

      // Stack
      const stack = d3.stack()
        .keys(stackOrder)
        .order(d3.stackOrderNone)
        .offset(d3.stackOffsetNone);

      const series = stack(data);

      // Scales
      const xScale = d3.scaleBand()
        .domain(data.map(d => d.month))
        .range([0, innerWidth])
        .padding(0.25);

      const maxRev = d3.max(data, d => totalRev(d));
      
      const yScale = d3.scaleLinear()
        .domain([0, maxRev * 1.1])
        .range([innerHeight, 0]);

      // Gridlines
      const yAxisGrid = d3.axisLeft(yScale).tickSize(-innerWidth).tickFormat('').ticks(6);
      g.append('g')
        .attr('class', 'grid-line')
        .call(yAxisGrid);

      // Axes
      const xAxis = d3.axisBottom(xScale);
      
      const yAxis = d3.axisLeft(yScale)
        .ticks(6)
        .tickFormat(d => (d / 1e6).toFixed(0) + "M");

      // Render Axes
      const xAxisG = g.append("g")
        .attr("transform", `translate(0, ${innerHeight})`)
        .call(xAxis);

      xAxisG.selectAll("text")
        .attr("transform", "rotate(-45)")
        .style("text-anchor", "end")
        .attr("dx", "-0.6em")
        .attr("dy", "0.15em");

      const yAxisG = g.append("g")
        .call(yAxis);

      yAxisG.append("text")
        .attr("class", "axis-label")
        .attr("transform", "rotate(-90)")
        .attr("x", -innerHeight / 2)
        .attr("y", -50)
        .style("text-anchor", "middle")
        .text("Est Revenue");

      // State
      let activeBorough = null;

      function updateOpacities(hoverMonth = null, hoverBorough = null) {
        d3.selectAll('.bar-segment').attr('opacity', function() {
          const m = d3.select(this).attr('data-month');
          const b = d3.select(this).attr('data-borough');
          
          if (hoverMonth && hoverBorough) {
            if (m === hoverMonth) {
              return b === hoverBorough ? 1.0 : 0.4;
            } else {
              return activeBorough && activeBorough !== b ? 0.15 : 0.85;
            }
          } else {
            return activeBorough && activeBorough !== b ? 0.15 : 0.85;
          }
        });
      }

      // Draw Bars
      g.selectAll(".serie")
        .data(series)
        .enter().append("g")
          .attr("class", "serie")
          .attr("fill", d => colorScale(d.key))
        .selectAll("rect")
        .data(d => d)
        .enter().append("rect")
          .attr("class", "bar-segment")
          .attr("data-borough", function() { return d3.select(this.parentNode).datum().key; })
          .attr("data-month", d => d.data.month)
          .attr("x", d => xScale(d.data.month))
          .attr("y", d => yScale(d[1]))
          .attr("height", d => yScale(d[0]) - yScale(d[1]))
          .attr("width", xScale.bandwidth())
          .attr("stroke", "white")
          .attr("stroke-width", 0.5)
          .attr("rx", 0)
          .attr("opacity", 0.85)
          .on("mouseover", function(event, d) {
            const hoverB = d3.select(this.parentNode).datum().key;
            const m = d.data.month;
            
            updateOpacities(m, hoverB);

            const monthData = d.data;
            const total = totalRev(monthData);
            
            let html = `<div class="tooltip-header">${m}</div>`;
            legendOrder.forEach(borough => {
              const val = monthData[borough] || 0;
              html += `<div class="tooltip-row">
                <span><span class="dot" style="background-color: ${colorScale(borough)}"></span>${borough}</span>
                <span>$${(val / 1e6).toFixed(1)}M</span>
              </div>`;
            });
            html += `<div class="tooltip-row tooltip-total">
              <span>Total</span>
              <span>$${(total / 1e6).toFixed(1)}M</span>
            </div>`;

            tooltip.style("visibility", "visible").html(html);
          })
          .on("mousemove", function(event) {
            tooltip.style("top", (event.pageY - 20) + "px")
              .style("left", (event.pageX + 15) + "px");
          })
          .on("mouseout", function() {
            tooltip.style("visibility", "hidden");
            updateOpacities();
          });

      // Peak Annotation
      const peakMonthData = data.reduce((a, b) => totalRev(a) > totalRev(b) ? a : b);
      const peakTotal = totalRev(peakMonthData);
      const peakX = xScale(peakMonthData.month) + xScale.bandwidth() / 2;
      const peakY = yScale(peakTotal);

      g.append("text")
        .attr("class", "peak-annotation")
        .attr("x", peakX)
        .attr("y", peakY - 14)
        .text(`Peak: $${(peakTotal / 1e6).toFixed(0)}M`);

      g.append("text")
        .attr("class", "peak-arrow")
        .attr("x", peakX)
        .attr("y", peakY - 3)
        .text("↓");

      // Legend
      const legend = svg.append("g")
        .attr("transform", `translate(${margin.left}, ${margin.top + innerHeight + 80})`);

      legend.append("text")
        .attr("class", "legend-title")
        .attr("x", 0)
        .attr("y", 0)
        .text("Borough");

      const legendStep = innerWidth / legendOrder.length;
      legendOrder.forEach((borough, index) => {
        const item = legend.append("g")
          .attr("class", "legend-item")
          .attr("transform", `translate(${index * legendStep}, 18)`)
          .on("click", () => {
            if (activeBorough === borough) {
              activeBorough = null;
            } else {
              activeBorough = borough;
            }
            updateOpacities();
          });

        item.append("rect")
          .attr("width", 12)
          .attr("height", 12)
          .attr("fill", colorScale(borough));

        item.append("text")
          .attr("class", "legend-text")
          .attr("x", 18)
          .attr("y", 10)
          .text(borough);
      });

    
}
