import * as d3 from 'd3';
import { store } from '../store.js';

export function drawQ3Sweetspot(data, containerId) {
    const width = 960;
    const height = 700;
    const margin = { top: 60, right: 40, bottom: 200, left: 80 };
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
    // svg.append("text")
    //   .attr("class", "title")
    //   .attr("x", margin.left)
    //   .attr("y", 15)
    //   .text("Sweet Spot Map — Price vs Occupancy by Room Type & Size");

    // svg.append("text")
    //   .attr("class", "subtitle")
    //   .attr("x", margin.left)
    //   .attr("y", 32)
    //   .text("Bubble size = estimated monthly revenue | Shape = accommodates segment");

    // Tooltip
    const tooltip = d3.select("body").append("div")
      .attr("class", "tooltip");

    // Colors
    const colorScale = d3.scaleOrdinal()
      .domain(["Entire home/apt", "Private room", "Shared room", "Hotel room"])
      .range(["#4E79A7", "#F28E2B", "#76B7B2", "#E15759"]);

    // Shapes
    const shapeScale = d3.scaleOrdinal()
      .domain(["Small (1–2)", "Medium (3–4)", "Large (5+)"])
      .range([d3.symbolCircle, d3.symbolSquare, d3.symbolTriangle]);

    // Load Data
    
      
      // Scales
      const xScale = d3.scaleLinear()
        .domain([0, d3.max(data, d => d.avg_price) * 1.05])
        .range([0, innerWidth]);

      const yScale = d3.scaleLinear()
        .domain([0, 1])
        .range([innerHeight, 0]);

      const sizeScale = d3.scaleSqrt()
        .domain([0, d3.max(data, d => d.avg_est_rev_monthly)])
        .range([8 * 8 * Math.PI, 40 * 40 * Math.PI]); 

      // Axes
      const xAxis = d3.axisBottom(xScale)
        .ticks(6)
        .tickFormat(d => "$" + d3.format(",.0f")(d))
      
      const yAxis = d3.axisLeft(yScale)
        .ticks(5)
        .tickFormat(d => d * 100 + "%");

      // Gridlines
      const xAxisGrid = d3.axisBottom(xScale).tickSize(-innerHeight).tickFormat('').ticks(6);
      const yAxisGrid = d3.axisLeft(yScale).tickSize(-innerWidth).tickFormat('').ticks(5);

      g.append('g')
        .attr('class', 'grid-line')
        .attr('transform', `translate(0,${innerHeight})`)
        .call(xAxisGrid);

      g.append('g')
        .attr('class', 'grid-line')
        .call(yAxisGrid);

      // Render Axes
      const xAxisG = g.append("g")
        .attr("transform", `translate(0, ${innerHeight})`)
        .call(xAxis);

      xAxisG.append("text")
        .attr("class", "axis-label")
        .attr("x", innerWidth / 2)
        .attr("y", 50)
        .style("text-anchor", "middle")
        .style("font-size", "16px")
        .style("font-weight", "500")
        .text("Average nightly price (USD)");

      const yAxisG = g.append("g")
        .call(yAxis);

      yAxisG.append("text")
        .attr("class", "axis-label")
        .attr("transform", "rotate(-90)")
        .attr("x", -innerHeight / 2)
        .attr("y", -55)
        .style("text-anchor", "middle")
        .style("font-size", "16px")
        .style("font-weight", "500")
        .text("Occupancy rate");

      // Medians & Quadrants
      const medianX = d3.median(data, d => d.avg_price);
      const medianY = d3.median(data, d => d.avg_occupancy);

      g.append("line")
        .attr("class", "quadrant-line")
        .attr("x1", xScale(medianX))
        .attr("x2", xScale(medianX))
        .attr("y1", 0)
        .attr("y2", innerHeight);

      g.append("line")
        .attr("class", "quadrant-line")
        .attr("x1", 0)
        .attr("x2", innerWidth)
        .attr("y1", yScale(medianY))
        .attr("y2", yScale(medianY));

      // Quadrant Labels
      const pad = 10;
      // g.append("text").attr("class", "quadrant-label")
      //   .attr("x", innerWidth - pad).attr("y", pad)
      //   .style("text-anchor", "end")
      //   .text("Sweet spot 🎯");

      // g.append("text").attr("class", "quadrant-label")
      //   .attr("x", pad).attr("y", pad)
      //   .style("text-anchor", "start")
      //   .text("Tăng giá đi ↑");

      // g.append("text").attr("class", "quadrant-label")
      //   .attr("x", innerWidth - pad).attr("y", innerHeight - pad)
      //   .style("text-anchor", "end")
      //   .text("Đang định giá sai ⚠");

      g.append("text").attr("class", "quadrant-label")
        .attr("x", pad).attr("y", innerHeight - pad)
        .style("text-anchor", "start")
        .style("font-size", "14px")
        .style("font-weight", "600")
        .text("Cold zone ❄");

      // State - now synchronized with global store
      function updateVisuals(filters) {
        const activeRoomType = filters.roomType;
        if (!activeRoomType) {
          d3.selectAll(".bubble").transition().duration(300).attr("opacity", 0.75);
        } else {
          d3.selectAll(".bubble").transition().duration(300)
            .attr("opacity", b => b.room_type === activeRoomType ? 0.75 : 0.1);
        }
      }

      // Listen for global store changes
      store.subscribe((_, filters) => {
        updateVisuals(filters);
      });

      // Bubbles
      const bubbles = g.selectAll(".bubble")
        .data(data)
        .enter()
        .append("path")
        .attr("class", "bubble")
        .attr("d", d3.symbol()
          .type(d => shapeScale(d.size_segment))
          .size(d => sizeScale(d.avg_est_rev_monthly))
        )
        .attr("transform", d => `translate(${xScale(d.avg_price)},${yScale(d.avg_occupancy)})`)
        .attr("fill", d => colorScale(d.room_type))
        .attr("stroke", "white")
        .attr("stroke-width", 1.5)
        .attr("opacity", 0.75)
        .on("mouseover", function(event, d) {
          tooltip.style("visibility", "visible")
            .html(`
              <b>${d.room_type}</b>
              <span>Size: ${d.size_segment}</span>
              <span>Avg price: $${d3.format(".0f")(d.avg_price)}</span>
              <span>Occupancy: ${(d.avg_occupancy * 100).toFixed(1)}%</span>
              <span>Est. monthly rev: $${d3.format(",.0f")(d.avg_est_rev_monthly)}</span>
              <span>Listings: ${d.listing_count}</span>
            `);

          if (!store.filters.roomType) {
            d3.selectAll(".bubble").attr("opacity", 0.3);
            d3.select(this).attr("opacity", 1.0);
          }
        })
        .on("mousemove", function(event) {
          tooltip.style("top", (event.pageY - 10) + "px")
            .style("left", (event.pageX + 15) + "px");
        })
        .on("mouseout", function() {
          tooltip.style("visibility", "hidden");
          updateVisuals(store.filters);
        })
        .on("click", function(event, d) {
          event.stopPropagation();
          store.setFilter('roomType', d.room_type);
        });

      // LEGEND BELOW CHART
      const legend = svg.append("g")
        .attr("transform", `translate(${margin.left}, ${margin.top + innerHeight + 80})`);

      const columns = [0, innerWidth / 3, (innerWidth / 3) * 2];

      // Legend 1: Room Type
      let roomTypeY = 0;
      legend.append("text")
        .attr("class", "legend-title")
        .attr("x", columns[0])
        .attr("y", roomTypeY)
        .style("font-size", "15px")
        .style("font-weight", "600")
        .text("Room type");
      roomTypeY += 18;

      colorScale.domain().forEach(rt => {
        const item = legend.append("g")
          .attr("class", "legend-item")
          .attr("transform", `translate(${columns[0]}, ${roomTypeY})`)
          .on("click", (event) => {
            event.stopPropagation();
            store.setFilter('roomType', rt);
          });

        item.append("circle")
          .attr("r", 5)
          .attr("fill", colorScale(rt));

        item.append("text")
          .attr("class", "legend-text")
          .attr("x", 14)
          .attr("y", 5)
          .style("font-size", "14px")
          .text(rt);

        roomTypeY += 20;
      });

      // Legend 2: Size Segment
      let segmentY = 0;
      legend.append("text")
        .attr("class", "legend-title")
        .attr("x", columns[1])
        .attr("y", segmentY)
        .style("font-size", "15px")
        .style("font-weight", "600")
        .text("Accommodates");
      segmentY += 18;

      shapeScale.domain().forEach(seg => {
        const item = legend.append("g")
          .attr("transform", `translate(${columns[1]}, ${segmentY})`);

        item.append("path")
          .attr("d", d3.symbol().type(shapeScale(seg)).size(50))
          .attr("fill", "#666");

        item.append("text")
          .attr("class", "legend-text")
          .attr("x", 14)
          .attr("y", 5)
          .style("font-size", "14px")
          .text(seg.split(" ")[0]);

        segmentY += 20;
      });

      // Legend 3: Bubble Size
      let sizeY = 0;
      legend.append("text")
        .attr("class", "legend-title")
        .attr("x", columns[2])
        .attr("y", sizeY)
        .style("font-size", "15px")
        .style("font-weight", "600")
        .text("Est. monthly rev");
      sizeY += 24;

      const sizeValues = [500, 1500, 3000];
      sizeValues.forEach(val => {
        const r = sizeScale(val);
        const item = legend.append("g")
          .attr("transform", `translate(${columns[2] + 10}, ${sizeY})`);

        item.append("circle")
          .attr("r", r)
          .attr("fill", "none")
          .attr("stroke", "#666");

        item.append("text")
          .attr("class", "legend-text")
          .attr("x", 30)
          .attr("y", 5)
          .style("font-size", "14px")
          .text("$" + d3.format(",")(val));

        sizeY += Math.max(r * 2 + 10, 25);
      });

    
}
