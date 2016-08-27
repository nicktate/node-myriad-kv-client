'use strict';

const constants = require('../lib/constants');
const errors = require('../lib/errors');

const _ = require('lodash');
const net = require('net');

module.exports = function(client) {
    return function(key, fn) {
        const socket = new net.Socket();

        if(_.isFunction(key)) {
            fn = key;
            key = undefined;
        }

        if(_.isUndefined(key)) {
            return fn(new errors.EINSUFFINFO());
        }

        socket.connect(client.options.port, client.options.host, () => {
            socket.write(['GET', key].join(' '));
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

            try {
                const error = new errors.ENOKEY();

                if(JSON.parse(data).error == error.message) {
                    return fn(error);
                } else {
                    return fn(null, data);
                }
            } catch(err) {
                return fn(null, data);
            }
        });
    };
};
