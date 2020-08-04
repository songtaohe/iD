import { displayLength } from '../util/units';
import { geoLonToMeters, geoMetersToLon, geoMetersToLat } from '../geo';
import { localizer } from '../core/localizer';



export function uiSat2GraphInteract(context) {
    var projection = context.projection,
        isImperial = !localizer.usesMetric(),
        maxLength = 180,
        tickHeight = 8;

    var lines = [];
    var points = [];
    var oldLoc = [];
    var curState = 0 ;


    function update(selection) {
        // choose loc1, loc2 along bottom of viewport (near where the scale will be drawn)
        // var dims = context.map().dimensions(),
        //     loc1 = projection.invert([0, dims[1]]),
        //     loc2 = projection.invert([maxLength, dims[1]]),
        //     scale = scaleDefs(loc1, loc2),

        var dims = context.map().dimensions(), 
            loc1 = projection.invert([0, dims[1]]),
            loc2 = projection.invert([dims[1], dims[1]]),
            size = 352/2;

        var posCenter = [dims[0]/2,dims[1]/2];
        var locCenter = projection.invert(posCenter);

        var locShow1 = [locCenter[0] - geoMetersToLon(size, locCenter[1]),locCenter[1] - geoMetersToLat(size)];
        var posShow1 = projection(locShow1);

        var locShow2 = [locCenter[0] + geoMetersToLon(size, locCenter[1]),locCenter[1] + geoMetersToLat(size)];
        var posShow2 = projection(locShow2);

        var scale =  (posShow2[0] - posShow1[0]) / (size * 2);

        selection.select('.sat2graph-path')
            .attr("x", posShow1[0])
            .attr("y", posShow2[1])
            .attr("width", posShow2[0] - posShow1[0])
            .attr("height", posShow1[1] - posShow2[1]);


        var graphsize = 2 * scale;

        if (graphsize < 1) {
            graphsize = 1;
        }

        console.log(oldLoc);
        var bias = projection(oldLoc);
        console.log(bias);


        var myline = selection.select('.sat2graph-box')
            .selectAll("line")
            .data(lines);

        myline.exit().remove();
        myline.enter().append("line")
            .style("stroke", "lightgreen");
            

        myline
            .attr("x1",function(d,i){
                return bias[0] + d[0][1] * scale;
            })
            .attr("y1",function(d,i){
                return bias[1] + d[0][0] * scale;
            })
            .attr("x2",function(d,i){
                return bias[0] + d[1][1] * scale;
            })
            .attr("y2",function(d,i){
                return bias[1] + d[1][0] * scale;
            })
            .style("stroke-width", graphsize);


        var circle = selection.select('.sat2graph-box')
            .selectAll("circle")
            .data(points);

        circle.exit().remove();
        circle.enter().append("circle")
            .attr("fill", 'indianred');

        

        circle
            .attr("cx", function(d,i){
                return bias[0] + d[1] * scale;
            })
            .attr("cy", function(d,i){
                return bias[1] + d[0] * scale;
            })
            .attr("r",graphsize * 1);

        if (curState == 0) {
            selection.select('.sat2graph-text')
                .text("Press s to run Sat2Graph.\nStatus: Ready");
        } else {
            selection.select('.sat2graph-text')
                .text("Press s to run Sat2Graph.\nStatus: Running");
        }

        //console.log("{\"lat\":"+locShow[1].toFixed(6)+" ,"+"\"lon\":"+locShow[0].toFixed(6)+", \"lat_n\":" + isize+ ", \"lon_n\":" + isize+ "},");
        // selection.select('.scale-path')
        //     .attr('d', 'M0.5,0.5v' + tickHeight + 'h' + scale.px + 'v-' + tickHeight);

        // selection.select('.scale-textgroup')
        //     .attr('transform', 'translate(' + (scale.px + 8) + ',' + tickHeight + ')');

        // selection.select('.scale-text')
        //     .text(scale.text);
    }

    function updateResult(data, selection) {
        lines = data.graph.graph[0];
        points = data.graph.graph[1];

        console.log(lines);
        console.log(points);
        
        curState = 0;

        selection.select('.sat2graph-text')
            .text("Press s to run Sat2Graph.\nStatus: Ready")


        update(selection);
    }

    function runSat2Graph(selection) {
        if (curState == 1) {
            return;
        }

        console.log("run sat2graph");
        url = "http://localhost:8002/";
        var dims = context.map().dimensions(), 
            loc1 = projection.invert([0, dims[1]]),
            loc2 = projection.invert([dims[1], dims[1]]),
            size = 352/2;

        var posCenter = [dims[0]/2,dims[1]/2];
        var locCenter = projection.invert(posCenter);

        var locShow1 = [locCenter[0] - geoMetersToLon(size, locCenter[1]),locCenter[1] - geoMetersToLat(size)];
        var posShow1 = projection(locShow1);

        var locShow2 = [locCenter[0] + geoMetersToLon(size, locCenter[1]),locCenter[1] + geoMetersToLat(size)];
        var posShow2 = projection(locShow2);

        oldLoc = [locShow1[0], locShow2[1]];

        curState = 1;

        selection.select('.sat2graph-text')
            .text("Press s to run Sat2Graph.\nStatus: Running...")

        fetch(url, {
            method: 'POST', // *GET, POST, PUT, DELETE, etc.
            mode: 'cors', // no-cors, *cors, same-origin
            cache: 'no-cache', // *default, no-cache, reload, force-cache, only-if-cached
            credentials: 'same-origin', // include, *same-origin, omit
            headers: {
              'Content-Type': 'application/json'
              // 'Content-Type': 'application/x-www-form-urlencoded',
            },
            redirect: 'follow', // manual, *follow, error
            referrerPolicy: 'no-referrer', // no-referrer, *no-referrer-when-downgrade, origin, origin-when-cross-origin, same-origin, strict-origin, strict-origin-when-cross-origin, unsafe-url
            body: JSON.stringify({"lat":locShow1[1], "lon":locShow1[0]}) // body data type must match "Content-Type" header
          })
        .then(response => response.json())
        .then(data => updateResult(data, selection));
    }


    return function(selection) {
        function switchUnits() {
            isImperial = !isImperial;
            selection.call(update);
        }

        var sat2graphbox = selection.append('svg')
            .attr('class', 'sat2graph-box');

        sat2graphbox
            .append('rect')
            .attr('class', 'sat2graph-path')
            .attr("x",200)
            .attr("y",200)
            .attr("width",400)
            .attr("height",400);
        

        sat2graphbox
            .selectAll("line")
            .data(lines)
            .enter()
            .append("line")
            .style("stroke", "lightgreen")
            .style("stroke-width", 10)
            .attr("x1", 0)
            .attr("y1", 0)
            .attr("x2", 200)
            .attr("y2", 200); 


        sat2graphbox
            .selectAll("circle")
            .data(points)
            .enter()
            .append("circle")
            .attr("cx", function(d,i){
                return d[0];
            })
            .attr("cy", function(d,i){
                return d[1];
            })
            .attr("r",3);


        sat2graphbox
            .append('g')
            .append('text')
            .attr("class",'sat2graph-text')
            .attr("x",50)
            .attr("y",150);

        selection.call(update);

        context.map().on('move.scale', function() {
            update(selection);
        });

        context.keybinding().on('s', function() {
            runSat2Graph(selection);
        });
    };
}
