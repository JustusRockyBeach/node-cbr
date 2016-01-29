'use strict';
const logger = require('log4js').getLogger('[cbr]');
const levels = require('log4js').levels;
const util = require('util');
const clone = require('clone');
const uuid = require('uuid');
const EventEmitter = require('events');
const Threads = require('webworker-threads');

const Model = require('./model');

const caseWeightedAverage = require('./measure-case-weighted-average');
const numerical = require('./measure-numerical');

var Retriever = function () {
    this.casesValuation = {};
    this.attributes = [];
    this.cases = [];
    EventEmitter.call(this);
};
util.inherits(Retriever, EventEmitter);

function compareSimilarity(a, b) {
    return b.similarity - a.similarity;
}

Retriever.prototype.setModel = function(modelDefinition) {
    var _this = this, cases, valuations;
    this.model = new Model();
    this.model.read(modelDefinition);
    cases = this.model.getTypes('case');
    cases.forEach(function(c) {
        if (!_this.casesValuation[c.name]) {
            _this.casesValuation[c.name] = {
                valuation: null,
                valuations: []
            } 
        }
        _this.casesValuation[c.name].valuation = caseWeightedAverage.create(_this.model.getValuationByType(c.name).type, _this.model);
        valuations = _this.model.getValuationsByType(c.name);
        valuations.forEach(function(v) {
            _this.casesValuation[c.name].valuations[v.name] = caseWeightedAverage.create(v.type, _this.model);
        });
    });
}

Retriever.prototype.add = function (data) {
    var add = clone(data);
    if (!add.id) {
        add.id = uuid.v4();
    }
    this.cases.push(add);
};

Retriever.prototype.evaluate = function(query, opt) {
    var _this = this, start = new Date().getTime(), options = opt || {},
        caseValuation = this.casesValuation.Case_Test.valuation,
        evaluation = [], cases = [], data,
        threshold = options.threshold || 0, maxCases = options.maxCases || 10,
        similarity;
    this.cases.forEach(function(c, index) {
        similarity = caseValuation(query, c);
        if (similarity >= threshold) {
            evaluation.push({
                similarity: similarity,
                id: index
            });
        }
    });
    evaluation.sort(compareSimilarity);
    for (var i = 0, n = evaluation.length > maxCases ? maxCases : evaluation.length; i < n; i++) {
        data = clone(_this.cases[evaluation[i].id]);
        data._similarity = evaluation[i].similarity;
        cases.push(data);
    }
    if (logger.isLevelEnabled(levels.DEBUG)) {
        logger.debug('Evaluation takes ' + (new Date().getTime() - start) + 'ms');
    }
    return {
        totalNoOfHits: evaluation.length,
        cases: cases
    };
};

Retriever.prototype.doit = function (event, value) {
    var _this = this;
    /*
        var worker = new Worker(function () {
            console.info('Created');
            onmessage = function () {
                console.info('Entered');
                sleep(1);
                this.emit(event, value);
                console.info('Emitted');
                self.close();
            };
        });
        worker.onmessage = function() {
          console.log('Now?');  
        };
        worker.postMessage(5);
    */
    function emit() {
        var x = 0;
        for (var i = 1000000000; i > 0; i--) {
            x++;
        }
        return x;
    }
    function fibo(n) {
        return n > 1 ? fibo(n - 1) + fibo(n - 2) : 1;
    }
    var th = Threads.create();
    console.time('fibo');
    th.eval(fibo).eval('fibo(50)', function (err, x) {
        console.timeEnd('fibo', x);
        _this.emit(event, value + x);
        th.destroy();
    })

};

module.exports = {
    numerical: numerical,
    Retriever: Retriever
};
