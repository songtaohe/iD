import _throttle from 'lodash-es/throttle';
import { select as d3_select } from 'd3-selection';

import { modeBrowse } from '../modes/browse';
import { svgPointTransform } from './helpers';
import { services } from '../services';

var _HOTtmEnabled = false;
var _errorService;


export function svgHOTtm(projection, context, dispatch) {
    var throttledRedraw = _throttle(function () { dispatch.call('change'); }, 1000);
    var minZoom = 12;
    var touchLayer = d3_select(null);
    var drawLayer = d3_select(null);
    var _HOTtmVisible = false;

    function markerPath(selection, klass) {
        selection
            .attr('class', klass)
            .attr('transform', 'translate(-10, -28)')
            .attr('points', '16,3 4,3 1,6 1,17 4,20 7,20 10,27 13,20 16,20 19,17.033 19,6');
    }


    // Loosely-coupled improveOSM service for fetching errors.
    function getService() {
        if (services.HOTtm && !_errorService) {
            _errorService = services.HOTtm;
            _errorService.on('loaded', throttledRedraw);
        } else if (!services.HOTtm && _errorService) {
            _errorService = null;
        }

        return _errorService;
    }


    // Show the errors
    function editOn() {
        if (!_HOTtmVisible) {
            _HOTtmVisible = true;
            drawLayer
                .style('display', 'block');
        }
    }


    // Immediately remove the errors and their touch targets
    function editOff() {
        if (_HOTtmVisible) {
            _HOTtmVisible = false;
            drawLayer
                .style('display', 'none');
            drawLayer.selectAll('.qa_error.HOTtm')
                .remove();
            touchLayer.selectAll('.qa_error.HOTtm')
                .remove();
        }
    }


    // Enable the layer.  This shows the errors and transitions them to visible.
    function layerOn() {
        editOn();

        drawLayer
            .style('opacity', 0)
            .transition()
            .duration(250)
            .style('opacity', 1)
            .on('end interrupt', function () {
                dispatch.call('change');
            });
    }


    // Disable the layer.  This transitions the layer invisible and then hides the errors.
    function layerOff() {
        throttledRedraw.cancel();
        drawLayer.interrupt();
        touchLayer.selectAll('.qa_error.HOTtm')
            .remove();

        drawLayer
            .transition()
            .duration(250)
            .style('opacity', 0)
            .on('end interrupt', function () {
                editOff();
                dispatch.call('change');
            });
    }


    // Update the error markers
    function updateMarkers() {
        if (!_HOTtmVisible || !_HOTtmEnabled) return;

        var service = getService();
        var selectedID = context.selectedErrorID();
        var data = (service ? service.getErrors(projection) : []);
        var getTransform = svgPointTransform(projection);

        // Draw markers..
        var markers = drawLayer.selectAll('.qa_error.HOTtm')
            .data(data, function(d) { return d.id; });

        // exit
        markers.exit()
            .remove();

        // enter
        var markersEnter = markers.enter()
            .append('g')
            .attr('class', function(d) {
                return [
                    'qa_error',
                    d.service,
                    'error_id-' + d.id,
                    'error_type-' + d.error_type,
                    'category-' + d.category
                ].join(' ');
            });

        markersEnter
            .append('polygon')
            .call(markerPath, 'shadow');

        markersEnter
            .append('ellipse')
            .attr('cx', 0)
            .attr('cy', 0)
            .attr('rx', 4.5)
            .attr('ry', 2)
            .attr('class', 'stroke');

        markersEnter
            .append('polygon')
            .attr('fill', 'currentColor')
            .call(markerPath, 'qa_error-fill');

        markersEnter
            .append('use')
            .attr('transform', 'translate(-5.5, -21)')
            .attr('class', 'icon-annotation')
            .attr('width', '11px')
            .attr('height', '11px')
            .attr('xlink:href', function(d) {
                var picon = d.icon;

                if (!picon) {
                    return '';
                } else {
                    var isMaki = /^maki-/.test(picon);
                    return '#' + picon + (isMaki ? '-11' : '');
                }
            });

        // update
        markers
            .merge(markersEnter)
            .sort(sortY)
            .classed('selected', function(d) { return d.id === selectedID; })
            .attr('transform', getTransform);


        // Draw targets..
        if (touchLayer.empty()) return;
        var fillClass = context.getDebug('target') ? 'pink ' : 'nocolor ';

        var targets = touchLayer.selectAll('.qa_error.HOTtm')
            .data(data, function(d) { return d.id; });

        // exit
        targets.exit()
            .remove();

        // enter/update
        targets.enter()
            .append('rect')
            .attr('width', '20px')
            .attr('height', '30px')
            .attr('x', '-10px')
            .attr('y', '-28px')
            .merge(targets)
            .sort(sortY)
            .attr('class', function(d) {
                return 'qa_error ' + d.service + ' target error_id-' + d.id + ' ' + fillClass;
            })
            .attr('transform', getTransform);


        function sortY(a, b) {
            return (a.id === selectedID) ? 1
                : (b.id === selectedID) ? -1
                : b.loc[1] - a.loc[1];
        }
    }


    // Draw the HOTtm layer and schedule loading errors and updating markers.
    function drawHOTtm(selection) {
        var service = getService();

        var surface = context.surface();
        if (surface && !surface.empty()) {
            touchLayer = surface.selectAll('.data-layer.touch .layer-touch.markers');
        }

        drawLayer = selection.selectAll('.layer-HOTtm')
            .data(service ? [0] : []);

        drawLayer.exit()
            .remove();

        drawLayer = drawLayer.enter()
            .append('g')
            .attr('class', 'layer-HOTtm')
            .style('display', _HOTtmEnabled ? 'block' : 'none')
            .merge(drawLayer);

        if (_HOTtmEnabled) {
            if (service && ~~context.map().zoom() >= minZoom) {
                editOn();
                service.loadErrors(projection);
                updateMarkers();
            } else {
                editOff();
            }
        }
    }


    // Toggles the layer on and off
    drawHOTtm.enabled = function(val) {
        if (!arguments.length) return _HOTtmEnabled;

        _HOTtmEnabled = val;
        if (_HOTtmEnabled) {
            layerOn();
        } else {
            layerOff();
            if (context.selectedErrorID()) {
                context.enter(modeBrowse(context));
            }
        }

        dispatch.call('change');
        return this;
    };


    drawHOTtm.supported = function() {
        return !!getService();
    };


    return drawHOTtm;
}
