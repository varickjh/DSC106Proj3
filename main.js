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

// Available features
const features = ["Calories", "Protein", "Sugar", "Carbohydrates", "Fat", "Fiber"];

// State variables
let selectedFeatures = [0]; // Default: Calories (0) selected
let selectedGender = "All";
let sortByValue = false;
let feature_dictionary = {
    "Calories": 0,
    "Protein": 1,
    "Sugar": 2,
    "Carbohydrates": 3,
    "Fat": 4,
    "Fiber": 5
};

let feature_label = {
    0: "Calories",
    1: "Protein",
    2: "Sugar",
    3: "Carbohydrates",
    4: "Fat",
    5: "Fiber"
};

// Color scale
const color = d3.scaleOrdinal()
    .domain(features)
    .range(d3.schemeCategory10);

    Promise.all([
        d3.csv("data/food_log.csv"),      // rename if needed
        d3.csv("data/dexcom.csv")         // rename if needed
      ]).then(([food_df, dexcom_df]) => {
      
        // Parse food_df columns
        food_df.forEach(d => {
          d.time_begin = new Date(d.time_begin);
          d.calorie = +d.calorie;
          d.total_carb = +d.total_carb;
          d.dietary_fiber = +d.dietary_fiber;
          d.sugar = +d.sugar;
          d.protein = +d.protein;
          d.total_fat = +d.total_fat;
          d.ID = +d.ID;
        });
      
        // Parse dexcom_df columns
        dexcom_df.forEach(d => {
          d.Timestamp = new Date(d["Timestamp (YYYY-MM-DDThh:mm:ss)"]);
          d["Glucose Value (mg/dL)"] = +d["Glucose Value (mg/dL)"];
          d.ID = +d.ID;
        });
      
        // Make them global
        window.food_df = food_df;
        window.dexcom_df = dexcom_df;
      
        // Kick off the UI rendering
        init();
      });
      


    
// Initialize the chart
function init() {
    // Populate checkboxes
    const checkboxContainer = document.getElementById('feature-checkboxes');
    features.forEach(feature => {
        const checkboxItem = document.createElement('div');
        checkboxItem.className = 'checkbox-item';
        
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.id = `feature-${feature}`;
        checkbox.value = feature;
        checkbox.checked = feature === 'Calories'; // Default: Calories selected
        checkbox.addEventListener('change', handleFeatureChange);
        
        const label = document.createElement('label');
        label.htmlFor = `feature-${feature}`;
        label.textContent = feature;
        
        checkboxItem.appendChild(checkbox);
        checkboxItem.appendChild(label);
        checkboxContainer.appendChild(checkboxItem);
    });
    
    // Add event listeners
    document.getElementById('gender-select').addEventListener('change', handleGenderChange);
    document.getElementById('sort-button').addEventListener('click', handleSortToggle);
    
    // Initial chart rendering
    updateChart();
    updateLegend();
}

// Handle feature checkbox change
function handleFeatureChange(event) {
    const feature = event.target.value;
    
    if (event.target.checked) {
        // Add feature if checked
        if (!selectedFeatures.includes(feature_dictionary[feature])) {
            selectedFeatures.push(feature_dictionary[feature]);
        }
    } else {
        // Remove feature if unchecked
        selectedFeatures = selectedFeatures.filter(f => f !== feature);
    }
    
    updateChart();
    updateLegend();
}

// Handle gender selection change
function handleGenderChange(event) {
    selectedGender = event.target.value;
    updateChart();
}

// Handle sort button click
function handleSortToggle() {
    sortByValue = !sortByValue;
    document.getElementById('sort-button').textContent = sortByValue ? 'Sort by Name' : 'Sort by Value';
    updateChart();
}

