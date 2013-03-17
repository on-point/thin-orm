var CRUD = require('./crud'),
    TableRegistry = require('./tableRegistry');

var API = {};

// table definition API's
API.getTableDefinition = TableRegistry.getTableDefinition;
API.table = TableRegistry.table;
API.registry = TableRegistry.registry;

API.createClient = function(driver, tableName) {
    return new CRUD(driver, tableName);
};

API.createDriver = function (name, options) {
    this.logger = options.logger || console.log;
    var driver = require("./drivers/" + name);
    return driver(this, options);
};

API.CRUD = CRUD;

module.exports = API;
