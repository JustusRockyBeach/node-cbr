var _ = require('lodash'),
    logger = require('log4js').getLogger('[model]'),
    levels = require('log4js').levels;

function Model() {
    this.classes = {};
    this.valuation = {};
    this.valuationTypes = {};
    this.valuationsByType = {};
}

Model.prototype.read = function (model) {
    var _this = this;
    if (model.classes) {
        model.classes.forEach(function (clazz) {
            if (clazz.name) {
                if (logger.isLevelEnabled(levels.DEBUG)) {
                    logger.debug('Model referening type ' + clazz.name);
                }
                _this.classes[clazz.name] = clazz;
            }
        });
        model.classes.forEach(function (clazz) {
        });
    }
    if (model.valuation) {
        model.valuation.forEach(function(valuation) {
            if (valuation.name) {
                _this.valuation[valuation.name] = valuation;
                if (!_this.valuationTypes[valuation.type] || valuation.isDefault) {
                    _this.valuationTypes[valuation.type] = valuation;
                }
                if (!_this.valuationsByType[valuation.type]) {
                    _this.valuationsByType[valuation.type] = [];
                }
                _this.valuationsByType[valuation.type].push(valuation);
            }
        });
    }
    if (logger.isLevelEnabled(levels.DEBUG)) {
        logger.info('Loaded ' + model.classes.length + ' classes.');
    }
};

Model.prototype.getTypes = function(type) {
    var result = [];
    _.forOwn(this.classes, function(typeDefinition, name) {
        if (typeDefinition.type === type) {
            result.push(typeDefinition);
        }
    });
    return result;
}

Model.prototype.getType = function (name, expect) {
    var type;
    if (!(type = this.classes[name])) {
        throw 'Missing type by name "' + name + '".';
    }
    if (expect && expect !== type.type) {
        throw 'Type "' + name + '" is not of type ' + expect + '.';
    }
    return type;
};

Model.prototype.getValuation = function (name) {
    var valuation;
    if (!(valuation = this.valuation[name])) {
        throw 'Missing valuation by name "' + name + '".';
    }
    return valuation;
};

Model.prototype.getValuationByType = function (type) {
    var valuation;
    if (!(valuation = this.valuationTypes[type])) {
        throw 'Missing valuation by type "' + type + '".';
    }
    return valuation;
};

Model.prototype.getValuationsByType = function (type) {
    var valuations;
    if (!(valuations = this.valuationsByType[type])) {
        throw 'Missing valuations by type "' + type + '".';
    }
    return valuations;
};

module.exports = Model;
