require([
    'ko',
    './components/index'
], function (
    ko
) {

        var tree = {
            childNodes: [
                {
                    content: '起',
                },
                {
                    content: '承',
                },
                {
                    content: '转',
                },
                {
                    content: '合',
                },
            ]
        };
        var keyMap = '1237654890qwertypoiuasdflkjhgzxcmnbv';
        function UUID() {
            var ret = '';
            for (var i = 0; i < 16; i++) {
                ret += keyMap[Math.floor(Math.random() * keyMap.length)];
            }
            return ret;
        }
        var prefix = 'myNoval_';
        var vm = {
            tree: ko.observable(),
            save: function () {
                var nodes = this.tree().childNodes.slice();
                nodes.forEach(function (node, idx) {
                    node.idx = idx;
                });
                while (nodes.length) {
                    var currentNode = nodes.shift();
                    var content = currentNode.content();
                   
                    if (!currentNode.id) {
                        currentNode.id = UUID();
                    }

                    localStorage.setItem(prefix + currentNode.id,
                        JSON.stringify({
                            content: content,
                            id: currentNode.id,
                            parentId: currentNode.parentId,
                            idx: currentNode.idx,
                        }));
                    if (currentNode.childNodes && currentNode.childNodes.length) {
                        currentNode.childNodes.forEach(function (node, idx) {
                            node.parentId = currentNode.id;
                            node.idx = idx;
                            nodes.push(node);
                        });
                    }
                }
            },
            load: function () {
                var map = {};
                var newTree = {
                    childNodes: []
                };
                Object.keys(localStorage).forEach(function (key) {
                    if (key.indexOf(prefix) === 0) {
                        var node = JSON.parse(localStorage.getItem(key));
                        node.childNodes = [];
                        map[node.id] = node;
                    }
                });

                Object.keys(map).forEach(function (key) {
                    var node = map[key];
                    var parentId = node.parentId;
                    if (parentId) {
                        map[parentId].childNodes[node.idx] = node;
                    } else {
                        newTree.childNodes[node.idx] = node;
                    }
                });

                this.tree(newTree);
                return newTree;
            }
        };

        if(!vm.load().childNodes.length){
            vm.tree(tree);
        }

        ko.applyBindings(vm);
    });
