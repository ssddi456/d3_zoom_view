var __assign = (this && this.__assign) || Object.assign || function(t) {
    for (var s, i = 1, n = arguments.length; i < n; i++) {
        s = arguments[i];
        for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
            t[p] = s[p];
    }
    return t;
};
define(["require", "exports", "knockout"], function (require, exports, ko) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    ko.components.register('highlight_token', {
        viewModel: {
            createViewModel: function (params, componentInfo) {
                var vm = __assign({}, params);
                return vm;
            },
        },
        template: "\n    <p data-bind=\"foreach: text\">\n        <span data-bind=\"text: $data.word, attr : { 'class': 'wordtype-' + $data.flag }\" >\n    <p>\n    "
    });
});
