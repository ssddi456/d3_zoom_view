define([
    'ko',
], function (
    ko
) {
        'use strict';
        var story = function (parentNode, childIdx) {
            var newNode = {
                content: ko.observable('test'),
                childNodes: [],
                characters: ko.observableArray(),
                isActive: ko.observable(false),
                hasFocus: ko.observable(false),
            };

            if (parentNode) {
                newNode.parent = parentNode;
                if (!parentNode.childNodes) {
                    parentNode.childNodes = [];
                }
                parentNode.childNodes.splice(childIdx, 0, newNode);
            }
            return newNode;
        };
        story.load = function (story, parent, characters) {
            story.content = ko.observable(ko.unwrap(story.content));

            characters = ko.unwrap(characters);
            var storyCharacters = ko.unwrap(story.characters || []).map(function (character) {
                if (typeof character == 'string') {
                    for (var i = 0; i < characters.length; i++) {
                        if (characters[i].id == character) {
                            return characters[i];
                        }
                    }
                    throw new Error('character ' + character + ' cannot be found.');
                } else {
                    return character;
                }
            }).filter(Boolean);

            story.characters = ko.observableArray(storyCharacters);
            story.parent = parent;
            story.isActive = ko.observable(!!ko.unwrap(story.isActive));
            story.hasFocus = ko.observable(!!ko.unwrap(story.hasFocus));
        };
        story.getJSON = function (story) {
            console.log( story, ko.unwrap(story.characters) );
            
            var ret = {
                id: story.id,
                idx: story.idx,
                parentId: story.parentId,
                removed: story.removed,
                content: ko.unwrap(story.content),
                isActive: !!ko.unwrap(story.isActive),
                hasFocus: !!ko.unwrap(story.hasFocus),
                characters: ko.unwrap(story.characters).map(function (character) {
                    console.log();
                    
                    return character.id;
                }),
            };
            return ret;
        }
        return story;
    });
