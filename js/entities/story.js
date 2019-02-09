define(["require", "exports", "../lib/uuid", "knockout"], function (require, exports, uuid_1, ko) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.story = function (parentNode, childIdx) {
        var newNode = {
            id: uuid_1.uuid(),
            content: ko.observable('story content'),
            childNodes: [],
            characters: ko.observableArray([]),
            tags: ko.observableArray([]),
            isActive: ko.observable(false),
            hasFocus: ko.observable(false),
            removed: false,
            parent: parentNode,
        };
        if (parentNode && childIdx !== undefined) {
            if (!parentNode.childNodes) {
                parentNode.childNodes = [];
            }
            parentNode.childNodes.splice(childIdx, 0, newNode);
        }
        return newNode;
    };
    exports.story.load = function (story, parent, characters, tags) {
        story.content = ko.observable(ko.unwrap(story.content));
        characters = ko.unwrap(characters);
        tags = ko.unwrap(tags);
        var storyCharacters = ko.unwrap(story.characters || []).map(function (character) {
            if (typeof character == 'string') {
                for (var i = 0; i < characters.length; i++) {
                    if (characters[i].id == character) {
                        return characters[i];
                    }
                }
                throw new Error('character ' + character + ' cannot be found.');
            }
            else {
                return character;
            }
        }).filter(Boolean);
        var storyTags = ko.unwrap(story.tags || []).map(function (tag) {
            if (typeof tag == 'string') {
                for (var i = 0; i < tags.length; i++) {
                    if (tags[i].id == tag) {
                        return tags[i];
                    }
                }
                throw new Error('tag ' + tag + ' cannot be found.');
            }
            else {
                return tag;
            }
        }).filter(Boolean);
        story.characters = ko.observableArray(storyCharacters);
        story.tags = ko.observableArray(storyTags);
        story.parent = parent;
        story.isActive = ko.observable(!!ko.unwrap(story.isActive));
        story.hasFocus = ko.observable(!!ko.unwrap(story.hasFocus));
    };
    exports.story.getJSON = function (story) {
        if (!story.id) {
            console.error('story miss id', JSON.stringify(story));
        }
        var ret = {
            id: story.id,
            idx: story.idx,
            parentId: story.parentId || '',
            removed: ko.unwrap(story.removed),
            content: ko.unwrap(story.content),
            isActive: !!ko.unwrap(story.isActive),
            hasFocus: !!ko.unwrap(story.hasFocus),
            characters: ko.unwrap(story.characters || []).map(function (character) {
                return character && character.id || character;
            }).filter(Boolean),
            tags: ko.unwrap(story.tags || []).map(function (tag) {
                return tag && tag.id || tag;
            }).filter(Boolean),
        };
        return ret;
    };
});
