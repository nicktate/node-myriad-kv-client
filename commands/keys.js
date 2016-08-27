'use strict';

const _ = require('lodash');
const net = require('net');

const constants = require('../lib/constants');

module.exports = function(client) {
    return function(pattern, fn) {
        const socket = new net.Socket();

        if(_.isFunction(pattern)) {
            fn = pattern;
            pattern = undefined;
        }

        socket.connect(client.options.port, client.options.host, () => {
            socket.write(['KEYS', pattern].join(' '));
            socket.write(constants.message.DELIMITER);
        });

        socket.on('error', (err) => {
            return fn(err);
        });

        socket.on('data', (data) => {
            socket.destroy();

            data = data.toString().split(constants.message.DELIMITER)[0];

            if(_.isEmpty(data)) {
                return fn();
            }

            return fn(null, data.split(','));
        });
    };
};
