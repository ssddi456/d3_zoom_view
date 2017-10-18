require([
    './entities/story',
    './lib/download',
    'ko',
    './components/index'
], function (
    story,
    download,
    ko
) {
        function get_tree() {
            return {
                childNodes: [
                    { content: '起', childNodes: [] },
                    { content: '承', childNodes: [] },
                    { content: '转', childNodes: [] },
                    { content: '合', childNodes: [] },
                ]
            };
        }

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
        var configPrefix = 'myNovalConfig_';

        var vm = {
            viewType: ko.observable('editView'),
            tab: ko.observable('character'),

            trees: ko.observable(),
            tree: ko.observable(),
            addTree: function () {
                var new_tree = get_tree();
                this.trees().childNodes.push(new_tree);
                this.tree(new_tree);
            },
            exports: function () {
                var json = {};
                this.save();
                Object.keys(localStorage).forEach(function (key) {
                    if (key.indexOf(storyPrefix) === 0
                        || key.indexOf(characterPrefix) === 0
                        || key.indexOf(configPrefix) === 0
                    ) {
                        json[key] = localStorage.getItem(key);
                    }
                });
                download(json, 'your_story.json');
            },
            characters: ko.observable([]),

            save: function () {
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
                });

                var nodes = this.trees().childNodes.slice();
                nodes.forEach(function (node, idx) {
                    node.idx = idx;
                });
                while (nodes.length) {
                    var currentNode = nodes.shift();

                    if (!currentNode.id) {
                        currentNode.id = UUID();
                    }

                    localStorage.setItem(storyPrefix + currentNode.id,
                        JSON.stringify(story.getJSON(currentNode)));
                    if (currentNode.childNodes && currentNode.childNodes.length) {
                        currentNode.childNodes.forEach(function (node, idx) {
                            node.parentId = currentNode.id;
                            node.idx = idx;
                            nodes.push(node);
                        });
                    }
                }

                var config = {
                    viewType: this.viewType(),
                    tab: this.tab(),
                };
                localStorage.setItem(configPrefix, JSON.stringify(config));
            },
            load: function () {
                var map = {};
                var newTree = {
                    childNodes: []
                };
                var characters = [];
                var config;

                Object.keys(localStorage).forEach(function (key) {
                    if (key.indexOf(storyPrefix) === 0) {
                        var node = JSON.parse(localStorage.getItem(key));
                        if (!node.removed) {
                            node.childNodes = [];
                            map[node.id] = node;
                        } else {
                            // dead nodes
                            // console.log( node );
                        }
                    } else if (key.indexOf(characterPrefix) === 0) {
                        var node = JSON.parse(localStorage.getItem(key));
                        if (!node.removed) {
                            if (node.idx != undefined) {
                                characters[node.idx] = node;
                            } else {
                                characters.push(node);
                            }
                        }
                    } else if (key.indexOf(configPrefix) === 0) {
                        config = JSON.parse(localStorage.getItem(key));
                    }
                });

                if (config) {
                    this.tab(config.tab);
                    this.viewType(config.viewType);
                }

                Object.keys(map).forEach(function (key) {
                    var node = map[key];
                    var parentId = node.parentId;
                    if (parentId != undefined) {
                        parent = map[parentId];
                    } else {
                        parent = newTree;
                    }
                    if (node.idx != undefined) {
                        parent.childNodes[node.idx] = node;
                    } else {
                        parent.childNodes.push(node);
                    }
                });
                newTree.childNodes = newTree.childNodes.filter(Boolean);
                Object.keys(map).forEach(function (key) {
                    map[key].childNodes = map[key].childNodes.filter(Boolean);
                });

                this.trees(newTree);
                this.characters(characters);
                return newTree;
            }
        };

        var trees = vm.load();
        if (trees.childNodes.length) {
            vm.tree(trees.childNodes[0]);
        } else {
            vm.addTree();
        }

        window.onbeforeunload = function () {
            console.log('save');
            vm.save();
        }

        ko.applyBindings(vm);
    });
