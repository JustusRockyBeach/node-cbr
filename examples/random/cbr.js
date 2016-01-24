'use strict';
const log4js = require('log4js');
const cbr = require('../../index');

log4js.configure();

var modelDefinition = {
    classes: [
        {
            name: 'Case_Test',
            type: 'case',
            attributes: {
                Test: {
                    type: 'Flt_Test'
                },
                Test2: {
                    type: 'Flt_Test'
                },
                Test3: {
                    type: 'Flt_Test'
                },
                Test4: {
                    type: 'Flt_Test'
                }
            }
        },
        {
            name: 'Flt_Test',
            type: 'float',
            min: 1,
            max: 10
        }
    ],
    valuation: [
        {
            name: 'Case_TestDefault',
            type: 'Case_Test',
            isDefault: true,
            operation: 'weighted-average',
            attributes: {
                Test: {
                    valuation: 'Flt_TestMoreIsBetter',
                    weight: 2
                },
                Test2: {
                    valuation: 'Flt_TestLessIsBetter',
                    weight: 2
                },
                Test3: {
                    valuation: 'Flt_TestMoreIsBetter',
                    weight: 2
                },
                Test4: {
                    valuation: 'Flt_TestLessIsBetter',
                    weight: 2
                }
            }
        },
        {
            name: 'Flt_TestMoreIsBetter',
            type: 'Flt_Test',
            isDefault: true,
            operation: 'numerical',
            config: cbr.numerical.moreIsBetter
        },
        {
            name: 'Flt_TestLessIsBetter',
            type: 'Flt_Test',
            operation: 'numerical',
            config: cbr.numerical.lessIsBetter
        }
    ],
    attributes: {
        Test: {
            weight: 2,
            evaluate: cbr.numerical.create(1, 10, cbr.numerical.moreIsBetter)
        },
        Test2: {
            weight: 2,
            evaluate: cbr.numerical.create(1, 10, cbr.numerical.moreIsBetter)
        }
    }
};

var retriever = new cbr.Retriever();

retriever.setModel(modelDefinition);
retriever.setValuationModel(modelDefinition);

function random(low, high) {
    return Math.floor(Math.random() * (high - low + 1) + low);
}

for (var i = 0; i < 1000000; i++) {
    retriever.add({
        Test: random(1, 10),
        Test2: random(1, 10),
        Test3: random(1, 10),
        Test4: random(1, 10)
    });
}

// Ich verliere 10ms nach der neuen Methode

retriever.evaluate({
    Test: 6,
    Test2: 5,
    Test3: 3,
    Test4: 10
}, {
    threshold: 0.5
});

retriever.evaluate({
    Test: 7,
    Test2: 2,
    Test3: 1,
    Test4: 2
}, {
    threshold: 0.5
});

retriever.evaluate({
    Test: 3,
    Test2: 5,
    Test3: 8,
    Test4: 4
}, {
    threshold: 0.5
});
