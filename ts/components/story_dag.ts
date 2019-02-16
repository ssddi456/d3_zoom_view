import * as ko from 'knockout';
import { graphlib, render } from 'dagre-d3';
import { Node, } from 'dagre';
import * as d3 from 'd3';
import { storyToGraph, createLineD, centralToNode, showAllDecestant, hideAllDecestant } from '../util/dagre_util';
import { D3ZoomEvent, ZoomTransform } from 'd3';
import { Story, story } from '../entities/story';
import { buildBtns, MenuDirection, makeContextMenu } from './context_menu';
import { editDialog } from './dialog';

export interface StoryNode extends Node {
    ref: Story;
}

ko.bindingHandlers['dagre-view'] = {
    init(element: any, valueAccessor: () => any) {
        const data = valueAccessor();

        console.log(ko.isObservable(data));

        const originData = ko.unwrap(data);

        console.log(originData);

        const g = new graphlib.Graph()
            .setGraph({
                rankdir: 'RL'
            })
            .setDefaultEdgeLabel(function () { return {}; });

        const renderer = new render();
        // Set up an SVG group so that we can translate the final graph.
        const container = d3.select(element);

        const centralizeOffset = {
            x: 0,
            y: 20,
        };

        const viewportSize = {
            width: 0,
            height: 0
        };

        let viewportMatrix: ZoomTransform = d3.zoomIdentity.translate(centralizeOffset.x, centralizeOffset.y);

        function doResize() {
            const width = parseFloat($(element).css('width'));
            svg.attr('width', width);
            const height = parseFloat($(element).css('height'));
            svg.attr("height", height);

            viewportSize.width = width;
            viewportSize.height = height;

            const graph = g.graph();
            // Center the graph
            const centralizeOffset = {
                x: (width - graph.width) / 2,
                y: (height - graph.height) / 2
            };

            viewportMatrix = viewportMatrix.translate(centralizeOffset.x - viewportMatrix.x, centralizeOffset.y - viewportMatrix.y);

            svgGroup.transition().duration(750).call(zoom.transform as any, viewportMatrix);
        }

        window.addEventListener('resize', doResize);

        const svg = container.append('svg');
        // top left menu
        const viewPortBtns = svg.append('g').attr('transform', 'translate(10, 10)')
            .on('contextmenu', function () { d3.event.preventDefault(); });
        // all contents
        const svgGroup = svg.append("g");
        const DAGContainer = svgGroup.append('g');

        // context menu
        const itemContextMenu = svg.append("g")
            .style('display', 'none')
            .on('contextmenu', function () { d3.event.preventDefault(); });

        const zoom = d3.zoom().on("zoom", function () {
            viewportMatrix = (d3.event as D3ZoomEvent<any, any>).transform
                .translate(centralizeOffset.x, centralizeOffset.y);

            svgGroup.attr("transform", viewportMatrix.toString());
        });




        storyToGraph(originData, g);
        // Run the renderer. This is what draws the final graph.

        renderer(DAGContainer as any, g);
        buildBtns(
            viewPortBtns,
            [{
                name: 'relayout', click() {
                    renderer(DAGContainer as any, g);
                }
            }, {
                name: 'central', click() {
                    doResize();
                }
            }]);

        const itemContext = makeContextMenu<StoryNode>(svg, itemContextMenu,
            [{
                name: 'edit content',
                click(itemContext) {
                    const ref = itemContext.ref;
                    editDialog.show(ref.content(), function ( editedContent) {
                        if(editedContent!= null ) {
                            ref.content(editedContent);
                            storyToGraph(originData, g);
                            // Run the renderer. This is what draws the final graph.
                            renderer(DAGContainer as any, g);         
                            doCenterToNode(itemContext);
                          }
                    });
                }
            },
            {
                name: 'add Child',
                click(itemContext) {
                    const ref = itemContext.ref;
                    if (ref.decestantVisible == false) {
                        showAllDecestant(itemContext, g);
                    }
                    const newStory = story(ref, ref.childNodes.length);
                    newStory.content(ko.unwrap(ref.content));

                    storyToGraph(originData, g);
                    // Run the renderer. This is what draws the final graph.
                    renderer(DAGContainer as any, g);

                    const newNode = g.node(newStory.id) as StoryNode;
                    bindNodeEvent(
                        d3.select(newNode.elem)
                    );
                    doCenterToNode(newNode);
                }
            }, {
                name: 'append sibling',
                click(itemContext) {
                    const ref = itemContext.ref;
                    const parent = ref.parent;
                    if (parent) {
                        const newStory = story(parent, parent.childNodes.indexOf(ref) + 1);
                        newStory.content(ko.unwrap(parent.content));

                        parent.childNodes.forEach(function (node) {
                            g.removeNode(node.id);
                        });

                        storyToGraph(originData, g);
                        // Run the renderer. This is what draws the final graph.
                        renderer(DAGContainer as any, g);

                        const newNode = g.node(newStory.id) as StoryNode;
                        bindNodeEvent(
                            d3.select(newNode.elem)
                        );
                        doCenterToNode(newNode);
                    }
                }
            }, {
                name: 'toggle child',
                click(itemContext) {
                    const ref = itemContext.ref;
                    if (ref.decestantVisible === false) {
                        showAllDecestant(itemContext, g);
                    } else {
                        hideAllDecestant(itemContext, g);
                    }

                    storyToGraph(originData, g);
                    // Run the renderer. This is what draws the final graph.
                    renderer(DAGContainer as any, g);

                    doCenterToNode(g.node(ref.id) as StoryNode);
                }
            }], MenuDirection.vertical);

        const drag = d3.drag<SVGGElement, string>().on('drag', function (d) {
            const node = d3.select(this);
            const attrs = g.node(d);
            const event = d3.event;
            attrs.x += event.dx;
            attrs.y += event.dy;

            node.attr('transform', 'translate(' + attrs.x + ',' + attrs.y + ')');

            const allInEdges = g.inEdges(d) || [];
            const allOutEdges = g.outEdges(d) || [];

            [...allInEdges, ...allOutEdges].forEach(function (x) {
                const edge = g.edge(x);
                d3.select(edge.elem as SVGGElement)
                    .select('path.path')
                    .attr('d', createLineD(x, g, svgGroup.node() as SVGGElement)!);
            });
        });

        bindNodeEvent(svgGroup.selectAll("g.node"));

        doResize();
        svg
            .call(zoom as any);

        ko.utils.domNodeDisposal.addDisposeCallback(element, function () {
            // This will be called when the element is removed by Knockout or
            // if some other part of your code calls ko.removeNode(element)
            window.removeEventListener('resize', doResize);
        });

        function bindNodeEvent(nodes: d3.Selection<any, any, any, any>) {
            nodes
                .call(drag as any)
                .on('dblclick', function (d) {
                    console.log(this);
                    d3.event.stopPropagation();

                    doCenterToNode(g.node(d) as StoryNode);
                })

                .on('contextmenu', function (d) {
                    d3.event.preventDefault();
                    d3.event.stopPropagation();
                    console.log('context', d);
                    itemContext.showWithContext(g.node(d) as StoryNode);
                });
        }

        function doCenterToNode(node: StoryNode) {
            const pos = centralToNode(node, viewportSize);

            viewportMatrix = d3.zoomIdentity.translate(pos.x, pos.y);

            svgGroup.transition().duration(750).call(zoom.transform as any, viewportMatrix);
        }

    },

}

