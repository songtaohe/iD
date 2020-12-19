import { displayLength } from '../util/units';
import { geoLonToMeters, geoLatToMeters, geoMetersToLon, geoMetersToLat } from '../geo';
import { localizer } from '../core/localizer';



export function uiSat2GraphInteract(context) {
    var projection = context.projection,
        isImperial = !localizer.usesMetric(),
        maxLength = 180,
        tickHeight = 8,
        boxsize = 500;

    var selectValue = "";

    var lines = [];
    var points = [];
    var oldLoc = [];
    var newOldLoc = [];

    var curState = 0 ;
    var curBK = 0;
    var curModelID = 0;
    var nModels = 2;
    var modelNames = ["80-City Global Model", "20-City US Model"]


    function updateText(selection){
        var text = selection.select('.sat2graph-text')
                .text("");

        if (curState == 0) {
            text.append("tspan")
                .text("Press 's' to run Sat2Graph.")
                .attr("x",50)
                .attr("y",480);

            text.append("tspan")
                .text("Press 'd' to toggle brightness.")
                .attr("x",50)
                .attr("y",510);

            text.append("tspan")
                .text("Press 'c' to clear the results.")
                .attr("x",50)
                .attr("y",540);
            
            text.append("tspan")
                .text("Press 'm' to switch model.")
                .attr("x",50)
                .attr("y",570);

            text.append("tspan")
                .text("Current model: " + modelNames[curModelID])
                .attr("x",50)
                .attr("y",600);

            text.append("tspan")
                .text("Status: Ready")
                .attr("x",50)
                .attr("y",650)
                .attr("fill","rgba(0, 255, 0, 1.0)");

        } else {
            text.append("tspan")
                .text("Press 's' to run Sat2Graph.")
                .attr("x",50)
                .attr("y",480);

            text.append("tspan")
                .text("Press 'd' to toggle brightness.")
                .attr("x",50)
                .attr("y",510);

            text.append("tspan")
                .text("Press 'c' to clear the results.")
                .attr("x",50)
                .attr("y",540);
                
            text.append("tspan")
                .text("Press 'm' to switch model.")
                .attr("x",50)
                .attr("y",570);

            text.append("tspan")
                .text("Current model: " + modelNames[curModelID])
                .attr("x",50)
                .attr("y",600);

            text.append("tspan")
                .text("Status: Running...")
                .attr("x",50)
                .attr("y",650)
                .attr("fill","rgba(255, 127, 0, 1.0)");
        }

        


    }

    function update(selection) {
        // choose loc1, loc2 along bottom of viewport (near where the scale will be drawn)
        // var dims = context.map().dimensions(),
        //     loc1 = projection.invert([0, dims[1]]),
        //     loc2 = projection.invert([maxLength, dims[1]]),
        //     scale = scaleDefs(loc1, loc2),

        var dims = context.map().dimensions(), 
            loc1 = projection.invert([0, dims[1]]),
            loc2 = projection.invert([dims[1], dims[1]]),
            size = boxsize/2;

        var posCenter = [dims[0]/2,dims[1]/2];
        var locCenter = projection.invert(posCenter);

        var loctile = [locCenter[0] - geoMetersToLon(1024, locCenter[1]),locCenter[1] - geoMetersToLat(1024)];
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


        var graphsize = 3 * scale;

        if (graphsize < 1) {
            graphsize = 1;
        }

        //console.log(oldLoc);
        var bias = projection(oldLoc);
        //console.log(bias);


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
            .attr("r",graphsize * 1.5);

        selection.select('.sat2graph-box')
            .selectAll("circle").raise();


        updateText(selection);

        //console.log("updata number of lines: " + lines.length);
        //console.log("updata number of points: " + points.length);


        console.log("{\"lat\":"+loctile[1].toFixed(6)+" ,"+"\"lon\":"+loctile[0].toFixed(6)+", \"lat_n\":1" + ", \"lon_n\":1" + "},");
        // selection.select('.scale-path')
        //     .attr('d', 'M0.5,0.5v' + tickHeight + 'h' + scale.px + 'v-' + tickHeight);

        // selection.select('.scale-textgroup')
        //     .attr('transform', 'translate(' + (scale.px + 8) + ',' + tickHeight + ')');

        // selection.select('.scale-text')
        //     .text(scale.text);
    }

    function updateResult(data, selection) {
        new_lines = data.graph.graph[0];
        new_points = data.graph.graph[1];

        if (oldLoc.length == 2) {
            // update pos in lines and points to newOldLoc;

            var biasx = geoLonToMeters(newOldLoc[0] - oldLoc[0], newOldLoc[1]);
            var biasy = geoLatToMeters(newOldLoc[1] - oldLoc[1]);

            console.log([biasx, biasy]);

            for (i = 0; i< lines.length; i++) {
                lines[i][0][0] += biasy;
                lines[i][1][0] += biasy;
                lines[i][0][1] -= biasx;
                lines[i][1][1] -= biasx;
            }

            for (i = 0; i< points.length; i++) {
                points[i][0] += biasy;
                points[i][1] -= biasx;
            }
        }

        lines = lines.concat(new_lines);
        points = points.concat(new_points);

        console.log("number of lines: " + lines.length);
        console.log("number of points: " + points.length);
        
        curState = 0;
        oldLoc = [newOldLoc[0], newOldLoc[1]];

        //update(selection);
        context.map().pan([1,1],100);
    }


    function cleargraph(selection) {
        
        points = [];
        lines = [];

        update(selection);
    }

    function changeBKcolor(selection) {
        
        curBK = 1-curBK;

        if (curBK < 0.5) {
            console.log("hit");
            selection.select('.sat2graph-box')
            .style("background-color","rgba(0, 0, 0, 0.75)");

        } else {
            selection.select('.sat2graph-box')
            .style("background-color","rgba(0, 0, 0, 0)");
        }     
    }

    function switchmodel(selection) {
        curModelID = (curModelID + 1) % nModels;


        update(selection);
    }

    function runSat2Graph(selection) {
        if (curState == 1) {
            return;
        }

        console.log("run sat2graph");
        //url = "http://localhost:8002/";
        url = "http://128.30.198.28:8123/";
        var dims = context.map().dimensions(), 
            loc1 = projection.invert([0, dims[1]]),
            loc2 = projection.invert([dims[1], dims[1]]),
            size = boxsize/2;

        var posCenter = [dims[0]/2,dims[1]/2];
        var locCenter = projection.invert(posCenter);

        var locShow1 = [locCenter[0] - geoMetersToLon(size, locCenter[1]),locCenter[1] - geoMetersToLat(size)];
        var posShow1 = projection(locShow1);

        var locShow2 = [locCenter[0] + geoMetersToLon(size, locCenter[1]),locCenter[1] + geoMetersToLat(size)];
        var posShow2 = projection(locShow2);

        newOldLoc = [locShow1[0], locShow2[1]];

        curState = 1;

        updateText(selection);

        var msg = {"lat":locShow1[1], "lon":locShow1[0], "v_thr": 0.05, "e_thr": 0.05, "snap_dist": 15, "snap_w": 100, "model_id" : curModelID};

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
            body: JSON.stringify(msg) // body data type must match "Content-Type" header
          })
        .then(response => response.json(response))
        .then(data => updateResult(data, selection));
        // .then(update(selection));
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


        // var models = ["Sat2Graph 20 U.S. Cities (DLA)", "Sat2Graph Global Model (U-NET)"]
        // var select = selection.append('select')
        //     .attr('class','select')
        //     .style("left","50px")
        //     .style("top","440px")
        //     .style("position","absolute")
        //     .on('change', onchange);

        // var options = select.selectAll('option')
        //     .data(models).enter()
        //     .append('option')
        //     .text(function (d) { return d; });

        // function onchange() {
        //     selectValue = sat2graphbox.select('select').property('value');
        // }

        selection.call(update);

        context.map().on('move.scale', function() {
            update(selection);
        });

        context.keybinding().on('s', function() {
            runSat2Graph(selection);
        });

        context.keybinding().on('d', function() {
            changeBKcolor(selection);
        });

         context.keybinding().on('c', function() {
            cleargraph(selection);
        });

        context.keybinding().on('m', function() {
            switchmodel(selection);
        });
    };
}
