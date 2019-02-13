define(["require", "exports", "knockout", "dagre-d3", "d3", "../util/dagre_util", "../entities/story", "./context_menu"], function (require, exports, ko, dagre_d3_1, d3, dagre_util_1, story_1, context_menu_1) {
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
                y: 20,
            };
            var viewportSize = {
                width: 0,
                height: 0
            };
            var viewportMatrix = d3.zoomIdentity.translate(centralizeOffset.x, centralizeOffset.y);
            function doResize() {
                var width = parseFloat($(element).css('width'));
                svg.attr('width', width);
                var height = parseFloat($(element).css('height'));
                svg.attr("height", height);
                viewportSize.width = width;
                viewportSize.height = height;
                var graph = g.graph();
                // Center the graph
                var centralizeOffset = {
                    x: (width - graph.width) / 2,
                    y: (height - graph.height) / 2
                };
                viewportMatrix = viewportMatrix.translate(centralizeOffset.x - viewportMatrix.x, centralizeOffset.y - viewportMatrix.y);
                svgGroup.transition().duration(750).call(zoom.transform, viewportMatrix);
            }
            window.addEventListener('resize', doResize);
            var svg = container.append('svg');
            // top left menu
            var viewPortBtns = svg.append('g').attr('transform', 'translate(10, 10)')
                .on('contextmenu', function () { d3.event.preventDefault(); });
            // all contents
            var svgGroup = svg.append("g");
            var DAGContainer = svgGroup.append('g');
            // context menu
            var itemContextMenu = svg.append("g")
                .style('display', 'none')
                .on('contextmenu', function () { d3.event.preventDefault(); });
            var zoom = d3.zoom().on("zoom", function () {
                viewportMatrix = d3.event.transform
                    .translate(centralizeOffset.x, centralizeOffset.y);
                svgGroup.attr("transform", viewportMatrix.toString());
            });
            dagre_util_1.storyToGraph(originData, g);
            // Run the renderer. This is what draws the final graph.
            renderer(DAGContainer, g);
            context_menu_1.buildBtns(viewPortBtns, [{
                    name: 'relayout', click: function () {
                        renderer(DAGContainer, g);
                    }
                }, {
                    name: 'central', click: function () {
                        doResize();
                    }
                }]);
            var itemContext = context_menu_1.makeContextMenu(svg, itemContextMenu, [{
                    name: 'add Child',
                    click: function (itemContext) {
                        var ref = itemContext.ref;
                        if (ref.decestantVisible == false) {
                            dagre_util_1.showAllDecestant(itemContext, g);
                        }
                        var newStory = story_1.story(ref, ref.childNodes.length);
                        newStory.content(ko.unwrap(ref.content));
                        dagre_util_1.storyToGraph(originData, g);
                        // Run the renderer. This is what draws the final graph.
                        renderer(DAGContainer, g);
                        var newNode = g.node(newStory.id);
                        bindNodeEvent(d3.select(newNode.elem));
                        doCenterToNode(newNode);
                    }
                }, {
                    name: 'append sibling',
                    click: function (itemContext) {
                        var ref = itemContext.ref;
                        var parent = ref.parent;
                        if (parent) {
                            var newStory = story_1.story(parent, parent.childNodes.indexOf(ref) + 1);
                            newStory.content(ko.unwrap(parent.content));
                            parent.childNodes.forEach(function (node) {
                                g.removeNode(node.id);
                            });
                            dagre_util_1.storyToGraph(originData, g);
                            // Run the renderer. This is what draws the final graph.
                            renderer(DAGContainer, g);
                            var newNode = g.node(newStory.id);
                            bindNodeEvent(d3.select(newNode.elem));
                            doCenterToNode(newNode);
                        }
                    }
                }, {
                    name: 'toggle child',
                    click: function (itemContext) {
                        var ref = itemContext.ref;
                        if (ref.decestantVisible === false) {
                            dagre_util_1.showAllDecestant(itemContext, g);
                        }
                        else {
                            dagre_util_1.hideAllDecestant(itemContext, g);
                        }
                        dagre_util_1.storyToGraph(originData, g);
                        // Run the renderer. This is what draws the final graph.
                        renderer(DAGContainer, g);
                        doCenterToNode(g.node(ref.id));
                    }
                }], context_menu_1.MenuDirection.vertical);
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
            bindNodeEvent(svgGroup.selectAll("g.node"));
            doResize();
            svg
                .call(zoom);
            ko.utils.domNodeDisposal.addDisposeCallback(element, function () {
                // This will be called when the element is removed by Knockout or
                // if some other part of your code calls ko.removeNode(element)
                window.removeEventListener('resize', doResize);
            });
            function bindNodeEvent(nodes) {
                nodes
                    .call(drag)
                    .on('dblclick', function (d) {
                    console.log(this);
                    d3.event.stopPropagation();
                    doCenterToNode(g.node(d));
                })
                    .on('contextmenu', function (d) {
                    d3.event.preventDefault();
                    d3.event.stopPropagation();
                    console.log('context', d);
                    itemContext.showWithContext(g.node(d));
                });
            }
            function doCenterToNode(node) {
                var pos = dagre_util_1.centralToNode(node, viewportSize);
                viewportMatrix = d3.zoomIdentity.translate(pos.x, pos.y);
                svgGroup.transition().duration(750).call(zoom.transform, viewportMatrix);
            }
        },
    };
});
