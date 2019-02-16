import * as ko from 'knockout';


ko.components.register('editable-text', {
    viewModel: {
        createViewModel: function (params, componentInfo) {
            const $element = $(componentInfo! && componentInfo!.element as HTMLElement);

            const vm = {
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
    template: `
        <!-- ko if: editing -->
        <!-- ko if: type == \'textarea\' -->
        <textarea data-bind="value: value, event:{blur: endEdit}"></textarea>
        <!-- /ko -->
        <!-- ko if: type == \'input\' -->
        <input type="text" class="form-control" data-bind="value: value, event:{blur: endEdit}"></input>
        <!-- /ko -->
        <!-- /ko -->
        <!-- ko ifnot: editing -->
        <!-- ko if: type == \'textarea\' -->
        <p data-bind="text: value, event:{dblclick: edit}"></p>
        <!-- /ko -->
        <!-- ko if: type == \'input\' -->
        <span data-bind="text: value, event:{dblclick: edit}"></span>
        <!-- /ko -->
        <i class="icon glyphicon glyphicon-edit" data-bind="click: edit"></i>
        <!-- /ko -->
        <div class="clear"></div>
    `
});
