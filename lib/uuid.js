define([
], function() {

    var keyMap = '1237654890qwertypoiuasdflkjhgzxcmnbv';
    function UUID() {
        var ret = '';
        for (var i = 0; i < 16; i++) {
            ret += keyMap[Math.floor(Math.random() * keyMap.length)];
        }
        return ret;
    }
    return UUID;
});
