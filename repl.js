'use strict';

const MyriadKV = require('./application');
const mc = new MyriadKV({
    host: '0.0.0.0',
    port: 2666
});

const ANSI_RED = '\x1b[31m';
const ANSI_GREEN = '\x1b[32m';
const ANSI_YELLOW = '\x1b[33m';
const ANSI_BLUE = '\x1b[34m';
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
    'stats ',
    'ttl '
];

repl.start({
    prompt: 'myriad-kv > ',
    eval: evalFunction,
    completer: completerFunction,
    writer: writerFunction
});

function evalFunction(expression, context, filename, callback) {
    const split = expression.trim().split(/\s+/);

    if (split.length === 0) {
        return callback();
    }

    const cmd = split[0];
    const arg = split.length == 2 ? split[1] : null;

    switch (cmd) {
        case 'get':
            return getFunction(arg, callback);
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
        case 'keys':
        case 'delete':
        case 'get':
            return keyCompleter(partial, callback);
    }

    return callback(null);
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

function getFunction(arg, callback) {
    if (!arg) {
        return callback();
    }

    return mc.get(arg, (err, res) => {
        return callback(null, err || res);
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
    }

    return util.inspect(output, true, 5, true);
}

function ansiJsonColorReplacer(match, pIndent, pKey, pVal, pEnd) {
    let result = pIndent || '';

    if (pKey) {
        result += pKey;
    }

    if (pVal) {
        if (pVal.startsWith("\"")) {
            result += util.format(`${ANSI_GREEN}%s${ANSI_RESET}`, pVal);
        } else {
            result += util.format(`${ANSI_RED}%s${ANSI_RESET}`, pVal);
        }
    }

    result += pEnd || '';

    return result;
}
