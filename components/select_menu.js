define([
    'ko',
], function (
    ko
) {
        'use strict';

        ko.components.register('select-menu', {
            viewModel: {
                createViewModel: function (params, componentInfo) {
                    var $element = $(componentInfo.element);
                    var vm = {
                        onSelect: params.onSelect,
                        label: params.label,
                        displayKey: params.display,
                        selectFrom: params.from,
                        selecting: ko.observable(false),
                        onchage: params.onchange,
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
