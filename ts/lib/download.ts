
export function download(json: {}, filename: string) {

    const json_url = 'data:application/json;base64,' + +window.btoa(encodeURI(encodeURIComponent(JSON.stringify(json))));
    window.open(json_url, undefined);

    let blob = new Blob();
    const type = blob.type;
    const force_saveable_type = 'application/octet-stream';

    if (type && type != force_saveable_type) {
        blob = blob.slice(0, blob.size, force_saveable_type);
    }

    const a = document.createElementNS('http://www.w3.org/1999/xhtml', 'a') as HTMLAnchorElement;
    a.href = json_url;
    a.download = filename;

    const e = document.createEvent('MouseEvents');
    e.initMouseEvent('click', true, false, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null);
    a.dispatchEvent(e);

    const obj_Url = URL.createObjectURL(blob);
    URL.revokeObjectURL(obj_Url);
}
