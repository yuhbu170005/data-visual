import * as d3 from 'd3'
import { createTooltip } from '../components/tooltip.js'

const SLOW_TIMES = ['within a few hours', 'within a day', 'a few days or more']
const COLORS = {
  'within a few hours': '#ffa94d',
  'within a day':       '#ff6b6b',
  'a few days or more': '#da77f2',
}
const TOP_N = 25

export function drawResponseBar(data, containerId) {
  const container = document.getElementById(containerId)
  if (!container) return

  // Filter: available + slow response only
  const filtered = data.filter(d =>
    d.hasAvailability &&
    d.responseTime &&
    SLOW_TIMES.includes(d.responseTime) &&
    d.neighbourhood
  )

  // Count distinct hosts per neighbourhood × responseTime
  const grouped = d3.rollup(
    filtered,
    v => new Set(v.map(d => d.hostId)).size,
    d => d.neighbourhood,
    d => d.responseTime
  )

  const rows = []
  grouped.forEach((timeMap, neighbourhood) => {
    const entry = { neighbourhood }
    let total = 0
    SLOW_TIMES.forEach(t => {
      entry[t] = timeMap.get(t) || 0
      total += entry[t]
    })
    entry.total = total
    rows.push(entry)
  })

  rows.sort((a, b) => b.total - a.total)
  const top = rows.slice(0, TOP_N).reverse()

  const stacked = d3.stack().keys(SLOW_TIMES)(top)

  const margin = { top: 10, right: 20, bottom: 40, left: 160 }
  const width  = container.clientWidth || 900
  const rowH   = 22
  const height = top.length * rowH + margin.top + margin.bottom

  const svg = d3.select(`#${containerId}`)
    .append('svg')
    .attr('width', width)
    .attr('height', height)

  const innerW = width - margin.left - margin.right
  const innerH = height - margin.top - margin.bottom
  const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`)

  const x = d3.scaleLinear().domain([0, d3.max(top, d => d.total)]).range([0, innerW]).nice()
  const y = d3.scaleBand().domain(top.map(d => d.neighbourhood)).range([0, innerH]).padding(0.25)

  // Grid
  g.append('g').attr('class', 'grid')
    .selectAll('line').data(x.ticks(5)).join('line')
    .attr('x1', d => x(d)).attr('x2', d => x(d))
    .attr('y1', 0).attr('y2', innerH)

  // Axes
  g.append('g').attr('class', 'axis')
    .attr('transform', `translate(0,${innerH})`)
    .call(d3.axisBottom(x).ticks(5))

  g.append('g').attr('class', 'axis')
    .call(d3.axisLeft(y).tickSize(0))
    .select('.domain').remove()

  const tip = createTooltip()

  stacked.forEach(layer => {
    const key = layer.key
    g.selectAll(null)
      .data(layer)
      .join('rect')
      .attr('x', d => x(d[0]))
      .attr('y', d => y(d.data.neighbourhood))
      .attr('width', d => Math.max(0, x(d[1]) - x(d[0])))
      .attr('height', y.bandwidth())
      .attr('fill', COLORS[key])
      .attr('rx', 2)
      .style('cursor', 'pointer')
      .on('mouseover', (event, d) => {
        tip.show(`
          <strong>${d.data.neighbourhood}</strong><br>
          "${key}": <strong>${d.data[key]} host</strong><br>
          Tổng chậm: ${d.data.total}
        `, event)
      })
      .on('mousemove', (event) => tip.move(event))
      .on('mouseleave', () => tip.hide())
  })

  // Legend
  const legendEl = document.createElement('div')
  legendEl.className = 'legend'
  Object.entries(COLORS).forEach(([label, color]) => {
    legendEl.innerHTML += `<div class="legend-item"><span class="legend-rect" style="background:${color}"></span>${label}</div>`
  })
  container.appendChild(legendEl)
}
