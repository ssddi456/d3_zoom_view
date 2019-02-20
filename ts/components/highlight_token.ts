import * as ko from 'knockout';
import { active } from 'd3';
import { mapped_table } from './characteristic_property_table';

interface WordInfo {
    word: string;
    flag: string;
    active: KnockoutObservable<boolean>;
}

interface NameTable {
    [k: string]: WordInfo[]
}

ko.components.register('highlight-token', {
    viewModel: {
        createViewModel: function (params, componentInfo) {
            const nameTable: NameTable = {};
            const vm = {
                ...params,
                highlightedWord: ko.observable(),
                text: (params.text as WordInfo[] || []).map(function (node: WordInfo) {
                    const ret = {
                        ...node,
                        active: ko.observable(!!ko.unwrap(node.active))
                    } as WordInfo;

                    if (['n', 'v', 'a'].indexOf(node.flag[0]) != -1) {
                        nameTable[node.word] = nameTable[node.word] || [];
                        nameTable[node.word].push(ret);
                    }

                    return ret;
                }),
                createClassName(data: WordInfo) {
                    return `wordtype-${data.flag} ${data.active() ? 'active' : ''}`;
                },
                highlightWord(data: WordInfo) {
                    vm.highlightedWord(data);
                    const allRef = nameTable[data.word];
                    if (allRef) {
                        allRef.forEach(x => x.active(true));
                    }
                },
                dehighlightWord(data: WordInfo) {
                    const allRef = nameTable[data.word];
                    if (allRef) {
                        allRef.forEach(x => x.active(false));
                    }
                    vm.highlightedWord(undefined);
                },
            };



            return vm;
        },
    },
    template: `
    <p data-bind="foreach: text"><span data-bind="text: word,
    attr : { 
        'class': $parent.createClassName($data), 
    },
    event: {
        mouseenter: $parent.highlightWord,
        mouseleave: $parent.dehighlightWord
    }
" ></p>
    <highlight-word params="word: highlightedWord"></highlight-word>
    `
});
   
ko.components.register('highlight-word', {
    viewModel: {
        createViewModel(params, componentInfo) {
            const word = params.word as KnockoutObservable<WordInfo>;

            return {
                word,
                flagInfo(flag: string) {
                    return flag + ' ' + (mapped_table[flag] || 'unknown');
                }
            };
        }
    },
    template: `
    <!-- ko if: word -->
    <div class="highlight-token" data-bind="with: word">
        <p><b data-bind="text: word"></b> : <b data-bind="text: $parent.flagInfo(flag)"></b></p>
    </div>
    <!-- /ko -->
    `
});
