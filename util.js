const crypto = require('crypto');

var Util = function() {}

Util.prototype.makeId = function(length, prefix, isUpperCase) {
    var text = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    if (!length || length == 0)
        length = 8;
    for (var i = 0; i < length; i++)
        text += possible.charAt(Math.floor(Math.random() * possible.length));

    if (prefix)
        text = prefix + text;

    if (isUpperCase)
        return text;
    return text.toLowerCase();
};

Util.prototype.makeId_UpperCase = function(length, prefix) {
    return this.makeId(length, prefix, true);
};

//https://stackoverflow.com/questions/105034/create-guid-uuid-in-javascript
Util.prototype.generateUUID = function() {
    var d = new Date().getTime();
    if (typeof performance !== 'undefined' && typeof performance.now === 'function') {
        d += performance.now(); //use high-precision timer if available
    }
    return 'xxxxxxxxxxxx4xxxyxxxxxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = (d + Math.random() * 16) % 16 | 0;
        d = Math.floor(d / 16);
        return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
    });
}

Util.prototype.generateUUID2 = function() {
    var d = new Date().getTime();
    if (typeof performance !== 'undefined' && typeof performance.now === 'function') {
        d += performance.now(); //use high-precision timer if available
    }
    return d + '-' + 'xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = (d + Math.random() * 16) % 16 | 0;
        d = Math.floor(d / 16);
        return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
    });
}

Util.prototype.convert2Array = function(data) {
    var retData = [];
    for (var item in data) {
        var itemSelf = data[item];
        itemSelf.code = item;
        retData.push(itemSelf)
    }

    return retData;
}

Util.prototype.getHash = function(data) {
    return crypto.createHash('md5').update(data).digest("hex");
}


module.exports = new Util();