define([


], function () {
    'use strict';

    function download(json, filename) {
        console.log(JSON.stringify(json));
        
        var json_url =  'data:application/json;base64,' +  +window.btoa(unescape(encodeURIComponent(JSON.stringify(json))));
        window.open(json_url, null);

        var blob = new Blob();
        var type = blob.type;
        var force_saveable_type = 'application/octet-stream';

        if (type && type != force_saveable_type) {
            blob = blob.slice(0, blob.size, force_saveable_type);
        }

        var a = document.createElementNS('http://www.w3.org/1999/xhtml', 'a');
        a.href = json_url;
        a.download = filename;

        var e = document.createEvent('MouseEvents');
        e.initMouseEvent('click', true, false, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null);
        a.dispatchEvent(e);

        var obj_Url = URL.createObjectURL(blob);
        URL.revokeObjectURL(obj_Url);
    }

    return download;

});

