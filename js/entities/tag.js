define(["require", "exports", "../lib/uuid", "knockout"], function (require, exports, uuid_1, ko) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.tag = function () {
        var newNode = {
            id: uuid_1.uuid(),
            name: ko.observable('测试名字'),
            desc: ko.observable('测试描述'),
        };
        return newNode;
    };
    exports.tag.load = function (tag) {
        tag.name = ko.observable(ko.unwrap(tag.name));
        tag.desc = ko.observable(ko.unwrap(tag.desc));
    };
    exports.tag.getJSON = function (tag) {
        var ret = {
            id: tag.id || uuid_1.uuid(),
            name: ko.unwrap(tag.name),
            desc: ko.unwrap(tag.desc)
        };
        return ret;
    };
});
