define([
    '../lib/uuid',
    'ko',
], function (
    uuid,
    ko
) {
        'use strict';
        var character = function () {
            var newNode = {
                id: uuid(),
                name: ko.observable('测试名字'),
                desc: ko.observable('测试描述'),
            };
            return newNode;
        };
        character.load = function (character) {
            character.name = ko.observable(ko.unwrap(character.name));
            character.desc = ko.observable(ko.unwrap(character.desc));
        };
        character.getJSON = function (character) {
            var ret = {
                id: character.id || uuid(),
                idx: character.idx,
                name: ko.unwrap(character.name),
                desc: ko.unwrap(character.desc)
            };
            return ret;
        }
        return character;
    });
