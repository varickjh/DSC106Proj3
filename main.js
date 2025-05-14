<<<<<<< HEAD
<<<<<<< HEAD
// main.js

const svg = d3.select("#chart"),
      margin = { top: 50, right: 20, bottom: 80, left: 60 },
      width = +svg.attr("width") - margin.left - margin.right,
      height = +svg.attr("height") - margin.top - margin.bottom,
      chart = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

const tooltip = d3.select("#tooltip");
let rawData = [];
let sorted = false;

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
    summary.sort((a, b) => b.Avg_Peak_Glucose - a.Avg_Peak_Glucose);
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
    .domain(summary.map(d => d.ID + "-participant"))
    .range([0, width])
    .padding(0.2);

  const y = d3.scaleLinear()
    .domain([0, d3.max(summary, d => d.Avg_Peak_Glucose)]).nice()
    .range([height, 0]);

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
    .attr("x", d => x(d.ID + "-participant"))
    .attr("y", d => y(d.Avg_Peak_Glucose))
    .attr("width", x.bandwidth())
    .attr("height", d => height - y(d.Avg_Peak_Glucose))
    .attr("fill", "steelblue")
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
    .on("mouseout", () => {
      tooltip.transition().duration(400).style("opacity", 0);
    });
}

// ✅ Event Listeners
document.querySelectorAll(".nutrient").forEach(cb => cb.addEventListener("change", updateChart));
document.getElementById("genderSelect").addEventListener("change", updateChart);
document.getElementById("sortBtn").addEventListener("click", () => {
  sorted = !sorted;
  updateChart();
});
=======
// Sample data
const data = [
    { Food: "Apple", Calories: 95, Protein: 0.5, Sugar: 19, Carbohydrates: 25, Fat: 0.3, Fiber: 4, Gender: "All" },
    { Food: "Banana", Calories: 105, Protein: 1.3, Sugar: 14, Carbohydrates: 27, Fat: 0.4, Fiber: 3.1, Gender: "All" },
    { Food: "Orange", Calories: 62, Protein: 1.2, Sugar: 12, Carbohydrates: 15, Fat: 0.2, Fiber: 3.1, Gender: "All" },
    { Food: "Steak", Calories: 271, Protein: 26, Sugar: 0, Carbohydrates: 0, Fat: 18, Fiber: 0, Gender: "Male" },
    { Food: "Salmon", Calories: 208, Protein: 20, Sugar: 0, Carbohydrates: 0, Fat: 13, Fiber: 0, Gender: "All" },
    { Food: "Chicken", Calories: 165, Protein: 31, Sugar: 0, Carbohydrates: 0, Fat: 3.6, Fiber: 0, Gender: "All" },
    { Food: "Yogurt", Calories: 150, Protein: 12, Sugar: 18, Carbohydrates: 26, Fat: 3.3, Fiber: 0, Gender: "Female" },
    { Food: "Spinach", Calories: 7, Protein: 0.9, Sugar: 0.1, Carbohydrates: 1.1, Fat: 0.1, Fiber: 0.7, Gender: "All" },
    { Food: "Ice Cream", Calories: 267, Protein: 4.6, Sugar: 28, Carbohydrates: 31, Fat: 14, Fiber: 0.7, Gender: "All" },
    { Food: "Quinoa", Calories: 120, Protein: 4.4, Sugar: 0.9, Carbohydrates: 21, Fat: 1.9, Fiber: 2.8, Gender: "Female" }
];
=======
// main.js
>>>>>>> 6e69947eddca7e3e112ad6f236bec865afa71f07

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

<<<<<<< HEAD
// one bar chart function
>>>>>>> 0f524db0b7d3f5629abc6e6e86219c6f84ac966c
=======
function updateChart() {
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
    summary.sort((a, b) => b.Avg_Peak_Glucose - a.Avg_Peak_Glucose);
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
    .text("Average Peak Glucose Levels by Participant");
  
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
}

// ✅ Event Listeners
document.querySelectorAll(".nutrient").forEach(cb => cb.addEventListener("change", updateChart));
document.getElementById("genderSelect").addEventListener("change", updateChart);
document.getElementById("sortBtn").addEventListener("click", () => {
  sorted = !sorted;
  updateChart();
});
>>>>>>> 6e69947eddca7e3e112ad6f236bec865afa71f07
