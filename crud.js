var TableRegistry = require('./tableRegistry'),
    Util = require('./util'),
    Table = require('./table'),
    Join = require('./join');

var CRUD = function(driver, table, options) {
    options = options || {};
    this.driver = driver;
    this.table = TableRegistry.getTableDefinition(table) || {};
    this.selectColumns = options.selectColumns || this.table.selectColumns;
    this.columns = options.columns || this.table.columns;
    this.tableName = table;
    this.defaultSelectCriteria = options.defaultSelectCriteria || table.defaultSelectCriteria;
    this.load = options.load;
    this.id = options.id || this.table.id || 'id';
    this.logger = options.logger || console.log;
    this.columnMap = this.table.columnMap;
    this.defaultJoins = this.table.defaultJoins;
};

/*
 * query - execute an SQL query
 *
 * query: the text of the query; can be parameterized with placeholders $1, $2, etc
 * parameters: an array of values for each of the placeholders in the query
 * callback: a function with signature (err, result) to be called with results of the query
 */
CRUD.prototype.query = function(query, parameters, callback) {
    this.driver.query(query, parameters, "SQL QUERY", callback);
};

/*
 * findMany - execute a SELECT and return many rows
 *
 * options:
 *   criteria: filter criteria that are applied to the WHERE clause to limit results
 *   columns: array of column names to return
 *   joins: array of join names to apply to the query
 *   limit: (int) max number of rows
 *   offset: (int) start row
 *   sort: hash of column names mapped to ASC or DESC
 * callback: a function with signature (err, result) to be called with results of the query
 */
CRUD.prototype.findMany = function(options, callback) {
    var values = [],
        query,
        self = this;

    options = options || {};
    if (this.defaultSelectCriteria)
        options.criteria = Util.extend({}, this.defaultSelectCriteria, options.criteria);

    query = 'SELECT ' + this.table.selectColumnList(options.columns || this.selectColumns, options.joins) + ' FROM ' + this.tableName;
    query += this._applyJoins(options.joins);
    query += this._applyCriteria(options, values);

    if (typeof(callback) !== 'function')
        callback = CRUD.returnMany(callback);

    if (this.table.needsJoinPostProcessing(options.joins))
        callback = this._createJoinCallback(options, callback);

    this.driver.query(query, values, this.tableName, callback);
};

/*
 * findById - execute a SELECT using the table's unique id column and return one row
 *
 * id: the value of the id
 * callback: a function with signature (err, result) to be called with results of the query
 */
CRUD.prototype.findById = function(id, callback) {
    var criteria = {};
    criteria[this.id] = id;
    return this.findOne({ criteria: criteria }, callback);
};

/*
 * findOne - execute a SELECT with criteria and return the first row
 * options: (same as findMany)
 * callback: a function with signature (err, result) to be called with results of the query
 */
CRUD.prototype.findOne = function(options, callback) {
    var values = [],
        query;

    options = options || {};
    query = 'SELECT ' + this.table.selectColumnList(options.columns || this.selectColumns, options.joins) + ' FROM ' + this.tableName;
    query += this._applyJoins(options.joins);
    query += this._applyCriteria(options, values);

    callback = CRUD.returnOne(callback);

    this.driver.query(query, values, this.tableName, callback);
};

/*
 * create - execute an INSERT and return the id of the new row
 *
 * options:
 *    data: a hash that maps column names to column values
 * callback: a function with signature (err, result) to be called with results of the query
 */
CRUD.prototype.create = function(options, callback) {
    var values = [],
        column,
        self = this,
        data = options.data;

    var columns = this.columns.filter(function(col) {
            return col !== this.id;
        }, this);
    var columnList = columns.map(function(item) { return this.columnMap[item]; }, this);

    var query = 'INSERT INTO ' + this.tableName
              + ' ( ' + columnList + ' ) '
              + ' VALUES ( ';

    for (var i = 0; i < columns.length; i++) {
        column = columns[i];
        if (column === 'createdAt')
            values[i] = new Date();
        else if (column === 'updatedAt')
            values[i] = new Date();
        else
            values[i] = data[column];
        query += '$' + (i + 1);
        if (i < columns.length - 1)
            query += ', ';
    }
    query += ') ';
    query += options.returning || this.driver.getInsertQueryText(this.table);

    if (typeof(callback) !== 'function')
        callback = CRUD.returnOne(callback);

    this.driver.query(query, values, this.tableName, function(err, result) {
        var id = self.driver.getIdForInsert(self.table, result);
        var obj = {};
        obj[self.id] = id;
        callback(err, obj);
    });
};

/*
 * update - execute an UPDATE statement
 *
 * options:
 *   criteria: (same as findMany)
 *   data: a hash that maps column names to column values
 * callback: a function with signature (err, result) to be called with results of the query
 */
