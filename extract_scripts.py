import re

files = [
    ("public/q2_chart.html", "src/charts/q2_monthly.js", "drawQ2Monthly", "data/q2_monthly.json"),
    ("public/q3_chart1.html", "src/charts/q3_sweetspot.js", "drawQ3Sweetspot", "data/q3_agg.json"),
    ("public/q3_chart3.html", "src/charts/q3_slope.js", "drawQ3Slope", "data/q3_agg.json")
]

for html_file, js_file, func_name, data_path in files:
    with open(html_file, "r") as f:
        html = f.read()
    
    # Extract script block
    match = re.search(r'<script>(.*?)</script>', html, re.DOTALL)
    if not match:
        continue
    script_content = match.group(1).strip()
    
    # Replace data loading with parameter
    script_content = re.sub(r'd3\.json\(.*?\)\.then\(data => \{', '', script_content)
    # Remove the closing bracket of d3.json
    script_content = re.sub(r'\}\)\.catch\(error => \{.*?\}\);', '', script_content, flags=re.DOTALL)
    
    # Replace d3.select("#chart") with container
    script_content = script_content.replace('d3.select("#chart")', 'd3.select(`#${containerId}`)')
    script_content = script_content.replace('const svg = d3.select(`#${containerId}`)\n      .append("svg")', 'd3.select(`#${containerId}`).selectAll("*").remove();\n    const svg = d3.select(`#${containerId}`)\n      .append("svg")\n      .attr("viewBox", `0 0 ${width} ${height}`)\n      .style("width", "100%")\n      .style("height", "auto");\n    //')
    
    # Form the new js content
    new_js = f"""import * as d3 from 'd3';

export function {func_name}(data, containerId) {{
    {script_content}
}}
"""
    
    with open(js_file, "w") as f:
        f.write(new_js)
    print(f"Generated {js_file}")

