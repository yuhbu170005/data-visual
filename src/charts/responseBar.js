import * as d3 from 'd3'
import { createTooltip } from '../components/tooltip.js'

const SLOW_TIMES = ['within a few hours', 'within a day', 'a few days or more']
const COLORS = {
  'within a few hours': '#ffa94d',
  'within a day': '#ff6b6b',
  'a few days or more': '#da77f2',
}
const TOP_N = 25

export function initResponseBar(containerId) {
  const container = document.getElementById(containerId)
  if (!container) return

  const margin = { top: 10, right: 20, bottom: 40, left: 160 }
  const width = container.clientWidth || 900
  const height = TOP_N * 22 + margin.top + margin.bottom

  const svg = d3.select(`#${containerId}`)
    .append('svg')
    .attr('width', width)
    .attr('height', height)

  const innerW = width - margin.left - margin.right
  const innerH = height - margin.top - margin.bottom
  const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`)

  const x = d3.scaleLinear().range([0, innerW])
  const y = d3.scaleBand().range([0, innerH]).padding(0.25)

  const xAxisGroup = g.append('g').attr('class', 'axis').attr('transform', `translate(0,${innerH})`)
  const yAxisGroup = g.append('g').attr('class', 'axis')
  const gridGroup = g.append('g').attr('class', 'grid')

  const tip = createTooltip()
  const layerGroup = g.append('g').attr('class', 'layers')

  // Legend
  const legendEl = document.createElement('div')
  legendEl.className = 'legend'
  legendEl.innerHTML = `<div style="width:100%; font-weight:600; font-size:14px; margin-bottom:4px; color:#333;">Thời gian phản hồi (Response Time)</div>`
  Object.entries(COLORS).forEach(([label, color]) => {
    legendEl.innerHTML += `<div class="legend-item"><span class="legend-rect" style="background:${color}"></span>${label}</div>`
  })
  container.appendChild(legendEl)

  function update(newData) {
    const filtered = newData.filter(d =>
      d.hasAvailability &&
      d.responseTime &&
      SLOW_TIMES.includes(d.responseTime) &&
      d.neighbourhood
    )

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
      if (total > 0) rows.push(entry)
    })

    rows.sort((a, b) => b.total - a.total)
    const top = rows.slice(0, TOP_N).reverse()
    const stacked = d3.stack().keys(SLOW_TIMES)(top)

    x.domain([0, d3.max(top, d => d.total) || 10]).nice()
    y.domain(top.map(d => d.neighbourhood))

    xAxisGroup.transition().duration(500).call(d3.axisBottom(x).ticks(5))
    yAxisGroup.transition().duration(500).call(d3.axisLeft(y).tickSize(0)).select('.domain').remove()

    gridGroup.selectAll('line').data(x.ticks(5))
      .join('line')
      .transition().duration(500)
      .attr('x1', d => x(d)).attr('x2', d => x(d))
      .attr('y1', 0).attr('y2', innerH)

    layerGroup.selectAll('.layer')
      .data(stacked, d => d.key)
      .join(
        enter => enter.append('g').attr('class', 'layer').attr('fill', d => COLORS[d.key]),
        update => update,
        exit => exit.remove()
      )
      .selectAll('rect')
      .data(d => d, d => d.data.neighbourhood)
      .join(
        enter => enter.append('rect')
          .attr('x', 0)
          .attr('y', d => y(d.data.neighbourhood) || 0)
          .attr('width', 0)
          .attr('height', y.bandwidth())
          .attr('rx', 2)
          .style('cursor', 'pointer')
          .on('mouseover', function(event, d) {
            const key = d3.select(this.parentNode).datum().key
            tip.show(`
              <strong>${d.data.neighbourhood}</strong><br>
              "${key}": <strong>${d.data[key]} host</strong><br>
              Tổng chậm: ${d.data.total}
            `, event)
          })
          .on('mousemove', (event) => tip.move(event))
          .on('mouseleave', () => tip.hide())
          .call(enter => enter.transition().duration(500)
            .attr('x', d => x(d[0]))
            .attr('width', d => Math.max(0, x(d[1]) - x(d[0])))
          ),
        update => update.call(update => update.transition().duration(500)
          .attr('x', d => x(d[0]))
          .attr('y', d => y(d.data.neighbourhood))
          .attr('width', d => Math.max(0, x(d[1]) - x(d[0])))
          .attr('height', y.bandwidth())
        ),
        exit => exit.transition().duration(300).attr('width', 0).remove()
      )
  }

  return { update }
}
