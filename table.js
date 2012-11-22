var Util = require('./util'),
    Join = require('./join');

// a table model
function Table(tableName, registry) {
    this.id = 'id';
    this.tableName = tableName;
    this.joins = {};
    this.defaultJoins = [];
    this.columns = null;
    this.selectColumns = null;
    this.defaultSelectCriteria = null;
    this.columnMap = null;
    this.isInitialized = false;
    this.defaultJoinsNeedPostProcessing = false;
    this.registry = registry;
}

Table.prototype.init = function() {
    if (this.isInitialized) return;
    this.isInitialized = true;
    if (!this.columnMap)
        this.columnMap = camelCaseToUnderscoreMap(this.columns);

    // build a list of default join names
    if (this.joins) {
        Util.eachKey(this.joins, function (name, join) {
            if (join.default)
                this.defaultJoins.push(name);
        }, this);
    }
    this.defaultJoinsNeedPostProcessing = this.needsJoinPostProcessing(this.defaultJoins);
};

Table.prototype.selectColumnList = function (dbColumns, joinsOrPrefix) {
    var self = this,
        prefix = ' ',
        joins = this.defaultJoins,
        columns;

    if (joinsOrPrefix instanceof Array)
        joins = joins.concat(joinsOrPrefix);

    if (joins.length > 0)
        prefix = ' ' + this.tableName + '.';
    else if ((typeof joinsOrPrefix === 'string') || (joinsOrPrefix instanceof String))
        prefix = ' ' + joinsOrPrefix + '.';

    columns = dbColumns.map(function (col) {
        var dbName = self.columnMap[col];
        if (dbName === col)
            return prefix + col;
        else if (dbName)
            return prefix + dbName + ' AS "' + col + '"';
        return col;
    });

    if (joins.length > 0)
        columns = columns.concat(this.joinColumns(joins));

    return columns;
};

Table.prototype.joinColumns = function (joins) {
    var columns = [];
    joins.forEach(function (joinName) {
        var join = this.joins[joinName];
        if (join) {
            var map = join.map;
            var joinTable = this.registry.getTableDefinition(join.table);
            if (!map)
                map = joinTable.columnMap;
            Util.eachKey(map, function (field, column) {
                if (join.type === Join.ONE_TO_MANY)
                    columns.push(' ' + join.table + '.' + column + ' AS "' + join.table + '.' + field + '"');
                else
                    columns.push(' ' + join.table + '.' + column + ' AS "' + field + '"');
            });
        }
    }, this);

    return columns;
};

Table.prototype.needsJoinPostProcessing = function (names) {
    if (this.defaultJoinsNeedPostProcessing)
        return true;
    if (!names || (names.length === 0))
        return false;

    for (var i = 0; i < names.length; i++) {
        var join = this.joins[names[i]];
        if (join && (join.type === Join.ONE_TO_MANY))
            return true;
    }

    return false;
};

// convert camel case to underscore
function toUnderscore(str) {
    return str.replace(/([A-Z])/g, function (s) {
        return '_' + s.toLowerCase();
    });
}

// build a map that converts each camel case column name to an underscore name
function camelCaseToUnderscoreMap(columns) {
    var map = {};
    for (var i = 0; i < columns.length; i++)
        map[columns[i]] = toUnderscore(columns[i]);
    return map;
}

module.exports = Table;