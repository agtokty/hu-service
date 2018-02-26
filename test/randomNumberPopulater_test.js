const expect = require('chai').expect;

var randomNumberPopulater = require('../tools/randomNumberPopulater');

it('randomNumberPopulater should provide functions', () => {

    var result = randomNumberPopulater.createRandomNumbers(100, 2000, 4, []);

    expect(randomNumberPopulater.createRandomNumbers).to.be.a('Function')
    expect(randomNumberPopulater.createNRondomNumber).to.be.a('Function')
})

it('createRandomNumbers should work fine', () => {

    var TOTAL_WEIGHT = 1500;
    var TOTAL_RANDOM_POINT = 500;

    var randomArray = randomNumberPopulater.createRandomNumbers(TOTAL_RANDOM_POINT, TOTAL_WEIGHT, 4, []);

    var total = 0;
    for (let index = 0; index < randomArray.length; index++) {
        total += randomArray[index];

        expect(randomArray[index]).is.gte(0)
    }

    expect(TOTAL_WEIGHT).to.eq(total);
    expect(TOTAL_RANDOM_POINT).to.eq(randomArray.length);
})

it('createRandomNumbers should work fine 2', () => {

    var TOTAL_WEIGHT = "1500";
    var TOTAL_RANDOM_POINT = "500";

    var randomArray = randomNumberPopulater.createRandomNumbers(TOTAL_RANDOM_POINT, TOTAL_WEIGHT, 5, []);

    var total = 0;
    for (let index = 0; index < randomArray.length; index++) {
        total += randomArray[index];

        expect(randomArray[index]).is.gte(0)
    }

    expect(Number(TOTAL_WEIGHT)).to.eq(total);
    expect(Number(TOTAL_RANDOM_POINT)).to.eq(randomArray.length);
})

it('createRandomNumbers should work fine 3', () => {

    var TOTAL_WEIGHT = "1500";
    var TOTAL_RANDOM_POINT = 200;

    var randomArray = randomNumberPopulater.createRandomNumbers(TOTAL_RANDOM_POINT, TOTAL_WEIGHT, 2, null);

    var total = 0;
    for (let index = 0; index < randomArray.length; index++) {
        total += randomArray[index];

        expect(randomArray[index]).is.gte(0)
    }

    expect(Number(TOTAL_WEIGHT)).to.eq(total);
    expect(Number(TOTAL_RANDOM_POINT)).to.eq(randomArray.length);
})

it('createNRondomNumber should work fine', () => {

    var randomArray1 = randomNumberPopulater.createNRondomNumber(15, 995, 40, false);
    expect(randomArray1).to.be.a('Array');
    expect(randomArray1.length).to.eq(40);


    var randomArray2 = randomNumberPopulater.createNRondomNumber(3, 5, 3, false);
    expect(randomArray2).to.be.a('Array');
    expect(randomArray2.length).to.eq(3);

    var randomArray3 = randomNumberPopulater.createNRondomNumber(3, 5, 4, false);
    expect(randomArray3).to.be.a('Array');
    expect(randomArray3.length).to.eq(4);

    var randomArray4 = randomNumberPopulater.createNRondomNumber(66, 55, 4, false);
    expect(randomArray4).to.be.a('Array');
    expect(randomArray4.length).to.eq(0);

})

it('createNRondomNumber (unique) should work fine', () => {

    var randomArray1 = randomNumberPopulater.createNRondomNumber(15, 995, 40, true);
    expect(randomArray1).to.be.a('Array');
    expect(randomArray1.length).to.eq(40);


    var randomArray2 = randomNumberPopulater.createNRondomNumber(3, 5, 3, true);
    expect(randomArray2).to.be.a('Array');
    expect(randomArray2.length).to.eq(3);

    var randomArray3 = randomNumberPopulater.createNRondomNumber(3, 5, 4, true);
    expect(randomArray3).to.be.a('Array');
    expect(randomArray3.length).to.eq(0);

    var randomArray4 = randomNumberPopulater.createNRondomNumber(66, 55, 4, true);
    expect(randomArray4).to.be.a('Array');
    expect(randomArray4.length).to.eq(0);

})