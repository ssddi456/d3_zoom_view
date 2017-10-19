define([
    './story',
    './tag',
    './character',
], function(
    story,
    tag,
    character
) {
    return {
        story: story,
        character: character,
        tag: tag
    };
});
