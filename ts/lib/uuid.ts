
const keyMap = '1237654890qwertypoiuasdflkjhgzxcmnbv';
export function uuid() {
    let ret = '';
    for (let i = 0; i < 16; i++) {
        ret += keyMap[Math.floor(Math.random() * keyMap.length)];
    }
    return ret;
}

