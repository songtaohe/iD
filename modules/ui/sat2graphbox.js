import { displayLength } from '../util/units';
import { geoLonToMeters, geoMetersToLon, geoMetersToLat } from '../geo';
import { localizer } from '../core/localizer';


export function uiSat2GraphBox(context) {
    var projection = context.projection,
        isImperial = !localizer.usesMetric(),
        maxLength = 180,
        tickHeight = 8;


    function scaleDefs(loc1, loc2) {
        var lat = (loc2[1] + loc1[1]) / 2,
            conversion = (isImperial ? 3.28084 : 1),
            dist = geoLonToMeters(loc2[0] - loc1[0], lat) * conversion,
            scale = { dist: 0, px: 0, text: '' },
            buckets, i, val, dLon;

        if (isImperial) {
            buckets = [5280000, 528000, 52800, 5280, 500, 50, 5, 1];
        } else {
            buckets = [5000000, 500000, 50000, 5000, 500, 50, 5, 1];
        }

        // determine a user-friendly endpoint for the scale
        for (i = 0; i < buckets.length; i++) {
            val = buckets[i];
            if (dist >= val) {
                scale.dist = Math.floor(dist / val) * val;
                break;
            } else {
                scale.dist = +dist.toFixed(2);
            }
        }

        dLon = geoMetersToLon(scale.dist / conversion, lat);
        scale.px = Math.round(projection([loc1[0] + dLon, loc1[1]])[0]);

        scale.text = displayLength(scale.dist / conversion, isImperial);

        return scale;
    }


    function update(selection) {
        // choose loc1, loc2 along bottom of viewport (near where the scale will be drawn)
        // var dims = context.map().dimensions(),
        //     loc1 = projection.invert([0, dims[1]]),
        //     loc2 = projection.invert([maxLength, dims[1]]),
        //     scale = scaleDefs(loc1, loc2),

        var dims = context.map().dimensions(), 
            loc1 = projection.invert([0, dims[1]]),
            loc2 = projection.invert([dims[1], dims[1]]);

        var scale = geoLonToMeters(loc2[0] - loc1[0], (loc2[1] + loc1[1]) / 2)

        var size = 2048;
        var isize = 1;
        if (scale > 2048*2.5) {
            size = 2048*2;
            isize = 2;
        }

        if (scale > 2048*3.5) {
            size = 2048*3;
            isize = 3;
        }

        if (scale > 2048*5) {
            size = 2048*4;
            isize = 4;
        }


        var posShow1 = [600,700];
        var locShow = projection.invert(posShow1);

        // locShow  bottom left 
        var locShow2 = [locShow[0] + geoMetersToLon(size, locShow[1]),locShow[1] + geoMetersToLat(size)];
        var posShow2 = projection(locShow2);

        selection.select('.sat2graph-path')
            .attr("x", posShow1[0])
            .attr("y", posShow2[1])
            .attr("width", posShow2[0] - posShow1[0])
            .attr("height", posShow1[1] - posShow2[1]);

        selection.select('.sat2graph-text')
            .text("size" + size + " lat,lon:" + locShow[1].toFixed(6) + "," + locShow[0].toFixed(6))

        console.log("{\"lat\":"+locShow[1].toFixed(6)+" ,"+"\"lon\":"+locShow[0].toFixed(6)+", \"lat_n\":" + isize+ ", \"lon_n\":" + isize+ "},");
        // selection.select('.scale-path')
        //     .attr('d', 'M0.5,0.5v' + tickHeight + 'h' + scale.px + 'v-' + tickHeight);

        // selection.select('.scale-textgroup')
        //     .attr('transform', 'translate(' + (scale.px + 8) + ',' + tickHeight + ')');

        // selection.select('.scale-text')
        //     .text(scale.text);
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
            .append('g')
            .append('text')
            .attr("class",'sat2graph-text')
            .attr("x",610)
            .attr("y",730);

        selection.call(update);

        context.map().on('move.scale', function() {
            update(selection);
        });
    };
}
