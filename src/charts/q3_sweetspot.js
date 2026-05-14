import * as d3 from 'd3';

export function drawQ3Sweetspot(data, containerId) {
    const width = 800;
    const height = 520;
    const margin = { top: 40, right: 180, bottom: 70, left: 70 };
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
      .attr("y", 15)
      .text("Sweet Spot Map — Price vs Occupancy by Room Type & Size");

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
      .range(["#4E79A7", "#F28E2B", "#E15759", "#76B7B2"]);

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
        .attr("y", 40)
        .style("text-anchor", "middle")
        .text("Average nightly price (USD)");

      const yAxisG = g.append("g")
        .call(yAxis);

      yAxisG.append("text")
        .attr("class", "axis-label")
        .attr("transform", "rotate(-90)")
        .attr("x", -innerHeight / 2)
        .attr("y", -45)
        .style("text-anchor", "middle")
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
      g.append("text").attr("class", "quadrant-label")
        .attr("x", innerWidth - pad).attr("y", pad)
        .style("text-anchor", "end")
        .text("Sweet spot 🎯");

      g.append("text").attr("class", "quadrant-label")
        .attr("x", pad).attr("y", pad)
        .style("text-anchor", "start")
        .text("Tăng giá đi ↑");

      g.append("text").attr("class", "quadrant-label")
        .attr("x", innerWidth - pad).attr("y", innerHeight - pad)
        .style("text-anchor", "end")
        .text("Đang định giá sai ⚠");

      g.append("text").attr("class", "quadrant-label")
        .attr("x", pad).attr("y", innerHeight - pad)
        .style("text-anchor", "start")
        .text("Cold zone ❄");

      // State
      let activeRoomType = null;

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

          if (!activeRoomType) {
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
          if (!activeRoomType) {
            d3.selectAll(".bubble").attr("opacity", 0.75);
          } else {
            d3.selectAll(".bubble").attr("opacity", d => d.room_type === activeRoomType ? 0.75 : 0.15);
          }
        })
        .on("click", function(event, d) {
          if (activeRoomType === d.room_type) {
            activeRoomType = null;
            d3.selectAll(".bubble").attr("opacity", 0.75);
          } else {
            activeRoomType = d.room_type;
            d3.selectAll(".bubble").attr("opacity", b => b.room_type === activeRoomType ? 0.75 : 0.15);
          }
        });

      // LEGEND
      const legendX = width - margin.right + 20;
      let legendY = margin.top;

      const legend = svg.append("g");

      // Legend 1: Room Type
      legend.append("text")
        .attr("class", "legend-title")
        .attr("x", legendX)
        .attr("y", legendY)
        .text("Room type");
      legendY += 20;

      colorScale.domain().forEach(rt => {
        const item = legend.append("g")
          .attr("class", "legend-item")
          .attr("transform", `translate(${legendX}, ${legendY})`)
          .on("click", () => {
            if (activeRoomType === rt) {
              activeRoomType = null;
              d3.selectAll(".bubble").attr("opacity", 0.75);
            } else {
              activeRoomType = rt;
              d3.selectAll(".bubble").attr("opacity", b => b.room_type === activeRoomType ? 0.75 : 0.15);
            }
          });

        item.append("circle")
          .attr("r", 5)
          .attr("fill", colorScale(rt));

        item.append("text")
          .attr("class", "legend-text")
          .attr("x", 12)
          .attr("y", 4)
          .text(rt);

        legendY += 20;
      });

      legendY += 15;

      // Legend 2: Size Segment
      legend.append("text")
        .attr("class", "legend-title")
        .attr("x", legendX)
        .attr("y", legendY)
        .text("Accommodates");
      legendY += 25;

      shapeScale.domain().forEach(seg => {
        const item = legend.append("g")
          .attr("transform", `translate(${legendX + 5}, ${legendY})`);

        item.append("path")
          .attr("d", d3.symbol().type(shapeScale(seg)).size(50))
          .attr("fill", "#666");

        item.append("text")
          .attr("class", "legend-text")
          .attr("x", 12)
          .attr("y", 4)
          .text(seg.split(" ")[0]); // "Small", "Medium", "Large"

        legendY += 20;
      });

      legendY += 15;

      // Legend 3: Bubble Size
      legend.append("text")
        .attr("class", "legend-title")
        .attr("x", legendX)
        .attr("y", legendY)
        .text("Est. monthly rev");
      legendY += 30;

      const sizeValues = [500, 1500, 3000];
      sizeValues.forEach(val => {
        const r = sizeScale(val);
        const item = legend.append("g")
          .attr("transform", `translate(${legendX + 15}, ${legendY})`);

        item.append("circle")
          .attr("r", r)
          .attr("fill", "none")
          .attr("stroke", "#666");

        item.append("text")
          .attr("class", "legend-text")
          .attr("x", 25)
          .attr("y", 4)
          .text("$" + d3.format(",")(val));

        legendY += Math.max(r * 2 + 10, 25);
      });

    
}
