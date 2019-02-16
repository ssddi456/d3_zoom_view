define(["require", "exports", "./scroll_row", "./character_card", "./editable_text", "./tags", "./snippets", "./select_menu", "./story_dag", "./dialog"], function (require, exports, scroll_row, character_card, editable_text, tags, snippets, select_menu, story_dag, dialog) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.components = {
        scroll_row: scroll_row,
        character_card: character_card,
        editable_text: editable_text,
        tags: tags,
        snippets: snippets,
        select_menu: select_menu,
        dialog: dialog,
    };
    exports.bindingPlaceHolder = {
        story_dag: story_dag
    };
});
