import { Node, Edge, graphlib } from 'dagre';
import { Story } from '../entities/story';
import * as ko from 'knockout';
import * as d3 from 'd3';

const edgeIdPrefix = 'edge_';

export function getIdOfEdge(e: Edge) {
    return edgeIdPrefix + e.v + '_' + e.w;
}


function walkEachChild(stories: Story[], parent: Story, graph: graphlib.Graph) {
    for (let i = 0; i < stories.length; i++) {
        const element = stories[i];
        graph.setNode(element.id, { label: ko.unwrap(element.content) });
        const edge = {
            v: element.id,
            w: parent.id,
        };

        graph.setEdge(edge, { id: getIdOfEdge(edge) });

        if (element.childNodes.length) {
            walkEachChild(element.childNodes, element, graph);
        }
    }
}

export function storyToGraph(story: Story, graph: graphlib.Graph) {
    graph.setNode(story.id, { label: ko.unwrap(story.content) });
    if (story.childNodes.length) {
        walkEachChild(story.childNodes, story, graph);
    }
}

function getCoords(elem: SVGGraphicsElement, wiewport: DOMMatrix) {
    const matrix = wiewport
        .multiply(elem.getScreenCTM()!)
    return { x: matrix.e, y: matrix.f };
}

export function calcPoints(g: graphlib.Graph, e: Edge, wiewport: DOMMatrix) {
    const edge = g.edge(e);
    const tail = fixSizeForNode(g.node(e.v));
    const head = fixSizeForNode(g.node(e.w));

    const points = edge.points.slice(1, edge.points.length - 1);
    // we asume this layout always use 2 seg edge
    // we should recaculate the joint point

    const tailCoord = getCoords(tail.elem, wiewport);
    const headCoord = getCoords(head.elem, wiewport);

    
    const horizentalSpace = tailCoord.x - (tail.width / 2) - headCoord.x - (head.width/2);
    const leftPoint = tail.width / 2 + 50;
    points[0].x = horizentalSpace > leftPoint ? tailCoord.x - leftPoint : tailCoord.x - 0.5 * (horizentalSpace) - tail.width / 2;
    points[0].y = tailCoord.y;

    const tailIntersect = tail.intersect(points[0]);
    points.unshift(tailIntersect);
    points.push(head.intersect(points[points.length - 1]));

    return points;
}

export function fixSizeForNode(n: Node) {
    const elem = n.elem as SVGGraphicsElement;
    if (!elem) {
        return n;
    }
    const bbox = elem.getBBox();
    if (!('width' in n)) {
        n.width = bbox.width;
    }
    if (!('height' in n)) {
        n.height = bbox.height;
    }
    return n;
}
interface Point {
    x: number;
    y: number;
}
var line = d3.line<Point>()
    .x(function (d) { return d.x; })
    .y(function (d) { return d.y; });

export function createLineD(edge: Edge, g: graphlib.Graph, wiewport: SVGGraphicsElement) {
    const points: Point[] = calcPoints(g, edge, wiewport.getScreenCTM()!.inverse());
    return line(points);
}
