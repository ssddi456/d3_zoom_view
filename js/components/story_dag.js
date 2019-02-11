define(["require", "exports", "knockout", "dagre-d3", "d3", "../util/dagre_util", "../entities/story"], function (require, exports, ko, dagre_d3_1, d3, dagre_util_1, story_1) {
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
            var viewPortBtns = svg.append('g').attr('transform', 'translate(10, 10)');
            var svgGroup = svg.append("g");
            var itemBtns = svg.append("g").style('display', 'none').on('contextmenu', function () { d3.event.preventDefault(); });
            var menuDirection;
            (function (menuDirection) {
                menuDirection[menuDirection["horizontal"] = 0] = "horizontal";
                menuDirection[menuDirection["vertical"] = 1] = "vertical";
            })(menuDirection || (menuDirection = {}));
            function buildBtns(btnContainer, _btns, isContextmenu, direction) {
                if (isContextmenu === void 0) { isContextmenu = false; }
                if (direction === void 0) { direction = menuDirection.horizontal; }
                _btns.reduce(function (left, item) {
                    var btn = btnContainer.append('g').attr('transform', direction == menuDirection.horizontal
                        ? 'translate(' + left + ',' + 0 + ')'
                        : 'translate(' + 0 + ',' + left + ')');
                    var bg = btn.append('rect')
                        .attr('y', -5)
                        .style('fill', '#e2edef');
                    var text = btn.append('text')
                        .attr('dx', '10')
                        .attr('dy', '10');
                    setTimeout(function () {
                        var bbox = text.node().getBBox();
                        console.log(bbox);
                        bg
                            .attr('width', bbox.width + 10 * 2)
                            .attr('height', bbox.height + 10);
                    }, 10);
                    text.text(item.name);
                    btn
                        .on('mousedown', function () {
                        d3.event.stopPropagation();
                    })
                        .on('click', function () {
                        var args = [];
                        for (var _i = 0; _i < arguments.length; _i++) {
                            args[_i] = arguments[_i];
                        }
                        item.click.apply(this, args);
                        if (isContextmenu) {
                            btnContainer.style('display', 'none');
                        }
                    });
                    return left + 10 * 2 + (direction == menuDirection.horizontal ? item.name.length * 7 : 15);
                }, 0);
            }
            var zoom = d3.zoom().on("zoom", function () {
                viewportMatrix = d3.event.transform
                    .translate(centralizeOffset.x, centralizeOffset.y);
                svgGroup.attr("transform", viewportMatrix.toString());
            });
            svg
                .on('mousedown', function () {
                itemBtns.style('display', 'none');
            })
                .call(zoom);
            dagre_util_1.storyToGraph(originData, g);
            // Run the renderer. This is what draws the final graph.
            renderer(svgGroup, g);
            buildBtns(viewPortBtns, [{
                    name: 'relayout', click: function () {
                        renderer(svgGroup, g);
                    }
                }, {
                    name: 'central', click: function () {
                        doResize();
                    }
                }]);
            var itemContext;
            buildBtns(itemBtns, [{
                    name: 'add Child',
                    click: function () {
                        var ref = itemContext.ref;
                        var newStory = story_1.story(ref, ref.childNodes.length);
                        newStory.content(ko.unwrap(ref.content));
                        dagre_util_1.storyToGraph(originData, g);
                        // Run the renderer. This is what draws the final graph.
                        renderer(svgGroup, g);
                        var newNode = g.node(newStory.id);
                        bindNodeEvent(d3.select(newNode.elem));
                        doCenterToNode(newNode);
                    }
                }, {
                    name: 'append sibling',
                    click: function () {
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
                            renderer(svgGroup, g);
                            var newNode = g.node(newStory.id);
                            bindNodeEvent(d3.select(newNode.elem));
                            doCenterToNode(newNode);
                        }
                    }
                }], true, menuDirection.vertical);
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
                    itemContext = g.node(d);
                    console.log(itemContext);
                    var mouseInfo = d3.mouse(svg.node());
                    itemBtns.style('display', null).attr('transform', 'translate(' + mouseInfo[0] + ',' + mouseInfo[1] + ')');
                });
            }
            function doCenterToNode(node) {
                var pos = dagre_util_1.centralToNode(node, viewportSize);
                viewportMatrix = d3.zoomIdentity.translate(pos.x, pos.y);
                svgGroup.transition().duration(750).call(zoom.transform, viewportMatrix);
            }
            doResize();
            ko.utils.domNodeDisposal.addDisposeCallback(element, function () {
                // This will be called when the element is removed by Knockout or
                // if some other part of your code calls ko.removeNode(element)
                window.removeEventListener('resize', doResize);
            });
        },
    };
});
