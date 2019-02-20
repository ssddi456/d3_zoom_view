var __assign = (this && this.__assign) || Object.assign || function(t) {
    for (var s, i = 1, n = arguments.length; i < n; i++) {
        s = arguments[i];
        for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
            t[p] = s[p];
    }
    return t;
};
define(["require", "exports", "knockout", "./characteristic_property_table"], function (require, exports, ko, characteristic_property_table_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    ko.components.register('highlight-token', {
        viewModel: {
            createViewModel: function (params, componentInfo) {
                var nameTable = {};
                var vm = __assign({}, params, { highlightedWord: ko.observable(), text: (params.text || []).map(function (node) {
                        var ret = __assign({}, node, { active: ko.observable(!!ko.unwrap(node.active)) });
                        if (['n', 'v', 'a'].indexOf(node.flag[0]) != -1) {
                            nameTable[node.word] = nameTable[node.word] || [];
                            nameTable[node.word].push(ret);
                        }
                        return ret;
                    }), createClassName: function (data) {
                        return "wordtype-" + data.flag + " " + (data.active() ? 'active' : '');
                    },
                    highlightWord: function (data) {
                        vm.highlightedWord(data);
                        var allRef = nameTable[data.word];
                        if (allRef) {
                            allRef.forEach(function (x) { return x.active(true); });
                        }
                    },
                    dehighlightWord: function (data) {
                        var allRef = nameTable[data.word];
                        if (allRef) {
                            allRef.forEach(function (x) { return x.active(false); });
                        }
                        vm.highlightedWord(undefined);
                    } });
                return vm;
            },
        },
        template: "\n    <p data-bind=\"foreach: text\"><span data-bind=\"text: word,\n    attr : { \n        'class': $parent.createClassName($data), \n    },\n    event: {\n        mouseenter: $parent.highlightWord,\n        mouseleave: $parent.dehighlightWord\n    }\n\" ></p>\n    <highlight-word params=\"word: highlightedWord\"></highlight-word>\n    "
    });
    ko.components.register('highlight-word', {
        viewModel: {
            createViewModel: function (params, componentInfo) {
                var word = params.word;
                return {
                    word: word,
                    flagInfo: function (flag) {
                        return flag + ' ' + (characteristic_property_table_1.mapped_table[flag] || 'unknown');
                    }
                };
            }
        },
        template: "\n    <!-- ko if: word -->\n    <div class=\"highlight-token\" data-bind=\"with: word\">\n        <p><b data-bind=\"text: word\"></b> : <b data-bind=\"text: $parent.flagInfo(flag)\"></b></p>\n    </div>\n    <!-- /ko -->\n    "
    });
});
