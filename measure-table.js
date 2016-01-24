'use strict';

module.exports = {
    create: function(table) {
        return function(q, c) {
            var tmp;
            if ((tmp = table[q]) && tmp[c]) {
                return tmp[c];
            }
            return 0;
        }
    }
}