CRUD.prototype.update = function(options, callback) {
    var values = [],
        column,
        data,
        j = 0,
        columns = this.columns,
        query = 'UPDATE ' + this.tableName + ' SET ';

    options = options || {};
    data = options.data;
    for (var i = 0; i < columns.length; i++) {
        column = columns[i];
        if (column === 'createdAt') {
            continue;
        } else if (column === 'updatedAt') {
            values[j++] = new Date();
            query += this.columnMap[column] + ' = $' + j + ', ';
        } else if (data[column]) {
            values[j++] = data[column];
            query += this.columnMap[column] + ' = $' + j + ', ';
        }
    }
    
    // remove trailing comma and space
    query = query.substr(0, query.length - 2);

    if (typeof(callback) !== 'function')
        callback = CRUD.returnResult(callback);

    query += this._applyCriteria(options, values);

    this.driver.query(query, values, this.tableName, callback);
};

/*
 * remove - execute a DELETE statement to remove all rows that match the criteria
 *
 * optionsOrId:
 *    criteria - (same as findMany)
 * callback: a function with signature (err, result) to be called with results of the query
 */
CRUD.prototype.remove = function(optionsOrId, callback) {
    var values = [],
        query = 'DELETE FROM ' + this.tableName;

    if (optionsOrId && (typeof optionsOrId === 'object')) {
        query += this._applyCriteria(optionsOrId, values);
    } else if (optionsOrId) {
        // we were passed the row id directly
        query += ' WHERE ' + this.id + ' = $1';
        values[0] = optionsOrId;
    }

    if (typeof(callback) !== 'function')
        callback = CRUD.returnResult(callback);

    this.driver.query(query, values, this.tableName, callback);
};

CRUD.prototype._applyJoins = function(additionalJoins) {
    var query = "",
        joins = this.defaultJoins;

    if (additionalJoins)
        joins = joins.concat(additionalJoins);

    joins.forEach(function(joinName) {
        var join = this.table.joins[joinName];
        if (join)
            query += this._join(join);
        else
            this.logger('Table ' + this.tableName + ' is missing a join named ' + joinName);
    }, this);

    return query;
};

// build a join clause
CRUD.prototype._join = function(criteria) {
    var query = ' LEFT OUTER JOIN ' + criteria.table + ' ON ',
        childTable = TableRegistry.getTableDefinition(criteria.table),
        onClauses = [],
        self = this;

    Util.eachKey(criteria.criteria, function(parentCol, childCol) {
        onClauses.push(self.tableName + '.' + self.columnMap[parentCol]
            + ' = ' + criteria.table + '.' + childTable.columnMap[childCol]);
    });

    query += onClauses.join(', ');

    return query;
};

CRUD.prototype.selectColumnList = function(dbColumns, joinOrPrefix) {
    return this.table.selectColumnList(dbColumns, joinOrPrefix);
};

/*
 * _applyCriteria - create WHERE, ORDER BY, and LIMIT clauses for the query
 * options:
 *   criteria: filter criteria that are applied to the WHERE clause to limit results
 *   columns: array of column names to return
 *   joins: array of join names to apply to the query
 *   limit: (int) max number of rows
 *   offset: (int) start row
 *   sort: hash of column names mapped to ASC or DESC
 * values - an array of parameter values
 */
CRUD.prototype._applyCriteria = function(options, values) {
    var i = values.length + 1,
        prefix = ' ',
        query = '',
        whereClauses = [],
        self = this;

    if ((self.defaultJoins.length > 0) || options.joins)
        prefix = ' ' + this.tableName + '.';

    if (options.criteria) {
        Util.eachKey(options.criteria, function(column, value) {
            if (value == null) {
                whereClauses.push(prefix + self.columnMap[column] + ' IS NULL ');
            }  else if (typeof(value) === 'object') {
                var keys = Object.keys(value);
                var operator;
                switch (keys[0]) {
                    case 'lt':
                    case 'LT': operator = '<'; break;
                    case 'lte':
                    case 'LTE': operator = '<='; break;
                    case 'gt':
                    case 'GT': operator = '>'; break;
                    case 'gte':
                    case 'GTE': operator = '>='; break;
                    case 'ne':
                    case 'NE': operator = '<>'; break;
                    case 'like':
                    case 'LIKE': operator = 'LIKE'; break;
                    case 'ilike':
                    case 'ILIKE': operator = 'ILIKE'; break;
                }
                if (operator) {
                    if ((operator === '<>') && (value[keys[0]] === null)) {
                        whereClauses.push(prefix + self.columnMap[column] + ' IS NOT NULL ');
                    } else {
                        whereClauses.push(prefix + self.columnMap[column] + ' ' + operator + ' $' + i++);
                        values.push(value[keys[0]]);
                    }
                } else {
                    this.logger("ERROR");
                }
            } else {
                whereClauses.push(prefix + self.columnMap[column] + ' = $' + i++);
                values.push(value);
            }
        });
        if (whereClauses.length > 0)
            query += ' WHERE ' + whereClauses.join(' AND ');
    }
    if (options.sort) {
        query += ' ORDER BY ';
        Util.eachKey(options.sort, function(column, direction) {
            direction = (direction === "DESC") ? "DESC" : "ASC";
            query += prefix + self.columnMap[column] + ' ' + direction;
        });
    }
    if (options.limit)
        query += ' LIMIT ' + parseInt(options.limit);
    if (options.offset)
        query += ' OFFSET ' + parseInt(options.offset);
    return query;
};

