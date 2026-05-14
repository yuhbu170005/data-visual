import * as d3 from 'd3'
import { createTooltip } from '../components/tooltip.js'

const ROOM_COLORS = {
  'Entire home/apt': '#4e79a7',
  'Private room': '#e15759',
  'Hotel room': '#f28e2b',
  'Shared room': '#59a14f',
}

export function drawLollipop(data, containerId) {
  const container = document.getElementById(containerId)
  if (!container) return

  // Force white background
  container.style.backgroundColor = '#ffffff'
  container.style.color = '#333'
  container.style.borderRadius = '8px'

  const grouped = d3.rollup(
    data.filter(d => d.rating !== null && d.neighbourhood && d.roomType),
    v => d3.mean(v, d => d.rating),
    d => d.neighbourhood,
    d => d.roomType
  )

  const rows = []
  grouped.forEach((roomMap, neighbourhood) => {
    roomMap.forEach((avg, roomType) => {
      rows.push({ neighbourhood, roomType, avg })
    })
  })

  // ✅ Bước 1: Tính toán tổng số lượng và điểm trung bình chung cho mỗi neighbourhood
  const countByNeigh = d3.rollup(
    data.filter(d => d.rating !== null && d.neighbourhood),
    v => v.length,
    d => d.neighbourhood
  )

  const overallAvgByNeigh = d3.rollup(
    data.filter(d => d.rating !== null && d.neighbourhood),
    v => d3.mean(v, d => d.rating),
    d => d.neighbourhood
  )

  // ✅ Bước 2: Lấy tất cả các neighbourhood
  let neighbourhoods = [...new Set(rows.map(d => d.neighbourhood))]

  // ✅ Bước 3: Sort theo số lượng listing (count) giảm dần
  neighbourhoods.sort((a, b) => countByNeigh.get(b) - countByNeigh.get(a))

  // Lấy top 20
  const top20 = neighbourhoods.slice(0, 20)

  // Filter rows sau khi có top20
  const filteredRows = rows.filter(d => top20.includes(d.neighbourhood))

  const margin = { top: 20, right: 30, bottom: 40, left: 180 }
  const rowHeight = 22
  const height = top20.length * rowHeight + margin.top + margin.bottom
  const width = container.clientWidth || 900

  const svg = d3.select(`#${containerId}`)
    .append('svg')
    .attr('width', width)
    .attr('height', height)

  const innerW = width - margin.left - margin.right
  const innerH = height - margin.top - margin.bottom
  const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`)

  // ✅ X scale dùng filteredRows
  const xMin = 0.0 // Bắt đầu từ 0.0 theo yêu cầu
  const xMax = 5.05
  const x = d3.scaleLinear().domain([xMin, xMax]).range([0, innerW]).nice()

  const y = d3.scaleBand().domain(top20).range([0, innerH]).padding(0.3)

  // Grid
  g.append('g').attr('class', 'grid')
    .selectAll('line')
    .data(x.ticks(6))
    .join('line')
    .attr('x1', d => x(d)).attr('x2', d => x(d))
    .attr('y1', 0).attr('y2', innerH)
    .attr('stroke', '#e0e0e0')
    .attr('stroke-width', 1)

  // Axes
  g.append('g').attr('class', 'axis')
    .attr('transform', `translate(0,${innerH})`)
    .call(d3.axisBottom(x).ticks(6).tickFormat(d3.format('.2f')))
    .attr('color', '#333')

  g.append('g').attr('class', 'axis')
    .call(d3.axisLeft(y).tickSize(0))
    .select('.domain').remove()

  g.selectAll('.axis text').attr('fill', '#333')

  // Y-axis label
  g.append('text')
    .attr('x', -margin.left + 10)
    .attr('y', -10)
    .attr('text-anchor', 'start')
    .attr('fill', '#333')
    .attr('font-size', '12px')
    .text('Neighbourhood Clea..')

  // X-axis label
  g.append('text')
    .attr('x', innerW / 2)
    .attr('y', innerH + 35)
    .attr('text-anchor', 'middle')
    .attr('fill', '#333')
    .attr('font-size', '12px')
    .text('Avg. Review Scores Rating')

  const tip = createTooltip()

  // Draw per neighbourhood
  top20.forEach(neigh => {
    const neighRows = filteredRows.filter(d => d.neighbourhood === neigh)
    const cy = y(neigh) + y.bandwidth() / 2

    neighRows.forEach(row => {
      // Draw stem from xMin to the dot
      g.append('line')
        .attr('x1', x(xMin))
        .attr('x2', x(row.avg))
        .attr('y1', cy)
        .attr('y2', cy)
        .attr('stroke', ROOM_COLORS[row.roomType] || '#aaa')
        .attr('stroke-width', 3)
        .style('opacity', 0.6) // Opacity helps see overlapping stems

      g.append('circle')
        .attr('cx', x(row.avg))
        .attr('cy', cy)
        .attr('r', 6)
        .attr('fill', ROOM_COLORS[row.roomType] || '#aaa')
        .attr('stroke', 'transparent')
        .attr('stroke-width', 0)
        .style('cursor', 'pointer')
        .on('mouseover', (event) => {
          tip.show(`
            <strong>${row.neighbourhood}</strong><br>
            ${row.roomType}<br>
            Rating: <strong>${row.avg.toFixed(2)}</strong>
          `, event)
        })
        .on('mousemove', (event) => tip.move(event))
        .on('mouseleave', () => tip.hide())
    })
  })

  // Legend
  const legendEl = document.createElement('div')
  legendEl.className = 'legend'
  legendEl.style.color = '#333'
  legendEl.innerHTML = `<div style="width:100%; font-weight:600; font-size:14px; margin-bottom:4px;">Loại phòng (Room type)</div>`
  Object.entries(ROOM_COLORS).forEach(([label, color]) => {
    legendEl.innerHTML += `
      <div class="legend-item">
        <span class="legend-dot" style="background:${color}"></span>
        ${label}
      </div>`
  })
  container.appendChild(legendEl)
}