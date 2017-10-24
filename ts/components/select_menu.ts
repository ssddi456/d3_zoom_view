import * as ko from 'knockout';
'use strict';

interface SelectMenuParams<T> {
    onSelect(val:T): any;
    label: string;
    display: string;
    from: T[];
}

ko.components.register('select-menu', {
    viewModel: {
        createViewModel<T>({
            onSelect,
            label,
            display,
            from,
        }: SelectMenuParams<T>,
            componentInfo: { element: HTMLElement }
        ) {
            const vm = {
                onSelect: onSelect,
                label: label,
                displayKey: display,
                selectFrom: from,
                selecting: ko.observable(false),
                select: function (val: T) {
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
