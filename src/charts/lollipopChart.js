import * as d3 from 'd3'
import { createTooltip } from '../components/tooltip.js'
import { store } from '../store.js'

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
    data.filter(d => d.rating !== null && d.rating > 1.0 && d.neighbourhood && d.roomType),
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
    data.filter(d => d.rating !== null && d.rating > 1.0 && d.neighbourhood),
    v => v.length,
    d => d.neighbourhood
  )

  const overallAvgByNeigh = d3.rollup(
    data.filter(d => d.rating !== null && d.rating > 1.0 && d.neighbourhood),
    v => d3.mean(v, d => d.rating),
    d => d.neighbourhood
  )

  // ✅ Bước 2: Lấy tất cả các neighbourhood
  let neighbourhoods = [...new Set(rows.map(d => d.neighbourhood))]

  // ✅ Bước 3: Sort theo số lượng listing (count) giảm dần
  neighbourhoods.sort((a, b) => countByNeigh.get(b) - countByNeigh.get(a))

  // Lấy top 20
  const top20 = neighbourhoods.slice(0, 20)

  // Filter rows sau khi có top20 và loại bỏ các outlier (d.avg < 4.0) để đảm bảo không vẽ ra ngoài trục X mới
  const filteredRows = rows.filter(d => top20.includes(d.neighbourhood) && d.avg >= 4.0)

  const margin = { top: 20, right: 30, bottom: 40, left: 180 }
  const rowHeight = 22
  const height = top20.length * rowHeight + margin.top + margin.bottom
  const width = container.clientWidth || 900

  const svg = d3.select(`#${containerId}`)
    .append('svg')
    .attr('width', width)
    .attr('height', height)

  // Nền ẩn (Background rect) để bắt sự kiện click ra ngoài -> Reset filter
  svg.append('rect')
    .attr('width', width)
    .attr('height', height)
    .attr('fill', 'transparent')
    .on('click', () => {
      store.setFilter('neighbourhood', null);
      svg.selectAll('.mark-group').transition().duration(300).attr('opacity', 1);
    });

  const innerW = width - margin.left - margin.right
  const innerH = height - margin.top - margin.bottom
  const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`)

  // ✅ X scale dùng filteredRows
  const xMin = 4.0 // Bắt đầu từ 4.0 theo yêu cầu
  const xMax = 5.0
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

  const marks = g.selectAll('.mark-group')
    .data(filteredRows)
    .join('g')
    .attr('class', 'mark-group')

  marks.append('line')
    .attr('x1', x(xMin))
    .attr('x2', d => x(d.avg))
    .attr('y1', d => y(d.neighbourhood) + y.bandwidth() / 2)
    .attr('y2', d => y(d.neighbourhood) + y.bandwidth() / 2)
    .attr('stroke', d => ROOM_COLORS[d.roomType] || '#aaa')
    .attr('stroke-width', 3)
    .style('opacity', 0.6) // Opacity helps see overlapping stems

  marks.append('circle')
    .attr('cx', d => x(d.avg))
    .attr('cy', d => y(d.neighbourhood) + y.bandwidth() / 2)
    .attr('r', 6)
    .attr('fill', d => ROOM_COLORS[d.roomType] || '#ccc')
    .attr('stroke', '#fff')
    .attr('stroke-width', 1)

  marks.on('mouseover', (event, d) => {
    tip.show(`
      <strong>${d.neighbourhood}</strong><br/>
      Room Type: ${d.roomType}<br/>
      Avg Rating: <strong>${d.avg.toFixed(2)}</strong>
    `, event)
    d3.select(event.currentTarget).select('circle').attr('stroke', '#333').attr('stroke-width', 2)
  })
  .on('mousemove', (event) => tip.move(event))
  .on('mouseleave', (event) => {
    tip.hide()
    d3.select(event.currentTarget).select('circle').attr('stroke', '#fff').attr('stroke-width', 1)
  })
  .on('click', function(event, d) {
    event.stopPropagation(); // Chặn sự kiện click truyền xuống background rect

    const isSelected = store.filters.neighbourhood === d.neighbourhood;
    
    // Cập nhật State
    store.setFilter('neighbourhood', d.neighbourhood);

    // Xử lý Hiệu ứng UI (Visual Feedback)
    if (isSelected) {
       // Deselect -> Tất cả sáng lại
       svg.selectAll('.mark-group').transition().duration(300).attr('opacity', 1);
    } else {
       // Select mới -> Mờ các nhánh khác
       svg.selectAll('.mark-group').transition().duration(300)
          .attr('opacity', node => node.neighbourhood === d.neighbourhood ? 1 : 0.2);
    }
  });

  // Legend
  const legendEl = document.createElement('div')
  legendEl.className = 'legend'
  legendEl.style.color = '#333'
  legendEl.innerHTML = `<div style="width:100%; font-weight:600; font-size:14px; margin-bottom:4px;">Room type</div>`
  Object.entries(ROOM_COLORS).forEach(([label, color]) => {
    legendEl.innerHTML += `
      <div class="legend-item">
        <span class="legend-dot" style="background:${color}"></span>
        ${label}
      </div>`
  })
  container.appendChild(legendEl)
}