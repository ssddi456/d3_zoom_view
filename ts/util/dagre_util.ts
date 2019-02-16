import { Node, Edge, graphlib } from 'dagre';
import { Story } from '../entities/story';
import * as ko from 'knockout';
import * as d3 from 'd3';
import { StoryNode } from '../components/story_dag';

const edgeIdPrefix = 'edge_';

export function getIdOfEdge(e: Edge) {
    return edgeIdPrefix + e.v + '_' + e.w;
}

function setStoryNode(graph: graphlib.Graph, ref: Story) {
    graph.setNode(ref.id, {
        label: ko.unwrap(ref.content),
        ref,
    });
}

function walkEachChild(stories: Story[],
    parent: Story,
    graph: graphlib.Graph,
    handler: (story: Story,
        parent: Story,
        graph: graphlib.Graph, ) => boolean | void
) {
    for (let i = 0; i < stories.length; i++) {
        const element = stories[i];
        
        if (handler(element, parent, graph) !== false && element.childNodes.length) {
            walkEachChild(element.childNodes, element, graph, handler);
        }
    }
}

export function storyToGraph(story: Story, graph: graphlib.Graph) {
    console.log( story );
    
    setStoryNode(graph, story);
    if (story.childNodes.length) {
        walkEachChild(story.childNodes, story, graph, function (element, parent, graph){
            if(element.visible === false) {
                return false;
            }

            setStoryNode(graph, element);

            const edge = {
                v: element.id,
                w: parent.id,
            };

            graph.setEdge(edge, { id: getIdOfEdge(edge) });
        });
    }
}

export function getCoords(elem: SVGGraphicsElement, wiewport: DOMMatrix) {
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


    const horizentalSpace = tailCoord.x - (tail.width / 2) - headCoord.x - (head.width / 2);
    const leftPoint = tail.width / 2 + 50;
    points[0].x = horizentalSpace > leftPoint ? tailCoord.x - leftPoint : tailCoord.x - 0.5 * (horizentalSpace) - tail.width / 2;
    points[0].y = tailCoord.y;

    const tailIntersect = tail.intersect(points[0]);
    points.unshift(tailIntersect);
    points.push(head.intersect(points[points.length - 1]));

    eraseSizeForNode(tail);
    eraseSizeForNode(head);
    return points;
}

function fixSizeForNode(n: Node) {
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

function eraseSizeForNode(n: Node) {
    delete n.width;
    delete n.height;
}

interface Point {
    x: number;
    y: number;
}
interface Size {
    width: number;
    height: number
}
var line = d3.line<Point>()
    .x(function (d) { return d.x; })
    .y(function (d) { return d.y; });

export function createLineD(edge: Edge, g: graphlib.Graph, wiewport: SVGGraphicsElement) {
    const points: Point[] = calcPoints(g, edge, wiewport.getScreenCTM()!.inverse());
    return line(points);
}


export function centralToNode(node: Node, g: Size) {
    fixSizeForNode(node);

    const ret = {
        x: g.width / 2 - (node.x + node.width / 2),
        y: g.height / 2 - (node.y + node.height / 2)
    };

    eraseSizeForNode(node);
    return ret;
}

export function hideAllDecestant(node: StoryNode, g: graphlib.Graph) {
    const story = node.ref;
    story.decestantVisible = false;
    if(story.childNodes.length) {
        walkEachChild(story.childNodes, story, g, function( child, parent, g){
            child.visible = false;
            g.removeNode(child.id);
        });
    }
}

export function showAllDecestant(node: StoryNode, g: graphlib.Graph){
    const story = node.ref;
    story.decestantVisible = true;
    if (story.childNodes.length) {
        walkEachChild(story.childNodes, story, g, function (child, parent, g) {
            child.visible = true;
        });
        storyToGraph(story, g);
    }
}
