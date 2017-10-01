define([
    'ko'
], function (
    ko
) {

        function containerHeight() {
            return document.documentElement.clientHeight;
        }
        function containerTop() {
            return document.body.scrollTop;
        }
        /**
         * 基本交互
         * 点击居中
         *  让被点击的块被选中，
         *  并且 如果整体高度小于窗口高度，则垂直居中
         *       否则顶部对齐到容器上边缘
         *      将父节点与本节点按此规则垂直方向对齐
         *      将子节点作为一个整体与本节点垂直方向对齐
         * 滚动列
         *   一列向上滚动时，其父节点的底部不得超过本节点兄弟元素总的底部
         *                  本节点的顶部不得超过本节点的子节点的顶部
         *   一列向下滚动时，其父节点的顶部不得超过本节点兄弟元素总的顶部
         *                  本节点的底部不得超过本节点的子节点的底部
         * 新增节点
         *  可以选择在某个节点的前或后增加节点
         *  没有子节点时，可以增加子节点
         */

        'use strict';
        ko.components.register('scroll-tree', {
            viewModel: {
                createViewModel: function (params, componentInfo) {
                    // control scroll here
                    var tree = ko.unwrap(params.tree);

                    var vm = {
                        element: $(componentInfo.element),
                        rows: ko.observableArray([]),
                        activeRow: ko.observable(),
                        activeNode: ko.observable(),
                        addNode: function (parentNode, rowIdx, colIdx, childIdx) {
                            var newNode = { content: ko.observable('test'), childNodes: [] };
                            if (parentNode) {
                                newNode.parent = parentNode;
                                if (!parentNode.childNodes) {
                                    parentNode.childNodes = [];
                                }
                                parentNode.childNodes.splice(childIdx, 0, newNode);
                            }
                            var row = this.rows()[rowIdx];
                            if (!row) {
                                row = ko.observableArray();
                                this.rows.push(row);
                            }
                            row.splice(colIdx, 0, newNode);

                            return newNode;
                        },
                        init: function ( tree ) {

                            tree.vm = {
                                children: [],
                                node: tree,
                            };

                            var currentLevel = tree.childNodes;
                            var nextLevel = [];
                            var currentRow = ko.observableArray();

                            while (currentLevel && currentLevel.length) {
                                for (var i = 0; i < currentLevel.length; i++) {
                                    var nodeInfo = currentLevel[i];
                                    nodeInfo.content = ko.observable(ko.unwrap(nodeInfo.content));
                                    if (!nodeInfo.parent) {
                                        nodeInfo.parent = tree;
                                    }
                                    currentRow.push(nodeInfo);
                                    if (nodeInfo.childNodes && nodeInfo.childNodes.length) {
                                        for (var j = 0; j < nodeInfo.childNodes.length; j++) {
                                            var childNode = nodeInfo.childNodes[j];
                                            childNode.parent = nodeInfo;
                                            nextLevel.push(childNode);
                                        }
                                    }
                                }
                                vm.rows.push(currentRow);
                                currentRow = ko.observableArray();
                                currentLevel = nextLevel;
                                nextLevel = [];
                            }
                        }
                    };

                    if (params.tree && params.tree.subscribe) {
                        params.tree.subscribe(function (newTree) {
                            if (newTree) {
                                vm.activeNode(undefined);
                                vm.activeRow(undefined);
                                vm.rows([]);
                                vm.init(newTree);
                            }
                        });
                    }

                    vm.activeRow.subscribe(function (oldVal) {
                        if (oldVal) {
                            oldVal.vm.element.removeClass('active');
                        }
                    }, null, "beforeChange");

                    vm.activeRow.subscribe(function (newVal) {
                        if (newVal) {
                            newVal.vm.element.addClass('active');
                        }
                    });

                    vm.activeNode.subscribe(function (oldVal) {
                        if (oldVal) {
                            oldVal = oldVal.vm;
                            oldVal.element.removeClass('active');
                            var parent = oldVal.parent;
                            while (parent.element) {
                                parent.element.removeClass('active');
                                parent = parent.parent;
                            }
                            oldVal.children.forEach(function (node) {
                                node.element.removeClass('active');
                            });
                        }
                    }, null, "beforeChange");

                    vm.activeNode.subscribe(function (newVal) {
                        if (newVal) {
                            newVal = newVal.vm;
                            newVal.element.addClass('active');
                            var parent = newVal.parent;
                            while (parent.element) {
                                parent.element.addClass('active');
                                parent = parent.parent;
                            }

                            newVal.children.forEach(function (node) {
                                node.element.addClass('active');
                            });
                        }
                    });

                    vm.init(tree);

                    /**
                     * interface treeNode {
                     *    childNodes : [],
                     *    content: ''
                     * }
                     * 
                     * 输入一个树，广度优先遍历来分层
                     */

                    return vm;
                }
            },
            template: [
                '<!-- ko foreach: {data: rows, as: "row"} -->',
                '<scroll-row params="{ nodes: row, tree: $component, idx: $index }"',
                '            data-bind="click:$component.activeRow"',
                '></scroll-row>',
                '<!-- /ko -->'
            ].join('')
        });

        ko.components.register('scroll-row', {
            viewModel: {
                createViewModel: function (params, componentInfo) {
                    var tree = params.tree;
                    // control scroll here
                    var vm = {
                        element: $(componentInfo.element),
                        nodes: [],
                        nodeInfos: params.nodes,
                        scrollHeight: function () {
                            return this.element.height();
                        },
                        scrollTo: function (scrollTo) {
                            this.element.css('top', scrollTo);
                        },
                        scrollBy: function (scrollBy) {
                            var top = this.scrollTop();
                            this.scrollTo(scrollBy + top);
                        },
                        scrollTop: function () {
                            return parseInt(this.element.css('top'));
                        },
                        activeNode: tree.activeNode,
                        idx: params.idx,
                        addNode: function (parentNode, idx, childIdx) {
                            return tree.addNode(parentNode, this.idx(), idx, childIdx);
                        },
                        addChildNode: function (parentNode, idx, childIdx) {
                            return tree.addNode(parentNode, this.idx() + 1, idx, childIdx);
                        }
                    };
                    params.nodes.vm = vm;

                    return vm;
                }
            },
            template: [
                '<div class="wrap" data-bind="foreach: {data: nodeInfos, as: \'node\'}">',
                '    <scroll-node params="{row: $component, node: node, idx: $index }"',
                '                 data-bind="click: $component.activeNode"',
                '    ></scroll-node>',
                '</div>',
            ].join('')
        });

        ko.components.register('scroll-node', {
            viewModel: {
                createViewModel: function (params, componentInfo) {
                    var originNode = params.node;
                    var row = params.row;
                    var vm = {
                        node: originNode,
                        parent: originNode.parent && originNode.parent.vm,
                        idx: params.idx,
                        nIndex: function () {
                            return this.parent.children.indexOf(this);
                        },
                        row: row,
                        children: [],
                        element: $(componentInfo.element),
                        dispose: function () {
                            this.parent.children.splice(this.parent.children.indexOf(this), 1);
                        }
                    };
                    var oldVm = originNode.vm;
                    originNode.vm = vm;
                    if (oldVm) {
                        vm.children = oldVm.children;
                    }

                    row.nodes[vm.idx()] = vm;
                    if (originNode.parent) {
                        var childNodeIdx = originNode.parent.childNodes.indexOf(originNode);
                        originNode.parent.vm.children[childNodeIdx] = vm;
                    }
                    vm.top = function () {
                        var siblings = this.row.nodes;
                        var prevSiblings = siblings.slice(0, this.idx());
                        var ret = 0;
                        for (var i = 0; i < prevSiblings.length; i++) {
                            var node = prevSiblings[i];
                            ret += node.element.height();
                        }
                        return ret;
                    }
                    vm.verticalAlignToWithSiblings = function (verticalCenter) {
                        var top = this.top();
                        var height = this.element.height();

                        var siblingsHeight = 0;
                        var siblings = this.siblings();
                        for (var i = 0; i < siblings.length; i++) {
                            var sibling = siblings[i];
                            siblingsHeight += sibling.element.height();
                        }

                        if (siblingsHeight < containerHeight()) {
                            var scrollTo = verticalCenter - top - siblingsHeight / 2;
                            this.row.scrollTo(scrollTo);
                        } else {
                            this.row.scrollTo(0 - top);
                        }

                    };

                    vm.verticalAlignTo = function (verticalCenter) {
                        var top = this.top();
                        var height = this.element.height();
                        if (this.element.height() < containerHeight()) {
                            var scrollTo = verticalCenter - top - height / 2;
                            this.row.scrollTo(scrollTo);
                        } else {
                            this.row.scrollTo(0 - top);
                        }
                    };

                    vm.tryTopAlignTo = function (alignTo, force) {
                        var top = this.top();
                        var screenTop = this.screenTop();
                        if (!force) {
                            if (screenTop < alignTo) {
                                this.row.scrollBy(alignTo - screenTop);
                            }
                        } else {

                            if (screenTop !== alignTo) {
                                this.row.scrollBy(alignTo - screenTop);
                            }
                        }
                    };

                    vm.tryBottomAlignTo = function (alignTo, force) {
                        var top = this.top();
                        var screenBottom = this.screenBottom();
                        if (!force) {
                            if (screenBottom > alignTo) {
                                this.row.scrollBy(alignTo - screenBottom);
                            }
                        } else {
                            if (screenBottom !== alignTo) {
                                this.row.scrollBy(alignTo - screenBottom);
                            }
                        }
                    }

                    vm.centery = function () {
                        var self = this;
                        setTimeout(function () {
                            var vCenter = containerHeight() / 2;
                            self.verticalAlignTo(vCenter);

                            var parent = self.parent;
                            while (parent.verticalAlignTo) {
                                parent.verticalAlignTo(vCenter);
                                parent = parent.parent;
                            }
                            var child = self.children[0];
                            var subTreeRoot = self;
                            while (child) {
                                child.verticalAlignToWithSiblings(vCenter);
                                subTreeRoot = child;
                                child = child.children[0];
                            }
                            var sibling = subTreeRoot.prevSibling();
                            if (sibling && sibling.children.length) {
                                sibling.children[sibling.children.length - 1].tryBottomAlignTo(vCenter, true);
                            } else {
                                sibling = subTreeRoot.nextSibling();
                                if (sibling && sibling.children.length) {
                                    sibling.children[0].tryTopAlignTo(vCenter, true);
                                }
                            }
                        })
                    };
                    vm.screenTop = function () {
                        var top = this.top();
                        var scrollTop = this.row.scrollTop();
                        return top + scrollTop - containerTop();
                    };
                    vm.screenBottom = function () {
                        var height = this.element.height();
                        return this.screenTop() + height;
                    };
                    vm.scroll = function (vm, e) {
                        if (e.originalEvent.deltaY > 0) {
                            if (this.parent.element) {
                                this.parent.tryTopAlignTo(this.screenTop());
                            }
                            if (this.children.length) {
                                this.children[this.children.length - 1].tryBottomAlignTo(this.screenBottom());
                            }
                        } else {
                            if (this.parent.element) {
                                this.parent.tryBottomAlignTo(this.screenBottom());
                            }
                            if (this.children.length) {
                                this.children[0].tryTopAlignTo(this.screenTop());
                            }
                        }
                    };
                    vm.siblings = function () {
                        return this.parent.children;
                    };

                    vm.prevSibling = function () {
                        var siblings = this.siblings();
                        var startIndex = siblings.indexOf(this);
                        return siblings[startIndex - 1];
                    };
                    vm.nextSibling = function () {
                        var siblings = this.siblings();
                        var startIndex = siblings.indexOf(this);
                        return siblings[startIndex + 1];
                    };

                    vm.appendSibling = function () {
                        var self = this;
                        var newNode = this.row.addNode(this.parent.node, this.idx() + 1, this.nIndex() + 1);
                        // seems it redraw some nodes;
                        setTimeout(function () {
                            newNode.vm.centery();
                            self.row.activeNode(newNode);
                        });
                    };
                    vm.addChild = function () {
                        var self = this;
                        var searchIdx = this.idx();
                        var idx = 0;
                        for (; searchIdx >= 0; searchIdx--) {
                            var searchNode = this.row.nodes[searchIdx];
                            if (searchNode.children.length) {
                                idx = searchNode.children[searchNode.children.length - 1].idx() + 1;
                                var insertAfterNode = searchNode.children[searchNode.children.length - 1];
                                break;
                            }
                        }
                        var newNode = this.row.addChildNode(this.node, idx, this.children.length);
                        setTimeout(function () {
                            newNode.vm.centery();
                            self.row.activeNode(newNode);
                        });
                    }
                    return vm;
                }
            },
            template: [
                '<div class="content" data-bind="click: centery, event:{wheel: scroll}">',
                '<editable-text params="value: node.content"></editable-text>',
                '</div>',
                '<div class="add_sibling" data-bind="click: appendSibling"> + </div>',
                '<div class="add_child" data-bind="click: addChild"> + </div>',
            ].join('')
        });
        ko.components.register('editable-text', {
            viewModel: {

                createViewModel: function (params, componentInfo) {
                    var $element = $(componentInfo.element);
                    var vm = {
                        value: params.value,
                        editing: ko.observable(false),
                        edit: function () {
                            this.editing(true);
                        },
                        endEdit: function () {
                            this.editing(false);
                        }
                    };
                    vm.editing.subscribe(function (newVal) {
                        if (newVal) {
                            setTimeout(function () {
                                var $textarea = $element.find('textarea');
                                $textarea.focus();
                                $textarea.on('input', function () {
                                    console.log('input!!!!');
                                    
                                    $textarea.attr('rows', this.value.split('\n'));
                                });

                            });
                        }
                    });
                    return vm;
                },
            },
            template: [
                '<!-- ko if: editing -->',
                '<textarea data-bind="value: value, event:{blur: endEdit}"></textarea>',
                '<!-- /ko -->',
                '<!-- ko ifnot: editing -->',
                '<i class="icon glyphicon glyphicon-edit" data-bind="click: edit"></i>',
                '<p data-bind="text: value, event:{dblclick: edit}"></p>',
                '<!-- /ko -->',
            ].join('')
        });

    });
