'use strict';
const _ = require('lodash');
const clone = require('clone');

function getDistance(v1, v2, config) {
    var result = Math.abs(v2 - v1),
        maxDistance = config.maxDistance;
    if (config.isCyclic && result > maxDistance) {
        result = 2 * maxDistance - result;
    }
    return result
}

function getMaxDistance(v, config) {
    if (config.useOrigin) {
        return Math.abs(v - config.origin);
    }
    return config.maxDistance;
}

function isLess(v1, v2, config) {
    var less = v1 < v2,
        maxDistance = config.maxDistance,
        leftDistance, rightDistance;
    if (config.isCyclic) {
        if (less) {
            leftDistance = v2 - v1;
        } else {
            leftDistance = 2 * maxDistance - v1 + v2;
        }
        rightDistance = 2 * maxDistance - leftDistance;
        return leftDistance < rightDistance;
    }
    return less;
}

function computePolynom(input, linearity) {
    if (linearity == 1) {
        return 1 - input;
    } else if (linearity == 0) {
        return 0;
    } else {
        return Math.pow(1 - input, 1 / linearity);
    }
}

function computeRoot(input, linearity) {
    if (linearity == 1) {
        return 1 - input;
    } else if (linearity == 0) {
        return 1
    } else {
        return Math.pow(1 - input, linearity);
    }
}

function computeSigmoid(input, linearity) {
    if (linearity == 1) {
        return 1 - input;
    } else {
        if (input < 0.5) {
            if (linearity == 0) {
                return 1;
            } else {
                return 1 - Math.pow(2 * input, 1 / linearity) / 2;
            }
        } else {
            if (linearity == 0) {
                return 0;
            } else {
                return Math.pow(2 - (2 * input), 1 / linearity) / 2;
            }
        }
    }
}

function getInterpolation(interpolationName) {
    if (interpolationName) {
        if ('POLYNOM' === interpolationName.toUpperCase()) {
            return computePolynom;
        } else if ('SIGMOID' === interpolationName.toUpperCase()) {
            return computeSigmoid;
        } else if ('ROOT' === interpolationName.toUpperCase()) {
            return computeRoot;
        } else {
            throw '"' + interpolationName + '" is not a valid interpolation function.';
        }
    }
    return computePolynom;
}

var defaultConfig = {
    isCyclic: false,
    useOrigin: false,
    origin: 0,

    equalIfLess: 0,
    toleranceIfLess: 1,
    linearityIfLess: 1,

    equalIfMore: 0,
    toleranceIfMore: 1,
    linearityIfMore: 1,

    interpolationIfLess: 'POLYNOM',
    interpolationIfMore: 'POLYNOM'
};

module.exports = {
    POLYNOM: 'POLYNOM',
    SIGMOID: 'SIGMOID',
    ROOT: 'ROOT',
    create: function (min, max, opts) {
        var config = _.assignIn(clone(defaultConfig), opts || {});
        if (min > max) {
            config.min = max;
            config.max = min;
        } else {
            config.min = min;
            config.max = max;
        }
        config.maxDistance = max - min;
        return function (q, c) {
            if (q === c) {
                return 1
            }
            if (q === undefined || c === undefined) {
                return 0;
            }
            var distance = getDistance(q, c, config),
                relativeDistance = distance / getMaxDistance(q, config),
                equal, tolerance, linearity, interpolation, stretchedDistance;
            if (relativeDistance < 1) {
                if (isLess(c, q, config)) {
                    equal = config.equalIfLess;
                    tolerance = config.toleranceIfLess;
                    linearity = config.linearityIfLess;
                    interpolation = getInterpolation(config.interpolationIfLess);
                } else {
                    equal = config.equalIfMore;
                    tolerance = config.toleranceIfMore;
                    linearity = config.linearityIfMore;
                    interpolation = getInterpolation(config.interpolationIfMore);
                }

                if (relativeDistance <= equal) {
                    return 1;
                } else if (relativeDistance >= tolerance) {
                    return 0;
                } else {
                    stretchedDistance = (relativeDistance - equal) / (tolerance - equal);
                    return interpolation(stretchedDistance, linearity);
                }
            }
            return 0;
        };
    },
    symmetricPeak: {
        isCyclic: false,

        useOrigin: false,
        origin: 0,

        equalIfLess: 0,
        toleranceIfLess: 1,
        linearityIfLess: 0.2,
        interpolationIfLess: 'POLYNOM',

        equalIfMore: 0,
        toleranccIfMore: 1,
        linearityIfMore: 0.2,
        interpolationIfMore: 'POLYNOM'
    },
    symmetricPlateau: {
        isCyclic: false,

        useOrigin: false,
        origin: 0,

        equalIfLess: 0,
        toleranceIfLess: 0.5,
        linearityIfLess: 0.5,
        interpolationIfLess: 'SIGMOID',

        equalIfMore: 0,
        toleranccIfMore: 0.5,
        linearityIfMore: 0.5,
        interpolationIfMore: 'SIGMOID'
    },
    lessIsBetter: {
        isCyclic: false,

        useOrigin: true,
        origin: 0,

        equalIfLess: 0,
        toleranceIfLess: 1,
        linearityIfLess: 0.5,
        interpolationIfLess: 'ROOT',

        equalIfMore: 0,
        toleranccIfMore: 1,
        linearityIfMore: 0.5,
        interpolationIfMore: 'POLYNOM'
    },
    moreIsBetter: {
        isCyclic: false,

        useOrigin: true,
        origin: 0,

        equalIfLess: 0,
        toleranceIfLess: 1,
        linearityIfLess: 0.5,
        interpolationIfLess: 'POLYNOM',

        equalIfMore: 0,
        toleranccIfMore: 1,
        linearityIfMore: 0.5,
        interpolationIfMore: 'ROOT'
    },
    lessIsPerfect: {
        isCyclic: false,

        useOrigin: false,
        origin: 0,

        equalIfLess: 1,
        toleranceIfLess: 1,
        linearityIfLess: 0.0,
        interpolationIfLess: 'ROOT',

        equalIfMore: 0,
        toleranccIfMore: 1,
        linearityIfMore: 0.05,
        interpolationIfMore: 'POLYNOM'
    },
    moreIsPerfect: {
        isCyclic: false,

        useOrigin: true,
        origin: 0,

        equalIfLess: 0,
        toleranceIfLess: 1,
        linearityIfLess: 0.05,
        interpolationIfLess: 'POLYNOM',

        equalIfMore: 1,
        toleranccIfMore: 1,
        linearityIfMore: 0.0,
        interpolationIfMore: 'ROOT'
    }
};
