var clone = require('clone'),
    numerical = require('./measure-numerical'),
    table = require('./measure-table');

function defaultEvaluator(q, c) {
    var tq = typeof q, tc = typeof c;
    if (tq === tc) {
        return q === c ? 1 : 0;
    }
    return 0;
}

function createEvaluator(valuation, type) {
    if (typeof valuation.operation === 'function') {
        return valuation.operation;
    }
    if ('numerical' === valuation.operation) {
        return numerical.create(type.min, type.max, valuation.config);
    } else if ('table' === valuation.operation) {
        return table.create(valuation.config);
    }
    return defaultEvaluator;
}

module.exports = {
    create: function (name, model) {
        var type = model.getType(name, 'case'),
            caseValuation = model.getValuationByType(name),
            attributes = [],
            attribute,
            attributeType,
            attributeValuation;
        Object.keys(type.attributes).forEach(function (attributeName) {
            attribute = clone(caseValuation.attributes[attributeName]);
            if (attribute.weight && attribute.weight > 0) {
                attribute.name = attributeName;
                attributeType = type.attributes[attributeName].type;
                if (attribute.valuation) {
                    attributeValuation = model.getValuation(attribute.valuation);
                } else {
                    attributeValuation = model.getValuationByType(attributeType);
                }
                attribute.evaluate = createEvaluator(attributeValuation, model.getType(attributeType));
                attributes.push(attribute);
            }
        });
        return function (q, c) {
            var similarity = 0,
                divider = 0,
                evaluate;
            attributes.forEach(function (attribute) {
                if (q[attribute.name]) {
                    if (q[attribute.name]._valuation) {
                        //TODO: Implement query valuation
                        throw 'query evaluation not implemented yet.';
                    } else {
                        evaluate = attribute.evaluate;
                    }
                    similarity += attribute.weight * evaluate(q[attribute.name], c[attribute.name]);
                    divider += attribute.weight;
                }
            });
            if (divider > 0) {
                similarity = similarity / divider;
            } else {
                similarity = 0;
            }
            return similarity;
        }
    }
}