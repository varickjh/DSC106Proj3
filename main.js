// main.js

const svg = d3.select("#chart"),
      margin = { top: 50, right: 20, bottom: 110, left: 80 },
      width = +svg.attr("width") - margin.left - margin.right,
      height = +svg.attr("height") - margin.top - margin.bottom,
      chart = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

const tooltip = d3.select("#tooltip");
let rawData = [];
let sorted = false;
let drillParticipant = null;

let colors = {'protein_present': '#FF5733', 'sugar_present': 'darkgreen', 'total_carb_present': '#3357FF', 'total_fat_present': '#FF33A1', 'dietary_fiber_present': '#A133FF'};

// Load and preprocess CSV once
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
  const selectedNutrients = Array.from(document.querySelectorAll(".nutrient:checked")).map(d => `${d.value}_present`);
  const genderFilter = document.getElementById("genderSelect").value;
  const threshold = +document.getElementById("thresholdInput").value || 140;

  let filtered = rawData.filter(d => {
    const genderMatch = genderFilter === "all" || d.gender === genderFilter;
    const nutrientMatch = selectedNutrients.length === 0 || selectedNutrients.every(n => d[n] === true);
    return genderMatch && nutrientMatch;
  });

  chart.selectAll(".axis, .bar, .threshold-line, .back-btn").remove();

  if (drillParticipant) {
    filtered = filtered.filter(d => d.ID === drillParticipant);
    const x = d3.scaleBand().domain(d3.range(filtered.length)).range([0, width]).padding(0.2);
    const y = d3.scaleLinear().domain([0, d3.max(filtered, d => d.Avg_Peak_Glucose)]).nice().range([height, 0]);

    chart.append("g")
      .attr("class", "axis")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(x).tickFormat(i => filtered[i]?.logged_food || `Meal ${i + 1}`))
      .selectAll("text")
      .attr("transform", "rotate(-45)")
      .style("text-anchor", "end");

    chart.append("g")
      .attr("class", "axis")
      .call(d3.axisLeft(y));

    // Remove previous x/y axis labels
    chart.selectAll(".x-axis-label").remove();
    chart.selectAll(".y-axis-label").remove();

    // X-Axis Label
    chart.append("text")
      .attr("class", "x-axis-label")
      .attr("x", width / 2)
      .attr("y", height + 70)
      .style("text-anchor", "middle")
      .text(drillParticipant ? `Meals for Participant ${drillParticipant}` : "Participants");

    // Y-Axis Label
    chart.append("text")
      .attr("class", "y-axis-label")
      .attr("transform", "rotate(-90)")
      .attr("x", -height / 2)
      .attr("y", -50)
      .style("text-anchor", "middle")
      .text("Average Peak Glucose (mg/dL)");


    chart.selectAll(".bar")
      .data(filtered)
      .join("rect")
      .attr("class", "bar")
      .attr("x", (d, i) => x(i))
      .attr("y", d => y(d.Avg_Peak_Glucose))
      .attr("width", x.bandwidth())
      .attr("height", d => height - y(d.Avg_Peak_Glucose))
      .attr("fill", "steelblue")
      .on("mouseover", (event, d) => {
        tooltip.transition().duration(200).style("opacity", 0.95);
        tooltip.html(
          `Participant: ${d.ID}<br>` +
          `Avg Peak Glucose: ${d.Avg_Peak_Glucose.toFixed(1)}<br>` +
          `HbA1C: ${d.HbA1C}`
        )
          .style("left", (event.pageX + 10) + "px")
          .style("top", (event.pageY - 28) + "px");
      })
      .on("mouseout", () => tooltip.transition().duration(400).style("opacity", 0));

    chart.append("line")
      .attr("class", "threshold-line")
      .attr("x1", 0)
      .attr("x2", width)
      .attr("y1", y(threshold))
      .attr("y2", y(threshold))
      .attr("stroke", "red")
      .attr("stroke-width", 2)
      .attr("stroke-dasharray", "4");

    chart.append("text")
      .attr("class", "back-btn")
      .attr("x", width / 2)
      .attr("y", -20)
      .attr("text-anchor", "middle")
      .attr("fill", "#0077cc")
      .style("cursor", "pointer")
      .text("← Back to Participants")
      .on("click", () => {
        drillParticipant = null;
        updateChart();
      });

  } else {
    const grouped = d3.group(filtered, d => d.ID);
    const summary = [];
    for (let [pid, group] of grouped.entries()) {
      summary.push({
        ID: pid,
        Avg_Peak_Glucose: d3.mean(group, d => d.Avg_Peak_Glucose),
        Meal_Count: group.length,
        gender: group[0].gender,
        HbA1C: group[0].HbA1C
      });
    }

    summary.sort((a, b) => sorted ? b.Avg_Peak_Glucose - a.Avg_Peak_Glucose : a.ID - b.ID);

    const x = d3.scaleBand().domain(summary.map(d => d.ID + "-participant")).range([0, width]).padding(0.2);
    const y = d3.scaleLinear().domain([0, d3.max(summary, d => d.Avg_Peak_Glucose)]).nice().range([height, 0]);

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

    // Remove previous x/y axis labels
    chart.selectAll(".x-axis-label").remove();
    chart.selectAll(".y-axis-label").remove();

    // X-Axis Label
    chart.append("text")
      .attr("class", "x-axis-label")
      .attr("x", width / 2)
      .attr("y", height + 70)
      .style("text-anchor", "middle")
      .text(drillParticipant ? `Meals for Participant ${drillParticipant}` : "Participants");

    // Y-Axis Label
    chart.append("text")
      .attr("class", "y-axis-label")
      .attr("transform", "rotate(-90)")
      .attr("x", -height / 2)
      .attr("y", -50)
      .style("text-anchor", "middle")
      .text("Average Peak Glucose (mg/dL)");


    chart.selectAll(".bar")
      .data(summary)
      .join("rect")
      .attr("class", "bar")
      .attr("x", d => x(d.ID + "-participant"))
      .attr("y", d => y(d.Avg_Peak_Glucose))
      .attr("width", x.bandwidth())
      .attr("height", d => height - y(d.Avg_Peak_Glucose))
      .attr("fill", "steelblue")
      .on("click", (event, d) => {
        drillParticipant = d.ID;
        updateChart();
      })
      .on("mouseover", (event, d) => {
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
      .on("mouseout", () => tooltip.transition().duration(400).style("opacity", 0));

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
}


// Event Listeners
document.querySelectorAll(".nutrient").forEach(cb => cb.addEventListener("change", updateChart));
document.getElementById("genderSelect").addEventListener("change", updateChart);

const sortButton = document.getElementById("sortBtn");

sortButton.addEventListener("click", () => {
  sorted = !sorted;
  updateChart();

  sortButton.textContent = sorted ? "Sort by Participant" : "Sort by Glucose";
});

document.getElementById("thresholdInput").addEventListener("input", updateChart);

