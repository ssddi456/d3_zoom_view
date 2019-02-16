define(["require", "exports", "knockout"], function (require, exports, ko) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.editDialog = {
        isShow: ko.observable(false),
        __editContent: ko.observable(''),
        callback: undefined,
        show: function (content, done) {
            this.__editContent(content || '');
            this.callback = done;
            this.isShow(true);
        },
        hide: function () {
            this.isShow(false);
        },
        cancel: function () {
            this.callback && this.callback(null);
            this.hide();
        },
        confirm: function () {
            this.callback(ko.unwrap(this.__editContent));
            this.hide();
        }
    };
    ko.components.register('edit_dialog', {
        viewModel: {
            instance: exports.editDialog
        },
        template: /* template */ "\n<div class=\"modal-backdrop fade\" data-bind=\"css: { 'in': isShow},  style: { display: isShow() ? 'block': 'none' }\"></div>\n<div class=\"modal fade\" tabindex=\"-1\" role=\"dialog\" data-bind=\"css: { 'in': isShow },  style: { display: isShow() ? 'block': 'none' }\">\n  <div class=\"modal-dialog\" role=\"document\">\n    <div class=\"modal-content\">\n      <div class=\"modal-header\">\n        <button type=\"button\" class=\"close\"  aria-label=\"Close\"><span aria-hidden=\"true\">&times;</span></button>\n        <h4 class=\"modal-title\" >Edit content</h4>\n      </div>\n      <div class=\"modal-body\">\n        <textarea class=\"form-control\" data-bind=\"value: __editContent\"></textarea>\n      </div>\n      <div class=\"modal-footer\">\n        <button type=\"button\" class=\"btn btn-default\" data-bind=\"click: cancel\">Close</button>\n        <button type=\"button\" class=\"btn btn-primary\" data-bind=\"click: confirm\">Save changes</button>\n      </div>\n    </div>\n  </div>\n</div>\n"
    });
});
