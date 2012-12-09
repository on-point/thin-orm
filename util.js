var Util = {};

// shallow copy
Util.extend = function(obj) {
    for (var i = 1; i < arguments.length; i++) {
        var arg = arguments[i];
        for (var prop in arg) {
            obj[prop] = arg[prop];
        }
    }
    return obj;
};

// iterate over all the keys in 'obj', call 'func' with each key/value pair
Util.eachKey = function(obj, func, context) {
    var keys = Object.keys(obj);
    for (var i = 0; i < keys.length; i++) {
        func.call(context, keys[i], obj[keys[i]]);
    }
};

module.exports = Util;