// Update the legend
function updateLegend() {
    const legendContainer = document.getElementById('legend');
    legendContainer.innerHTML = '';
    
    selectedFeatures.forEach(feature => {
        const legendItem = document.createElement('div');
        legendItem.className = 'legend-item';
        
        const colorBox = document.createElement('span');
        colorBox.className = 'legend-color';
        colorBox.style.backgroundColor = color(feature);
        
        const labelText = document.createElement('span');
        labelText.textContent = feature_label[feature];
        
        legendItem.appendChild(colorBox);
        legendItem.appendChild(labelText);
        legendContainer.appendChild(legendItem);
    });
}

// Update the chart
// function updateChart() { //delete this and replace function to create the bar chart
//     const chartContainer = document.getElementById('chart-container');
//     chartContainer.innerHTML = '';
    
//     // Show message if no features selected
//     if (selectedFeatures.length === 0) {
//         const messageDiv = document.createElement('div');
//         messageDiv.className = 'empty-chart-message';
//         messageDiv.textContent = 'Please select at least one feature to display';
//         chartContainer.appendChild(messageDiv);
//         return;
//     }
    
//     // Create SVG element
//     const containerWidth = chartContainer.clientWidth;
//     const containerHeight = chartContainer.clientHeight;
    
//     const margin = { top: 40, right: 30, bottom: 90, left: 60 };
//     const width = containerWidth - margin.left - margin.right;
//     const height = containerHeight - margin.top - margin.bottom;
    
//     const svg = d3.select(chartContainer)
//         .append('svg')
//         .attr('width', containerWidth)
//         .attr('height', containerHeight)
//         .append('g')
//         .attr('transform', `translate(${margin.left},${margin.top})`);
    
//     // Filter data based on gender selection
//     const filteredData = data.filter(d => 
//         selectedGender === 'All' ? true : d.Gender === selectedGender || d.Gender === 'All'
//     );
    
//     // Process data for stacked bars
//     const stackedData = filteredData.map(item => {
//         const foodItem = { Food: item.Food };
//         selectedFeatures.forEach(feature => {
//             foodItem[feature] = item[feature];
//         });
//         return foodItem;
//     });
    
//     // Sort data if needed
//     if (sortByValue) {
//         stackedData.sort((a, b) => {
//             let sumA = 0, sumB = 0;
//             selectedFeatures.forEach(feature => {
//                 sumA += a[feature];
//                 sumB += b[feature];
//             });
//             return d3.descending(sumA, sumB);
//         });
//     } else {
//         stackedData.sort((a, b) => d3.ascending(a.Food, b.Food));
//     }
    
//     // X axis
//     const x = d3.scaleBand()
//         .domain(stackedData.map(d => d.Food))
//         .range([0, width])
//         .padding(0.2);
    
//     svg.append('g')
//         .attr('transform', `translate(0,${height})`)
//         .call(d3.axisBottom(x))
//         .selectAll('text')
//         .attr('transform', 'translate(-10,0)rotate(-45)')
//         .style('text-anchor', 'end');
    
//     // Calculate max value for Y scale
//     let maxValue = 0;
//     stackedData.forEach(d => {
//         let sum = 0;
//         selectedFeatures.forEach(feature => {
//             sum += d[feature];
//         });
//         maxValue = Math.max(maxValue, sum);
//     });
    
//     // Y axis
//     const y = d3.scaleLinear()
//         .domain([0, maxValue * 1.1])
//         .range([height, 0]);
    
//     svg.append('g')
//         .call(d3.axisLeft(y));
    
//     // Add Y axis label
//     svg.append('text')
//         .attr('transform', 'rotate(-90)')
//         .attr('y', -margin.left + 20)
//         .attr('x', -height / 2)
//         .attr('text-anchor', 'middle')
//         .text('Value');
    
//     // Create tooltip
//     const tooltip = d3.select('body')
//         .append('div')
//         .attr('class', 'tooltip')
//         .style('opacity', 0);
    
