function createSqliteDriver(context, options) {

    // TODO: add support for this.lastId vs RETURNING in PG
    return {
        query: function (query, parameters, id, callback) {
            var self = context;
            if (query[0] !== 'S') {
                options.db.run(query, parameters, function (err, result) {
                    if (err)
                        self.logger('query on ' + id + ':\n\ttext: ' + query + JSON.stringify(parameters) + '\n\tfailed: ' + err);
                    else
                        self.logger('query on ' + id + ':\n\ttext: ' + query + '\n\tparams: ' + JSON.stringify(parameters) + '\n\treturns ' + JSON.stringify(this));
                    callback(err, this);
                });
            } else {
                options.db.all(query, parameters, function (err, rows) {
                    if (err)
                        self.logger('query on ' + id + ':\n\ttext: ' + query + JSON.stringify(parameters) + '\n\tfailed: ' + err);
                    else
                        self.logger('query on ' + id + ':\n\ttext: ' + query + '\n\tparams: ' + JSON.stringify(parameters) + '\n\treturns ' + JSON.stringify(rows));
                    callback(err, { rows: rows, count: rows.length });
                });
            }
        },
        getInsertQueryText: function (table) {
            return "";
        },

        getIdForInsert: function (table, result) {
            if (result && result.lastID)
                return result.lastID;
            return -1;
        }
    };
}

module.exports = createSqliteDriver;