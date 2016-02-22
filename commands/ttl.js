var net = require("net");
var _ = require("lodash");
var errors = require([__dirname, "..", "lib", "errors"].join("/"));
var constants = require([__dirname, "..", "lib", "constants"].join("/"));

module.exports = function(client){
    return function(key, ttl, fn){
        var socket = new net.Socket();

        if(_.isFunction(key)){
            fn = key;
            key = undefined;
            ttl = undefined;
        }
        else if(_.isFunction(ttl)){
            fn = ttl;
            ttl = undefined;
        }

        if(_.isUndefined(key))
            return fn(new errors.EINSUFFINFO());

        socket.connect(client.options.port, client.options.host, function(){
            if(ttl)
                socket.write(["TTL", key, ttl].join(" "));
            else
                socket.write(["TTL", key].join(" "));

            socket.write(constants.message.DELIMITER);
        });

        socket.on("error", function(err){
            return fn(err);
        });

        socket.on("data", function(data){
            socket.destroy();

            data = data.toString().split(constants.message.DELIMITER)[0];

            if(_.isEmpty(data))
                return fn();

            try{
                var no_key = new errors.ENOKEY();
                var no_leader = new errors.ENOLEADER();
                var failed_proxy = new errors.EFAILEDPROXY();

                if(JSON.parse(data).error == no_key.message)
                    return fn(no_key);
                else if(JSON.parse(data).error == no_leader.message)
                    return fn(no_leader);
                else if(JSON.parse(data).error == failed_proxy.message)
                    return fn(failed_proxy);
                else
                    return fn(null, JSON.parse(data).ttl);
            }
            catch(err){
                return fn(null, data);
            }
        });

    }
}
