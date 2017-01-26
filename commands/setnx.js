'use strict';

const constants = require('../lib/constants');
const errors = require('../lib/errors');

const _ = require('lodash');
const net = require('net');

module.exports = function(client) {
    return function(entry, fn) {
        const socket = new net.Socket();

        if(_.isFunction(entry)) {
            fn = entry;
            entry = undefined;
        }

        if(_.isUndefined(entry) || !_.has(entry, 'key') || !_.has(entry, 'value')) {
            return fn(new errors.EINSUFFINFO());
        }

        socket.connect(client.options.port, client.options.host, () => {
            socket.write(['SETNX', entry.key, entry.value].join(' '));
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
                const failed_proxy = new errors.EFAILEDPROXY();
                const error_exists = new errors.EEXISTS();

                if(JSON.parse(data).error == no_leader.message) {
                    return fn(no_leader);
                } else if(JSON.parse(data).error == failed_proxy.message) {
                    return fn(failed_proxy);
                } else if(JSON.parse(data).error == error_exists.message) {
                    return fn(error_exists);
                } else {
                    return fn();
                }
            } catch(err) {
                return fn();
            }
        });
    };
};

