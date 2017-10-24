define(["require", "exports", "../lib/uuid", "knockout"], function (require, exports, uuid_1, ko) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.character = function () {
        var newNode = {
            id: uuid_1.uuid(),
            name: ko.observable('测试名字'),
            desc: ko.observable('测试描述'),
        };
        return newNode;
    };
    exports.character.load = function (character) {
        character.name = ko.observable(ko.unwrap(character.name));
        character.desc = ko.observable(ko.unwrap(character.desc));
    };
    exports.character.getJSON = function (character) {
        var ret = {
            id: character.id || uuid_1.uuid(),
            idx: character.idx || -1,
            name: ko.unwrap(character.name),
            desc: ko.unwrap(character.desc)
        };
        return ret;
    };
});
