import * as d3 from 'd3'
import { createTooltip } from '../components/tooltip.js'

const COLORS = { true: '#f28e2b', false: '#e15759' }

export function drawLineChart(data, containerId) {
  const container = document.getElementById(containerId)
  if (!container) return

  const filtered = data.filter(d =>
    d.hostSinceYear !== null &&
    d.price !== null &&
    d.isSuperhost !== null
  )

  // Group by year × superhost → avg price
  const grouped = d3.rollup(
    filtered,
    v => d3.mean(v, d => d.price),
    d => d.isSuperhost,
    d => d.hostSinceYear
  )

  const series = []
  grouped.forEach((yearMap, isSuperhost) => {
    const points = []
    yearMap.forEach((avg, year) => points.push({ year, avg }))
    points.sort((a, b) => a.year - b.year)
    series.push({ isSuperhost: String(isSuperhost), points })
  })

  const margin = { top: 20, right: 20, bottom: 40, left: 55 }
  const width  = container.clientWidth || 500
  const height = 280

  const svg = d3.select(`#${containerId}`)
    .append('svg')
    .attr('width', width)
    .attr('height', height)

  const innerW = width - margin.left - margin.right
  const innerH = height - margin.top - margin.bottom
  const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`)

  const allYears = [...new Set(filtered.map(d => d.hostSinceYear))].sort()
  const allAvgs  = series.flatMap(s => s.points.map(p => p.avg))

  const x = d3.scaleLinear().domain(d3.extent(allYears)).range([0, innerW])
  const y = d3.scaleLinear().domain([0, d3.max(allAvgs) * 1.1]).range([innerH, 0]).nice()

  // Grid
  g.append('g').attr('class', 'grid')
    .selectAll('line').data(y.ticks(5)).join('line')
    .attr('x1', 0).attr('x2', innerW)
    .attr('y1', d => y(d)).attr('y2', d => y(d))
    .attr('stroke', '#e0e0e0')
    .attr('stroke-width', 1)

  // Axes
  g.append('g').attr('class', 'axis')
    .attr('transform', `translate(0,${innerH})`)
    .call(d3.axisBottom(x).tickFormat(d3.format('d')).ticks(6))
    .attr('color', '#333')

  g.append('g').attr('class', 'axis')
    .call(d3.axisLeft(y).ticks(5).tickFormat(d => d))
    .attr('color', '#333')

  // Title
  g.append('text')
    .attr('x', innerW / 2)
    .attr('y', -5)
    .attr('text-anchor', 'middle')
    .attr('fill', '#333')
    .attr('font-size', '14px')
    .text('Year of Host Since')

  // Y-axis label
  g.append('text')
    .attr('transform', 'rotate(-90)')
    .attr('x', -innerH / 2)
    .attr('y', -45)
    .attr('text-anchor', 'middle')
    .attr('fill', '#333')
    .attr('font-size', '12px')
    .text('Avg. Price')

  const line = d3.line().x(d => x(d.year)).y(d => y(d.avg))

  const tip = createTooltip()

  series.forEach(s => {
    const color = COLORS[s.isSuperhost] || '#aaa'
    const label = s.isSuperhost === 'true' ? 'Superhost' : 'Non-superhost'

    g.append('path')
      .datum(s.points)
      .attr('fill', 'none')
      .attr('stroke', color)
      .attr('stroke-width', 2.5)
      .attr('d', line)

    g.selectAll(null)
      .data(s.points)
      .join('circle')
      .attr('cx', d => x(d.year))
      .attr('cy', d => y(d.avg))
      .attr('r', 6)
      .attr('fill', 'transparent')
      .attr('stroke', 'transparent')
      .style('cursor', 'pointer')
      .on('mouseover', (event, d) => {
        tip.show(`<strong>${label}</strong><br>Năm: ${d.year}<br>Giá TB: <strong>$${d.avg.toFixed(0)}</strong>`, event)
      })
      .on('mousemove', (event) => tip.move(event))
      .on('mouseleave', () => tip.hide())
  })

  // Legend
  const legendEl = document.createElement('div')
  legendEl.className = 'legend'
  Object.entries(COLORS).forEach(([key, color]) => {
    const label = key === 'true' ? 'Superhost' : 'Non-superhost'
    legendEl.innerHTML += `<div class="legend-item"><span class="legend-dot" style="background:${color}"></span>${label}</div>`
  })
  container.appendChild(legendEl)
}
