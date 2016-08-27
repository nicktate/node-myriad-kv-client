'use strict';

const _ = require('lodash');
const repl = require('repl');

const commands = [
    'keys',
    'get',
    'delete',
    'count',
    'stats'
];

repl.start({
    prompt: 'myriad-kv > ',
    eval: evalFunction,
    completer: completerFunction
});

function evalFunction(expression, context, filename, callback) {
    const split = expression.trim().split(/\s+/);

    if (split.length === 0) {
        return callback();
    }

    const cmd = split[0];

    if (cmd === 'keys') {
        return callback(null, 'what');
    }

    return callback();
}

function completerFunction(partial, callback) {
    const split = partial.trim().split(/\s+/);

    if (split.length === 0) {
        return callback(null, [commands, partial]);
    }

    const cmd = split[0];

    if (split.length === 1) {
        return callback(null, [_.filter(commands, (c) => {
            return c.startsWith(cmd);
        }), partial]);
    }

    return callback(null);
}
