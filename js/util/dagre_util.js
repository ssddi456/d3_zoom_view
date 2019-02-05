define(["require", "exports", "knockout", "d3"], function (require, exports, ko, d3) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var edgeIdPrefix = 'edge_';
    function getIdOfEdge(e) {
        return edgeIdPrefix + e.v + '_' + e.w;
    }
    exports.getIdOfEdge = getIdOfEdge;
    function walkEachChild(stories, parent, graph) {
        for (var i = 0; i < stories.length; i++) {
            var element = stories[i];
            graph.setNode(element.id, { label: ko.unwrap(element.content) });
            var edge = {
                v: element.id,
                w: parent.id,
            };
            graph.setEdge(edge, { id: getIdOfEdge(edge) });
            if (element.childNodes.length) {
                walkEachChild(element.childNodes, element, graph);
            }
        }
    }
    function storyToGraph(story, graph) {
        graph.setNode(story.id, { label: ko.unwrap(story.content) });
        if (story.childNodes.length) {
            walkEachChild(story.childNodes, story, graph);
        }
    }
    exports.storyToGraph = storyToGraph;
    function getCoords(elem, wiewport) {
        var matrix = wiewport
            .multiply(elem.getScreenCTM());
        return { x: matrix.e, y: matrix.f };
    }
    function calcPoints(g, e, wiewport) {
        var edge = g.edge(e);
        var tail = fixSizeForNode(g.node(e.v));
        var head = fixSizeForNode(g.node(e.w));
        var points = edge.points.slice(1, edge.points.length - 1);
        // we asume this layout always use 2 seg edge
        // we should recaculate the joint point
        var tailCoord = getCoords(tail.elem, wiewport);
        var headCoord = getCoords(head.elem, wiewport);
        var horizentalSpace = tailCoord.x - (tail.width / 2) - headCoord.x - (head.width / 2);
        var leftPoint = tail.width / 2 + 50;
        points[0].x = horizentalSpace > leftPoint ? tailCoord.x - leftPoint : tailCoord.x - 0.5 * (horizentalSpace) - tail.width / 2;
        points[0].y = tailCoord.y;
        var tailIntersect = tail.intersect(points[0]);
        points.unshift(tailIntersect);
        points.push(head.intersect(points[points.length - 1]));
        return points;
    }
    exports.calcPoints = calcPoints;
    function fixSizeForNode(n) {
        var elem = n.elem;
        if (!elem) {
            return n;
        }
        var bbox = elem.getBBox();
        if (!('width' in n)) {
            n.width = bbox.width;
        }
        if (!('height' in n)) {
            n.height = bbox.height;
        }
        return n;
    }
    exports.fixSizeForNode = fixSizeForNode;
    var line = d3.line()
        .x(function (d) { return d.x; })
        .y(function (d) { return d.y; });
    function createLineD(edge, g, wiewport) {
        var points = calcPoints(g, edge, wiewport.getScreenCTM().inverse());
        return line(points);
    }
    exports.createLineD = createLineD;
});
