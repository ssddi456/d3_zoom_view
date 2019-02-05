define(["require", "exports", "knockout", "dagre-d3", "d3", "../util/dagre_util"], function (require, exports, ko, dagre_d3_1, d3, dagre_util_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    ko.bindingHandlers['dagre-view'] = {
        init: function (element, valueAccessor) {
            var data = valueAccessor();
            console.log(ko.isObservable(data));
            var originData = ko.unwrap(data);
            console.log(originData);
            var g = new dagre_d3_1.graphlib.Graph()
                .setGraph({
                rankdir: 'RL'
            })
                .setDefaultEdgeLabel(function () { return {}; });
            var renderer = new dagre_d3_1.render();
            // Set up an SVG group so that we can translate the final graph.
            var container = d3.select(element);
            var centralizeOffset = {
                x: 0,
                y: 20
            };
            var viewportMatrix = d3.zoomIdentity.translate(centralizeOffset.x, centralizeOffset.y);
            function doResize() {
                svg.attr('width', parseFloat($(element).css('width')));
                svg.attr("height", parseFloat($(element).css('height')));
                // Center the graph
                centralizeOffset.x = (parseFloat(svg.attr("width")) - g.graph().width) / 2;
                svgGroup.attr("transform", viewportMatrix.toString());
            }
            window.addEventListener('resize', doResize);
            var svg = container.append('svg');
            var svgGroup = svg.append("g");
            var zoom = d3.zoom().on("zoom", function () {
                viewportMatrix = d3.event.transform.translate(centralizeOffset.x, centralizeOffset.y);
                svgGroup.attr("transform", viewportMatrix.toString());
            });
            svg.call(zoom);
            dagre_util_1.storyToGraph(originData, g);
            // Run the renderer. This is what draws the final graph.
            renderer(svgGroup, g);
            var drag = d3.drag().on('drag', function (d) {
                var node = d3.select(this);
                var attrs = g.node(d);
                var event = d3.event;
                attrs.x += event.dx;
                attrs.y += event.dy;
                node.attr('transform', 'translate(' + attrs.x + ',' + attrs.y + ')');
                var allInEdges = g.inEdges(d) || [];
                var allOutEdges = g.outEdges(d) || [];
                allInEdges.concat(allOutEdges).forEach(function (x) {
                    var edge = g.edge(x);
                    d3.select(edge.elem)
                        .select('path.path')
                        .attr('d', dagre_util_1.createLineD(x, g, svgGroup.node()));
                });
            });
            svgGroup.selectAll("g.node").call(drag);
            doResize();
            ko.utils.domNodeDisposal.addDisposeCallback(element, function () {
                // This will be called when the element is removed by Knockout or
                // if some other part of your code calls ko.removeNode(element)
                window.removeEventListener('resize', doResize);
            });
        },
    };
});
