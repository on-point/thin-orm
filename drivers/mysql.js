function createMySQLDriver(context, options) {
    return  {
        query:function (query, parameters, id, callback) {
            var self = context;
            if (parameters instanceof Array) {
                var parametersPrepared = parameters;
            } else {
                var parametersPrepared = [parameters];
            }
            var queryPrepared = query.replace(/\$\d/g, '\?');
            options.db.query(queryPrepared, parametersPrepared, function (err, result, info) {
                if (err){
                    self.logger('query on ' + id + ':\n\ttext: ' + queryPrepared + JSON.stringify(parametersPrepared) + '\n\tfailed: ' + err);
                } else {
                    self.logger('query on ' + id + ':\n\ttext: ' + queryPrepared + '\n\tparams: ' + JSON.stringify(parametersPrepared) + '\n\treturns ' + JSON.stringify(result));
                }
/*
 { fieldCount: 0,
 affectedRows: 1,
 insertId: 4,
 serverStatus: 2,
 warningCount: 0,
 message: '',
 protocol41: true,
 changedRows: 0 }

*/
                if(result.length==1 && result.insertId!=undefined && result.affectedRows!=undefined && result.changedRows!= undefined){
                    //this is update/delete/insert query
                    callback(err, {rows:result.affectedRows, count: result.fieldCount, insertId:result.insertId});
                } else {
                    //this is select query
                    callback(err, {rows:result, count: result.fieldCount});
                }

            });

        },
        // gets a SQL clause to have an INSERT query return the id of the new row
        getInsertQueryText:function (table) {
            return "";
        },

        // gets the id of a new row from the result of an INSERT query
        getIdForInsert:function (table, result) {
            if (result && result.insertId)
                return result.insertId;
            return -1;
        }
    };
}

module.exports = createMySQLDriver;