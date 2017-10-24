define(["require", "exports", "knockout", "../entities/character"], function (require, exports, ko, character_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    ko.components.register('characters', {
        viewModel: {
            createViewModel: function (params, componentInfo) {
                var vm = {
                    characters: ko.observableArray([]),
                    filterWord: ko.observable(''),
                    clearFilter: function () {
                        this.filterWord('');
                    },
                    filtedCharacters: ko.pureComputed(function () {
                        var filterWord = vm.filterWord();
                        var characters = ko.unwrap(vm.characters);
                        if (!filterWord) {
                            return characters;
                        }
                        return characters.filter(function (character) {
                            var name = character.name();
                            var desc = character.desc();
                            if (name.indexOf(filterWord) != -1) {
                                return true;
                            }
                            if (desc.indexOf(filterWord) != -1) {
                                return true;
                            }
                        });
                    }),
                    addCharacter: function () {
                        this.characters.push(character_1.character());
                    },
                    copyCharacter: function (_character, idx) {
                        var newCharacter = character_1.character();
                        newCharacter.name(ko.unwrap(_character.name));
                        newCharacter.desc(ko.unwrap(_character.desc));
                        this.characters.splice(idx, 0, newCharacter);
                    },
                    removeCharacter: function (character) {
                        this.characters.remove(character);
                    },
                    init: function (characters) {
                        characters.forEach(character_1.character.load);
                        this.characters(characters);
                    }
                };
                if (params.characters && params.characters.subscribe) {
                    params.characters.subscribe(function (newVal) {
                        vm.init(newVal);
                    });
                }
                vm.init(ko.unwrap(params.characters));
                return vm;
            }
        },
        template: [
            '<div class="row">',
            '    <div class="col-md-2">',
            '        <div class="input-group" data-bind="visible: characters().length > 3">',
            '            <input type="text" class="form-control" data-bind="value:filterWord">',
            '            <div class="input-group-addon"><i class="glyphicon glyphicon-remove" data-bind="click: clearFilter"></i></div>',
            '            <div class="input-group-addon"><i class="glyphicon glyphicon-search"></i></div>',
            '        </div>',
            '    </div>',
            '    <div class="col-md-10">',
            '        <div class="btn-toolbar">',
            '            <div class="btn-group">',
            '                <button type="button" class="btn btn-default", data-bind="click: addCharacter">add character</button>',
            '            </div>',
            '        </div>',
            '    </div>',
            '</div>',
            '<div class="row" style="position:absolute; top:34px; bottom: 0px; left:0;right:0;">',
            '    <div class="col-md-2" style="position:absolute; top: 0px; bottom: 0px; overflow:auto;">',
            '        <div data-bind="foreach: {data:filtedCharacters, as:\'character\'}">',
            '            <div class="bs-callout bs-callout-normal" >',
            '                <h4><a data-bind="text: character.name, attr:{href: \'#character_\' + character.id}"></a> </h4>',
            '            </div>',
            '        </div>',
            '    </div>',
            '    <div class="col-md-10 col-md-offset-2" style="position:absolute; top: 0px; bottom: 0px; overflow:auto;">',
            '        <div class="character-list" data-bind="foreach: {data:characters, as: \'character\'}" >',
            '            <div class="bs-callout bs-callout-normal" data-bind="attr: { id: \'character_\' + character.name() }">',
            '                <character-card params="{name: character.name, desc: character.desc}"></character-card>',
            '                <div class="btn-toolbar">',
            '                    <div class="btn-group">',
            '                        <button type="button" class="btn btn-xs btn-default"',
            '                                data-bind="click: function(){ $component.copyCharacter(character, $index()) }"',
            '                        ><i class="glyphicon glyphicon-duplicate"></i></button>',
            '                    </div>',
            '                    <div class="btn-group">',
            '                        <button type="button" class="btn btn-xs btn-danger"',
            '                                data-bind="click: function(){ $component.removeCharacter(character) }"',
            '                        ><i class="glyphicon glyphicon-floppy-remove"></i></button>',
            '                    </div>',
            '                </div>',
            '            </div>',
            '        </div>',
            '</div>',
        ].join('')
    });
    ko.components.register('character-card', {
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
