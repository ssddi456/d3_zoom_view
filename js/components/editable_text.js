define(["require", "exports", "knockout"], function (require, exports, ko) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    ko.components.register('editable-text', {
        viewModel: {
            createViewModel: function (params, componentInfo) {
                var $element = $(componentInfo && componentInfo.element);
                var vm = {
                    value: params.value,
                    type: params.type || 'textarea',
                    editing: ko.observable(false),
                    edit: function () {
                        this.editing(true);
                    },
                    endEdit: function () {
                        this.editing(false);
                    }
                };
                vm.editing.subscribe(function (newVal) {
                    if (newVal) {
                        setTimeout(function () {
                            var $textarea = $element.find('textarea, input');
                            $textarea.focus();
                            function setHeight() {
                                $textarea.height($textarea.get(0).scrollHeight - parseFloat($textarea.css('padding-top')) - parseFloat($textarea.css('padding-bottom')));
                            }
                            if (vm.type == 'textarea') {
                                setHeight();
                                $textarea.on('input', setHeight);
                            }
                        });
                    }
                });
                return vm;
            },
        },
        template: "\n        <!-- ko if: editing -->\n        <!-- ko if: type == 'textarea' -->\n        <textarea data-bind=\"value: value, event:{blur: endEdit}\"></textarea>\n        <!-- /ko -->\n        <!-- ko if: type == 'input' -->\n        <input type=\"text\" class=\"form-control\" data-bind=\"value: value, event:{blur: endEdit}\"></input>\n        <!-- /ko -->\n        <!-- /ko -->\n        <!-- ko ifnot: editing -->\n        <!-- ko if: type == 'textarea' -->\n        <p data-bind=\"text: value, event:{dblclick: edit}\"></p>\n        <!-- /ko -->\n        <!-- ko if: type == 'input' -->\n        <span data-bind=\"text: value, event:{dblclick: edit}\"></span>\n        <!-- /ko -->\n        <i class=\"icon glyphicon glyphicon-edit\" data-bind=\"click: edit\"></i>\n        <!-- /ko -->\n        <div class=\"clear\"></div>\n    "
    });
});
