import * as ko from 'knockout';


ko.components.register('highlight_token', {
    viewModel: {

        createViewModel: function (params, componentInfo) {
            const vm = {
                ...params
            };

            return vm;
        },
    },
    template: `
    <p data-bind="foreach: text">
        <span data-bind="text: $data.word, attr : { 'class': 'wordtype-' + $data.flag }" >
    <p>
    `
});
