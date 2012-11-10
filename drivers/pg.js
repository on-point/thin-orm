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

        getInsertQueryText: function(table) { return " RETURNING " + table.id; },

        getIdForInsert: function(table, result) {
            if (result && result.rows && result.rows.length > 0)
                return result.rows[0][table.id];
            return -1;
        }

    };
}

module.exports = createPgDriver;