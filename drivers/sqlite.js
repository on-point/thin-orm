function createSqliteDriver(context, options) {

    return {
        query: function (query, parameters, id, callback) {
            var self = context;
            if (/^select/i.test(query)) {
                // a SELECT query
                options.db.all(query, parameters, function (err, rows) {
                    if (err)
                        self.logger('query on ' + id + ':\n\ttext: ' + query + JSON.stringify(parameters) + '\n\tfailed: ' + err);
                    else
                        self.logger('query on ' + id + ':\n\ttext: ' + query + '\n\tparams: ' + JSON.stringify(parameters) + '\n\treturns ' + JSON.stringify(rows));
                    console.log('rows>');
                    console.log(rows);
                    console.log('<rows');
                    callback(err, { rows: rows, count: rows.length });
                });
            } else {
                // all other queries
                options.db.run(query, parameters, function (err, result) {
                    if (err)
                        self.logger('query on ' + id + ':\n\ttext: ' + query + JSON.stringify(parameters) + '\n\tfailed: ' + err);
                    else
                        self.logger('query on ' + id + ':\n\ttext: ' + query + '\n\tparams: ' + JSON.stringify(parameters) + '\n\treturns ' + JSON.stringify(this));
                    console.log('this>');
                    console.log(this);
                    console.log('<this');
                    callback(err, this);
                });
            }
        },

        // gets a SQL clause to have an INSERT query return the id of the new row
        getInsertQueryText: function (table) {
            return "";
        },

        // gets the id of a new row from the result of an INSERT query
        getIdForInsert: function (table, result) {
            if (result && result.lastID)
                return result.lastID;
            return -1;
        }
    };
}

module.exports = createSqliteDriver;