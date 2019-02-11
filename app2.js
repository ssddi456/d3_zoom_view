require([
    './js/entities/story',
    './js/entities/character',
    './js/entities/tag',
    './js/lib/download',
    'knockout',
    './js/components/index'
], function (
    storyEntity,
    characterEntity,
    tagEntity,
    downloadModule,
    ko
) {
        var story = storyEntity.story;
        var character = characterEntity.character;
        var tag = tagEntity.tag;
        var download = downloadModule.download;

        function get_tree() {
            return {
                content: '新的故事',
                childNodes: [
                    { content: '起', childNodes: [] },
                    { content: '承', childNodes: [] },
                    { content: '转', childNodes: [] },
                    { content: '合', childNodes: [] },
                ]
            };
        }

        var storyPrefix = 'myNoval_';
        var characterPrefix = 'myNovalCharacter_';
        var tagPrefix = 'myNovalTag_';
        var configPrefix = 'myNovalConfig_';

        var vm = {
            tab: ko.observable('character'), // story, tag
            viewType: ko.observable('editView'),


            trees: ko.observable(),
            tree: ko.observable(),

            addTree: function () {
                var new_tree = get_tree();
                this.trees.valueWillMutate();
                this.trees.peek().childNodes.push(new_tree);
                this.trees.valueHasMutated();
                this.tree(new_tree);
            },

            changeTree: function (tree) {
                if (tree) {
                    this.tree(tree);
                }
            },


            characters: ko.observable([]),
            tags: ko.observable([]),
            snippets: ko.observable([]),

            exports: function () {
                var json = {};
                this.save();
                Object.keys(localStorage).forEach(function (key) {
                    if (key.indexOf(storyPrefix) === 0
                        || key.indexOf(characterPrefix) === 0
                        || key.indexOf(tagPrefix) === 0
                        || key.indexOf(configPrefix) === 0
                    ) {
                        json[key] = localStorage.getItem(key);
                    }
                });
                download(json, 'your_story.json');
            },

            save: function () {
                // so i should implements the characters save/load
                var characters = this.characters();
                characters.forEach(function (_character, idx) {
                    _character.idx = idx;
                    localStorage.setItem(characterPrefix + _character.id,
                        JSON.stringify(character.getJSON(_character)));
                });

                var tags = this.tags();
                tags.forEach(function (_tag, idx) {
                    _tag.idx = idx;
                    localStorage.setItem(tagPrefix + _tag.id,
                        JSON.stringify(character.getJSON(_tag)));
                });

                var snippets = this.snippets();
                snippets.forEach(function (snippet, idx) {
                    snippet.idx = idx;
                    snippet.parentId = 'snippets';
                    localStorage.setItem(storyPrefix + snippet.id,
                        JSON.stringify(story.getJSON(snippet)));
                });

                var nodes = this.trees().childNodes.slice();
                nodes.forEach(function (node, idx) {
                    node.idx = idx;
                });

                while (nodes.length) {
                    var currentNode = nodes.shift();

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
                var storyAndSnippetsMap = {};

                var newTree = {
                    childNodes: []
                };

                var characters = [];

                var tags = [];

                var snippets = [];

                var config;

                Object.keys(localStorage).forEach(function (key) {
                    if (key.indexOf(storyPrefix) === 0) {
                        var node = JSON.parse(localStorage.getItem(key));
                        if (!node.removed) {
                            node.childNodes = [];
                            storyAndSnippetsMap[node.id] = node;
                        } else {
                            // dead nodes
                            // console.log( node );
                        }
                    } else if (key.indexOf(characterPrefix) === 0) {
                        var node = JSON.parse(localStorage.getItem(key));
                        character.load(node);
                        if (!node.removed) {
                            if (node.idx != undefined && node.idx >= 0 && !characters[node.idx]) {
                                characters[node.idx] = node;
                            } else {
                                characters.push(node);
                            }
                        }
                    } else if (key.indexOf(tagPrefix) === 0) {
                        var node = JSON.parse(localStorage.getItem(key));
                        tag.load(node);
                        if (!node.removed) {
                            if (node.idx != undefined && node.idx >= 0 && !characters[node.idx]) {
                                tags[node.idx] = node;
                            } else {
                                tags.push(node);
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
                const mapKeys = Object.keys(storyAndSnippetsMap);
                mapKeys.forEach(function (key) {
                    var node = storyAndSnippetsMap[key];
                    var parentId = node.parentId;
                    var parentArray;

                    if (parentId != undefined && parentId != '') {
                        if (parentId == 'snippets') {
                            parentArray = snippets;
                        } else {
                            parentArray = storyAndSnippetsMap[parentId].childNodes;
                        }
                    } else {
                        parentArray = newTree.childNodes;
                    }
                    if (node.idx != undefined) {
                        parentArray[node.idx] = node;
                    } else {
                        parentArray.push(node);
                    }
                });
                newTree.childNodes = newTree.childNodes.filter(Boolean);
                characters = characters.filter(Boolean);
                tags = tags.filter(Boolean);

                console.log(mapKeys);
                
                mapKeys.forEach(function (key) {
                    var node = storyAndSnippetsMap[key];
                    node.childNodes = node.childNodes.filter(Boolean);
                    var parent = storyAndSnippetsMap[node.parentId];
                    story.load(node, parent, characters, tags);
                });

                snippets = snippets.filter(Boolean);


                this.trees(newTree);
                this.characters(characters);
                this.tags(tags);
                this.snippets(snippets);

                return newTree;
            }
        };

        vm.tree.subscribe(function (tree) {
            if (tree) {
                tree.content = ko.observable(ko.unwrap(tree.content));
            }
        });

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
