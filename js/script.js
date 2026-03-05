import * as topojson from 'https://unpkg.com/topojson-client@3?module';

const width=975,
    height=610;
const projection = d3.geoAlbersUsa().scale(1300).translate([width/2, height/2])

// Create SVG
function map(mapdata) {
  // Create an svg element to hold our map, and set it to the proper width and
  // height. The viewBox is set to a constant value becase the projection we're
  // using is designed for that viewBox size:
  // https://github.com/topojson/us-atlas#us-atlas-topojson

  // Create the US boundary
  const usa = svg
    .append('g')
    .append('path')
    .datum(topojson.feature(mapdata, mapdata.objects.nation))
    .attr('d', d3.geoPath())

  // Create the state boundaries. "stroke" and "fill" set the outline and fill
  // colors, respectively.
  const state = svg
    .append('g')
    .attr('stroke', '#fff')
    .attr('fill', '#ddd')
    .selectAll('path')
    .data(topojson.feature(mapdata, mapdata.objects.states).features)
    .join('path')
    .attr('vector-effect', 'non-scaling-stroke')
    .attr('d', d3.geoPath());
}



let allData = []
let targetDay = 30
let tempVar = 'minTemp'
// let xVar = 'income', yVar = 'lifeExp', sizeVar = 'population', targetYear = 2000
// let xScale, yScale, sizeScale
// const options = ['income', 'lifeExp', 'gdp', 'population', 'childDeaths']
const temp_map = new Map([['minTemp', 'Minimum Temperature'], ['maxTemp', 'Maximum Temperature'], ['rangeTemp', 'Temperature Range']])
const stateNames = new Map([ //AI generated
    ['AL', 'Alabama'], ['AK', 'Alaska'], ['AZ', 'Arizona'], ['AR', 'Arkansas'],
    ['CA', 'California'], ['CO', 'Colorado'], ['CT', 'Connecticut'], ['DE', 'Delaware'],
    ['FL', 'Florida'], ['GA', 'Georgia'], ['HI', 'Hawaii'], ['ID', 'Idaho'],
    ['IL', 'Illinois'], ['IN', 'Indiana'], ['IA', 'Iowa'], ['KS', 'Kansas'],
    ['KY', 'Kentucky'], ['LA', 'Louisiana'], ['ME', 'Maine'], ['MD', 'Maryland'],
    ['MA', 'Massachusetts'], ['MI', 'Michigan'], ['MN', 'Minnesota'], ['MS', 'Mississippi'],
    ['MO', 'Missouri'], ['MT', 'Montana'], ['NE', 'Nebraska'], ['NV', 'Nevada'],
    ['NH', 'New Hampshire'], ['NJ', 'New Jersey'], ['NM', 'New Mexico'], ['NY', 'New York'],
    ['NC', 'North Carolina'], ['ND', 'North Dakota'], ['OH', 'Ohio'], ['OK', 'Oklahoma'],
    ['OR', 'Oregon'], ['PA', 'Pennsylvania'], ['RI', 'Rhode Island'], ['SC', 'South Carolina'],
    ['SD', 'South Dakota'], ['TN', 'Tennessee'], ['TX', 'Texas'], ['UT', 'Utah'],
    ['VT', 'Vermont'], ['VA', 'Virginia'], ['WA', 'Washington'], ['WV', 'West Virginia'],
    ['WI', 'Wisconsin'], ['WY', 'Wyoming']
]);
const t = 1000; // 1000ms = 1 second
// const continents = ['Africa', 'Asia', 'Oceania', 'Americas', 'Europe']
// const colorScale = d3.scaleOrdinal(continents, d3.schemeSet2); // d3.schemeSet2 is a set of predefined colors. 

function dayOfYear(dateStr) { // AI generated function
    const year = dateStr.slice(0, 4);
    const month = dateStr.slice(4, 6);
    const day = dateStr.slice(6, 8);
    const date = new Date(year, month - 1, day); // month is 0-indexed
    const jan1 = new Date(year, 0, 1);
    return Math.floor((date - jan1) / (1000 * 60 * 60 * 24)) + 1; // ms to days
}

