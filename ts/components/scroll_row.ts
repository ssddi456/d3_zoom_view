import * as ko from 'knockout';
import { story, Story } from '../entities/story';
import { Tag } from '../entities/tag';
import { Character } from '../entities/character';


function containerHeight() {
    return document.documentElement.clientHeight;
}
function containerTop() {
    return document.body.scrollTop;
}
function containerLeft() {
    return document.body.scrollLeft;
}
function containerScrollLetf(scrollTo: number) {
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


interface Row {
    vm: RowVM;
    row: KnockoutObservableArray<StoryWithVM>
};

interface StoryTree {
    vm: LayoutTree;
    childNodes: StoryWithVM[];
}
interface LayoutTree {
    activeNode: KnockoutObservable<StoryWithVM>;
    node: StoryTree;
    rows: KnockoutObservable<Row[]>;
    addNode(parentNode: Story, rowIdx: number, colIdx: number, childIdx?: number): StoryWithVM;
}

interface RowVM {
    element: JQuery;
    tree: LayoutTree;
    wrap: JQuery;
    nodes: StoryVM[];
    nodeInfos: KnockoutObservableArray<StoryWithVM>;
    activeNode: KnockoutObservable<StoryWithVM>;
    idx(): number;
    scroll(node: Row, e: JQueryMouseEventObject): void;
    addNode(parentNode: StoryWithVM, idx: number, childIdx: number): StoryWithVM;
    addChildNode(parentNode: StoryWithVM, idx: number, childIdx: number): StoryWithVM;
    moveUpNode(node: StoryWithVM): void;
    scrollToInfo: number;
    scrollTo(n: number): void;
    scrollBy(n: number): void;
    scrollTop(): number;
    scrollLeft(): number;
}
interface StoryWithVM extends Story {
    vm: StoryVM;
    parent: StoryWithVM;
    childNodes: StoryWithVM[];
}

interface StoryVM {
    node: StoryWithVM;
    parent: StoryVM;
    idx(): number;
    nIndex(): number;
    row: RowVM;
    element: JQuery;
    top(): number;
    verticalAlignToWithSiblings(verticalCenter: number): void;
    verticalAlignTo(center: number): void;
    tryTopAlignTo(top: number, direction: number, force?: boolean): void;
    tryBottomAlignTo(bottom: number, direction: number, force?: boolean): void;
    centery(): void;
    screenTop(): number;
    screenBottom(): number;
    screenLeft(): number;
    children(): StoryVM[];
    lastChild(): StoryVM | undefined;
    firstChild(): StoryVM | undefined;
    scrollAlign(delta: number): void;
    allParents(hanlder: (parent: StoryVM) => void): void;
    siblings(): StoryVM[];
    prevSibling(): StoryVM | undefined;
    nextSibling(): StoryVM | undefined;
    appendSibling(): void;
    addChild(): void;
    moveUp(vm: StoryVM, e: JQueryEventObject): void;
    removeNode(): void;
}

ko.components.register('scroll-tree', {
    viewModel: {
        createViewModel: function (params, componentInfo) {
            const characters = params.characters;
            const tags = params.tags;


            // control scroll here
            const vm = {
                element: $(componentInfo && componentInfo.element),
                rows: ko.observableArray<Row>([]),
                activeRow: ko.observable<Row>(),
                activeNode: ko.observable<StoryWithVM>(),
                addNode: function (parentNode: StoryWithVM, rowIdx: number, colIdx: number, childIdx?: number) {
                    const newNode = story(parentNode, childIdx) as StoryWithVM;

                    let rowInfo = this.rows()[rowIdx];
                    if (!rowInfo) {
                        rowInfo = { row: ko.observableArray<StoryWithVM>([]) } as Row;
                        this.rows.push(rowInfo);
                    }

                    rowInfo.row.splice(colIdx, 0, newNode);

                    return newNode;
                },
                init: function (tree: StoryTree) {

                    tree.vm = {
                        node: tree,
                    } as LayoutTree;

                    let currentLevel = tree.childNodes;
                    let nextLevel = [] as StoryWithVM[];
                    let currentRow = ko.observableArray<StoryWithVM>();
                    let shouldFocusOn: StoryWithVM | undefined;

                    while (currentLevel && currentLevel.length) {
                        for (let i = 0; i < currentLevel.length; i++) {
                            const nodeInfo = currentLevel[i];
                            if (ko.unwrap(nodeInfo.hasFocus)) {
                                shouldFocusOn = nodeInfo;
                            }
                            story.load(nodeInfo, nodeInfo.parent || tree, characters, tags);

                            currentRow.push(nodeInfo);
                            if (nodeInfo.childNodes && nodeInfo.childNodes.length) {
                                for (let j = 0; j < nodeInfo.childNodes.length; j++) {
                                    const childNode = nodeInfo.childNodes[j];
                                    childNode.parent = nodeInfo;
                                    nextLevel.push(childNode);
                                }
                            }
                        }
                        this.rows.push({ row: currentRow } as Row);
                        currentRow = ko.observableArray<StoryWithVM>();
                        currentLevel = nextLevel;
                        nextLevel = [];
                    }
                    if (shouldFocusOn) {
                        const self = this;
                        setTimeout(function () {
                            if (shouldFocusOn) {
                                self.activeNode(shouldFocusOn);
                                shouldFocusOn.vm.centery();
                            }
                        }, 10);
                    }
                },
                scrollRow: function (vm: Row, e: JQueryMouseEventObject) {
                    vm.vm.scroll(vm, e);
                }
            };

            const tree = ko.unwrap(params.tree);
            if (params.tree && params.tree.subscribe) {
                params.tree.subscribe(function (newTree: StoryTree) {
                    if (newTree) {
                        vm.activeNode(null);
                        vm.activeRow(null);
                        vm.rows([]);
                        vm.init(newTree);
                    }
                });
            }

            vm.activeNode.equalityComparer = function (a, b) {
                return a === b;
            };
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

                    oldVal.vm.allParents(function (parent) {
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

                    newVal.vm.centery();
                    newVal.vm.allParents(function (parent) {
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
        '<!-- ko foreach: rows -->',
        '<scroll-row params="{ nodes: $data, tree: $component, idx: $index }"',
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
            const parentRow = { row: ko.observableArray<StoryWithVM>() } as Row;
            const mainRow = { row: ko.observableArray<StoryWithVM>() } as Row;
            const tagsRow = { row: ko.observableArray<StoryWithVM>() } as Row;

            const characters = params.characters;
            const tags = params.tags;
            const snippets = params.snippets;

            const vm = {
                parentRow: parentRow,
                mainRow: mainRow,
                tagsRow: tagsRow,

                characters: characters,
                tags: tags,
                snippets: snippets,

                activeNode: ko.observable<StoryWithVM | undefined>(),
                addNode(parentNode: Story, rowIdx: number, colIdx: number, childIdx?: number) {
                    /**
                     * rowIdx: 1 main row, addSiblings
                     * rowIdx: 2 new row, addNewChild
                     */
                    const newNode = story(parentNode, childIdx) as StoryWithVM;
                    if (rowIdx == 2) {
                        // 这说明是第一个子节点，应当把这个父节点移走，把子节点加入mainRow
                        this.mainRow.row.splice(colIdx, 1, newNode);
                    } else {
                        this.mainRow.row.splice(colIdx, 0, newNode);
                    }
                    return newNode;
                },
                init: function (tree: StoryTree) {
                    this.mainRow.row.splice(0, Infinity);

                    tree.vm = {
                        node: tree,
                    } as LayoutTree;

                    const currentLevel = tree.childNodes.slice();
                    let shouldFocusOn: StoryWithVM | undefined;
                    while (currentLevel && currentLevel.length) {
                        let nodeInfo = currentLevel.shift();
                        if (!nodeInfo) {
                            break;
                        }
                        story.load(nodeInfo, nodeInfo.parent || tree, characters, tags);

                        if (nodeInfo.childNodes && nodeInfo.childNodes.length) {
                            for (let j = 0; j < nodeInfo.childNodes.length; j++) {
                                const childNode = nodeInfo.childNodes[nodeInfo.childNodes.length - j - 1];
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
                            this.mainRow.row.push(nodeInfo);
                            if (nodeInfo.hasFocus()) {
                                shouldFocusOn = nodeInfo;
                            }
                        }
                    }
                    if (shouldFocusOn) {
                        const self = this;
                        setTimeout(function () {
                            if (shouldFocusOn) {
                                self.activeNode(shouldFocusOn);
                                shouldFocusOn.vm.centery();
                            }
                        });
                    }
                },
                scrollRow: function (vm: Row, _: any, e: JQueryMouseEventObject) {
                    vm.vm.scroll(vm, e);
                }
            };
            const tree = ko.unwrap(params.tree);
            if (params.tree && params.tree.subscribe) {
                params.tree.subscribe(function (newTree: StoryTree) {
                    if (newTree) {
                        vm.activeNode(undefined);

                        parentRow.row([]);
                        mainRow.row([]);
                        tagsRow.row([]);

                        vm.init(newTree);
                    }
                });
            }
            vm.activeNode.equalityComparer = function (a, b) {
                return a === b;
            };
            vm.activeNode.subscribe(function (oldVal) {
                if (oldVal) {
                    oldVal.isActive(false);
                    oldVal.hasFocus(false);

                    oldVal.childNodes.forEach(function (node) {
                        node.isActive(false);
                    });

                    oldVal.vm.allParents(function (parent) {
                        parent.node.isActive(false);
                    });
                }
            }, null, 'beforeChange');
            vm.activeNode.subscribe(function (newVal) {
                vm.tagsRow.row([]);
                vm.tagsRow.vm.scrollTo(0);
                if (newVal) {
                    newVal.vm.centery();
                    newVal.isActive(true);
                    newVal.hasFocus(true);

                    if (ko.isObservable(newVal.parent.isActive)) {
                        newVal.parent.isActive(true);

                        const parent = newVal.parent;

                        if (parent != vm.parentRow.row()[0]) {
                            vm.parentRow.row.splice(0, 1, newVal.parent);
                            // make a patch here to make scroll property;
                            setTimeout(function () {
                                const parentVM = newVal.parent.vm;
                                newVal.vm.parent = parentVM;
                                parentVM.tryTopAlignTo(newVal.vm.screenTop(), 1, true);
                            });
                        } else {
                            setTimeout(function () {
                                newVal.parent.vm.tryTopAlignTo(newVal.vm.screenTop(), 1, true);
                            })
                        }
                    } else {
                        vm.parentRow.row([]);
                    }

                } else {
                    vm.parentRow.row([]);
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
        '<tag-row params="{ ',
        '           nodes: tagsRow, ',
        '           tree: $component,',
        '           characters: characters,',
        '           snippets: snippets,',
        '           tags: tags',
        '         }"',
        '         style="margin-left:80%; padding-left:10px;"',
        '         data-bind="event: { wheel: scrollRow.bind(null, tagsRow) }"',
        '         class="scroll-row"',
        '></tag-row>',
    ].join('')
});

function createRowVM(
    params: {
        tree: LayoutTree,
        nodes: Row,
        idx(): number,
    }, componentInfo: { element: Node }) {
    const tree = params.tree;
    // control scroll here
    const $element = $(componentInfo.element);
    const $wrap = $element.find('.wrap');

    const vm = {
        tree: tree,
        scrollToInfo: 0,
        wrap: $wrap,
        element: $element,

        nodes: [],
        nodeInfos: params.nodes && params.nodes.row,

        activeNode: tree.activeNode,
        idx: params.idx,
        scroll: function (vm, e) {
            e.preventDefault();
            e.stopPropagation();
            const delta = -1 * (e.originalEvent as WheelEvent).deltaY;
            this.scrollBy(delta);
            const activeNode = this.activeNode();
            if (activeNode) {
                activeNode.vm.scrollAlign(delta);
            }
        },

        addNode: function (parentNode, idx, childIdx) {
            return tree.addNode(parentNode, this.idx(), idx, childIdx);
        },
        addChildNode: function (parentNode, idx, childIdx) {
            return tree.addNode(parentNode, this.idx() + 1, idx, childIdx);
        },
        moveUpNode: function (node) {
            const row = this.tree.rows()[this.idx()];
            if (row) {
                const nodeInfos = row.row;
                const nodes = nodeInfos.peek();
                const index = nodes.indexOf(node);

                nodeInfos.valueWillMutate && nodeInfos.valueWillMutate();
                nodes.splice(index, 1);
                nodes.splice(index - 1, 0, node);
                nodeInfos.valueHasMutated && nodeInfos.valueHasMutated();
            }
        },
        scrollTo: function (scrollTo) {
            this.scrollToInfo = scrollTo;
            this.wrap.css('margin-top', this.scrollToInfo);
        },
        scrollBy: function (scrollBy) {
            const top = this.scrollTop();
            this.scrollTo(scrollBy + top);
        },
        scrollTop: function () {
            return parseFloat(this.wrap.css('margin-top'));
        },
        scrollLeft: function () {
            return parseFloat(this.element.css('margin-left'));
        },
    } as RowVM;


    if (params.nodes) {
        if (params.nodes.vm) {
            const oldVM = params.nodes.vm;
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

interface StoryAttrEditer {
    characters: KnockoutObservableArray<Character>;
    selectableCharacters: KnockoutComputed<Character[]>;
    setCharacter(character: Character): void;
    removeCharacter(character: Character): void;
    tags: KnockoutObservableArray<Tag>;
    selectableTags: KnockoutComputed<Tag[]>;
    setTag(tag: Tag): void;
    removeTag(tag: Tag): void;

    snippets: KnockoutObservableArray<Story>;
    filterWord: KnockoutObservable<string>;
    clearFilter(): void;
    filtedSnippets: KnockoutComputed<Story[]>;
    useSnippet(snippet: Story): void;
}

ko.components.register('tag-row', {
    viewModel: {
        createViewModel: function (params, componentInfo) {
            if (!componentInfo) {
                return;
            }
            const rowVM = createRowVM(params, componentInfo) as RowVM & StoryAttrEditer;

            rowVM.snippets = params.snippets;
            rowVM.characters = params.characters;

            rowVM.selectableCharacters = ko.computed(function () {
                const activeNode = rowVM.tree.activeNode();
                if (!activeNode) {
                    return [];
                }
                const characters = ko.unwrap(params.characters);

                const ret = [] as Character[];
                characters.forEach(function (character: Character) {
                    if (activeNode.characters.indexOf(character) === -1) {
                        ret.push(character);
                    }
                });
                return ret;
            });

            rowVM.setCharacter = function (character) {
                const activeNode = rowVM.tree.activeNode();
                if (activeNode && activeNode.characters.indexOf(character) === -1) {
                    activeNode.characters.push(character);
                }
            };

            rowVM.removeCharacter = function (character) {
                const activeNode = rowVM.tree.activeNode();
                if (activeNode) {
                    activeNode.characters.remove(character);
                }
            };

            rowVM.tags = params.tags;
            rowVM.selectableTags = ko.computed(function () {
                const activeNode = rowVM.tree.activeNode();
                if (!activeNode) {
                    return [];
                }

                const tags = ko.unwrap<Tag[]>(params.tags);

                const ret = [] as Tag[];
                tags.forEach(function (tag) {
                    if (activeNode.tags.indexOf(tag) === -1) {
                        ret.push(tag);
                    }
                });
                return ret;
            });

            rowVM.setTag = function (tag) {
                const activeNode = rowVM.tree.activeNode();
                if (activeNode && activeNode.tags.indexOf(tag) === -1) {
                    activeNode.tags.push(tag);
                }
            };

            rowVM.removeTag = function (tag) {
                const activeNode = rowVM.tree.activeNode();
                if (activeNode) {
                    activeNode.tags.remove(tag);
                }
            };

            rowVM.tree.activeNode.subscribe(function () {
                rowVM.scrollTo(0);
            });

            rowVM.filterWord = ko.observable('');
            rowVM.clearFilter = function () {
                this.filterWord('');
            };

            rowVM.filtedSnippets = ko.pureComputed<Story[]>(function () {
                // should be some better search
                const ret: Story[] = [];
                const filterBy = ko.unwrap(rowVM.filterWord);
                if (!filterBy) {
                    return ret;
                }
                const localSnippets = ko.unwrap(rowVM.snippets);
                localSnippets.forEach(function (story) {
                    const content = ko.unwrap(story.content);
                    if (content.indexOf(filterBy) !== -1) {
                        ret.push(story);
                    }
                });
                return ret;
            });

            rowVM.useSnippet = function (snippet) {
                const node = rowVM.tree.activeNode();
                const content: string = ko.unwrap(node.content);
                node.content(content + '\n' + ko.unwrap(snippet.content));
            };

            return rowVM;
        }
    },
    template: [
        '<div class="wrap" data-bind="if: tree.activeNode">',
        '    <span>characters</span>',
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
        '    <span>tags</span>',
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
        '    <hr/>',
        '    <div class="input-group">',
        '        <input type="text" class="form-control" data-bind="value:filterWord">',
        '        <div class="input-group-addon"><i class="glyphicon glyphicon-remove" data-bind="click: clearFilter"></i></div>',
        '        <div class="input-group-addon"><i class="glyphicon glyphicon-search"></i></div>',
        '    </div>',
        '    <div data-bind="foreach: {data: filtedSnippets, as: \'snippet\'}">',
        '        <div class="bs-callout bs-callout-normal" >',
        '           <p data-bind="text:snippet.content"></p>',
        '           <div class="btn-toolbar">',
        '               <div class="btn-group">',
        '                   <button type="button" class="btn btn-default"',
        '                          data-bind="click:$component.useSnippet"',
        '                   >use</button>',
        '               </div>',
        '           </div>',
        '        </div>',
        '    </div>',
        '</div>',
    ].join('')
});

function createNodeVM(
    params: {
        node: StoryWithVM,
        row: RowVM,
        idx(): number,
    },
    componentInfo: { element: Node }
) {
    const originNode = params.node;
    const row = params.row;
    const vm = {
        node: originNode,
        parent: originNode.parent && originNode.parent.vm,
        idx: params.idx,
        nIndex: function () {
            return this.node.parent.childNodes.indexOf(this.node);
        },
        row: row,
        element: $(componentInfo.element),
    } as StoryVM;
    originNode.vm = vm;

    row.nodes[vm.idx()] = vm;
    vm.top = function () {
        const siblings = this.row.nodes;
        const prevSiblings = siblings.slice(0, this.idx());
        let ret = 0;
        for (let i = 0; i < prevSiblings.length; i++) {
            const node = prevSiblings[i];
            ret += node.element.height() || 0;
        }
        return ret;
    }
    vm.verticalAlignToWithSiblings = function (verticalCenter) {
        const top = this.top();

        let siblingsHeight = 0;
        const siblings = this.siblings();
        for (let i = 0; i < siblings.length; i++) {
            const sibling = siblings[i];
            siblingsHeight += sibling.element.height() || 0;
        }

        if (siblingsHeight < containerHeight()) {
            const scrollTo = verticalCenter - top - siblingsHeight / 2;
            this.row.scrollTo(scrollTo);
        } else {
            this.row.scrollTo(0 - top);
        }

    };

    vm.verticalAlignTo = function (verticalCenter) {
        const top = this.top();
        const height = this.element.height() || 0;
        if (height < containerHeight()) {
            const scrollTo = verticalCenter - top - height / 2;
            this.row.scrollTo(scrollTo);
        } else {
            this.row.scrollTo(0 - top);
        }
    };

    vm.tryTopAlignTo = function (alignTo, direction, force) {
        const screenTop = this.screenTop();
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
        const screenBottom = this.screenBottom();
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
        const self = this;
        setTimeout(function () {
            const vCenter = containerHeight() / 2;
            self.verticalAlignTo(vCenter);
            const width = self.element.width() || 0
            containerScrollLetf(width / 2 + self.row.scrollLeft() - (containerWidth() - width) / 2);

            self.allParents(function (parent) {
                parent.verticalAlignTo(vCenter);
            })

            let child = self.firstChild();
            let subTreeRoot = self;
            while (child) {
                child.verticalAlignToWithSiblings(vCenter);
                subTreeRoot = child;
                child = child.firstChild();
            }
            let sibling = subTreeRoot.prevSibling();
            let siblingLastChild: StoryVM | undefined;
            if (sibling) {
                siblingLastChild = sibling.lastChild();
            }
            if (siblingLastChild) {
                siblingLastChild.tryBottomAlignTo(vCenter, 0, true);
            } else {
                sibling = subTreeRoot.nextSibling();
                if (sibling) {
                    const first = sibling.firstChild()
                    first && first.tryTopAlignTo(vCenter, 0, true);
                }
            }
        })
    };
    vm.screenTop = function () {
        const top = this.top();
        const scrollTop = this.row.scrollTop();
        return top + scrollTop - containerTop();
    };
    vm.screenBottom = function () {
        const height = this.element.height() || 0;
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
        const screenTop = this.screenTop();
        const screenBottom = this.screenBottom();

        if (delta > 0) {
            // go down
            this.allParents(function (parent) {
                parent.tryTopAlignTo(screenTop, -1);
            });

            const lastChild = this.lastChild();
            if (lastChild) {
                lastChild.tryBottomAlignTo(this.screenBottom(), -1);
            }
        } else {
            // go up
            this.allParents(function (parent) {
                parent.tryBottomAlignTo(screenBottom, 1);
            });

            const first = this.firstChild();
            if (first) {
                first.tryTopAlignTo(this.screenTop(), 1);
            }
        }
    };
    vm.allParents = function (callback) {
        let parent = this.node.parent;
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
        const siblings = this.siblings();
        const startIndex = siblings.indexOf(this);
        return siblings[startIndex - 1];
    };
    vm.nextSibling = function () {
        const siblings = this.siblings();
        const startIndex = siblings.indexOf(this);
        return siblings[startIndex + 1];
    };

    vm.appendSibling = function () {
        const self = this;
        const newNode = this.row.addNode(this.node.parent, this.idx() + 1, this.nIndex() + 1);
        // seems it redraw some nodes;
        setTimeout(function () {
            self.row.activeNode(newNode);
        });
    };
    vm.addChild = function () {
        const self = this;
        let searchIdx = this.idx();
        let idx = 0;
        for (; searchIdx >= 0; searchIdx--) {
            const searchNode = this.row.nodes[searchIdx];
            const searchLastChild = searchNode.lastChild();
            if (searchLastChild) {
                idx = searchLastChild.idx() + 1;
                break;
            }
        }
        const newNode = this.row.addChildNode(this.node, idx, this.children().length);
        setTimeout(function () {
            self.row.activeNode(newNode);
        });
    };

    vm.moveUp = function (vm, e) {

        if (this.prevSibling()) {
            const siblingNodes = this.node.parent.childNodes;
            const index = siblingNodes.indexOf(this.node);
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

function findLastVisibleNode(node: StoryWithVM): StoryWithVM {
    for (let i = node.childNodes.length - 1; i >= 0; i--) {
        node = node.childNodes[i];
        if (node.childNodes.length) {
            const lastVisibleNode = findLastVisibleNode(node);
            if (lastVisibleNode) {
                return lastVisibleNode;
            }
        } else {
            if (node.vm) {
                return node;
            }
        }
    }
    throw new Error('unreachable branch');
}

ko.components.register('edit-node', {
    viewModel: {
        createViewModel: function (params, componentInfo) {
            if (!componentInfo) {
                return;
            }
            const nodeVM = createNodeVM(params, componentInfo);
            nodeVM.appendSibling = function () {
                const self = this;
                let newNode: StoryWithVM;

                if (this.row.idx() == 1) {
                    newNode = this.row.addNode(this.node.parent, this.idx() + 1, this.nIndex() + 1);
                } else if (this.row.idx() == 0) {
                    // so we need caculate idx here;
                    // try find the last child
                    const lastChild = findLastVisibleNode(this.node.parent).vm;
                    newNode = this.row.addChildNode(this.node.parent, lastChild.idx() + 1, this.nIndex() + 1);
                } else {
                    throw new Error('unexpected row idx');
                }

                // seems it redraw some nodes;
                setTimeout(function () {
                    self.row.activeNode(newNode);
                });
            };
            nodeVM.addChild = function (this: StoryVM) {
                const self = this;
                let newNode: StoryWithVM;
                if (this.row.idx() == 1) {
                    newNode = this.row.addChildNode(this.node, this.idx(), this.children().length);
                } else if (this.row.idx() == 0) {
                    // so we need caculate idx here;
                    // try find the last child
                    const lastChild = findLastVisibleNode(this.node).vm;
                    newNode = this.row.addChildNode(this.node, lastChild.idx() + 1, this.children().length);
                } else {
                    throw new Error('unexpected row idx');
                }

                setTimeout(function () {
                    self.row.activeNode(newNode);
                });
            };
            return nodeVM;
        }
    },
    template: [
        '<div class="content">',
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

