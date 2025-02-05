import { displayLength } from '../util/units';
import { geoLonToMeters, geoLatToMeters, geoMetersToLon, geoMetersToLat } from '../geo';
import { localizer } from '../core/localizer';



export function uiSat2GraphInteract(context) {
    var projection = context.projection,
        isImperial = !localizer.usesMetric(),
        maxLength = 180,
        tickHeight = 8,
        boxsize = 500;

    var sessionID = Math.random().toString(36).substring(7);
    var selectValue = "";

    var lines = [];
    var points = [];
    var oldLoc = [];
    var newOldLoc = [];

    var curState = 0 ;
    var serverStatus = "Unknown";
    var curBK = 0;
    var curModelID = 5;
    var nModels = 6;
    var modelNames = ["80-City Global (old)", "20-City US (old)", "20-City US V2 (1km)", "20-City US V2 (500m)", "Global-V2 (1km)", "Global-V2 (500m)"]

    var globalopacity = 1.0;

    function updateText(selection){
        var text = selection.select('.sat2graph-text')
                .text("");
        var adjust = -350;
        if (curState == 0) {
            text.append("tspan")
                .text("Press 's' to run Sat2Graph.")
                .attr("x",50)
                .attr("y",480+adjust);

            text.append("tspan")
                .text("Press 'd' to toggle brightness.")
                .attr("x",50)
                .attr("y",510+adjust);

            text.append("tspan")
                .text("Press 'c' to clear the results.")
                .attr("x",50)
                .attr("y",540+adjust);
            
            text.append("tspan")
                .text("Press 'm' to switch model.")
                .attr("x",50)
                .attr("y",570+adjust);

            text.append("tspan")
                .text("Current model: " + modelNames[curModelID])
                .attr("x",50)
                .attr("y",600+adjust);

            text.append("tspan")
                .text("Status: "+serverStatus)
                .attr("x",50)
                .attr("y",650+adjust)
                .attr("fill","rgba(0, 255, 0, 1.0)");

        } else {
            text.append("tspan")
                .text("Press 's' to run Sat2Graph.")
                .attr("x",50)
                .attr("y",480+adjust);

            text.append("tspan")
                .text("Press 'd' to toggle brightness.")
                .attr("x",50)
                .attr("y",510+adjust);

            text.append("tspan")
                .text("Press 'c' to clear the results.")
                .attr("x",50)
                .attr("y",540+adjust);
                
            text.append("tspan")
                .text("Press 'm' to switch model.")
                .attr("x",50)
                .attr("y",570+adjust);

            text.append("tspan")
                .text("Current model: " + modelNames[curModelID])
                .attr("x",50)
                .attr("y",600+adjust);

            text.append("tspan")
                .text("Status: "+serverStatus)
                .attr("x",50)
                .attr("y",650+adjust)
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
            .attr("height", posShow1[1] - posShow2[1])
            .style("opacity", 1.0);


        var graphsize = 3 * scale;

        if (graphsize < 1) {
            graphsize = 1;
        }

        var opacity = 1.0;

        if (scale > 1.5) {
            opacity = 1.0 - (scale-1.5)/3.0;
            if (opacity < 0.2) {
                opacity = 0.2;
            }
        }

        opacity = opacity * globalopacity;



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
            //.attr('filter', 'url(#' + 'dropshadow' + ')' )
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
            .style("opacity", opacity)
            .style("stroke-linecap","round")
            .style("stroke-width", function(d,i){
                if (d.length == 2) {
                    return graphsize*2;
                } else {
                    if (d[2] == 0) {
                        return graphsize *1.5;
                    }
                    if (d[2] == 1) {
                        return graphsize *2;
                    }
                    if (d[2] == 2) {
                        return graphsize *2.5;
                    }
                }
            })
            .style("stroke", function(d,i){
                if (d.length == 2) {
                    return "Orange";
                } else {
                    if (d[2] == 0) {
                        return "GhostWhite";
                    }
                    if (d[2] == 1) {
                        return "Gold";
                    }
                    if (d[2] == 2) {
                        return "OrangeRed";
                    }
                }
            });


        var circle = selection.select('.sat2graph-box')
            .selectAll("circle")
            .data(points);

        circle.exit().remove();
        circle.enter().append("circle")
            .style("opacity", opacity)
            .attr("fill", 'DarkGray');
            
        //.attr("fill", 'indianred');
        

        circle
            .attr("cx", function(d,i){
                return bias[0] + d[1] * scale;
            })
            .attr("cy", function(d,i){
                return bias[1] + d[0] * scale;
            })
            .attr("r",graphsize * 0.8);

        selection.select('.sat2graph-box')
            .selectAll("circle").raise();


        updateText(selection);

        //console.log("updata number of lines: " + lines.length);
        //console.log("updata number of points: " + points.length);


        console.log("{\"lat\":"+locShow1[1].toFixed(6)+" ,"+"\"lon\":"+locShow1[0].toFixed(6)+", \"lat_n\":1" + ", \"lon_n\":1" + "},");
        // selection.select('.scale-path')
        //     .attr('d', 'M0.5,0.5v' + tickHeight + 'h' + scale.px + 'v-' + tickHeight);

        // selection.select('.scale-textgroup')
        //     .attr('transform', 'translate(' + (scale.px + 8) + ',' + tickHeight + ')');

        // selection.select('.scale-text')
        //     .text(scale.text);
    }

    function updateResult(data, selection) {
        curState = 0;
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
        
        
        oldLoc = [newOldLoc[0], newOldLoc[1]];

        //update(selection);
        context.map().pan([1,1],100);
    }


    function cleargraph(selection) {
        
        points = [];
        lines = [];

        update(selection);
    }

    function toggleGraph(selection) {
        globalopacity = 1.0 - globalopacity;
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
        curModelID = curModelID - 1
        if (curModelID < 0) {
            curModelID = nModels - 1
        }
        //curModelID = (curModelID + 1) % nModels;
        if (curModelID == 2 || curModelID == 4) {
            boxsize = 1000;
        } else {
            boxsize = 500;
        }

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

        var realModelId = curModelID;
        if (realModelId == 3) {
            realModelId = 2;
        }

        if (realModelId == 4) {
            realModelId = 3;
        }

        if (realModelId == 5) {
            realModelId = 3;
        }

        var msg = {"lat":locShow1[1], "lon":locShow1[0], "v_thr": 0.05, "e_thr": 0.01, "snap_dist": 15, "snap_w": 100, "model_id" : realModelId};
        if (curModelID == 2 || curModelID == 4) {
            msg["size"] = 1000;
            msg["padding"] = 28;
            msg["stride"] = 176;
            msg["nPhase"] = 1;
            if (curModelID == 4) {
                msg["nPhase"] = 5;
            }
        }

        if (curModelID == 3) {
            msg["size"] = 500;
            msg["padding"] = 14;
            msg["stride"] = 176;
            msg["nPhase"] = 1;
        }

        if (curModelID == 5) {
            msg["size"] = 500;
            msg["padding"] = 14;
            msg["stride"] = 176;
            msg["nPhase"] = 5;
        }

        msg["sessionID"] = sessionID;


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


    function updateStatus(data, selection) {
        console.log(data);
        if (serverStatus != data.status) {
            serverStatus = data.status; 

            if (serverStatus == "Running Sat2Graph") {
                context.map().pan([0,1],100);
            } else if (serverStatus == "Downloading Image") {
                context.map().pan([0,-1],100);
            } else {
                context.map().pan([-1,-1],100);
            }

        }
        //update(selection);
    }

    
    function checkStatus(selection) {
        var msg = {"cmd":"getstatus", "sessionID":sessionID};
        url = "http://128.30.198.28:8123/";
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
        .then(data => updateStatus(data, selection));
        
    }

    setInterval(checkStatus, 1000);




    return function(selection) {
        function switchUnits() {
            isImperial = !isImperial;
            selection.call(update);
        }

        var sat2graphbox = selection.append('svg')
            .attr('class', 'sat2graph-box');
        
        sat2graphbox.append('rect')
            .attr('x', 30)
            .attr('y', 100)
            .attr('rx', 15)
            .attr('width', 400)
            .attr('height', 230)
            .attr('opacity', 0.5)
            .attr('fill', 'black');

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

        // Too slow
        // var activeDropShadow = "dropshadow";
        // var svg = sat2graphbox;
        // var filter = svg.append('defs')
        //     .append('filter')
        //         .attr('id', activeDropShadow)
        //         // x, y, width and height represent values in the current coordinate system that results
        //         // from taking the current user coordinate system in place at the time when the
        //         // <filter> element is referenced
        //         // (i.e., the user coordinate system for the element referencing the <filter> element via a filter attribute).
        //         .attr('filterUnits','userSpaceOnUse');
    
        // filter.append('feGaussianBlur')
        //     .attr('in', 'SourceAlpha')
        //     .attr('stdDeviation', 5.0);
    
        // filter.append('feOffset')
        //     .attr('dx', 0)
        //     .attr('dy', 0);
    
        // var feComponentTransfer = filter.append('feComponentTransfer');
        // feComponentTransfer
        //     .append('feFuncA')
        //         .attr('type', 'linear')
        //         .attr('slope', 0.5);
    
        // var feMerge = filter.append('feMerge');
        // feMerge.append('feMergeNode');
        // feMerge.append('feMergeNode').attr('in', 'SourceGraphic');




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

        context.keybinding().on('r', function() {
            toggleGraph(selection);
        });

    };
}
