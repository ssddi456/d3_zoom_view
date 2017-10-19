define([
    '../lib/uuid',
    'ko',
], function (
    uuid,
    ko
) {
        'use strict';
        var tag = function () {
            var newNode = {
                id: uuid(),
                name: ko.observable('测试名字'),
                desc: ko.observable('测试描述'),
            };
            return newNode;
        };
        tag.load = function (tag) {
            tag.name = ko.observable(ko.unwrap(tag.name));
            tag.desc = ko.observable(ko.unwrap(tag.desc));
        };
        tag.getJSON = function (tag) {
            var ret = {
                id: tag.id || uuid(),
                idx: tag.idx,
                name: ko.unwrap(tag.name),
                desc: ko.unwrap(tag.desc)
            };
            return ret;
        }
        return tag;
    });
