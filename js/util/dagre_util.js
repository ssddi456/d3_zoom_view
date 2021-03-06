define(["require", "exports", "knockout", "d3"], function (require, exports, ko, d3) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var edgeIdPrefix = 'edge_';
    function getIdOfEdge(e) {
        return edgeIdPrefix + e.v + '_' + e.w;
    }
    exports.getIdOfEdge = getIdOfEdge;
    function setStoryNode(graph, ref) {
        graph.setNode(ref.id, {
            label: ko.unwrap(ref.content),
            ref: ref,
        });
    }
    function walkEachChild(stories, parent, graph, handler) {
        for (var i = 0; i < stories.length; i++) {
            var element = stories[i];
            if (handler(element, parent, graph) !== false && element.childNodes.length) {
                walkEachChild(element.childNodes, element, graph, handler);
            }
        }
    }
    function storyToGraph(story, graph) {
        console.log(story);
        setStoryNode(graph, story);
        if (story.childNodes.length) {
            walkEachChild(story.childNodes, story, graph, function (element, parent, graph) {
                if (element.visible === false) {
                    return false;
                }
                setStoryNode(graph, element);
                var edge = {
                    v: element.id,
                    w: parent.id,
                };
                graph.setEdge(edge, { id: getIdOfEdge(edge) });
            });
        }
    }
    exports.storyToGraph = storyToGraph;
    function getCoords(elem, wiewport) {
        var matrix = wiewport
            .multiply(elem.getScreenCTM());
        return { x: matrix.e, y: matrix.f };
    }
    exports.getCoords = getCoords;
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
        eraseSizeForNode(tail);
        eraseSizeForNode(head);
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
    function eraseSizeForNode(n) {
        delete n.width;
        delete n.height;
    }
    var line = d3.line()
        .x(function (d) { return d.x; })
        .y(function (d) { return d.y; });
    function createLineD(edge, g, wiewport) {
        var points = calcPoints(g, edge, wiewport.getScreenCTM().inverse());
        return line(points);
    }
    exports.createLineD = createLineD;
    function centralToNode(node, g) {
        fixSizeForNode(node);
        var ret = {
            x: g.width / 2 - (node.x + node.width / 2),
            y: g.height / 2 - (node.y + node.height / 2)
        };
        eraseSizeForNode(node);
        return ret;
    }
    exports.centralToNode = centralToNode;
    function hideAllDecestant(node, g) {
        var story = node.ref;
        story.decestantVisible = false;
        if (story.childNodes.length) {
            walkEachChild(story.childNodes, story, g, function (child, parent, g) {
                child.visible = false;
                g.removeNode(child.id);
            });
        }
    }
    exports.hideAllDecestant = hideAllDecestant;
    function showAllDecestant(node, g) {
        var story = node.ref;
        story.decestantVisible = true;
        if (story.childNodes.length) {
            walkEachChild(story.childNodes, story, g, function (child, parent, g) {
                child.visible = true;
            });
            storyToGraph(story, g);
        }
    }
    exports.showAllDecestant = showAllDecestant;
});
