import * as ko from 'knockout';
import { graphlib, render } from 'dagre-d3';
import * as d3 from 'd3';
import { storyToGraph, createLineD } from '../util/dagre_util';
import { layout } from 'dagre';
import { D3ZoomEvent, ZoomTransform } from 'd3';

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
            y: 20
        };
        let viewportMatrix: ZoomTransform = d3.zoomIdentity.translate(centralizeOffset.x, centralizeOffset.y);

        function doResize() {
            svg.attr('width', parseFloat($(element).css('width')));
            svg.attr("height", parseFloat($(element).css('height')));

            // Center the graph
            centralizeOffset.x = (parseFloat(svg.attr("width")) - g.graph().width) / 2;
            svgGroup.attr("transform", viewportMatrix.toString());
        }
        window.addEventListener('resize', doResize);

        const svg = container.append('svg');
        const svgGroup = svg.append("g");

        const zoom = d3.zoom().on("zoom", function () {
            viewportMatrix = (d3.event as D3ZoomEvent<any, any>).transform.translate(centralizeOffset.x, centralizeOffset.y);
            svgGroup.attr("transform", viewportMatrix.toString());
        });
        svg.call(zoom as any);



        storyToGraph(originData, g);


        // Run the renderer. This is what draws the final graph.
        renderer(svgGroup as any, g);



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

        svgGroup.selectAll("g.node").call(drag as any);

        doResize();

        ko.utils.domNodeDisposal.addDisposeCallback(element, function () {
            // This will be called when the element is removed by Knockout or
            // if some other part of your code calls ko.removeNode(element)
            window.removeEventListener('resize', doResize);
        });
    },

}

