import * as d3 from "d3"
import * as topojson from "topojson"

var zoomOn = null;
var env = process.env.PATH;
var url = '<%= path %>/assets/image.png';

console.log(url)

function numberFormat(num) {
    if ( num > 0 ) {
        if ( num > 1000000000 ) { return ( num / 1000000000 ).toFixed(1) + 'bn' }
        if ( num > 1000000 ) { return ( num / 1000000 ).toFixed(1) + 'm' }
        if (num % 1 != 0) { return num.toFixed(2) }
        else { return num.toLocaleString() }
    }
    if ( num < 0 ) {
        var posNum = num * -1;
        if ( posNum > 1000000000 ) return [ "-" + String(( posNum / 1000000000 ).toFixed(1)) + 'bn'];
        if ( posNum > 1000000 ) return ["-" + String(( posNum / 1000000 ).toFixed(1)) + 'm'];
        else { return num.toLocaleString() }
    }
    return num;
}

function makeMap(states,countryData,regionData) {

	var statusMessage = d3.select("#statusMessage");

	var width = document.querySelector("#mapContainer").getBoundingClientRect().width
	var height = width * 0.6

	if (width < 500) {
	    height = width * 0.8;
	}
	var margin = {top: 0, right: 0, bottom: 0, left:0}
	var active = d3.select(null);
	var scaleFactor = width / 860

	var topRadius = 25 * scaleFactor;
	var bottomRadius = 3 * scaleFactor;

	var radius = d3.scaleSqrt()
					.range([bottomRadius,topRadius])    
					.domain([1,550])	

	var projection = d3.geoMercator()
					.scale(width / 2 / Math.PI)
					.rotate([-150,0])
	                .translate([width/2,height * 0.6])

	var path = d3.geoPath()
	    .projection(projection);

	var graticule = d3.geoGraticule();  

	// console.log(sa2s.objects.sa2s)

	var zoom = d3.zoom()
	        .scaleExtent([1, 100])
	        .on("zoom", zoomed);    

	d3.select("#mapContainer svg").remove();
	        
	var svg = d3.select("#mapContainer").append("svg")	
	                .attr("width", width)
	                .attr("height", height)
	                .attr("id", "map")
	                .attr("overflow", "hidden")
	                .on("mousemove", tooltipMove)
	                .on('onTouchStart', function(currentSwiper, e) {
	                    if (isAndroidApp && window.GuardianJSInterface.registerRelatedCardsTouch) {
	                        window.GuardianJSInterface.registerRelatedCardsTouch(true);
	                    }
	                })
	                .on('onTouchEnd', function(currentSwiper, e) {
	                    if (isAndroidApp && window.GuardianJSInterface.registerRelatedCardsTouch) {
	                        window.GuardianJSInterface.registerRelatedCardsTouch(false);
	                    }
	                });

	// if (zoomOn == true | zoomOn == null) {
	//     svg.call(zoom)
	// }                

	var tooltip = d3.select("#mapContainer")
	    .append("div")
	    .attr("class", "tooltip")
	    .style("position", "absolute")
	    .style("z-index", "20")
	    .style("visibility", "hidden")
	    .style("top", "30px")
	    .style("left", "55px");                 

	var features = svg.append("g")

	features.append("path")
	            .datum(graticule)
	            .attr("class", "graticule")
	            .attr("d", path);                       

	features.append("g")
	    .selectAll("path")
	    .data(topojson.feature(states,states.objects.countries).features)
	    .enter().append("path")
	        .attr("class", "country")
	        .attr("id", d => d.properties.ADMIN)
	        .attr("fill", "#dcdcdc")
	        .attr("data-tooltip","")
	        .attr("d", path);

	if (width > 480) {
	    features.append("path")
	      .attr("class", "mesh")
	      .attr("stroke-width", 0.5)
	      .attr("d", path(topojson.mesh(states,states.objects.countries, function(a, b) { return a !== b; }))); 
	}
	      

	var scaleColour = d3.scaleLinear()
							.range(["#ca0020","#f7f7f7","#0571b0"])
							.domain([-45,0,45]);

	countryData.forEach(function(d) {
		d.lat = +d.lat;
		d.lon = +d.lon;
		d['2018-19'] = +d['2018-19'];
		d['change'] = +d['change'];
		d['%_change'] = +d['%_change'];
	})


	countryData.sort(function (a, b) {
 		return b.spending - a.spending;
	});

	var mapCircles = features.selectAll(".mapCircle")
							.data(countryData);				

	mapCircles					
		.enter()
			.append("svg:circle")
			.attr("class", "mapCircle")
			.attr("cx",function(d){
			 return projection([d.lon,d.lat])[0]
			})
			.attr("cy",function(d){ return projection([d.lon,d.lat])[1]})
			.attr("r", function(d){ return radius(d['2018-19']) } )
			.style("fill", function(d) { return scaleColour(d['change']); })
			.style("opacity", 0.8)
			.on("mouseover", tooltipIn)
	        .on("mouseout", tooltipOut) 


	statusMessage.transition(600).style("opacity",0);


	function tooltipMove(d) {
	    var leftOffset = 0
	    var rightOffset = 0
	    var mouseX = d3.mouse(this)[0]
	    var mouseY = d3.mouse(this)[1]
	    var half = width/2;
	    if (mouseX < half) {
	        d3.select(".tooltip").style("left", d3.mouse(this)[0] + "px");
	    }

	    else if (mouseX >= half) {
	        d3.select(".tooltip").style("left", ( d3.mouse(this)[0] -200) + "px");
	    }
	    
	    d3.select(".tooltip").style("top", (d3.mouse(this)[1] + 30 ) + "px");
	}       

	function tooltipIn(d) {     
		console.log(d)
	    // var tooltipText = d3.select(this).attr('data-tooltip')
	    d3.select(".tooltip").html(`<b>${d.region}</b><br>Alert status: <b>${d['2018-19']}</b>`).style("visibility", "visible");
	    
	}

	function tooltipOut(d) {
	    d3.select(".tooltip").style("visibility", "hidden");
	}           


	d3.select("#zoomIn").on("click", function(d) {
	    zoom.scaleBy(svg.transition().duration(750), 1.5);
	});    

	d3.select("#zoomOut").on("click", function(d) {
	    zoom.scaleBy(svg.transition().duration(750), 1/1.5);
	}); 

	d3.select("#zoomToggle").on("click", function(d) {
	    toggleZoom();
	}); 

	function toggleZoom() {

	    
	    console.log(zoomOn)
	    if (zoomOn == false) {
	        d3.select("#zoomToggle").classed("zoomLocked", false)
	        d3.select("#zoomToggle").classed("zoomUnlocked", true) 
	        svg.call(zoom);
	        zoomOn = true
	    }

	    else if (zoomOn == true) {
	        svg.on('.zoom', null);
	        d3.select("#zoomToggle").classed("zoomLocked", true)
	        d3.select("#zoomToggle").classed("zoomUnlocked", false) 
	        zoomOn = false
	    }

	    else if (zoomOn == null) {
	        svg.on('.zoom', null);
	        d3.select("#zoomToggle").classed("zoomLocked", true)
	        d3.select("#zoomToggle").classed("zoomUnlocked", false)  
	        svg.call(zoom);
	        zoomOn = false
	    }

	   
	}


	if (width < 500) {
	    if (zoomOn == null) {
	        toggleZoom()
	    }
	}

	function zoomed() {
	    
	    scaleFactor = d3.event.transform.k;
	    d3.selectAll(".mesh").style("stroke-width", 0.5 / d3.event.transform.k + "px");
	    features.style("stroke-width", 0.5 / d3.event.transform.k + "px");
	    features.attr("transform", d3.event.transform); // updated for d3 v4

	    features.selectAll(".placeContainers")
	        .style("display", function(d) { 
	            if (d['properties']['scalerank'] < d3.event.transform.k) {
	                return "block";
	            }
	            else {
	                return "none";
	            }
	            })

	    features.selectAll(".placeText")
	            .style("font-size", 0.8/d3.event.transform.k + "rem")
	            .attr("dx", 5/d3.event.transform.k )
	            .attr("dy", 5/d3.event.transform.k );   

	    features.selectAll(".mapCircle")
			.attr("r", radius/d3.event.transform.k )
			.style("stroke-width", .5 / d3.event.transform.k + "px");                    

	}

	function reset() {
	    active.classed("active", false);
	    active = d3.select(null);
	    svg.transition()
	        .duration(750)
	        .call( zoom.transform, d3.zoomIdentity );
	}


}

console.log('<%= path %>/assets/countries.json');

Promise.all([
	d3.json('<%= path %>/assets/countries.json'),
	d3.csv('<%= path %>/assets/oda-allocation.csv'),
	d3.csv('<%= path %>/assets/regions.csv')
])
.then((results) =>  {
	makeMap(results[0],results[1],results[2])
});