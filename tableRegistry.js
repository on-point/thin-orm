var Table = require('./table'),
    TableBuilder = require('./tableBuilder');

var TableRegistry = {
    registry: {},

    // register a table
    table: function(tableName) {
        var table = new Table(tableName, this);
        this.registry[tableName] = table;
        return new TableBuilder(table);
    },

    // get the definition for a table from the registry
    getTableDefinition: function(tableName) {
        var table = this.registry[tableName];
        table.init();
        return table;
    }

};

module.exports = TableRegistry;