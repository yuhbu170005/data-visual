import * as d3 from 'd3';

export function drawQ3Slope(data, containerId) {
    const width = 760;
    const height = 660;
    const margin = { top: 60, right: 160, bottom: 30, left: 70 };
    const plotWidth = width - margin.left - margin.right;
    
    const subplotHeight = 220;
    const gap = 80;
    
    const subplotTopY = margin.top;
    const subplotBottomY = subplotTopY + subplotHeight + gap;

    d3.select(`#${containerId}`).selectAll("*").remove();
    const svg = d3.select(`#${containerId}`)
      .append("svg")
      .attr("viewBox", `0 0 ${width} ${height}`)
      .style("width", "100%")
      .style("height", "auto");


    // Title & Subtitle
    svg.append("text")
      .attr("class", "title")
      .attr("x", margin.left)
      .attr("y", 25)
      .text("Does Size Pay Off? Revenue & Occupancy by Room Size");

    // svg.append("text")
    //   .attr("class", "subtitle")
    //   .attr("x", margin.left)
    //   .attr("y", 45)
    //   .text("Top: estimated monthly revenue · Bottom: occupancy rate · Small→Medium→Large");

    // Tooltip
    const tooltip = d3.select("body").append("div")
      .attr("class", "tooltip");

    // Colors
    const colorScale = d3.scaleOrdinal()
      .domain(["Entire home/apt", "Private room", "Shared room", "Hotel room"])
      .range(["#4E79A7", "#F28E2B", "#E15759", "#76B7B2"]);

    const sizes = ["Small (1–2)", "Medium (3–4)", "Large (5+)"];

    
      
      // X Scale
      const xScale = d3.scalePoint()
        .domain(sizes)
        .range([0, plotWidth])
        .padding(0.4);

      // Y Scales
      const maxRev = d3.max(data, d => d.avg_est_rev_monthly);
      const yRevScale = d3.scaleLinear()
        .domain([0, maxRev * 1.15])
        .range([subplotHeight, 0]);

      const yOccScale = d3.scaleLinear()
        .domain([0, 1])
        .range([subplotHeight, 0]);

      // Draw vertical column lines and labels
      sizes.forEach(size => {
        const x = margin.left + xScale(size);
        // Column line across both subplots
        svg.append("line")
          .attr("class", "axis-line")
          .attr("x1", x).attr("x2", x)
          .attr("y1", subplotTopY).attr("y2", subplotBottomY + subplotHeight);
        
        // Top label
        svg.append("text")
          .attr("class", "col-label")
          .attr("x", x)
          .attr("y", subplotTopY - 10)
          .text(size);
          
        // Bottom label
        svg.append("text")
          .attr("class", "col-label")
          .attr("x", x)
          .attr("y", subplotBottomY + subplotHeight + 20)
          .text(size);
      });

      // Subplot Groups
      const topG = svg.append("g")
        .attr("transform", `translate(${margin.left},${subplotTopY})`);
        
      const bottomG = svg.append("g")
        .attr("transform", `translate(${margin.left},${subplotBottomY})`);

      // Y Axes
      topG.append("g").call(d3.axisLeft(yRevScale).ticks(4).tickFormat(d => "$" + d3.format(",.0f")(d)));
      bottomG.append("g").call(d3.axisLeft(yOccScale).ticks(4).tickFormat(d => (d * 100) + "%"));

      // Separator
      const sepY = subplotTopY + subplotHeight + gap / 2;
      svg.append("line")
        .attr("class", "separator-line")
        .attr("x1", margin.left)
        .attr("x2", margin.left + plotWidth)
        .attr("y1", sepY)
        .attr("y2", sepY);

      svg.append("text")
        .attr("class", "separator-text")
        .attr("x", margin.left + plotWidth / 2)
        .attr("y", sepY - 5)
        .text("Does higher occupancy explain the revenue trend?");

      // Group Data
      const grouped = d3.group(data, d => d.room_type);
      
      const lineRev = d3.line()
        .x(d => xScale(d.size_segment))
        .y(d => yRevScale(d.avg_est_rev_monthly));

      const lineOcc = d3.line()
        .x(d => xScale(d.size_segment))
        .y(d => yOccScale(d.avg_occupancy));

      let activeRoomType = null;

      function updateHighlight(roomType) {
        if (!roomType) {
          d3.selectAll(".data-line").style("opacity", 1).style("stroke-width", "2.5px");
          d3.selectAll(".data-dot").style("opacity", 1);
          d3.selectAll(".val-label").style("opacity", 1);
          d3.selectAll(".slope-label").style("opacity", 1);
        } else {
          d3.selectAll(".data-line")
            .style("opacity", function() { return d3.select(this).attr("data-type") === roomType ? 1 : 0.15; })
            .style("stroke-width", function() { return d3.select(this).attr("data-type") === roomType ? "4px" : "2.5px"; });
          
          d3.selectAll(".data-dot")
            .style("opacity", function() { return d3.select(this).attr("data-type") === roomType ? 1 : 0.15; });
            
          d3.selectAll(".val-label, .slope-label")
            .style("opacity", function() { return d3.select(this).attr("data-type") === roomType ? 1 : 0.15; });
        }
      }

      Array.from(grouped).forEach(([roomType, values]) => {
        // Sort values based on sizes
        values.sort((a, b) => sizes.indexOf(a.size_segment) - sizes.indexOf(b.size_segment));

        const color = colorScale(roomType);

        // -- TOP SUBPLOT (Revenue) --
        topG.append("path")
          .datum(values)
          .attr("class", "data-line")
          .attr("data-type", roomType)
          .attr("d", lineRev)
          .attr("stroke", color)
          .attr("stroke-width", 2.5)
          .on("mouseover", () => { if (!activeRoomType) updateHighlight(roomType); })
          .on("mouseout", () => { if (!activeRoomType) updateHighlight(null); });

        values.forEach(d => {
          topG.append("circle")
            .attr("class", "data-dot")
            .attr("data-type", roomType)
            .attr("cx", xScale(d.size_segment))
            .attr("cy", yRevScale(d.avg_est_rev_monthly))
            .attr("r", 5)
            .attr("fill", color)
            .attr("stroke", "white")
            .attr("stroke-width", 2)
            .on("mouseover", function(event) {
              if (!activeRoomType) updateHighlight(roomType);
              tooltip.style("visibility", "visible")
                .html(`
                  <b>${d.room_type}</b>
                  <span>Size: ${d.size_segment}</span>
                  <span>Est. monthly rev: $${d3.format(",.0f")(d.avg_est_rev_monthly)}</span>
                  <span>Occupancy: ${(d.avg_occupancy * 100).toFixed(1)}%</span>
                  <span>Avg price: $${d3.format(".0f")(d.avg_price)}</span>
                  <span>Listings: ${d.listing_count}</span>
                `);
            })
            .on("mousemove", function(event) {
              tooltip.style("top", (event.pageY - 10) + "px")
                .style("left", (event.pageX + 15) + "px");
            })
            .on("mouseout", function() {
              tooltip.style("visibility", "hidden");
              if (!activeRoomType) updateHighlight(null);
            });

          topG.append("text")
            .attr("class", "val-label")
            .attr("data-type", roomType)
            .attr("x", xScale(d.size_segment))
            .attr("y", yRevScale(d.avg_est_rev_monthly) - 10)
            .text("$" + d3.format(",.0f")(d.avg_est_rev_monthly));
        });

        // Slope annotation Top
        const smallValRev = values.find(v => v.size_segment === "Small (1–2)")?.avg_est_rev_monthly;
        const largeValRev = values.find(v => v.size_segment === "Large (5+)")?.avg_est_rev_monthly;
        if (smallValRev && largeValRev) {
          const pct = (largeValRev - smallValRev) / smallValRev * 100;
          const text = (pct >= 0 ? "▲ +" : "▼ ") + pct.toFixed(0) + "%";
          topG.append("text")
            .attr("class", `slope-label ${pct >= 0 ? "slope-up" : "slope-down"}`)
            .attr("data-type", roomType)
            .attr("x", xScale("Large (5+)") + 15)
            .attr("y", yRevScale(largeValRev) + 4)
            .text(text);
        }


        // -- BOTTOM SUBPLOT (Occupancy) --
        bottomG.append("path")
          .datum(values)
          .attr("class", "data-line")
          .attr("data-type", roomType)
          .attr("d", lineOcc)
          .attr("stroke", color)
          .attr("stroke-width", 2.5)
          .on("mouseover", () => { if (!activeRoomType) updateHighlight(roomType); })
          .on("mouseout", () => { if (!activeRoomType) updateHighlight(null); });

        values.forEach(d => {
          bottomG.append("circle")
            .attr("class", "data-dot")
            .attr("data-type", roomType)
            .attr("cx", xScale(d.size_segment))
            .attr("cy", yOccScale(d.avg_occupancy))
            .attr("r", 5)
            .attr("fill", color)
            .attr("stroke", "white")
            .attr("stroke-width", 2)
            .on("mouseover", function(event) {
              if (!activeRoomType) updateHighlight(roomType);
              tooltip.style("visibility", "visible")
                .html(`
                  <b>${d.room_type}</b>
                  <span>Size: ${d.size_segment}</span>
                  <span>Est. monthly rev: $${d3.format(",.0f")(d.avg_est_rev_monthly)}</span>
                  <span>Occupancy: ${(d.avg_occupancy * 100).toFixed(1)}%</span>
                  <span>Avg price: $${d3.format(".0f")(d.avg_price)}</span>
                  <span>Listings: ${d.listing_count}</span>
                `);
            })
            .on("mousemove", function(event) {
              tooltip.style("top", (event.pageY - 10) + "px")
                .style("left", (event.pageX + 15) + "px");
            })
            .on("mouseout", function() {
              tooltip.style("visibility", "hidden");
              if (!activeRoomType) updateHighlight(null);
            });

          bottomG.append("text")
            .attr("class", "val-label")
            .attr("data-type", roomType)
            .attr("x", xScale(d.size_segment))
            .attr("y", yOccScale(d.avg_occupancy) - 10)
            .text((d.avg_occupancy * 100).toFixed(1) + "%");
        });

        // Slope annotation Bottom
        const smallValOcc = values.find(v => v.size_segment === "Small (1–2)")?.avg_occupancy;
        const largeValOcc = values.find(v => v.size_segment === "Large (5+)")?.avg_occupancy;
        if (smallValOcc && largeValOcc) {
          const pct = (largeValOcc - smallValOcc) / smallValOcc * 100;
          const text = (pct >= 0 ? "▲ +" : "▼ ") + pct.toFixed(0) + "%";
          bottomG.append("text")
            .attr("class", `slope-label ${pct >= 0 ? "slope-up" : "slope-down"}`)
            .attr("data-type", roomType)
            .attr("x", xScale("Large (5+)") + 15)
            .attr("y", yOccScale(largeValOcc) + 4)
            .text(text);
        }
      });

      // LEGEND
      const legendX = margin.left + plotWidth + 40;
      // Center vertically across both subplots
      const totalHeight = subplotBottomY + subplotHeight - subplotTopY;
      let legendY = subplotTopY + totalHeight / 2 - 40; 

      const legend = svg.append("g");

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
              updateHighlight(null);
            } else {
              activeRoomType = rt;
              updateHighlight(rt);
            }
          });

        item.append("line")
          .attr("x1", 0).attr("x2", 15)
          .attr("y1", -4).attr("y2", -4)
          .attr("stroke", colorScale(rt))
          .attr("stroke-width", 3);

        item.append("text")
          .attr("class", "legend-text")
          .attr("x", 20)
          .attr("y", 0)
          .text(rt);

        legendY += 25;
      });

    
}
