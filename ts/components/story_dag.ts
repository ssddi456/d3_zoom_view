import * as ko from 'knockout';
import { graphlib, render } from 'dagre-d3';
import { Node, } from 'dagre';
import * as d3 from 'd3';
import { storyToGraph, createLineD, centralToNode } from '../util/dagre_util';
import { D3ZoomEvent, ZoomTransform } from 'd3';
import { Story, story } from '../entities/story';

interface BtnConfig {
    name: string;
    click: () => void
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
        const viewPortBtns = svg.append('g').attr('transform', 'translate(10, 10)');
        const svgGroup = svg.append("g");
        const itemBtns = svg.append("g").style('display', 'none').on('contextmenu', function () { d3.event.preventDefault(); });

        enum menuDirection {
            horizontal,
            vertical,
        }

        function buildBtns(
            btnContainer: d3.Selection<SVGGElement, any, any, any>,
            _btns: BtnConfig[],
            isContextmenu: boolean = false,
            direction: menuDirection = menuDirection.horizontal
        ) {
            _btns.reduce(function (left, item) {
                const btn = btnContainer.append('g').attr('transform',
                    direction == menuDirection.horizontal
                        ? 'translate(' + left + ',' + 0 + ')'
                        : 'translate(' + 0 + ',' + left + ')'
                );
                const bg = btn.append('rect')
                    .attr('y', -5)
                    .style('fill', '#e2edef');
                const text = btn.append('text')
                    .attr('dx', '10')
                    .attr('dy', '10');

                setTimeout(() => {
                    const bbox = text.node()!.getBBox();
                    console.log(bbox);
                    bg
                        .attr('width', bbox.width + 10 * 2)
                        .attr('height', bbox.height + 10)
                }, 10);

                text.text(item.name);
                btn
                    .on('mousedown', function () {
                        d3.event.stopPropagation();
                    })
                    .on('click', function (...args: any[]) {
                        item.click.apply(this, args as any);
                        if (isContextmenu) {
                            btnContainer.style('display', 'none');
                        }
                    });

                return left + 10 * 2 + (direction == menuDirection.horizontal ? item.name.length * 7 : 15);
            }, 0);
        }


        const zoom = d3.zoom().on("zoom", function () {
            viewportMatrix = (d3.event as D3ZoomEvent<any, any>).transform
                .translate(centralizeOffset.x, centralizeOffset.y);

            svgGroup.attr("transform", viewportMatrix.toString());
        });

        svg
            .on('mousedown', function () {
                itemBtns.style('display', 'none');
            })
            .call(zoom as any);


        storyToGraph(originData, g);
        // Run the renderer. This is what draws the final graph.
        renderer(svgGroup as any, g);

        buildBtns(
            viewPortBtns,
            [{
                name: 'relayout', click() {
                    renderer(svgGroup as any, g);
                }
            }, {
                name: 'central', click() {
                    doResize();
                }
            }]);
        interface StoryNode extends Node {
            ref: Story
        }

        let itemContext: StoryNode;
        buildBtns(
            itemBtns,
            [{
                name: 'add Child',
                click() {
                    const ref = itemContext.ref;
                    const newStory = story(ref);
                    ref.childNodes.push(newStory);
                    storyToGraph(originData, g);
                    // Run the renderer. This is what draws the final graph.
                    renderer(svgGroup as any, g);

                    const newNode = g.node(newStory.id) as StoryNode;
                    bindNodeEvent(
                        d3.select(newNode.elem)
                    );
                    doCenterToNode(newNode);
                }
            }, {
                name: 'add sibling',
                click() {
                    // storyToGraph(originData, g);
                    // // Run the renderer. This is what draws the final graph.
                    // renderer(svgGroup as any, g);
                }
            }],
            true,
            menuDirection.vertical);

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
                    itemContext = g.node(d) as StoryNode;
                    const mouseInfo = d3.mouse(svg.node() as any);
                    itemBtns.style('display', null).attr('transform', 'translate(' + mouseInfo[0] + ',' + mouseInfo[1] + ')')
                });
        }

        function doCenterToNode(node: StoryNode) {
            const pos = centralToNode(node, viewportSize);

            viewportMatrix = d3.zoomIdentity.translate(pos.x, pos.y);

            svgGroup.transition().duration(750).call(zoom.transform as any, viewportMatrix);
        }

        doResize();

        ko.utils.domNodeDisposal.addDisposeCallback(element, function () {
            // This will be called when the element is removed by Knockout or
            // if some other part of your code calls ko.removeNode(element)
            window.removeEventListener('resize', doResize);
        });
    },

}

