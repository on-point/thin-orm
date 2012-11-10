var Join = require('./join');


// a fluent interface for building table and join definintions
function TableBuilder(table) {
    this.table = table;
}

// (required) define the columns in the table (in javascript camel case)
TableBuilder.prototype.columns = function (columns) {
    if (!(columns instanceof Array))
        columns = Array.prototype.slice.call(arguments);
    this.table.columns = columns;
    this.table.selectColumns = columns;
    return this;
};

// (optional) define the default selection criteria for the table
TableBuilder.prototype.defaultSelectCriteria = function (criteria) {
    this.table.defaultSelectCriteria = criteria;
    return this;
};

// (optional) define the columns to return from a SELECT query
TableBuilder.prototype.selectColumns = function (columns) {
    if (!(columns instanceof Array))
        columns = Array.prototype.slice.call(arguments);
    this.table.selectColumns = columns;
    return this;
};

// (optional) create a join definition
TableBuilder.prototype.join = function (name) {
    this.currentJoin = new Join(name);
    this.table.joins[name] = this.currentJoin;
    return this;
};

// (required for joins) specify the join criteria
TableBuilder.prototype.on = function (criteria) {
    this.currentJoin.criteria = criteria;
    return this;
};

// (required for joins) specify a join table with a one to one mapping
TableBuilder.prototype.oneToOne = function (table) {
    this.currentJoin.type = Join.ONE_TO_ONE;
    this.currentJoin.table = table;
    return this;
};

// (required for joins) specify a join table with a one to one mapping
TableBuilder.prototype.oneToMany = function (table) {
    this.currentJoin.type = Join.ONE_TO_MANY;
    this.currentJoin.table = table;
    return this;
};

// (optional) should this join be used for all queries?
TableBuilder.prototype.default = function () {
    this.currentJoin.default = true;
    return this;
};

// (optional) specify the columns from the join table to map into the query
//   keys - names to add to parent result
//   values - names of columns in child table
TableBuilder.prototype.columnMap = function (map) {
    this.currentJoin.map = map;
    return this;
};

module.exports = TableBuilder;