function init(){
    d3.csv("./data/weather.csv", 
        function(d) {
            return {  
            // Besides converting the types, we also simpilify the variable names here. 
            station: d.station,
            state: d.state,
            latitude: +d.latitude, // using + to convert to numbers; same below
            longitude: +d.longitude, 
            date: +(d.date.slice(4)),
            day: dayOfYear(d.date),
            minTemp: +d.TMIN, 
            maxTemp: +d.TMAX,
            rangeTemp: +d.TMAX - +d.TMIN
            }
        }
    )
    .then(data => {
        const validStates = new Set(['AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA',
        'HI','ID','IL','IN','IA','KS','KY','LA','ME','MD',
        'MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ',
        'NM','NY','NC','ND','OH','OK','OR','PA','RI','SC',
        'SD','TN','TX','UT','VT','VA','WA','WV','WI','WY'])
        // console.log(data)
        allData = data.filter(d => validStates.has(d.state))
                  .filter(d => 
                  d.station &&
                  d.state &&
                  !isNaN(d.latitude) &&
                  !isNaN(d.longitude) &&
                  !isNaN(d.minTemp) &&
                  !isNaN(d.maxTemp) &&
                  projection([d.longitude, d.latitude]) !== null)
        // setupSelector()
        
        // Initial rendering steps:
        // P.S. You could move these into setupSelector(), 
        // but calling them separately makes the flow clearer.
        // updateAxes()
        updateVis()
        // addLegend()
    })
    .catch(error => console.error('Error loading data:', error));
}

// // Here’s what each function is responsible for:

// function setupSelector(){
//   // Handles UI changes (sliders, dropdowns)
//   // Anytime the user tweaks something, this function reacts.
//   // May need to call updateAxes() and updateVis() here when needed!
//   let slider = d3
//       .sliderHorizontal()
//       .min(d3.min(allData.map(d => +d.year))) // setup the range
//       .max(d3.max(allData.map(d => +d.year))) // setup the range
//       .step(1)
//       .width(width)  // Widen the slider if needed
//       .displayValue(false)
//       .default(targetYear)
//       .on('onchange', (val) => {
//         targetYear = +val // Update the year
//         updateVis() // Refresh the chart
//       });

//   d3.select('#slider')
//       .append('svg')
//       .attr('width', width)  // Adjust width if needed
//       .attr('height', 100)
//       .append('g')
//       .attr('transform', 'translate(30,30)')
//       .call(slider);

//   d3.selectAll('.variable')
//    // loop over each dropdown button
//     .each(function() {
//         d3.select(this).selectAll('myOptions')
//         .data(options)
//         .enter()
//         .append('option')
//         .text(d => options_map.get(d)) // The displayed text
//         .attr("value",d => d) // The actual value used in the code
//     }).on("change", function (event) {
//         const var_id = d3.select(this).property("id")
//         if (var_id == "xVariable") {
//           xVar = d3.select(this).property("value")
//         } else if (var_id == "yVariable") {
//           yVar = d3.select(this).property("value")
//         } else if (var_id == "sizeVariable") {
//           sizeVar = d3.select(this).property("value")
//         }
//         updateAxes(); 
//         updateVis();
//     })
//   d3.select('#xVariable').property('value', xVar)
//   d3.select('#yVariable').property('value', yVar)
//   d3.select('#sizeVariable').property('value', sizeVar)

// }

// function updateAxes(){
//   // Draws the x-axis and y-axis
//   // Adds ticks, labels, and makes sure everything lines up nicely
//   svg.selectAll('.axis').remove()
//   svg.selectAll('.labels').remove()
//   xScale = d3.scaleLinear()
//     .domain([0, d3.max(allData, d => d[xVar])])
//     .range([0, width]);
//   const xAxis = d3.axisBottom(xScale)

//   svg.append("g")
//     .attr("class", "axis")
//     .attr("transform", `translate(0,${height})`) // Position at the bottom
//     .call(xAxis);

//   yScale = d3.scaleLinear()
//     .domain([0, d3.max(allData, d => d[yVar])])
//     .range([height, 0]);
//   const yAxis = d3.axisLeft(yScale)

//   svg.append("g")
//     .attr("class", "axis")
//     .call(yAxis);

//   sizeScale = d3.scaleSqrt()
//     .domain([0, d3.max(allData, d => d[sizeVar])]) // Largest bubble = largest data point 
//     .range([5, 20]); // Feel free to tweak these values if you want bigger or smaller bubbles

//   // X-axis label
//   svg.append("text")
//       .attr("x", width / 2)
//       .attr("y", height + margin.bottom - 20)
//       .attr("text-anchor", "middle")
//       .text(options_map.get(xVar)) // Displays the current x-axis variable
//       .attr('class', 'labels')

//   // Y-axis label (rotated)
//   svg.append("text")
//       .attr("transform", "rotate(-90)")
//       .attr("x", -height / 2)
//       .attr("y", -margin.left + 40)
//       .attr("text-anchor", "middle")
//       .text(options_map.get(yVar)) // Displays the current y-axis variable
//       .attr('class', 'labels')

// }

