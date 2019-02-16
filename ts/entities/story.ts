import { uuid } from '../lib/uuid';
import * as ko from 'knockout';
import { Entity } from './index';
import { Character } from './character';
import { Tag } from './tag';

export interface Story {
    id: string;
    idx?: number;
    parentId?: string;
    content: KnockoutObservable<string>;
    childNodes: Story[];
    characters: KnockoutObservableArray<Character>;
    tags: KnockoutObservableArray<Tag>;
    isActive: KnockoutObservable<boolean>;
    hasFocus: KnockoutObservable<boolean>;
    removed: boolean;
    parent?: Story;

    visible?: boolean;
    decestantVisible?: boolean;
}

export interface StoryJSON {
    id: string;
    parentId: string;
    idx?: number;
    content: string;
    characters: string[];
    tags: string[];
    isActive: boolean;
    hasFocus: boolean;
    removed: boolean;
}

export const story = function (parentNode?: Story, childIdx?: number) {
    const newNode: Story = {
        id: uuid(),
        content: ko.observable('story content'),
        childNodes: [] as Story[],
        characters: ko.observableArray([]),
        tags: ko.observableArray([]),
        isActive: ko.observable(false),
        hasFocus: ko.observable(false),
        removed: false,
        parent: parentNode,
    };

    if (parentNode) {
        if (!parentNode.childNodes) {
            parentNode.childNodes = [];
        }
        if (childIdx !== undefined) {
            parentNode.childNodes.splice(childIdx, 0, newNode);
        } else {
            parentNode.childNodes.push(newNode);
        }
    }
    return newNode;
} as Entity<Story, StoryJSON>;

story.load = function (story: Story, parent: Story, characters: Character[], tags: Tag[]) {
    story.content = ko.observable(ko.unwrap(story.content));

    characters = ko.unwrap(characters);
    tags = ko.unwrap(tags);

    const storyCharacters = ko.unwrap(story.characters || []).map(function (character) {
        if (typeof character == 'string') {
            for (let i = 0; i < characters.length; i++) {
                if (characters[i].id == character) {
                    return characters[i];
                }
            }
            throw new Error('character ' + character + ' cannot be found.');
        } else {
            return character;
        }
    }).filter(Boolean);
    const storyTags = ko.unwrap(story.tags || []).map(function (tag) {
        if (typeof tag == 'string') {
            for (let i = 0; i < tags.length; i++) {
                if (tags[i].id == tag) {
                    return tags[i];
                }
            }
            throw new Error('tag ' + tag + ' cannot be found.');
        } else {
            return tag;
        }
    }).filter(Boolean);

    story.characters = ko.observableArray(storyCharacters);
    story.tags = ko.observableArray(storyTags);

    story.parent = parent;
    story.isActive = ko.observable(!!ko.unwrap(story.isActive));
    story.hasFocus = ko.observable(!!ko.unwrap(story.hasFocus));
};
story.getJSON = function (story: Story) {
    if (!story.id) {
        console.error('story miss id', JSON.stringify(story));
    }
    const ret = {
        id: story.id,
        idx: story.idx,
        parentId: story.parentId || '',
        removed: ko.unwrap(story.removed),
        content: ko.unwrap(story.content),
        isActive: !!ko.unwrap(story.isActive),
        hasFocus: !!ko.unwrap(story.hasFocus),
        characters: ko.unwrap(story.characters || []).map(function (character) {
            return character && character.id || character;
        }).filter(Boolean) as string[],
        tags: ko.unwrap(story.tags || []).map(function (tag) {
            return tag && tag.id || tag;
        }).filter(Boolean) as string[],
    };

    return ret;
}
