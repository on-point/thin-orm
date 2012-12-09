function createPgDriver(context, options) {

    return  {
        query: function (query, parameters, id, callback) {
            var self = context;
            options.pg.connect(function (err, client) {
                if (err) {
                    self.logger('cannot connect to postgresql: ' + err);
                } else {
                    client.query({ text:query, values:parameters }, function (err, result) {
                        if (err)
                            self.logger('query on ' + id + ':\n\ttext: ' + query + JSON.stringify(parameters) + '\n\tfailed: ' + err);
                        else
                            self.logger('query on ' + id + ':\n\ttext: ' + query + '\n\tparams: ' + JSON.stringify(parameters) + '\n\treturns ' + JSON.stringify(result.rows));
                        callback(err, result);
                    });
                }
            });
        },

        // gets a SQL clause to have an INSERT query return the id of the new row
        getInsertQueryText: function(table) {
            return " RETURNING " + table.id;
        },

        // gets the id of a new row from the result of an INSERT query
        getIdForInsert: function(table, result) {
            if (result && result.rows && result.rows.length > 0)
                return result.rows[0][table.id];
            return -1;
        }
    };
}

module.exports = createPgDriver;