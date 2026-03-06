import * as topojson from 'https://unpkg.com/topojson-client@3?module';

const width=975,
    height=610;
const projection = d3.geoAlbersUsa().scale(1300).translate([width/2, height/2])

const tempColorScale = d3.scaleLinear()
        .domain([-20, 0, 32, 65, 95]) 
        .range(['#542788', '#035d91', '#92c5de', '#ea9359', '#ca0020']) // color scale generated from AI
        .clamp(true);

const radiusScale = d3.scaleLinear()
    .domain([-20, 60, 100]) 
    .range([10, 5, 10]) 
    .clamp(true);

const radiusScale2 = d3.scaleLinear()
    .domain([0, 60])
    .range([2, 15])
    .clamp(true);
    
// found from: https://billmill.org/making_a_us_map.html#:~:text=Create%20your%20HTML,want%20to%20show%20state%20boundaries
function map(mapdata) {
  const usa = svg
    .append('g')
    .append('path')
    .datum(topojson.feature(mapdata, mapdata.objects.nation))
    .attr('d', d3.geoPath())

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
const options = ['Minimum Temperature', 'Maximum Temperature', 'Temperature Range']
                      
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
const t = 1000; 

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

      

        setupSelector()
        updateVis()
        // addLegend()
    })
    .catch(error => console.error('Error loading data:', error));
}


function setupSelector(){
  const padding = 300
  let slider = d3
      .sliderHorizontal()
      .min(d3.min(allData.map(d => +d.day)))
      .max(d3.max(allData.map(d => +d.day)))
      .step(1)
      .ticks(9)
      .width(width - padding)
      .displayValue(true)
      .default(targetDay)
      .on('onchange', (val) => {
        targetDay = +val
        const jan1 = new Date(2017, 0, 1);
        const date = new Date(jan1.setDate(+val));
        const timeFormat = d3.timeFormat("%B %d, %Y")
        d3.select('#value').text(timeFormat(date));
        updateVis()
      });

  d3.select('#slider')
       .append('svg')
       .attr('width', width)  // Adjust width if needed
       .attr('height', 100)
       .append('g')
       .attr('transform', 'translate(30,30)')
       .call(slider);

  d3.select('#tempVariable')
    .selectAll('myOptions')
    .data(options)
    .enter()
    .append('option')
    .text(d => d)
    .attr('value', d => d);

  d3.select('#tempVariable')
    .on('change', function(event) {
      const variableValue = d3.select(this).property('value');
      if(variableValue === 'Minimum Temperature') {
        tempVar = 'minTemp'
      } 
      else if(variableValue === 'Maximum Temperature') {
        tempVar = 'maxTemp'
      } 
      else if(variableValue === 'Temperature Range') {
        tempVar = 'rangeTemp'
      }

      updateVis()
    });
}

function updateVis(){
  let currentData = allData.filter(d => projection([d.longitude, d.latitude]) !== null)
                    .filter(d => d.day == targetDay);
 
  console.log(currentData)
  const points = svg.selectAll('.points')
    .data(currentData, d => d.station)
    .join(
        // When we have new data points
        function(enter){
            return enter.append('circle')
            .attr('class', 'points')
            .style('opacity', .5) 
            .on('mouseover', function (event, d) {
                console.log(d) 
                d3.select('#tooltip')
                  .style("display", 'block') 
                  .html( 
                  `<strong>${stateNames.get(d.state)}</strong><br/>
                  Station: ${d.station}<br/>
                  ${temp_map.get(tempVar)}: ${d[tempVar]}°F`)
                  .style("left", (event.pageX + 20) + "px")
                  .style("top", (event.pageY - 28) + "px");
                 d3.select(this) 
                  .style('stroke', 'black')
                  .style('stroke-width', '4px')
                })
            .on("mouseout", function (event, d) {
                d3.select('#tooltip')
                  .style('display', 'none')
                d3.select(this) // Refers to the hovered circle
                  .style('stroke', 'none')
                  .style('stroke-width', '0px')
            })
         
        },
        // Update existing points when data changes
        function(update){
            return update
        },
        // Remove points that no longer exist in the filtered data 
        function(exit){
            exit
            .transition(t)
            .attr('r',0)
            .remove();
        }
    )

    .transition().duration(t)
    .attr('transform', d => `translate(${projection([d.longitude, d.latitude]).join(",")})`)
    .attr('r', d => (tempVar === 'rangeTemp') ? radiusScale2(d[tempVar]) : radiusScale(d[tempVar]))
    .style('fill', d => (tempVar === 'rangeTemp') ? 'steelblue' : tempColorScale(d[tempVar]));
    
}

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
