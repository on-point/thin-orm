var ORM = require('../main'),
    blogs,
    tableName = 'blogs',
    columns = ['id', 'userId', 'text', 'createdAt'],
    data = {},
    options = { data: data };


function setup() {
    options.data = {};
    data = options.data;
}

function callback(err, results) {
    data.err = err;
    data.results = results;
    data.callbackCalled = true;
}

exports['table definition'] = function(t) {
    var driver = ORM.createDriver("test", options);
    ORM.table(tableName)
        .columns(columns);
    blogs = ORM.createClient(driver, tableName);
    t.done();
};

exports['a simple find many query'] = function(t) {
    setup();
    blogs.findMany({}, callback);
    t.equal(data.params.length, 0);
    t.ok(/SELECT\s+id.*user_id.*text.*created_at.*FROM\s+blogs/.test(data.query), 'generates a select');
    t.ok(data.callbackCalled, "callback was called");
    t.done();
};

exports['a simple find one query'] = function (t) {
    setup();
    blogs.findOne({criteria: { userId: 1 }}, callback);
    t.ok(/SELECT\s+id.*user_id.*text.*created_at.*FROM\s+blogs\s+WHERE\s+user_id\s+=\s+\$1/.test(data.query), 'generates a select');
    t.equal(data.params.length, 1);
    t.equal(data.params[0], 1);
    t.ok(data.callbackCalled, "callback was called");
    t.done();
};

exports['a simple findById query'] = function (t) {
    setup();
    blogs.findById(1, callback);
    t.ok(/SELECT\s+id.*user_id.*text.*created_at.*FROM\s+blogs\s+WHERE\s+id\s+=\s+\$1/.test(data.query), 'generates a select');
    t.equal(data.params.length, 1);
    t.equal(data.params[0], 1);
    t.ok(data.callbackCalled, "callback was called");
    t.done();
};

exports['a query with sorted results'] = function (t) {
    setup();
    blogs.findMany({ sort: { createdAt: "DESC" }}, callback);
    t.equal(data.params.length, 0);
    t.ok(/SELECT\s+id.*user_id.*text.*created_at.*FROM\s+blogs\s+ORDER\s+BY\s+created_at\s+DESC/.test(data.query), 'generates a select');
    t.ok(data.callbackCalled, "callback was called");
    t.done();
};

exports['a query with paging (offset, limit, and sort)'] = function (t) {
    setup();
    blogs.findMany({ offset:100, limit:200, sort: { createdAt: 'ASC' }}, callback);
    t.equal(data.params.length, 0);
    t.ok(/SELECT\s+id.*user_id.*text.*created_at.*FROM\s+blogs\s+ORDER\s+BY\s+created_at\s+ASC\s+LIMIT\s200\s+OFFSET\s+100/.test(data.query), 'generates a select');
    t.ok(data.callbackCalled, "callback was called");
    t.done();
};

exports['a find many with multiple criteria and comparison operator'] = function (t) {
    setup();
    var aWeekAgo = new Date(Date.now() - 7 * 24 * 3600 * 1000);
    blogs.findMany({ criteria: { userId: 216, createdAt: { GT: aWeekAgo }}}, callback);
    t.ok(/SELECT\s+id.*user_id.*text.*created_at.*FROM\s+blogs\s+WHERE\s+user_id\s+=\s+\$1\s+AND\s+created_at\s>\s\$2/.test(data.query), 'generates a select');
    t.equal(data.params.length, 2);
    t.equal(data.params[0], 216);
    t.equal(data.params[1], aWeekAgo);
    t.ok(data.callbackCalled, "callback was called");
    t.done();
};

exports['a find many with between comparison operator'] = function (t) {
    setup();
    var aWeekAgo = new Date(Date.now() - 7 * 24 * 3600 * 1000);
    var now = new Date();
    blogs.findMany({ criteria:{ createdAt:{ BETWEEN: [aWeekAgo, now] }}}, callback);
    t.ok(/SELECT\s+id.*user_id.*text.*created_at.*FROM\s+blogs\s+WHERE\s+created_at\s+>=\s+\$1\s+AND\s+created_at\s+<\s+\$2/.test(data.query), 'generates a select');
    t.equal(data.params.length, 2);
    t.equal(data.params[0], aWeekAgo);
    t.equal(data.params[1], now);
    t.ok(data.callbackCalled, "callback was called");
    t.done();
};

exports['a query for a column with a null value'] = function (t) {
    setup();
    blogs.findMany({ criteria: { text: null }}, callback);
    t.equal(data.params.length, 0);
    t.ok(/SELECT\s+id.*user_id.*text.*created_at.*FROM\s+blogs\s+WHERE\s+text\s+IS\s+NULL/.test(data.query), 'generates a select');
    t.ok(data.callbackCalled, "callback was called");
    t.done();
};
