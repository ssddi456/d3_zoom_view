require([
    './js/world/text_analize',
    'knockout',
],
    function (
        text_analize,
        ko
    ) {

        console.log(text_analize);

        ko.applyBindings(text_analize.default);
    });
