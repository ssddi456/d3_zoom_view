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
        var storyPrefix = 'myNoval_';
        var characterPrefix = 'myNovalCharacter_';

        var vm = {
            viewType: ko.observable('editView'),
            tab: ko.observable('character'),

            tree: ko.observable(),
            characters: ko.observable([]),

            save: function () {
                var nodes = this.tree().childNodes.slice();
                nodes.forEach(function (node, idx) {
                    node.idx = idx;
                });
                while (nodes.length) {
                    var currentNode = nodes.shift();
                    var content = ko.unwrap(currentNode.content);

                    if (!currentNode.id) {
                        currentNode.id = UUID();
                    }

                    localStorage.setItem(storyPrefix + currentNode.id,
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
                // so i should implements the characters save/load
                var characters = this.characters();
                characters.forEach(function (character, idx) {
                    if (!character.id) {
                        character.id = UUID();
                    }
                    localStorage.setItem(characterPrefix + character.id,
                        JSON.stringify({
                            id: character.id,
                            idx: idx,
                            name: ko.unwrap(character.name),
                            desc: ko.unwrap(character.desc)
                        }));
                })
            },
            load: function () {
                var map = {};
                var newTree = {
                    childNodes: []
                };
                var characters = [];
                Object.keys(localStorage).forEach(function (key) {
                    if (key.indexOf(storyPrefix) === 0) {
                        var node = JSON.parse(localStorage.getItem(key));
                        node.childNodes = [];
                        map[node.id] = node;
                    } else if (key.indexOf(characterPrefix) === 0) {
                        var node = JSON.parse(localStorage.getItem(key));
                        if(node.idx){
                            characters[node.idx] = node;
                        } else {
                            characters.push(node);
                        }
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
                this.characters(characters);
                return newTree;
            }
        };

        if (!vm.load().childNodes.length) {
            vm.tree(tree);
        }

        window.onbeforeunload = function () {
            console.log('save');
            vm.save();
        }

        ko.applyBindings(vm);
    });
