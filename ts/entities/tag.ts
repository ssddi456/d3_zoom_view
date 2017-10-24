import { uuid } from '../lib/uuid';
import * as ko from 'knockout';
import { Entity } from './index';

export interface Tag {
    id: string;
    name: KnockoutObservable<string>;
    desc: KnockoutObservable<string>;
}
export interface TagJSON {
    id: string;
    name: string;
    desc: string;
}


export const tag = function () {
    const newNode = {
        id: uuid(),
        name: ko.observable('测试名字'),
        desc: ko.observable('测试描述'),
    };
    return newNode;
} as Entity<Tag, TagJSON>;
tag.load = function (tag) {
    tag.name = ko.observable(ko.unwrap(tag.name));
    tag.desc = ko.observable(ko.unwrap(tag.desc));
};
tag.getJSON = function (tag) {
    const ret = {
        id: tag.id || uuid(),
        name: ko.unwrap(tag.name),
        desc: ko.unwrap(tag.desc)
    };
    return ret;
}
