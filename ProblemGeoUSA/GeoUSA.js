/**
 * Created by hen on 3/8/14.
 */

var margin = {
    top: 50,
    right: 50,
    bottom: 50,
    left: 50
};

var width = 1060 - margin.left - margin.right;
var height = 800 - margin.bottom - margin.top;

var bbVis = {
    x: 100,
    y: 10,
    w: width - 100,
    h: 300
};

var detail_par = {
    x : 25,
    y : 25,
    w : 350,
    h: 250
}   

var detailVis = d3.select("#detailVis").append("svg").attr({
    width: detail_par.w,
    height: detail_par.h
})

var canvas = d3.select("#vis").append("svg").attr({
    width: width + margin.left + margin.right,
    height: height + margin.top + margin.bottom
    })

var svg = canvas.append("g").attr({
        transform: "translate(" + margin.left + "," + margin.top + ")"
    });


var projection = d3.geo.albersUsa().translate([width / 2, height / 2]);//.precision(.1);
var path = d3.geo.path().projection(projection);


var dataSet = {};

var centered;

// global array for the x-axis
var xaxis_vals = ["01:00:00 AM", "02:00:00 AM", "03:00:00 AM", "04:00:00 AM", "05:00:00 AM", "06:00:00 AM", "07:00:00 AM", "08:00:00 AM", "09:00:00 AM", "10:00:00 AM", "11:00:00 AM", "12:00:00 PM", "01:00:00 PM", "02:00:00 PM", "03:00:00 PM", "04:00:00 PM", "05:00:00 PM", "06:00:00 PM", "07:00:00 PM", "08:00:00 PM", "09:00:00 PM", "10:00:00 PM", "11:00:00 PM", "12:00:00 AM"];
//scales
var x = d3.scale.ordinal().domain(xaxis_vals).rangePoints([detail_par.x, detail_par.w - 3 * detail_par.x]),
y = d3.scale.linear().range([detail_par.h-75, detail_par.y]);

// axes
var yAxis = d3.svg.axis().scale(y).orient("right");
var xAxis = d3.svg.axis().scale(x)
// .tickValues(x.domain().filter(function(d, i) { return !(i % 2); }))
.orient("bottom");


function loadStations(val_data) {

    d3.csv("../data/NSRDB_StationsMeta.csv",function(error,data){
        var id;
        // this function find the correct radius
        function radius(d){
            id = String(d.USAF);
            if (val_data[id] != null)
            {
                if (val_data[id].sum > 0)
                    return scale(val_data[id].sum);
            }
            return 2;
        }
        
        // this function gets classes
        function get_class(d){
            id = String(d.USAF);
            if (val_data[id] != null)
            {
                if (val_data[id].sum > 0)
                    return "station hasData";
            }

                return "station";
            
        }

        var names = Object.keys(val_data);
        var domain_dt =[];
        for (var i = 0; i < names.length; i++) {
            domain_dt.push(val_data[names[i]].sum);
        };

        var scale = d3.scale.linear().domain(d3.extent(domain_dt.filter(function(d){return d>0;}))).range([2,8]);
        var y_max_val = d3.max(domain_dt);

        createDetailVis(y_max_val, val_data[names[0]].hourly);

        // first make a canvas at the right position
        var circles = svg.selectAll(".station")
            .data(data)
            .enter().append("g")
            .style("position", "relative")
            .style("z-index", "10")
            .attr("transform", function(d) {
                return "translate(" + projection([
                  d["NSRDB_LON(dd)"],
                  d["NSRDB_LAT (dd)"]
                ]) + ")"
              });
        // add tooltip texts
        circles
            .append("text")   
            .attr("transform","translate(15,0)")
            .style("visibility", "hidden")
            .html(function(d){
                if (get_class(d) != 'station')
                    return d.STATION +", "+val_data[String(d.USAF)].sum;
                else
                    return d.STATION+", NO DATA";
            });
        // add circles
        circles.attr("class", get_class).append("circle")
            // .attr("class", get_class)
            .attr("r",radius);
        
        // handles mouse events
        svg.selectAll(".hasData")
            .on('mouseover',   function(d){
                    d3.select(this).style("z-index", "-1");
                    d3.select(this).select("text").style("visibility", "visible").style("z-index", "-1");
                    updateDetailVis( val_data[String(d.USAF)].hourly, d.STATION);
                    
            })
            .on('mouseout', function(d){
                d3.select(this).style("z-index", "10");
                d3.select(this).select("text").style("visibility", "hidden");
            });
    });
}


function loadStats() {

    d3.json("../data/reducedMonthStationHour2003_2004.json", function(error,data){
        completeDataSet= data;

        loadStations(completeDataSet);
    })

}

// from: http://bl.ocks.org/mbostock/2206590
function clicked(d) {
  var x, y, k;

  if (d && centered !== d) 
  {
    var centroid = path.centroid(d);
    x = centroid[0];
    y = centroid[1];
    k = 4;
    centered = d;
  } 
  else 
  {
    x = width / 2;
    y = height / 2;
    k = 1;
    centered = null;
  }

  svg.selectAll("path")
      .classed("active", centered && function(d) { return d === centered; });

  svg.transition()
      .duration(500)
      .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")scale(" + k + ")translate(" + -x + "," + -y + ")")
}

// load map
d3.json("../data/us-named.json", function(error, data) {

    var usMap = topojson.feature(data,data.objects.states).features

    svg.selectAll(".country")
        .data(usMap)
        .enter()
        .append("path")
        .attr("class","country")
        .attr("d",path)
        .on("click", clicked);
    // see also: http://bl.ocks.org/mbostock/4122298

    loadStats();
});



function trans_bars(d,i){
    var time = xaxis_vals[i];
    return "translate(" + x(time) + "," + y(d) + ")"; 
}

var allBars;

var createDetailVis = function(y_max, base_data){
    y.domain([0, 14000000]);

    detailVis.append("g")
    .attr("transform", "translate(10,20)")
    .append("text")
    .attr("class","title")
    .text("Select Station");

    detailVis.append("g")
      .attr("class", "y axis")
      .attr("transform", "translate("+ (detail_par.w - 3 * detail_par.x + 10) +",0)")
      .call(yAxis);

    detailVis.append("g")
      .attr("class", "x axis")
      .attr("transform", "translate(0,"+(detail_par.h- 3 * detail_par.x)+")")
      .call(xAxis)
      .selectAll("text")  
            .style("text-anchor", "end")
            .attr("dx", "-.8em")
            .attr("dy", ".15em")
            .attr("transform", function(d) {
                return "rotate(-65)" 
            });
    allBars = detailVis.append("g");
}


var updateDetailVis = function(given_data, name){
    var data = [];
    for (var i = 0; i < xaxis_vals.length; i++) {
        data.push(given_data[xaxis_vals[i]]);
    };

    detailVis.selectAll(".title")
        .text("Name: "+ name);

    var bar = allBars.selectAll(".bar")
        .data(data);
    var bars = bar.enter().append("g")
        .attr("class", "bar");

    bar
        .attr("transform", trans_bars);

    bars.append("rect")
        .attr("x", 0)
        .attr("width", 8)

    bar.select("rect")
        .attr("height", function(d,i) {return detail_par.h - y(d) - 3 * detail_par.x; });

    bar.exit().remove();
}

