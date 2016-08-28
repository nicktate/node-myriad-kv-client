'use strict';

const argv = require('./lib/config');
const MyriadKV = require('./application');

const mc = new MyriadKV({
    host: argv.host,
    port: argv.port
});

const ANSI_RED = '\x1b[31m';
const ANSI_GREEN = '\x1b[32m';
const ANSI_RESET = '\x1b[0m';
const JSON_LINE_REGEX = /^( *)("[\w]+": )?("[^"]*"|[\w.+-]*)?([,[{])?$/mg;

const _ = require('lodash');
const repl = require('repl');
const util = require('util');

const COMMANDS = [
    'delete ',
    'flush ',
    'get ',
    'keys ',
    'set ',
    'snapshot ',
    'stat ',
    'ttl '
];

function runRepl() {
    // run stat so we can test myriad connection
    return mc.stat((err) => {
        if (err) {
            // eslint-disable-next-line no-console
            console.error(err);
            process.exit(1);
        }

        return repl.start({
            prompt: 'myriad-kv > ',
            eval: evalFunction,
            completer: completerFunction,
            writer: writerFunction
        });
    });
}

function evalFunction(expression, context, filename, callback) {
    const split = expression.trim().split(/\s+/);

    if (split.length === 0) {
        return callback();
    }

    const cmd = split[0];
    const arg = split.length > 1 ? split[1] : null;

    switch (cmd) {
        case 'delete':
            return errorWrap(mc.delete)(arg, callback);
        case 'flush':
            return errorWrap(mc.flush)(callback);
        case 'get':
            return errorWrap(mc.get)(arg, callback);
        case 'keys':
            return errorWrap(mc.keys)(arg, callback);
        case 'set':
            return errorWrap(mc.set)({
                key: arg,
                value: split.length === 3 ? split[2] : null
            }, callback);
        case 'snapshot':
            return errorWrap(mc.snapshot)(callback);
        case 'stat':
            return errorWrap(mc.stat)(callback);
        case 'ttl':
            return errorWrap(mc.ttl)(arg, split.length === 3 ? split[2] : null, callback);
    }

    return callback();
}

function completerFunction(partial, callback) {
    const split = partial.trim().split(/\s+/);

    if (split.length === 0) {
        return callback(null, [COMMANDS, partial]);
    }

    const cmd = split[0];

    if (split.length === 1 && COMMANDS.indexOf(`${cmd} `) < 0) {
        return callback(null,
            [
                _.filter(COMMANDS, (c) => {
                    return c.startsWith(cmd);
                }),
                partial
            ]
        );
    }

    switch (cmd) {
        case 'delete':
        case 'get':
        case 'keys':
            return keyCompleter(partial, callback);
    }

    return callback(null, [[], partial]);
}

function keyCompleter(partial, callback) {
    if (!partial) {
        return callback();
    }

    const split = partial.trim().split(/\s+/);

    if (split.length < 1) {
        return callback();
    }

    const cmd = split[0];
    let partialKey = split.length == 2 ? split[1] : '*';

    // wildcard all queries
    if (!partialKey.endsWith('*')) {
        partialKey += '*';
    }

    partialKey = `^${partialKey.replace('*', '.*')}$`;

    return mc.keys(partialKey, (err, results) => {
        if (err) {
            return callback(null, [[], partial]);
        }

        results = _.map(results, res => `${cmd} ${res}`);

        return callback(null, [results, partial]);
    });
}

function writerFunction(output) {
    switch (typeof output) {
        case 'string':
            // try to parse as json and pretty print
            try {
                output = JSON.parse(output);
                output = JSON.stringify(output, null, 2);
                output = output.replace(JSON_LINE_REGEX, ansiJsonColorReplacer);

                return output;
            } catch (e) {
                return util.inspect(output, true, 5, true);
            }
        case 'object':
            try {
                output = JSON.stringify(output, null, 2);
                output = output.replace(JSON_LINE_REGEX, ansiJsonColorReplacer);
                return output;
            } catch (e) {
                return util.inspect(output, true, 5, true);
            }
    }

    return util.inspect(output, true, 5, true);
}

function ansiJsonColorReplacer(match, pIndent, pKey, pVal, pEnd) {
    let result = pIndent || '';

    if (pKey) {
        result += pKey;
    }

    if (pVal) {
        if (pVal.startsWith('"')) {
            result += util.format(`${ANSI_GREEN}%s${ANSI_RESET}`, pVal);
        } else {
            result += util.format(`${ANSI_RED}%s${ANSI_RESET}`, pVal);
        }
    }

    result += pEnd || '';

    return result;
}

function errorWrap(func) {
    return function(arg1, arg2, arg3) {
        if (typeof arg1 === 'function') {
            return func((error, result) => {
                return arg1(null, error || result);
            });
        }

        if (typeof arg2 === 'function') {
            return func(arg1, (error, result) => {
                return arg2(null, error || result);
            });
        }

        if (typeof arg3 === 'function') {
            return func(arg1, arg2, (error, result) => {
                return arg3(null, error || result);
            });
        }

        throw new Error('One of the first three arguments must be a callback function');
    };
}

module.exports = {
    run: runRepl
};
