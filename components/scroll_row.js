define([
    '../entities/story',
    'ko'
], function (
    story,
    ko
) {

        function containerHeight() {
            return document.documentElement.clientHeight;
        }
        function containerTop() {
            return document.body.scrollTop;
        }
        function containerLeft() {
            return document.body.scrollLeft;
        }
        function containerScrollLetf(scrollTo) {
            document.body.scrollLeft = scrollTo;
        }
        function containerWidth() {
            return document.documentElement.clientWidth;
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
                    var characters = params.characters;
                    var tags = params.tags;

                    // control scroll here
                    var vm = {
                        element: $(componentInfo.element),
                        rows: ko.observableArray([]),
                        activeRow: ko.observable(),
                        activeNode: ko.observable(),
                        addNode: function (parentNode, rowIdx, colIdx, childIdx) {
                            var newNode = story(parentNode, childIdx);

                            var row = this.rows()[rowIdx];
                            if (!row) {
                                row = ko.observableArray();
                                this.rows.push(row);
                            }
                            row.splice(colIdx, 0, newNode);

                            return newNode;
                        },
                        init: function (tree) {

                            tree.vm = {
                                node: tree,
                            };

                            var currentLevel = tree.childNodes;
                            var nextLevel = [];
                            var currentRow = ko.observableArray();
                            var shouldFocusOn;

                            while (currentLevel && currentLevel.length) {
                                for (var i = 0; i < currentLevel.length; i++) {
                                    var nodeInfo = currentLevel[i];
                                    if (ko.unwrap(nodeInfo.hasFocus)) {
                                        shouldFocusOn = nodeInfo;
                                    }
                                    story.load(nodeInfo, nodeInfo.parent || tree, characters, tags);

                                    currentRow.push(nodeInfo);
                                    if (nodeInfo.childNodes && nodeInfo.childNodes.length) {
                                        for (var j = 0; j < nodeInfo.childNodes.length; j++) {
                                            var childNode = nodeInfo.childNodes[j];
                                            childNode.parent = nodeInfo;
                                            nextLevel.push(childNode);
                                        }
                                    }
                                }
                                this.rows.push(currentRow);
                                currentRow = ko.observableArray();
                                currentLevel = nextLevel;
                                nextLevel = [];
                            }
                            if (shouldFocusOn) {
                                var self = this;
                                setTimeout(function () {
                                    self.activeNode(shouldFocusOn);
                                    shouldFocusOn.vm.centery();
                                });
                            }
                        },
                        scrollRow: function (vm, e) {
                            vm.vm.scroll(vm, e);
                        }
                    };

                    var tree = ko.unwrap(params.tree);
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
                            oldVal.isActive(false);
                            oldVal.hasFocus(false);

                            oldVal.childNodes.forEach(function (node) {
                                node.isActive(false);
                            });
                            oldVal = oldVal.vm;
                            oldVal.allParents(function (parent) {
                                parent.node.isActive(false);
                            });
                        }
                    }, null, "beforeChange");

                    vm.activeNode.subscribe(function (newVal) {
                        if (newVal) {
                            newVal.isActive(true);
                            newVal.hasFocus(true);

                            newVal.childNodes.forEach(function (node) {
                                node.isActive(true);
                            });

                            newVal = newVal.vm;
                            newVal.allParents(function (parent) {
                                parent.node.isActive(true);
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
                '            data-bind="click:$component.activeRow, ',
                '                       event: { wheel: $component.scrollRow },',
                '                       style: { \'margin-left\': $index() * 20 + \'%\' }',
                '"',
                '></scroll-row>',
                '<!-- /ko -->'
            ].join('')
        });


        ko.components.register('edit-tree', {
            viewModel: {
                createViewModel: function (params, componentInfo) {
                    var parentRow = ko.observableArray();
                    var mainRow = ko.observableArray();
                    var tagsRow = ko.observableArray();

                    var characters = params.characters;
                    var tags = params.tags;

                    var vm = {
                        parentRow: parentRow,
                        mainRow: mainRow,
                        tagsRow: tagsRow,

                        characters: characters,
                        tags: tags,

                        activeNode: ko.observable(),
                        addNode: function (parentNode, rowIdx, colIdx, childIdx) {
                            /**
                             * rowIdx: 1 main row, addSiblings
                             * rowIdx: 2 new row, addNewChild
                             */
                            var newNode = story(parentNode, childIdx);
                            if (rowIdx == 2) {
                                // 这说明是第一个子节点，应当把这个父节点移走，把子节点加入mainRow
                                this.mainRow.splice(colIdx, 1, newNode);
                            } else {
                                this.mainRow.splice(colIdx, 0, newNode);
                            }
                            return newNode;
                        },
                        init: function (tree) {
                            this.mainRow.splice(0, Infinity);

                            tree.vm = {
                                node: tree,
                            };

                            var currentLevel = tree.childNodes.slice();
                            var shouldFocusOn;
                            while (currentLevel && currentLevel.length) {
                                var nodeInfo = currentLevel.shift();

                                story.load(nodeInfo, nodeInfo.parent || tree, characters, tags);

                                if (nodeInfo.childNodes && nodeInfo.childNodes.length) {
                                    for (var j = 0; j < nodeInfo.childNodes.length; j++) {
                                        var childNode = nodeInfo.childNodes[nodeInfo.childNodes.length - j - 1];
                                        childNode.parent = nodeInfo;
                                        currentLevel.unshift(childNode);
                                    }
                                    if (nodeInfo.hasFocus()) {
                                        nodeInfo.hasFocus(false);
                                        // so we should focus on it first visible children
                                        while (nodeInfo.childNodes.length) {
                                            nodeInfo = nodeInfo.childNodes[0];
                                        }
                                        nodeInfo.hasFocus(true);
                                    }
                                } else {
                                    this.mainRow.push(nodeInfo);
                                    if (nodeInfo.hasFocus()) {
                                        shouldFocusOn = nodeInfo;
                                    }
                                }
                            }
                            if (shouldFocusOn) {
                                var self = this;
                                setTimeout(function () {
                                    self.activeNode(shouldFocusOn);
                                    shouldFocusOn.vm.centery();
                                });
                            }
                        },
                        scrollRow: function (vm, self, e) {
                            vm.vm.scroll(vm, e);
                        }
                    };
                    var tree = ko.unwrap(params.tree);
                    if (params.tree && params.tree.subscribe) {
                        params.tree.subscribe(function (newTree) {
                            if (newTree) {
                                vm.activeNode(undefined);

                                parentRow([]);
                                mainRow([]);
                                tagsRow([]);

                                vm.init(newTree);
                            }
                        });
                    }

                    vm.activeNode.subscribe(function (oldVal) {
                        if (oldVal) {
                            oldVal.isActive(false);
                            oldVal.hasFocus(false);

                            oldVal.childNodes.forEach(function (node) {
                                node.isActive(false);
                            });

                            oldVal = oldVal.vm;
                            oldVal.allParents(function (parent) {
                                parent.node.isActive(false);
                            });
                        }
                    }, null, 'beforeChange');
                    vm.activeNode.subscribe(function (newVal) {
                        vm.tagsRow([]);
                        if (newVal) {
                            newVal.isActive(true);
                            newVal.hasFocus(true);

                            if (ko.isObservable(newVal.parent.isActive)) {
                                newVal.parent.isActive(true);

                                var parent = newVal.parent;

                                if (parent != vm.parentRow()[0]) {
                                    vm.parentRow.splice(0, 1, newVal.parent);
                                    // make a patch here to make scroll property;
                                    setTimeout(function () {
                                        var parentVM = newVal.parent.vm;
                                        newVal.vm.parent = parentVM;
                                        parentVM.tryTopAlignTo(newVal.vm.screenTop(), 1, true);
                                    });
                                } else {
                                    setTimeout(function () {
                                        newVal.parent.vm.tryTopAlignTo(newVal.vm.screenTop(), 1, true);
                                    })
                                }
                            } else {
                                vm.parentRow([]);
                            }

                        } else {
                            vm.parentRow([]);
                        }
                    });

                    vm.init(tree);

                    return vm;
                }
            },
            template: [
                '<edit-row params="{ nodes: parentRow, tree: $component, idx: function(){return 0;} }"',
                '          class="scroll-row"',
                '          style="margin-left:0%"',
                '          data-bind="event: { wheel: scrollRow.bind(null, parentRow) }"',
                '></edit-row>',

                '<edit-row params="{ nodes: mainRow, tree: $component, idx: function(){ return 1;} }"',
                '          class="scroll-row"',
                '          style="margin-left:20%; width: 60%;"',
                '          data-bind="event: { wheel: scrollRow.bind(null, mainRow) }"',
                '></edit-row>',

                '<tag-row params="{ tree: $component, characters: characters, tags: tags }"',
                '         style="margin-left:80%"',
                '         data-bind="event: { wheel: scrollRow.bind(null, tagsRow) }"',
                '         class="scroll-row"',
                '></tag-row>',
            ].join('')
        });

        function createRowVM(params, componentInfo) {
            var tree = params.tree;
            // control scroll here
            var $element = $(componentInfo.element);
            var $wrap = $element.find('.wrap');
            var vm = {
                tree: tree,
                element: $element,
                nodes: [],
                nodeInfos: params.nodes,
                scrollTo: function (scrollTo) {
                    this.scrollToInfo = scrollTo;
                    $wrap.css('margin-top', this.scrollToInfo);
                },
                scrollBy: function (scrollBy) {
                    var top = this.scrollTop();
                    this.scrollTo(scrollBy + top);
                },
                scrollTop: function () {
                    return parseFloat($wrap.css('margin-top'));
                },
                scrollLeft: function () {
                    return parseFloat(this.element.css('margin-left'));
                },
                activeNode: tree.activeNode,
                idx: params.idx,
                addNode: function (parentNode, idx, childIdx) {
                    return tree.addNode(parentNode, this.idx(), idx, childIdx);
                },
                addChildNode: function (parentNode, idx, childIdx) {
                    return tree.addNode(parentNode, this.idx() + 1, idx, childIdx);
                },
                scroll: function (vm, e) {
                    e.preventDefault();
                    e.stopPropagation();
                    var delta = -1 * e.originalEvent.deltaY;
                    this.scrollBy(delta);
                    var activeNode = tree.activeNode();
                    if (activeNode) {
                        activeNode.vm.scrollAlign(delta);
                    }
                },
                moveUpNode: function (node) {
                    //
                    var nodeInfos = this.tree.rows()[this.idx()];
                    var nodes = nodeInfos.peek();
                    var index = nodes.indexOf(node);

                    nodeInfos.valueWillMutate();
                    nodes.splice(index, 1);
                    nodes.splice(index - 1, 0, node);
                    nodeInfos.valueHasMutated();
                }
            };

            if (params.nodes) {
                if (params.nodes.vm) {
                    var oldVM = params.nodes.vm;
                    vm.scrollTo(oldVM.scrollToInfo || 0);
                }

                params.nodes.vm = vm;
            }

            return vm;
        }
        ko.components.register('scroll-row', {
            viewModel: {
                createViewModel: createRowVM
            },
            template: [
                '<div class="wrap" data-bind="foreach: {data: nodeInfos, as: \'node\'}">',
                '    <scroll-node params="{row: $component, node: node, idx: $index }"',
                '                 data-bind="click: $component.activeNode,',
                '                            css: { active: node.isActive}"',
                '    ></scroll-node>',
                '</div>',
            ].join('')
        });

        ko.components.register('edit-row', {
            viewModel: {
                createViewModel: createRowVM
            },
            template: [
                '<div class="wrap" data-bind="foreach: {data: nodeInfos, as: \'node\'}">',
                '    <edit-node params="{row: $component, node: node, idx: $index }"',
                '               data-bind="click: $component.activeNode,',
                '                          css: { active: node.isActive}"',
                '               class="scroll-node"',
                '    ></edit-node>',
                '</div>',
            ].join('')
        });

        ko.components.register('tag-row', {
            viewModel: {
                createViewModel: function (params, componentInfo) {
                    var rowVM = createRowVM(params, componentInfo);

                    rowVM.characters = params.characters;
                    rowVM.selectableCharacters = ko.computed(function () {
                        var activeNode = rowVM.tree.activeNode();
                        if (!activeNode) {
                            return [];
                        }
                        var characters = ko.unwrap(params.characters);

                        var ret = [];
                        characters.forEach(function (character) {
                            if (activeNode.characters.indexOf(character) === -1) {
                                ret.push(character);
                            }
                        });
                        return ret;
                    });

                    rowVM.setCharacter = function (character) {
                        var activeNode = rowVM.tree.activeNode();
                        if (activeNode && activeNode.characters.indexOf(character) === -1) {
                            activeNode.characters.push(character);
                        }
                    };

                    rowVM.removeCharacter = function (character) {
                        var activeNode = rowVM.tree.activeNode();
                        if (activeNode) {
                            activeNode.characters.remove(character);
                        }
                    };

                    rowVM.tags = params.tags;
                    rowVM.selectableTags = ko.computed(function () {
                        var activeNode = rowVM.tree.activeNode();
                        if (!activeNode) {
                            return [];
                        }

                        var tags = ko.unwrap(params.tags);

                        var ret = [];
                        tags.forEach(function (tag) {
                            if (activeNode.tags.indexOf(tag) === -1) {
                                ret.push(tag);
                            }
                        });
                        return ret;
                    });

                    rowVM.setTag = function (tag) {
                        var activeNode = rowVM.tree.activeNode();
                        if (activeNode && activeNode.tags.indexOf(tag) === -1) {
                            activeNode.tags.push(tag);
                        }
                    };

                    rowVM.removeTag = function (tag) {
                        var activeNode = rowVM.tree.activeNode();
                        if (activeNode) {
                            activeNode.tags.remove(tag);
                        }
                    };

                    rowVM.tree.activeNode.subscribe(function () {
                        rowVM.scrollTo(0);
                    });

                    return rowVM;
                }
            },
            template: [
                '<div class="wrap" data-bind="if: tree.activeNode">',
                '    <select-menu',
                '        params="onSelect: setCharacter, from: selectableCharacters, display: \'name\', label: \'add character\'">',
                '    </select-menu>',
                '    <div data-bind="foreach: {data: tree.activeNode().characters, as: \'node\'}">',
                '        <div class="bs-callout bs-callout-normal" >',
                '            <h4>',
                '                <span data-bind="text:node.name"></span>',
                '                <i data-bind="click: $component.removeCharacter" class="glyphicon glyphicon-remove"></i>',
                '            </h4>',
                '            <p data-bind="text:node.desc"></p>',
                '        </div>',
                '    </div>',
                '    <hr/>',
                '    <select-menu',
                '        params="onSelect: setTag, from: selectableTags, display: \'name\', label: \'add tag\'">',
                '    </select-menu>',
                '    <div data-bind="foreach: {data: tree.activeNode().tags, as: \'node\'}">',
                '        <div class="bs-callout bs-callout-normal" >',
                '            <h4>',
                '                <span data-bind="text:node.name"></span>',
                '                <i data-bind="click: $component.removeTag" class="glyphicon glyphicon-remove"></i>',
                '            </h4>',
                '            <p data-bind="text:node.desc"></p>',
                '        </div>',
                '    </div>',
                '</div>',
            ].join('')
        });

        function createNodeVM(params, componentInfo) {
            var originNode = params.node;
            var row = params.row;
            var vm = {
                node: originNode,
                parent: originNode.parent && originNode.parent.vm,
                idx: params.idx,
                nIndex: function () {
                    return this.node.parent.childNodes.indexOf(this.node);
                },
                row: row,
                element: $(componentInfo.element),
            };
            var oldVm = originNode.vm;
            originNode.vm = vm;

            row.nodes[vm.idx()] = vm;
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

            vm.tryTopAlignTo = function (alignTo, direction, force) {
                var top = this.top();
                var screenTop = this.screenTop();
                if (!force) {
                    if ((screenTop - alignTo) * direction > 0) {
                        this.row.scrollBy(alignTo - screenTop);
                    }
                } else {
                    if (screenTop !== alignTo) {
                        this.row.scrollBy(alignTo - screenTop);
                    }
                }
            };

            vm.tryBottomAlignTo = function (alignTo, direction, force) {
                var top = this.top();
                var screenBottom = this.screenBottom();
                if (!force) {
                    if ((screenBottom - alignTo) * direction > 0) {
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

                    containerScrollLetf(self.element.width() / 2 + self.row.scrollLeft() - (containerWidth() - self.element.width()) / 2);

                    self.allParents(function (parent) {
                        parent.verticalAlignTo(vCenter);
                    })

                    var child = self.firstChild();
                    var subTreeRoot = self;
                    while (child) {
                        child.verticalAlignToWithSiblings(vCenter);
                        subTreeRoot = child;
                        child = child.firstChild();
                    }
                    var sibling = subTreeRoot.prevSibling();
                    if (sibling) {
                        var siblingLastChild = sibling.lastChild();
                    }
                    if (siblingLastChild) {
                        siblingLastChild.tryBottomAlignTo(vCenter, 0, true);
                    } else {
                        sibling = subTreeRoot.nextSibling();
                        if (sibling && sibling.node.childNodes.length) {
                            sibling.firstChild().tryTopAlignTo(vCenter, 0, true);
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
            vm.screenLeft = function () {
                return this.row.scrollLeft() - containerLeft();
            };
            vm.children = function () {
                return this.node.childNodes.map(function (node) {
                    return node.vm;
                });
            }
            vm.lastChild = function () {
                return this.children().filter(Boolean).slice(-1)[0];
            };
            vm.firstChild = function () {
                return this.children().filter(Boolean)[0];
            };

            vm.scrollAlign = function (delta) {
                var screenTop = this.screenTop();
                var screenBottom = this.screenBottom();

                if (delta > 0) {
                    // go down
                    this.allParents(function (parent) {
                        parent.tryTopAlignTo(screenTop, -1);
                    });

                    var lastChild = this.lastChild();
                    if (lastChild) {
                        lastChild.tryBottomAlignTo(this.screenBottom(), -1);
                    }
                } else {
                    // go up
                    this.allParents(function (parent) {
                        parent.tryBottomAlignTo(screenBottom, 1);
                    });

                    if (this.children().length) {
                        this.firstChild().tryTopAlignTo(this.screenTop(), 1);
                    }
                }
            };
            vm.allParents = function (callback) {
                var parent = this.node.parent;
                while (parent && parent.vm && parent.vm.element) {
                    callback(parent.vm);
                    parent = parent.parent;
                }
            };

            vm.siblings = function () {
                return this.node.parent.childNodes.map(function (node) {
                    return node.vm;
                });
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
                var newNode = this.row.addNode(this.node.parent, this.idx() + 1, this.nIndex() + 1);
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
                    var searchLastChild = searchNode.lastChild();
                    if (searchLastChild) {
                        idx = searchLastChild.idx() + 1;
                        break;
                    }
                }
                var newNode = this.row.addChildNode(this.node, idx, this.children().length);
                setTimeout(function () {
                    newNode.vm.centery();
                    self.row.activeNode(newNode);
                });
            };

            vm.moveUp = function (vm, e) {

                if (this.prevSibling()) {
                    var siblingNodes = this.node.parent.childNodes;
                    var index = siblingNodes.indexOf(this.node);
                    siblingNodes.splice(index, 1);
                    siblingNodes.splice(index - 1, 0, this.node);

                    this.row.moveUpNode(this.node);

                    this.centery();
                }
            };
            vm.removeNode = function () {
                this.node.removed = true;
            };

            return vm;
        }

        ko.components.register('scroll-node', {
            viewModel: {
                createViewModel: createNodeVM
            },
            template: [
                '<div class="content">',
                '<editable-text params="value: node.content"></editable-text>',

                '<div class="btn-toolbar">',
                '    <div class="btn-group">',
                '        <span data-bind="text: node.childNodes.length"></span>',
                '    </div>',
                '    <div class="btn-group">',
                '        <button type="button" class="btn btn-default" data-bind="click:moveUp">move up</button>',
                '    </div>',
                '    <div class="btn-group">',
                '        <button type="button" class="btn btn-default" data-bind="click:removeNode">remove</button>',
                '    </div>',
                '</div>',

                '</div>',
                '<div class="add_sibling" data-bind="click: appendSibling"> + </div>',
                '<div class="add_child" data-bind="click: addChild"> + </div>',
            ].join('')
        });

        function findLastVisibleNode(node) {
            for (var i = node.childNodes.length - 1; i >= 0; i--) {
                var node = node.childNodes[i];
                if (node.childNodes.length) {
                    var lastVisibleNode = findLastVisibleNode(node);
                    if (lastVisibleNode) {
                        return lastVisibleNode;
                    }
                } else {
                    if (node.vm && !node.vm.disposed) {
                        return node;
                    }
                }
            }
        }

        ko.components.register('edit-node', {
            viewModel: {
                createViewModel: function (params, componentInfo) {
                    var nodeVM = createNodeVM(params, componentInfo);
                    nodeVM.appendSibling = function () {
                        var self = this;
                        if (this.row.idx() == 1) {
                            var newNode = this.row.addNode(this.node.parent, this.idx() + 1, this.nIndex() + 1);
                        } else if (this.row.idx() == 0) {
                            // so we need caculate idx here;
                            // try find the last child
                            var lastChild = findLastVisibleNode(this.node.parent).vm;
                            var newNode = this.row.addChildNode(this.node.parent, lastChild.idx() + 1, this.nIndex() + 1);
                        } else {
                            throw new Error('unexpected row idx');
                        }

                        // seems it redraw some nodes;
                        setTimeout(function () {
                            newNode.vm.centery();
                            self.row.activeNode(newNode);
                        });
                    };
                    nodeVM.addChild = function () {
                        var self = this;
                        if (this.row.idx() == 1) {
                            var newNode = this.row.addChildNode(this.node, this.idx(), this.children().length);
                        } else if (this.row.idx() == 0) {
                            // so we need caculate idx here;
                            // try find the last child
                            var lastChild = findLastVisibleNode(this.node).vm;
                            var newNode = this.row.addChildNode(this.node, lastChild.idx() + 1, this.children().length);
                        } else {
                            throw new Error('unexpected row idx');
                        }

                        setTimeout(function () {
                            newNode.vm.centery();
                            self.row.activeNode(newNode);
                        });
                    };
                    return nodeVM;
                }
            },
            template: [
                '<div class="content" data-bind="click: centery">',
                '<editable-text params="value: node.content"></editable-text>',
                '</div>',
                '<div class="add_sibling" data-bind="click: appendSibling"> + </div>',
                '<div class="add_child" data-bind="click: addChild"> + </div>',
            ].join('')
        });

        ko.components.register('tag-node', {
            viewModel: {
                createViewModel: createNodeVM
            },
            template: [
                '<div class="content">',
                '<editable-text params="value: node.content"></editable-text>',
                '</div>',
            ].join('')
        });

    });
