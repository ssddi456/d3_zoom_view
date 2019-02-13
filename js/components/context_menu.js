define(["require", "exports", "d3"], function (require, exports, d3) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var MenuDirection;
    (function (MenuDirection) {
        MenuDirection[MenuDirection["horizontal"] = 0] = "horizontal";
        MenuDirection[MenuDirection["vertical"] = 1] = "vertical";
    })(MenuDirection = exports.MenuDirection || (exports.MenuDirection = {}));
    function buildBtns(btnContainer, _btns, isContextmenu, direction, getContext) {
        if (isContextmenu === void 0) { isContextmenu = false; }
        if (direction === void 0) { direction = MenuDirection.horizontal; }
        _btns.reduce(function (left, item) {
            var btn = btnContainer.append('g').attr('transform', direction == MenuDirection.horizontal
                ? 'translate(' + left + ',' + 0 + ')'
                : 'translate(' + 0 + ',' + left + ')');
            item.elem = btn;
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
                if (getContext) {
                    item.click(getContext());
                }
                else {
                    item.click(null);
                }
                if (isContextmenu) {
                    btnContainer.style('display', 'none');
                }
            });
            return left + 10 * 2 + (direction == MenuDirection.horizontal ? item.name.length * 7 : 15);
        }, 0);
    }
    exports.buildBtns = buildBtns;
    function layoutBtns(_btns, direction, getContext) {
        if (direction === void 0) { direction = MenuDirection.horizontal; }
        var context = getContext ? getContext() : null;
        _btns.reduce(function (left, item) {
            var btn = item.elem;
            if (item.visible && item.visible(context) == false) {
                btn.style('display', 'none');
                return left;
            }
            btn.style('display', null).attr('transform', direction == MenuDirection.horizontal
                ? 'translate(' + left + ',' + 0 + ')'
                : 'translate(' + 0 + ',' + left + ')');
            return left + 10 * 2 + (direction == MenuDirection.horizontal ? item.name.length * 7 : 15);
        }, 0);
    }
    exports.layoutBtns = layoutBtns;
    function makeContextMenu(container, wrapper, buttons, direction, autoDismiss) {
        if (direction === void 0) { direction = MenuDirection.horizontal; }
        var itemContext;
        wrapper
            .style('display', 'none')
            .on('contextmenu', function () { d3.event.preventDefault(); });
        if (autoDismiss !== false) {
            container
                .on('mousedown', function () {
                wrapper.style('display', 'none');
            });
        }
        buildBtns(wrapper, buttons, true, direction, function () { return itemContext; });
        var ret = {
            showWithContext: function (item, position) {
                itemContext = item;
                layoutBtns(buttons, direction, function () { return itemContext; });
                wrapper.style('display', null);
                if (position != undefined) {
                    wrapper.attr('transform', 'translate(' + position.x + ',' + position.y + ')');
                }
                else {
                    var mouseInfo = d3.mouse(container.node());
                    wrapper.attr('transform', 'translate(' + mouseInfo[0] + ',' + mouseInfo[1] + ')');
                }
            },
            hide: function () {
                wrapper.style('display', 'none');
            }
        };
        return ret;
    }
    exports.makeContextMenu = makeContextMenu;
});
