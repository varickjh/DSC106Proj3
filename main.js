// main.js

const svg = d3.select("#chart"),
      margin = { top: 50, right: 20, bottom: 110, left: 80 },
      width = +svg.attr("width") - margin.left - margin.right,
      height = +svg.attr("height") - margin.top - margin.bottom,
      chart = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

const tooltip = d3.select("#tooltip");
let rawData = [];
let sorted = false;

let colors = {'protein_present': '#FF5733', 'sugar_present': 'darkgreen', 'total_carb_present': '#3357FF', 'total_fat_present': '#FF33A1', 'dietary_fiber_present': '#A133FF'};

// ✅ Load and preprocess CSV once
d3.csv("glucose_peaks_by_nutrient.csv", d3.autoType).then(data => {
  const boolCols = ['protein_present', 'sugar_present', 'total_carb_present', 'total_fat_present', 'dietary_fiber_present'];
  
  rawData = data.filter(d => d.ID && d.Avg_Peak_Glucose !== undefined);

  rawData.forEach(d => {
    // Normalize boolean columns
    boolCols.forEach(col => {
      d[col] = d[col] === true || d[col] === 'True';
    });

    // Normalize gender
    d.gender = d.gender?.toLowerCase();
  });

  console.log("✅ Data loaded:", rawData.length, "rows");
  updateChart();
});

function updateChart() {
  const threshold = +document.getElementById("thresholdInput").value || 140;
  const selectedNutrients = Array.from(document.querySelectorAll(".nutrient:checked"))
    .map(d => `${d.value}_present`);
  const genderFilter = document.getElementById("genderSelect").value;

  const filtered = rawData.filter(d => {
    const genderMatch = (genderFilter === "all" || d.gender === genderFilter);
    const nutrientMatch = selectedNutrients.length === 0 || selectedNutrients.every(n => d[n] === true);
    return genderMatch && nutrientMatch;
  });

  const grouped = d3.group(filtered, d => d.ID);
  const summary = [];

  for (let [pid, group] of grouped.entries()) {
    const avg = d3.mean(group, d => d.Avg_Peak_Glucose);
    const count = group.length;
    const gender = group[0].gender;
    const hba1c = group[0].HbA1C;

    summary.push({ ID: pid, Avg_Peak_Glucose: avg, Meal_Count: count, gender, HbA1C: hba1c });
  }

  if (sorted) {
    summary.sort((a, b) => b.Avg_Peak_Glucose - a.Avg_Peak_Glucose);  // descending by glucose
  } else {
    summary.sort((a, b) => a.ID - b.ID);  // ascending by participant ID
  }

  chart.selectAll(".axis").remove();
  chart.selectAll(".bar").remove();

  if (summary.length === 0) {
    chart.append("text")
      .attr("x", width / 2)
      .attr("y", height / 2)
      .attr("text-anchor", "middle")
      .attr("fill", "#aaa")
      .text("No data for selected filters.");
    return;
  }

  const x = d3.scaleBand()
    .domain(summary.map(d => "Participant " + d.ID))
    .range([0, width])
    .padding(0.2);

  const y = d3.scaleLinear()
    .domain([0, d3.max(summary, d => d.Avg_Peak_Glucose)]).nice()
    .range([height, 0]);

  chart.append("text")
    .attr("x", width / 2)
    .attr("y", -20) // position above the chart
    .attr("text-anchor", "middle")
    .attr("font-size", "16px")
    .attr("font-weight", "bold")
  
  chart.append("text")
    .attr("x", width / 2)
    .attr("y", height + 90) // 50px below chart area, fits in bottom margin
    .attr("text-anchor", "middle")
    .attr("font-size", "12px")
    .text("Participant (ID)");
  
  chart.append("text")
  .attr("transform", "rotate(-90)")
  .attr("x", -height / 2)
  .attr("y", -45) // 45px left of the y-axis, fits in left margin
  .attr("text-anchor", "middle")
  .attr("font-size", "12px")
  .text("Average Peak Glucose (mg/dL)");

  chart.append("g")
    .attr("class", "axis")
    .attr("transform", `translate(0,${height})`)
    .call(d3.axisBottom(x))
    .selectAll("text")
    .attr("transform", "rotate(-45)")
    .style("text-anchor", "end");

  chart.append("g")
    .attr("class", "axis")
    .call(d3.axisLeft(y));


  chart.selectAll(".bar")
    .data(summary, d => d.ID)
    .join("rect")
    .attr("class", "bar")
    .attr("x", d => x("Participant " + d.ID))
    .attr("y", d => y(d.Avg_Peak_Glucose))
    .attr("width", x.bandwidth())
    .attr("height", d => height - y(d.Avg_Peak_Glucose))
    .attr("fill", colors[selectedNutrients[0]] || 'steelblue')  // <- use first selected nutrient color
    .on("mouseover", (event, d) => {
      d3.select(event.currentTarget).attr("fill", "orange");  // <- change color on hover
  
      tooltip.transition().duration(200).style("opacity", 0.95);
      tooltip.html(
        `Participant: ${d.ID}<br>` +
        `Avg Peak Glucose: ${d.Avg_Peak_Glucose.toFixed(1)}<br>` +
        `Meals Count: ${d.Meal_Count}<br>` +
        `HbA1C: ${d.HbA1C}`
      )
      .style("left", (event.pageX + 10) + "px")
      .style("top", (event.pageY - 28) + "px");
    })
    .on("mouseout", (event) => {
      d3.select(event.currentTarget).attr("fill", colors[selectedNutrients[0]] || 'steelblue');  // <- revert color on mouseout
  
      tooltip.transition().duration(400).style("opacity", 0);
    });
    // Remove previous threshold line
  chart.selectAll(".threshold-line").remove();

  // Add dynamic red threshold line
  chart.append("line")
    .attr("class", "threshold-line")
    .attr("x1", 0)
    .attr("x2", width)
    .attr("y1", y(threshold))
    .attr("y2", y(threshold))
    .attr("stroke", "red")
    .attr("stroke-width", 2)
    .attr("stroke-dasharray", "4");
}

// ✅ Event Listeners
document.querySelectorAll(".nutrient").forEach(cb => cb.addEventListener("change", updateChart));
document.getElementById("genderSelect").addEventListener("change", updateChart);

const sortButton = document.getElementById("sortBtn");

sortButton.addEventListener("click", () => {
  sorted = !sorted;
  updateChart();

  sortButton.textContent = sorted ? "Sort by Participant" : "Sort by Glucose";
});

document.getElementById("thresholdInput").addEventListener("input", updateChart);

