import * as d3 from 'd3';

export function drawQ7StackedArea(data, containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  d3.select(container).selectAll('*').remove();

  const width = container.clientWidth || 1200;
  const height = 560;
  const margin = { top: 40, right: 40, bottom: 120, left: 70 };
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

  // Parse data
  const listings = data.listings;
  const monthData = data.data;

  // Define months (will use the monthName from data which includes year)
  const months = monthData.map((d, i) => i); // Just index array for x-axis
  const monthLabels = monthData.map(d => d.monthName); // Full labels with year

  // Transform data for d3.stack()
  const stackData = monthData.map((m, idx) => {
    const obj = { idx: idx };
    listings.forEach(lid => {
      obj[lid] = m[lid] || 0;
    });
    return obj;
  });

  // Setup stack generator
  const stack = d3.stack()
    .keys(listings)
    .value((d, key) => d[key] || 0)
    .order(d3.stackOrderNone)
    .offset(d3.stackOffsetNone);

  const series = stack(stackData);

  // Create SVG
  const svg = d3.select(container)
    .append('svg')
    .attr('width', width)
    .attr('height', height);

  const g = svg.append('g')
    .attr('transform', `translate(${margin.left},${margin.top})`);

  // Setup scales
  const xScale = d3.scaleLinear()
    .domain([0, monthData.length - 1])
    .range([0, innerWidth]);

  const yMax = d3.max(series, s => d3.max(s, d => d[1])) || 100;
  const y = d3.scaleLinear()
    .domain([0, yMax * 1.08])
    .range([innerHeight, 0])
    .nice();

  // Color scale
  const color = d3.scaleOrdinal()
    .domain(listings)
    .range(d3.schemeCategory10);

  // Create area generator with tension
  const area = d3.area()
    .curve(d3.curveMonotoneX)
    .x((d, i) => xScale(i))
    .y0(d => y(d[0]))
    .y1(d => y(d[1]));

  // Add grid lines for better readability
  g.append('g')
    .attr('class', 'grid')
    .attr('color', '#eee')
    .attr('stroke-dasharray', '4,4')
    .selectAll('line')
    .data(y.ticks(8))
    .join('line')
    .attr('x1', 0).attr('x2', innerWidth)
    .attr('y1', d => y(d))
    .attr('y2', d => y(d));

  // Add areas
  const paths = g.selectAll('.area-path')
    .data(series)
    .join('path')
    .attr('class', 'area-path')
    .attr('d', area)
    .attr('fill', (d, i) => color(listings[i]))
    .attr('opacity', 0.7)
    .attr('stroke', 'none');

  // Add area border lines (optional, for better definition)
  g.selectAll('.area-line')
    .data(series)
    .join('path')
    .attr('class', 'area-line')
    .attr('d', d => {
      const line = d3.line()
        .curve(d3.curveMonotoneX)
        .x((point, i) => xScale(i))
        .y((point, i) => y(point[1]));
      return line(d);
    })
    .attr('stroke', (d, i) => d3.rgb(color(listings[i])).darker(1))
    .attr('stroke-width', 1.5)
    .attr('fill', 'none')
    .attr('opacity', 0.6);

  // Add X axis with better tick spacing
  const xAxisGroup = g.append('g')
    .attr('transform', `translate(0,${innerHeight})`)
    .call(d3.axisBottom(xScale)
      .tickValues(d3.range(0, monthData.length, 2))
      .tickFormat(i => monthLabels[i]))
    .attr('color', '#333');
  
  xAxisGroup.selectAll('text')
    .attr('font-size', '11px')
    .attr('font-weight', '500')
    .attr('text-anchor', 'end')
    .attr('dy', '0.3em')
    .attr('dx', '-0.6em')
    .attr('transform', 'rotate(-45)');

  // Add Y axis
  g.append('g')
    .call(d3.axisLeft(y).ticks(8))
    .attr('color', '#333')
    .selectAll('text')
    .attr('font-size', '12px');

  // Add Y axis label
  g.append('text')
    .attr('transform', 'rotate(-90)')
    .attr('x', -innerHeight / 2)
    .attr('y', -50)
    .attr('text-anchor', 'middle')
    .attr('fill', '#333')
    .attr('font-size', '13px')
    .attr('font-weight', '600')
    .text('Number of Reviews');

  // Setup tooltip
  const tooltip = d3.select('body').append('div')
    .attr('class', 'tooltip')
    .style('position', 'absolute')
    .style('visibility', 'hidden')
    .style('background', 'rgba(255, 255, 255, 0.95)')
    .style('border', '1px solid #ddd')
    .style('border-radius', '6px')
    .style('padding', '12px')
    .style('font-size', '12px')
    .style('box-shadow', '0 2px 8px rgba(0,0,0,0.1)')
    .style('pointer-events', 'none')
    .style('max-width', '300px')
    .style('z-index', '10000');

  // Add interactive vertical line and points for tooltip
  const bisect = d3.bisector(d => d.month).left;

  g.append('g')
    .attr('class', 'focus')
    .style('display', 'none')
    .append('line')
    .attr('class', 'y-hover-line')
    .attr('stroke', '#999')
    .attr('stroke-width', 1)
    .attr('stroke-dasharray', '5,5')
    .attr('y1', 0)
    .attr('y2', innerHeight);

  const focus = g.select('.focus');

  // Add vertical line for tooltip
  const vline = g.append('line')
    .attr('class', 'vertical-guide')
    .attr('stroke', '#ccc')
    .attr('stroke-width', 1)
    .attr('stroke-dasharray', '3,3')
    .attr('y1', 0)
    .attr('y2', innerHeight)
    .style('display', 'none')
    .attr('pointer-events', 'none');

  // Add circles at data points for each area
  const pointGroups = g.selectAll('.point-group')
    .data(series)
    .join('g')
    .attr('class', 'point-group');

  pointGroups.selectAll('circle')
    .data((d, i) => d.map((point, idx) => ({ point, idx, listingIdx: i })))
    .join('circle')
    .attr('cx', d => xScale(d.idx))
    .attr('cy', d => y(d.point[1]))
    .attr('r', 3)
    .attr('fill', d => color(listings[d.listingIdx]))
    .attr('stroke', '#fff')
    .attr('stroke-width', 1.5)
    .attr('opacity', 0);

  // Add overlay rectangle for mouse interaction
  g.append('rect')
    .attr('class', 'overlay')
    .attr('width', innerWidth)
    .attr('height', innerHeight)
    .attr('fill', 'none')
    .attr('pointer-events', 'all')
    .on('mousemove', function(event) {
      const mouseX = d3.pointer(event)[0];
      const monthIndex = Math.round(xScale.invert(mouseX));
      
      if (monthIndex >= 0 && monthIndex < monthData.length) {
        const currentMonthData = monthData[monthIndex];
        const monthLabel = monthLabels[monthIndex];
        
        // Show vertical guide line
        vline.style('display', 'block')
          .attr('x1', xScale(monthIndex))
          .attr('x2', xScale(monthIndex));

        // Prepare tooltip data
        let tooltipContent = `<strong>${monthLabel}</strong><br/>`;
        let totalReviews = 0;

        listings.forEach(lid => {
          const count = currentMonthData[lid] || 0;
          totalReviews += count;
          tooltipContent += `<div style="margin-top: 4px; color: ${color(lid)};">
            <strong>ID ${lid.slice(-8)}:</strong> ${count} reviews
          </div>`;
        });

        tooltipContent += `<div style="margin-top: 8px; border-top: 1px solid #ddd; padding-top: 8px; font-weight: 600;">
          Total: ${totalReviews} reviews
        </div>`;

        tooltip
          .html(tooltipContent)
          .style('visibility', 'visible')
          .style('left', (event.pageX + 10) + 'px')
          .style('top', (event.pageY - 10) + 'px');

        // Show circles at this month
        g.selectAll('.point-group circle')
          .attr('opacity', d => d.idx === monthIndex ? 1 : 0);
      }
    })
    .on('mouseleave', function() {
      tooltip.style('visibility', 'hidden');
      vline.style('display', 'none');
      g.selectAll('.point-group circle').attr('opacity', 0);
    });

  // Add legend below chart
  const legend = g.append('g')
    .attr('class', 'legend')
    .attr('transform', `translate(0, ${innerHeight + 80})`);

  legend.append('text')
    .attr('x', 0)
    .attr('y', -12)
    .attr('font-size', '12px')
    .attr('font-weight', '600')
    .attr('fill', '#333')
    .text('Top 5 Listings');

  const legendStep = innerWidth / listings.length;
  listings.forEach((lid, i) => {
    const xOffset = i * legendStep;

    legend.append('rect')
      .attr('x', xOffset)
      .attr('y', 0)
      .attr('width', 12)
      .attr('height', 12)
      .attr('fill', color(lid))
      .attr('opacity', 0.7)
      .attr('rx', 2);

    legend.append('text')
      .attr('x', xOffset + 18)
      .attr('y', 10)
      .attr('font-size', '11px')
      .attr('fill', '#333')
      .text(`ID ${lid.slice(-8)}`);
  });
}
