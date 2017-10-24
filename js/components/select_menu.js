define(["require", "exports", "knockout"], function (require, exports, ko) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    'use strict';
    ko.components.register('select-menu', {
        viewModel: {
            createViewModel: function (_a, componentInfo) {
                var onSelect = _a.onSelect, label = _a.label, display = _a.display, from = _a.from;
                var vm = {
                    onSelect: onSelect,
                    label: label,
                    displayKey: display,
                    selectFrom: from,
                    selecting: ko.observable(false),
                    select: function (val) {
                        if (val) {
                            vm.onSelect(val);
                        }
                        vm.selecting(false);
                    },
                    cancel: function () {
                        this.selecting(false);
                    }
                };
                return vm;
            },
        },
        template: [
            '<div class="dropdown" data-bind="css:{ open: selecting}">',
            '    <button type="button" ',
            '            class="btn btn-default"',
            '            data-toggle="dropdown" ',
            '            data-bind="click: function(){ selecting(true); }, text: label">',
            '        <span class="caret"></span>',
            '    </button>',
            '    <ul class="dropdown-menu">',
            '        <!-- ko foreach: {data: selectFrom, as: \'data\'} -->',
            '        <li data-bind="click: $component.select">',
            '            <a data-bind="text: $component.displayKey ? data[$component.displayKey]: data" href="#"></a>',
            '        </li>',
            '        <!-- /ko -->',
            '        <li data-bind="click: cancel">',
            '            <a href="#"><i class="glyphicon glyphicon-remove"></i>取消</a>',
            '        </li>',
            '    </ul>',
            '</div>',
        ].join('')
    });
});
