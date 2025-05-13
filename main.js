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
function updateChart() {
    const chartContainer = document.getElementById('chart-container');
    chartContainer.innerHTML = '';
    
    // Show message if no features selected
    if (selectedFeatures.length === 0) {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'empty-chart-message';
        messageDiv.textContent = 'Please select at least one feature to display';
        chartContainer.appendChild(messageDiv);
        return;
    }
    
    // Create SVG element
    const containerWidth = chartContainer.clientWidth;
    const containerHeight = chartContainer.clientHeight;
    
    const margin = { top: 40, right: 30, bottom: 90, left: 60 };
    const width = containerWidth - margin.left - margin.right;
    const height = containerHeight - margin.top - margin.bottom;
    
    const svg = d3.select(chartContainer)
        .append('svg')
        .attr('width', containerWidth)
        .attr('height', containerHeight)
        .append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);
    
    // Filter data based on gender selection
    const filteredData = data.filter(d => 
        selectedGender === 'All' ? true : d.Gender === selectedGender || d.Gender === 'All'
    );
    
    // Process data for stacked bars
    const stackedData = filteredData.map(item => {
        const foodItem = { Food: item.Food };
        selectedFeatures.forEach(feature => {
            foodItem[feature] = item[feature];
        });
        return foodItem;
    });
    
    // Sort data if needed
    if (sortByValue) {
        stackedData.sort((a, b) => {
            let sumA = 0, sumB = 0;
            selectedFeatures.forEach(feature => {
                sumA += a[feature];
                sumB += b[feature];
            });
            return d3.descending(sumA, sumB);
        });
    } else {
        stackedData.sort((a, b) => d3.ascending(a.Food, b.Food));
    }
    
    // X axis
    const x = d3.scaleBand()
        .domain(stackedData.map(d => d.Food))
        .range([0, width])
        .padding(0.2);
    
    svg.append('g')
        .attr('transform', `translate(0,${height})`)
        .call(d3.axisBottom(x))
        .selectAll('text')
        .attr('transform', 'translate(-10,0)rotate(-45)')
        .style('text-anchor', 'end');
    
    // Calculate max value for Y scale
    let maxValue = 0;
    stackedData.forEach(d => {
        let sum = 0;
        selectedFeatures.forEach(feature => {
            sum += d[feature];
        });
        maxValue = Math.max(maxValue, sum);
    });
    
    // Y axis
    const y = d3.scaleLinear()
        .domain([0, maxValue * 1.1])
        .range([height, 0]);
    
    svg.append('g')
        .call(d3.axisLeft(y));
    
    // Add Y axis label
    svg.append('text')
        .attr('transform', 'rotate(-90)')
        .attr('y', -margin.left + 20)
        .attr('x', -height / 2)
        .attr('text-anchor', 'middle')
        .text('Value');
    
    // Create tooltip
    const tooltip = d3.select('body')
        .append('div')
        .attr('class', 'tooltip')
        .style('opacity', 0);
    
    // Create bar groups
    const barGroups = svg.selectAll('.bar-group')
        .data(stackedData)
        .enter()
        .append('g')
        .attr('class', 'bar-group')
        .attr('transform', d => `translate(${x(d.Food)},0)`);
    
    // Create stacked bars
    let yOffset = {};
    stackedData.forEach(d => {
        yOffset[d.Food] = 0;
    });
    
    selectedFeatures.forEach(feature => {
        barGroups.append('rect')
            .attr('class', 'bar')
            .attr('width', x.bandwidth())
            .attr('y', d => y(d[feature] + yOffset[d.Food]))
            .attr('height', d => height - y(d[feature]))
            .attr('fill', color(feature))
            .attr('data-feature', feature)
            .on('mouseover', function(event, d) {
                const featureName = d3.select(this).attr('data-feature');
                const value = d[featureName];
                
                tooltip.transition()
                    .duration(200)
                    .style('opacity', .9);
                tooltip.html(`<strong>${d.Food}</strong><br>${featureName}: ${value}`)
                    .style('left', (event.pageX + 10) + 'px')
                    .style('top', (event.pageY - 28) + 'px');
            })
            .on('mouseout', function() {
                tooltip.transition()
                    .duration(500)
                    .style('opacity', 0);
            });
        
        // Update offset for next bar
        stackedData.forEach(d => {
            yOffset[d.Food] += d[feature];
        });
    });
}

// Initialize on page load
window.addEventListener('DOMContentLoaded', init);

// Handle window resize
window.addEventListener('resize', function() {
    updateChart();
});

// one bar chart function