//     // Create bar groups
//     const barGroups = svg.selectAll('.bar-group')
//         .data(stackedData)
//         .enter()
//         .append('g')
//         .attr('class', 'bar-group')
//         .attr('transform', d => `translate(${x(d.Food)},0)`);
    
//     // Create stacked bars
//     let yOffset = {};
//     stackedData.forEach(d => {
//         yOffset[d.Food] = 0;
//     });
    
//     selectedFeatures.forEach(feature => {
//         barGroups.append('rect')
//             .attr('class', 'bar')
//             .attr('width', x.bandwidth())
//             .attr('y', d => y(d[feature] + yOffset[d.Food]))
//             .attr('height', d => height - y(d[feature]))
//             .attr('fill', color(feature))
//             .attr('data-feature', feature)
//             .on('mouseover', function(event, d) {
//                 const featureName = d3.select(this).attr('data-feature');
//                 const value = d[featureName];
                
//                 tooltip.transition()
//                     .duration(200)
//                     .style('opacity', .9);
//                 tooltip.html(`<strong>${d.Food}</strong><br>${featureName}: ${value}`)
//                     .style('left', (event.pageX + 10) + 'px')
//                     .style('top', (event.pageY - 28) + 'px');
//             })
//             .on('mouseout', function() {
//                 tooltip.transition()
//                     .duration(500)
//                     .style('opacity', 0);
//             });
        
//         // Update offset for next bar
//         stackedData.forEach(d => {
//             yOffset[d.Food] += d[feature];
//         });
//     });
// }

function getAvgCaloriesPerParticipant(food_df, genderFilter = "All") {
    const filtered = food_df.filter(d => {
      return genderFilter === "All" || d.Gender === genderFilter;
    });
  
    const grouped = d3.rollup(
      filtered,
      v => d3.mean(v, d => d.calorie),
      d => d.ID
    );
  
    return Array.from(grouped, ([participant, avg_calorie]) => ({
      participant,
      avg_calorie
    }));
  }
  function updateChart() {
    if (!window.food_df) return;
  
    const data = getAvgCaloriesPerParticipant(food_df, selectedGender);
    
    d3.select("#chart-container").selectAll("*").remove();
    drawBarChart(data);
  }
  function drawBarChart(data) {
    const width = 800;
    const height = 400;
    const margin = { top: 30, right: 20, bottom: 50, left: 60 };
  
    const svg = d3.select("#chart-container")
      .append("svg")
      .attr("width", width)
      .attr("height", height);
  
    const x = d3.scaleBand()
      .domain(data.map(d => d.participant))
      .range([margin.left, width - margin.right])
      .padding(0.1);
  
    const y = d3.scaleLinear()
      .domain([0, d3.max(data, d => d.avg_calorie)])
      .nice()
      .range([height - margin.bottom, margin.top]);
  
    svg.append("g")
      .selectAll("rect")
      .data(data)
      .enter()
      .append("rect")
      .attr("x", d => x(d.participant))
      .attr("y", d => y(d.avg_calorie))
      .attr("width", x.bandwidth())
      .attr("height", d => y(0) - y(d.avg_calorie))
      .attr("fill", "tomato");
  
    svg.append("g")
      .attr("transform", `translate(0,${height - margin.bottom})`)
      .call(d3.axisBottom(x).tickFormat(d => `P${d}`));
  
    svg.append("g")
      .attr("transform", `translate(${margin.left},0)`)
      .call(d3.axisLeft(y));
  
    svg.append("text")
      .attr("x", width / 2)
      .attr("y", margin.top / 2)
      .attr("text-anchor", "middle")
      .attr("font-size", "16px")
      .text("Average Calorie Intake by Participant");
  }
      


// Initialize on page load
window.addEventListener('DOMContentLoaded', init);

// Handle window resize
window.addEventListener('resize', function() {
    updateChart();
});

// one bar chart function
>>>>>>> 0f524db0b7d3f5629abc6e6e86219c6f84ac966c
