var db = require('./../routes/db/queries');

const fs = require('fs');

let rawdata = fs.readFileSync('data/Duraklar_.json');
let DATA = JSON.parse(rawdata);


for (var i = 0; i < DATA.length; i++) {
    var item = DATA[i];

    item.px = Number(item.px);
    item.py = Number(item.py);

    db.insertStation(item);
}
