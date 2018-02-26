var db = require('./../routes/db/queries');

//TEST
// var TOTAL_WEIGHT = 1500;
// var TOTAL_RANDOM_POINT = 500;
// var RANDOM_WEGIHTS = createRandomNumbers(TOTAL_RANDOM_POINT, TOTAL_WEIGHT, 5, []);

// var total = 0;
// for (let index = 0; index < RANDOM_WEGIHTS.length; index++) {
//     total += RANDOM_WEGIHTS[index];
//     console.log(RANDOM_WEGIHTS[index])
// }

// console.log("TOTAL_WEIGHT is right : " + (TOTAL_WEIGHT == total))
// console.log("TOTAL_RANDOM_POINT is right : " + (TOTAL_RANDOM_POINT == RANDOM_WEGIHTS.length))

// var result = createNRondomNumber(3, 5, 4, true);
// var result2 = createNRondomNumber(10, 25, 8, false);


function createRandomNumbers(count, total, addSub, resultArray) {

    if (!resultArray)
        resultArray = [];
    count = Number(count);
    total = Number(total);

    if (count == 0)
        return resultArray;

    if (count == 1) {
        resultArray.push(total);
        return (0, 0, 0, resultArray);
    }

    var radnomAverage = Number((total / count).toFixed(0));

    var max = radnomAverage + addSub - 2;

    // var min = (radnomAverage - addSub);
    // if (min < 0)
    //     min = 0;
    var min = (radnomAverage - addSub) < 0 ? 0 : (radnomAverage - addSub);

    var random = randomIntBetweenMinMax(min, max);

    if (random < 0)
        random = 0;

    if (total <= random) {
        random = total;
    }

    total = total - random;
    count = count - 1;

    resultArray.push(random);

    return createRandomNumbers(count, total, addSub, resultArray);

}

function createNRondomNumber(min, max, count, isUnique) {

    var resultObj = {};
    var resultArray = [];

    isUnique = (typeof isUnique == "boolean") ? isUnique : false;

    if (max <= min)
        return [];

    if ((max - min + 1) < count && isUnique)
        return [];

    while (count > 0) {

        var random = randomIntBetweenMinMax(min, max);

        if (isUnique) {
            if (resultObj[random] == undefined) {
                resultObj[random] = random;
                count--;
            }
        } else {
            resultArray.push(random);
            count--;
        }

    }

    if (isUnique) {
        for (const key in resultObj) {
            if (resultObj.hasOwnProperty(key)) {
                const element = resultObj[key];
                resultArray.push(Number(element));
            }
        }
    }

    return resultArray;
}

function randomIntBetweenMinMax(min, max) {
    return Math.floor((Math.random() * ((max + 1) - min)) + min);
}

module.exports = {
    createNRondomNumber: createNRondomNumber,
    createRandomNumbers: createRandomNumbers
}