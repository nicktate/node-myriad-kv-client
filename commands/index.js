'use strict';

module.exports = {
    get: require('./get'),
    delete: require('./delete'),
    flush: require('./flush'),
    keys: require('./keys'),
    set: require('./set'),
    snapshot: require('./snapshot'),
    stat: require('./stat'),
    ttl: require('./ttl')
};