function updateVis(){
  // Draws (or updates) the bubbles
  // Filter data for the current year
  // let currentData = allData.filter(d => d.year === targetYear)
  let currentData = allData.filter(d => projection([d.longitude, d.latitude]) !== null)
                    .filter(d => d.day == targetDay);
  console.log(currentData)
  const points = svg.selectAll('.points')
    .data(currentData, d => d.station)
    .join(
        // When we have new data points
        function(enter){
            return enter.append('g')
            .attr('transform', d => `translate(${projection([d.longitude, d.latitude]).join(",")})`)
            .append('circle')
            // .attr('class', 'points')
            // .attr('cx', d => xScale(d[xVar])) // Position on x-axis
            // .attr('cy', d => yScale(d[yVar])) // Position on y-axis
            // .attr('r',  d => sizeScale(d[sizeVar])) // Bubble size
            .attr('r', 10)
            // .style('fill', d => colorScale(d.continent))
            .style('fill', 'steelblue')
            .style('opacity', .5) // Slight transparency for better visibility
            .on('mouseover', function (event, d) {
                console.log(d) // See the data point in the console for debugging
                d3.select('#tooltip')
                  // if you change opacity to hide it, you should also change opacity here
                  .style("display", 'block') // Make the tooltip visible
                  .html( // Change the html content of the <div> directly
                  `<strong>${stateNames.get(d.state)}</strong><br/>
                  Station: ${d.station}<br/>
                  ${temp_map.get(tempVar)}: ${d[tempVar]}°F`)
                  .style("left", (event.pageX + 20) + "px")
                  .style("top", (event.pageY - 28) + "px");
                 d3.select(this) // Refers to the hovered circle
                  .style('stroke', 'black')
                  .style('stroke-width', '4px')
                })
            .on("mouseout", function (event, d) {
                d3.select('#tooltip')
                  .style('display', 'none')
                d3.select(this) // Refers to the hovered circle
                  .style('stroke', 'none')
                  .style('stroke-width', '0px')
                //placeholder: hide it
            })
            // .attr('r',0)
            // .transition(t)
            // .attr('r',  d => sizeScale(d[sizeVar]))
        },
        // Update existing points when data changes
        function(update){
            return update
            .transition(t)
            .attr('cx', d => xScale(d[xVar]))
            .attr('cy', d => yScale(d[yVar]))
            .attr('r',  d => sizeScale(d[sizeVar]))
        },
        // Remove points that no longer exist in the filtered data 
        function(exit){
            exit
            .transition(t)
            .attr('r',0)
            .remove()
        }
    )
    
}

// function addLegend(){
//   let size = 10  // Size of the legend squares

//   // Your turn, draw a set of rectangles using D3
//   svg.selectAll('continentSquare')
//     .data(continents, d => d.continents)
//     .enter()
//     .append("rect")
//     .attr("width", 10)
//     .attr("height", 10)
//     .attr("y", -margin.top/2)
//     .attr("x", (d, i) => i * (size + 100) + 100)
//     .style("fill", d => colorScale(d))

//   svg.selectAll("continentName")
//       .data(continents)
//       .enter()
//       .append("text")
//       .attr("y", -margin.top/2 + size) // Align vertically with the square
//       .attr("x", (d, i) => i * (size + 100) + 120)  
//       .style("fill", d => colorScale(d))  // Match text color to the square
//       .text(d => d) // The actual continent name
//       .attr("text-anchor", "left")
//       .style('font-size', '13px')
//   // data here should be "continents", which we've defined as a global variable
//   // the rect's y could be  -margin.top/2, x could be based on i * (size + 100) + 100
//   // i is the index in the continents array
//   // use "colorScale" to fill them; colorScale is a global variable we defined, used in coloring bubbles
// }


const svg = d3.select("#map").append("svg")
      .attr("width", width)
      .attr("height", height)
      .attr("viewBox", [0, 0, 1200, 610])
      .attr("style", "width: 100%; height: auto; height: intrinsic;");

window.addEventListener('DOMContentLoaded', async (event) => {
  const res = await fetch(`https://cdn.jsdelivr.net/npm/us-atlas@3/states-albers-10m.json`)
  const mapJson = await res.json()
  map(mapJson)
});
window.addEventListener('load', init);

// Create SVG
// const svg = d3.select('#vis')
//     .append('svg')
//     .attr('width', width)
//     .attr('height', height)
//     .append('g')
//     .attr('transform', `translate(${margin.left},${margin.top})`);


// svg.append('g')
//    .attr('transform', `translate(0,${height})`)
//    .call(xAxis);


// svg.append('g')
//     .attr('class', 'y-axis')
//     .call(yAxis);
