define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var keyMap = '1237654890qwertypoiuasdflkjhgzxcmnbv';
    function uuid() {
        var ret = '';
        for (var i = 0; i < 16; i++) {
            ret += keyMap[Math.floor(Math.random() * keyMap.length)];
        }
        return ret;
    }
    exports.uuid = uuid;
});
