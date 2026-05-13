# New York Hotel Data Visualization

An interactive data visualization dashboard for exploring New York City hotel data, built with **D3.js** and **Vite**.

> **University Assignment** — Data Visualization

---

## Tech Stack

| Tool | Purpose |
|------|---------|
| [Vite](https://vitejs.dev/) | Lightning-fast build tool and dev server |
| [D3.js v7](https://d3js.org/) | Data-driven document manipulation and charting |
| Vanilla JavaScript (ES Modules) | No framework overhead; direct DOM control |
| CSS Custom Properties | Design tokens for consistent theming |

---

## Installation

### Prerequisites

- [Node.js](https://nodejs.org/) v20.19.0 or v22.12.0+ (required by Vite)
- npm v9 or higher

### Steps

```bash
# 1. Clone the repository
git clone https://github.com/yuhbu170005/data-visual.git
cd data-visual

# 2. Install dependencies
npm install
```

### Data Processing Environment (Python)

If you need to process the raw datasets to generate chart-ready JSON files, you will need a Python environment.

1. **Set up a virtual environment:**
   ```bash
   python3 -m venv .venv
   source .venv/bin/activate
   ```

2. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

3. **Run data processing scripts:**
   ```bash
   python process_q2.py
   python process_q3.py
   ```


---

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start the Vite development server with hot-reload |
| `npm run build` | Build for production (output in `dist/`) |
| `npm run preview` | Preview the production build locally |

---

## Folder Structure

```
data-visual/
├── index.html              # Application HTML entry point
├── vite.config.js          # Vite configuration
├── package.json            # Project metadata and scripts
│
├── public/
│   └── data/               # Static datasets (CSV, JSON, GeoJSON)
│
└── src/
    ├── main.js             # JavaScript entry point — bootstraps the app
    ├── app.js              # Dashboard orchestrator — wires charts together
    │
    ├── charts/             # One file per chart type
    │   ├── barChart.js
    │   ├── lineChart.js
    │   ├── scatterPlot.js
    │   └── choroplethMap.js
    │
    ├── components/         # Reusable UI pieces shared across charts
    │   ├── tooltip.js
    │   └── legend.js
    │
    ├── styles/             # Global CSS (no component-level styles yet)
    │   ├── main.css        # Imports all partials in order
    │   ├── variables.css   # CSS custom properties (design tokens)
    │   ├── reset.css       # Browser normalization
    │   └── layout.css      # Page structure and dashboard grid
    │
    ├── utils/              # Pure helper functions
    │   ├── dataLoader.js   # Wraps d3.csv / d3.json
    │   ├── formatters.js   # Number/text formatters
    │   └── domHelpers.js   # DOM creation helpers
    │
    └── assets/             # Images, icons, fonts
```

---

## Development Guide

### Start the dev server

```bash
npm run dev
# Opens http://localhost:5173 in your browser automatically
```

### Adding a new chart

1. **Create the chart module** in `src/charts/`:

   ```js
   // src/charts/myChart.js
   import * as d3 from 'd3';

   export function initMyChart(selector, data, options = {}) {
     const { width = 600, height = 400 } = options;

     const svg = d3.select(selector)
       .append('svg')
       .attr('width', width)
       .attr('height', height);

     // ... your D3 code here
   }
   ```

2. **Register the chart** in `src/app.js`:

   ```js
   import { createChartCard } from './utils/domHelpers.js';
   import { loadCSV }         from './utils/dataLoader.js';
   import { initMyChart }     from './charts/myChart.js';

   export async function initDashboard() {
     const dashboard = document.querySelector('.dashboard');
     const data = await loadCSV('/data/hotels.csv');

     const { card, chartContainer } = createChartCard(
       'my-chart',
       'My Chart Title',
       'A short description'
     );
     dashboard.appendChild(card);
     initMyChart(`#${chartContainer.id}`, data);
   }
   ```

3. **Add your dataset** (CSV/JSON) to `public/data/`.

---

## Recommended Additional Libraries

The following libraries pair well with D3.js dashboards and can be added as needed:

| Library | npm package | Why it's useful |
|---------|------------|-----------------|
| **Lodash** | `lodash-es` | Functional helpers for data manipulation (groupBy, sortBy, etc.) |
| **Topojson** | `topojson-client` | Required to render GeoJSON/TopoJSON for the choropleth map |
| **d3-annotation** | `d3-annotation` | Add text annotations to charts (callouts, highlights) |
| **d3-tip** | `d3-tip` | Pre-built tooltip plugin for D3 |
| **crossfilter2** | `crossfilter2` | Fast in-browser filtering and grouping of large datasets |
| **dc.js** | `dc` | High-level charting library built on D3 + crossfilter |

---

## Best Practices for Scalable D3.js Projects

1. **One file per chart** — keeps modules focused and easy to test independently.
2. **Separate data loading from rendering** — use `dataLoader.js` for fetches; pass plain arrays/objects to chart functions.
3. **Use CSS custom properties** for colors and spacing so theming is a single-file change.
4. **Make charts responsive** — derive `width`/`height` from `container.getBoundingClientRect()` and re-render on `ResizeObserver`.
5. **Clean up on re-render** — always call `svg.selectAll('*').remove()` or use D3's enter/update/exit pattern before re-drawing.
6. **Store raw data, not DOM** — keep the original dataset in memory; derive display data with filters/aggregations on the fly.
7. **Use `console.log` or a logger util** during development; strip logs for production.
8. **Commit datasets** in `public/data/` only if they are small enough; link to external sources otherwise.

---

## Future Development

- [ ] Load and parse the NYC hotel CSV dataset
- [ ] Bar chart — average nightly price per borough
- [ ] Scatter plot — price vs. review score
- [ ] Choropleth map — hotel density by neighbourhood
- [ ] Line chart — availability over time
- [ ] Tooltip component with formatted details
- [ ] Legend component for categorical color scales
- [ ] Filter/control panel (by borough, room type, price range)
- [ ] Responsive resize handling via `ResizeObserver`
- [ ] Accessibility improvements (ARIA labels, keyboard navigation)