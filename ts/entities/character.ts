import { uuid } from '../lib/uuid';
import * as ko from 'knockout';
import { Entity } from './index';

export interface Character {
    id: string;
    idx?: number;
    name: KnockoutObservable<string>;
    desc: KnockoutObservable<string>;
}
export interface CharacterJSON {
    id: string;
    idx: number;
    name: string;
    desc: string;
}

export const character = function () {
    const newNode = {
        id: uuid(),
        name: ko.observable('测试名字'),
        desc: ko.observable('测试描述'),
    };
    return newNode;
} as Entity<Character, CharacterJSON>;

character.load = function (character) {
    character.name = ko.observable(ko.unwrap(character.name));
    character.desc = ko.observable(ko.unwrap(character.desc));
};
character.getJSON = function (character) {
    const ret = {
        id: character.id || uuid(),
        idx: character.idx || -1,
        name: ko.unwrap(character.name),
        desc: ko.unwrap(character.desc)
    };
    return ret;
}
