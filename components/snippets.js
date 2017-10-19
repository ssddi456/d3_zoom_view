define([
    '../entities/story',
    'ko',
], function (
    story,
    ko
) {

        ko.components.register('snippets', {
            viewModel: {
                createViewModel: function (params, componentInfo) {
                    var tags = params.tags;
                    var snippets = params.snippets;
                    var characters = params.characters;

                    var vm = {

                    };


                    return vm;
                }
            },
            template: [
                '<div class="row">',
                '    <div class="col-md-2">',
                '    </div>',
                '    <div class="col-md-10">',
                '    </div>',
                '    <div class="col-md-10">',
                '    </div>',
                '</div>',
                '<div class="row">',
                '    <div class="col-md-2">',
                '    </div>',
                '    <div class="col-md-10 col-md-offset-2" >',
                '    </div>',
                '    <div class="col-md-10 col-md-offset-2" >',
                '    </div>',
                '</div>',
            ].join('')
        });
    });
