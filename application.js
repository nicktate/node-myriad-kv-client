'use strict';

const commands = require('./commands');

const _ = require('lodash');

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

// executed directly from command line, run the repl
if (require.main === module) {
    const MyriadRepl = require('./repl');
    MyriadRepl.run();
}
