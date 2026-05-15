import * as d3 from 'd3'
import { createTooltip } from '../components/tooltip.js'

const COLORS = { 'Single-host': '#ffa94d', 'Multi-host': '#4dabf7' }
const TOP_N = 20

export function initStackedBar(containerId) {
  const container = document.getElementById(containerId)
  if (!container) return

  const margin = { top: 10, right: 20, bottom: 40, left: 150 }
  const width = container.clientWidth || 500
  // Initial height
  const height = TOP_N * 20 + margin.top + margin.bottom

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
  legendEl.innerHTML = `<div style="width:100%; font-weight:600; font-size:14px; margin-bottom:4px; color:#333;">Host Type</div>`
  Object.entries(COLORS).forEach(([label, color]) => {
    legendEl.innerHTML += `<div class="legend-item"><span class="legend-rect" style="background:${color}"></span>${label}</div>`
  })
  container.appendChild(legendEl)

  function update(newData) {
    const grouped = d3.rollup(
      newData.filter(d => d.neighbourhood),
      v => new Set(v.map(d => d.hostId)).size,
      d => d.neighbourhood,
      d => d.hostType
    )

    const rows = []
    grouped.forEach((typeMap, neighbourhood) => {
      const single = typeMap.get('Single-host') || 0
      const multi = typeMap.get('Multi-host') || 0
      rows.push({ neighbourhood, 'Single-host': single, 'Multi-host': multi, total: single + multi })
    })

    rows.sort((a, b) => b.total - a.total)
    const top = rows.slice(0, TOP_N)
    top.reverse()

    const keys = ['Single-host', 'Multi-host']
    const stacked = d3.stack().keys(keys)(top)

    // Update Scales
    x.domain([0, d3.max(top, d => d.total) || 10]).nice()
    y.domain(top.map(d => d.neighbourhood))

    // Update Axes & Grid
    xAxisGroup.transition().duration(500).call(d3.axisBottom(x).ticks(5))
    yAxisGroup.transition().duration(500).call(d3.axisLeft(y).tickSize(0)).select('.domain').remove()

    gridGroup.selectAll('line').data(x.ticks(5))
      .join('line')
      .transition().duration(500)
      .attr('x1', d => x(d)).attr('x2', d => x(d))
      .attr('y1', 0).attr('y2', innerH)

    // Update Stacked Bars
    layerGroup.selectAll('.layer')
      .data(stacked, d => d.key)
      .join(
        enter => enter.append('g')
          .attr('class', 'layer')
          .attr('fill', d => COLORS[d.key]),
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
            tip.show(event, `
              <div class="tooltip-header">${d.data.neighbourhood}</div>
              <div class="tooltip-row">
                <span><span class="dot" style="background-color: ${COLORS[key]}"></span>${key}</span>
                <strong style="margin-left: 10px;">${d.data[key]} host</strong>
              </div>
              <div class="tooltip-row" style="border-top: 1px solid #eee; margin-top: 5px; padding-top: 5px;">
                <span>Total</span>
                <strong>${d.data.total}</strong>
              </div>
            `)
            d3.selectAll('.layer rect').transition().duration(200).attr('opacity', 0.3)
            d3.select(this).transition().duration(200).attr('opacity', 1)
          })
          .on('mousemove', (event) => tip.move(event))
          .on('mouseleave', function() {
            tip.hide()
            d3.selectAll('.layer rect').transition().duration(200).attr('opacity', 1)
          })
          .call(enter => enter.transition().duration(500)
            .attr('x', d => x(d[0]))
            .attr('width', d => x(d[1]) - x(d[0]))
          ),
        update => update.call(update => update.transition().duration(500)
          .attr('x', d => x(d[0]))
          .attr('y', d => y(d.data.neighbourhood))
          .attr('width', d => x(d[1]) - x(d[0]))
          .attr('height', y.bandwidth())
        ),
        exit => exit.transition().duration(300).attr('width', 0).remove()
      )
  }

  return { update }
}
