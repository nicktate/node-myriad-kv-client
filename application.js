'use strict';

const _ = require('lodash');
const commands = require('./commands');

function MyriadKVClient(options) {
    this.options = _.defaults(options, {
        host: '127.0.0.1',
        port: 2666
    });

    _.each(commands, (fn, command) => {
        MyriadKVClient.prototype[command] = fn(this);
    });
}

module.exports = MyriadKVClient;