/*
 * create a callback the will postprocess the result rows by creating sub objects for each
 *  one-to-many join
 */
CRUD.prototype._createJoinCallback = function (options, callback) {
    var joinNames = this.defaultJoins;
    var joins = [];
    var idColumn = this.id;
    var self = this;

    if (options.joins)
        joinNames = joinNames.concat(options.joins);


    for (var i = 0; i < joinNames.length; i++) {
        var join = this.table.joins[joinNames[i]];
        if (join.type === Join.ONE_TO_MANY) {
            var map = join.map;
            var joinTable = TableRegistry.getTableDefinition(join.table);
            if (!map)
                map = joinTable.columnMap;
            joins.push({
                name:join.table,
                columns:Object.keys(map)
            });
        }
    }

    return function (err, result) {
        var resultHash = new OrderedHash();
        if (err || !result) {
            callback(err, result);
            return;
        }
        for (var r = 0; r < result.rows.length; r++) {
            var row = result.rows[r];

            // if the index column has changed, create a new row
            var currentRow = resultHash.get(row[idColumn]);
            if (!currentRow) {
                currentRow = {};
                resultHash.put(row[idColumn], currentRow);
                var keys = Object.keys(row);
                for (var k = 0; k < keys.length; k++) {
                    if (keys[k].indexOf('.') === -1)
                        currentRow[keys[k]] = row[keys[k]];
                }
            }

            // for each join, move the join data into a child object of the current row
            for (var j = 0; j < joins.length; j++) {
                var join = joins[j];
                var data = {};
                var columns = join.columns;
                if (!currentRow[join.name])
                    currentRow[join.name] = [];

                var haveData = false;
                for (var c = 0; c < columns.length; c++) {
                    var name = join.name + '.' + columns[c];
                    if (row[name]) {
                        data[columns[c]] = row[name];
                        haveData = true;
                    }
                    delete row[name];
                }
                if (haveData)
                    currentRow[join.name].push(data);
            }
        }
        self.logger('\n\tconverted to ' + JSON.stringify(resultHash.items));

        callback(err, { rows:resultHash.items, rowCount:resultHash.items.length });
    };
};

// static methods

// remove null values; should this be an option?
CRUD.clean = function(object) {
    if (Array.isArray(object)) {
        for (var i = 0; i < object.length; i++)
            CRUD.clean(object[i]);
    }
    for (var attr in object) {
        if (object.hasOwnProperty(attr)) {
            if (object[attr] == null)
                delete object[attr];
        }
    }
};

CRUD.returnMany = function(response) {
    return function (err, result) {
        if (err) {
            response.send('[ database error: ' + err + ']', 500);
        } else {
            CRUD.clean(result.rows);
            response.send(result.rows);
        }
    }
};

CRUD.returnOne = function(response) {
    return function(err, result) {
        if (err) {
            if (response.send)
                response.send('[ database error: ' + err + ']', 500);
            else if (typeof response === "function")
                response(err, result);
        } else {
            if (response.send) {
                CRUD.clean(result.rows[0]);
                response.send(result.rows[0]);
            } else if (typeof response === "function") {
                if (result.rows)
                    response(null, result.rows[0]);
                else
                    response(null, result);
            }
        }
    }
};

CRUD.returnResult = function(response) {
    return function(err, result) {
        if (err) {
            response.send('[ database error: ' + err + ']', 500);
        } else {
            response.send(result.rows);
        }
    }
};

// implementation of a hash table that preserves the order that the items were added
function OrderedHash() {
    this.items = [];
    this.hash = {};
}

OrderedHash.prototype.get = function (key) {
    return this.hash[key];
};

// this 'put' is not very robust, but is sufficient for our needs
OrderedHash.prototype.put = function (key, value) {
    this.items.push(value);
    this.hash[key] = value;
};


module.exports = CRUD;
