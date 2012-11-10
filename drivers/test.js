function createTestDriver(context, options) {
    return {

        query: function testDriver(query, parameters, id, cb) {
            options.data.query = query;
            options.data.params = parameters;
            cb();
        },

        getInsertQueryText:function (table) {
            return "";
        },

        getIdForInsert:function (table, result) {
            return -1;
        }
    };
}

module.exports = createTestDriver;