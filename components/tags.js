define([
    '../entities/tag',
    'ko',
], function (
    tag,
    ko
) {

        ko.components.register('tags', {
            viewModel: {
                createViewModel: function (params, componentInfo) {
                    var vm = {
                        tags: ko.observableArray([]),
                        filterWord: ko.observable(''),
                        clearFilter: function () {
                            this.filterWord('');
                        },
                        filtedTags: ko.pureComputed(function () {
                            var filterWord = vm.filterWord();
                            var tags = vm.tags();
                            if (!filterWord) {
                                return tags;
                            }
                            return tags.filter(function (tag) {
                               var name = tag.name();
                               var desc = tag.desc();
                               if(name.indexOf(filterWord) != -1) {
                                   return true;
                               }
                               if(desc.indexOf(filterWord) != -1) {
                                   return true;
                               }
                            });
                        }),
                        addTag: function () {
                            this.tags.push(tag());
                        },
                        copyTag: function (_tag, idx) {
                            var newTag = tag();

                            newTag.name(ko.unwrap(_tag.name)),
                            newTag.desc(ko.unwrap(_tag.desc)),

                            this.tags.splice(idx, 0, newTag);
                        },
                        removeTag: function (tag) {
                            this.tags.remove(tag);
                        },
                        init: function (tags) {
                            tags.forEach(function (_tag) {
                                tag.load(_tag);
                            });
                            this.tags(tags);
                        }
                    };

                    if (params.tags && params.tags.subscribe) {
                        params.tags.subscribe(function (newVal) {
                            vm.init(newVal);
                        });
                    }

                    vm.init(ko.unwrap(params.tags));
                    return vm;
                }
            },
            template: [
                '<div class="row">',
                '    <div class="col-md-2">',
                '        <div class="input-group" data-bind="visible: tags().length > 3">',
                '            <input type="text" class="form-control" data-bind="value:filterWord">',
                '            <div class="input-group-addon"><i class="glyphicon glyphicon-remove" data-bind="click: clearFilter"></i></div>',
                '            <div class="input-group-addon"><i class="glyphicon glyphicon-search"></i></div>',
                '        </div>',
                '    </div>',
                '    <div class="col-md-10">',
                '        <div class="btn-toolbar">',
                '            <div class="btn-group">',
                '                <button type="button" class="btn btn-default", data-bind="click: addTag">add tag</button>',
                '            </div>',
                '        </div>',
                '    </div>',
                '</div>',
                '<div class="row" style="position:absolute; top:34px; bottom: 0px; left:0;right:0;">',
                '    <div class="col-md-2" style="position:absolute; top: 0px; bottom: 0px; overflow:auto;">',
                '        <div data-bind="foreach: {data:filtedTags, as:\'tag\'}">',
                '            <div class="bs-callout bs-callout-normal" >',
                '                <h4><a data-bind="text: tag.name, attr:{href: \'#tag_\' + tag.name()}"></a> </h4>',
                '            </div>',
                '        </div>',
                '    </div>',
                '    <div class="col-md-10 col-md-offset-2" style="position:absolute; top: 0px; bottom: 0px; overflow:auto;">',
                '        <div class="tag-list" data-bind="foreach: {data:tags, as: \'tag\'}" >',
                '            <div class="bs-callout bs-callout-normal" data-bind="attr: { id: \'tag_\' + tag.name() }">',
                '                <tag-card params="{name: tag.name, desc: tag.desc}"></tag-card>',
                '                <div class="btn-toolbar">',
                '                    <div class="btn-group">',
                '                        <button type="button" class="btn btn-xs btn-default"',
                '                                data-bind="click: function(){ $component.copyTag(tag, $index()) }"',
                '                        ><i class="glyphicon glyphicon-duplicate"></i></button>',
                '                    </div>',
                '                    <div class="btn-group">',
                '                        <button type="button" class="btn btn-xs btn-danger"',
                '                                data-bind="click: function(){ $component.removeTag(tag) }"',
                '                        ><i class="glyphicon glyphicon-floppy-remove"></i></button>',
                '                    </div>',
                '                </div>',
                '            </div>',
                '        </div>',
                '</div>',
            ].join('')
        })

        ko.components.register('tag-card', {
            viewModel: {
                createViewModel: function (params, componentInfo) {
                    var vm = {
                        name: params.name,
                        desc: params.desc,
                    };
                    return vm;
                }
            },
            template: [
                '<h4>',
                '    <editable-text params="value: name, type: \'input\'"></editable-text>',
                '</h4>',
                
                '<editable-text params="value: desc"></editable-text>',
            ].join('')
        });
    });
