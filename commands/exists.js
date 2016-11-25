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
            socket.write(['EXISTS', key].join(' '));
            socket.write(constants.message.DELIMITER);
        });

        socket.on('error', (err) => {
            socket.destroy();
            return fn(err);
        });

        let buffer = '';

        socket.on('data', (data) => {
            buffer += data.toString();

            if (buffer.indexOf(constants.message.DELIMITER) === -1) {
                return;
            }

            socket.end();
            data = buffer.split(constants.message.DELIMITER)[0];

            if(_.isEmpty(data)) {
                return fn();
            }

            try {
                const no_leader = new errors.ENOLEADER();

                if(JSON.parse(data).error === no_leader.message) {
                    return fn(no_leader);
                } else {
                    if(data === 'true') {
                        return fn(null, true);
                    } else if(data === 'false') {
                        return fn(null, false);
                    } else {
                        return fn(null, data);
                    }
                }
            } catch(err) {
                return fn(null, data);
            }
        });
    };
};
