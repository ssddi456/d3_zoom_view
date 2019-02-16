import * as ko from 'knockout';
import { story, Story } from '../entities/story';
import { Character } from '../entities/character';
import { Tag } from '../entities/tag';

interface SnippetTabVM {
    activeNode: KnockoutObservable<Story | undefined>;
    characters: KnockoutObservableArray<Character>;
    tags: KnockoutObservableArray<Tag>;
    snippets: KnockoutObservableArray<Story>;
    filterWord: KnockoutObservable<string>;
    clearFilter(): void;
    filtedSnippets: KnockoutComputed<Story[]>;
    addSnippet(): void;
}

ko.components.register('snippets', {
    viewModel: {
        createViewModel: function (params, componentInfo) {
            const tags = params.tags;
            const snippets = ko.observableArray<Story>(ko.unwrap(params.snippets));
            const characters = params.characters;



            const vm: SnippetTabVM = {
                activeNode: ko.observable(),
                characters: characters,
                tags: tags,
                snippets: snippets,

                filterWord: ko.observable(''),
                clearFilter: function () {
                    this.filterWord('');
                },
                filtedSnippets: ko.pureComputed(function () {
                    const filterWord = vm.filterWord();
                    const snippets = vm.snippets();
                    if (!filterWord) {
                        return snippets;
                    }
                    return snippets.filter(function (snippet) {
                        const content = snippet.content();

                        if (content.indexOf(filterWord) != -1) {
                            return true;
                        }
                    });
                }),

                addSnippet: function () {
                    const newStory = story();
                    this.snippets.push(newStory);
                    this.activeNode(newStory);
                }
            };

            vm.activeNode.subscribe(function (snippet) {
                if (snippet) {
                    snippet.isActive(false);
                    snippet.hasFocus(false);
                }
            }, null, 'beforeChange');
            vm.activeNode.subscribe(function (snippet) {
                if (snippet) {
                    snippet.isActive(true);
                    snippet.hasFocus(true);
                }
            });

            let shouldHasFocus: Story | undefined = undefined;
            snippets.peek().forEach(function (snippet) {
                story.load(snippet, null, characters, tags);
                if (snippet.hasFocus()) {
                    if (shouldHasFocus) {
                        shouldHasFocus.isActive(false);
                        shouldHasFocus.hasFocus(false);
                    }
                    shouldHasFocus = snippet;
                }
            });

            if (shouldHasFocus) {
                vm.activeNode(shouldHasFocus);
            }

            return vm;
        }
    },
    template: [
        '<div class="row">',
        '    <div class="col-md-2">',
        '        <div class="input-group" data-bind="visible: snippets().length > 3">',
        '            <input type="text" class="form-control" data-bind="value:filterWord">',
        '            <div class="input-group-addon"><i class="glyphicon glyphicon-remove" data-bind="click: clearFilter"></i></div>',
        '            <div class="input-group-addon"><i class="glyphicon glyphicon-search"></i></div>',
        '        </div>',
        '        <div class="btn-toolbar">',
        '            <div class="btn-group">',
        '                <button type="button" class="btn btn-default", data-bind="click: addSnippet">add snippet</button>',
        '            </div>',
        '        </div>',
        '        <div data-bind="foreach: {data:filtedSnippets, as:\'snippet\'}">',
        '            <div class="bs-callout"',
        '                 data-bind="click: $component.activeNode, ',
        '                            css: { ',
        '                                   \'bs-callout-normal\': !snippet.hasFocus(),',
        '                                   \'bs-callout-info\': snippet.hasFocus(),',
        '                                 }">',
        '                <h4 style="white-space: nowrap;overflow: hidden;text-overflow: ellipsis;"',
        '                    data-bind="text: snippet.content"></h4>',
        '            </div>',
        '        </div>',
        '    </div>',
        '    <div class="col-md-8" data-bind="if: activeNode" >',
        '        <editable-text params="value: activeNode().content"></editable-text>',
        '    </div>',
        '    <div class="col-md-2" >',
        '        <tag-row params="{ tree: $component, characters: characters, tags: tags }"></tag-row>',
        '    </div>',
        '</div>',
    ].join('')
});
