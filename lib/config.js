'use strict';

const yargs = require('yargs');

yargs.option('host', {
    alias: 'h',
    describe: 'myraid host to connect to (defaults to 0.0.0.0)',
    default: '0.0.0.0'
});

yargs.option('port', {
    alias: 'p',
    describe: 'myraid port to connect to (defaults to 2666)',
    default: '2666'
});

module.exports = yargs.argv;
