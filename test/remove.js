var ORM = require('../main'),
    blogs,
    tableName = 'blogs',
    columns = ['id', 'userId', 'text', 'createdAt'],
    data = {},
    options = { data:data };


function setup() {
    options.data = {};
    data = options.data;
}

function callback(err, results) {
    data.err = err;
    data.results = results;
    data.callbackCalled = true;
}

exports['table definition'] = function (t) {
    var driver = ORM.createDriver("test", options);
    ORM.table(tableName)
        .columns(columns);
    blogs = ORM.createClient(driver, tableName);
    t.done();
};

exports['remove all blog entries created by a user'] = function (t) {
    setup();
    blogs.remove({ criteria: { userId: 7 }}, callback);
    t.equal(data.params.length, 1);
    t.equal(data.params[0], 7);
    t.ok(/DELETE\s+FROM\s+blogs\s+WHERE\s+user_id\s+=\s+\$1/.test(data.query), 'generates a delete');
    t.ok(data.callbackCalled, "callback was called");
    t.done();
};

exports['remove one blog entry'] = function (t) {
    setup();
    blogs.remove(22, callback);
    t.equal(data.params.length, 1);
    t.equal(data.params[0], 22);
    t.ok(/DELETE\s+FROM\s+blogs\s+WHERE\s+id\s+=\s+\$1/.test(data.query), 'generates a delete');
    t.ok(data.callbackCalled, "callback was called");
    t.done();
};

exports['remove all blog entries'] = function (t) {
    setup();
    blogs.remove(null, callback);
    t.equal(data.params.length, 0);
    t.ok(/DELETE\s+FROM\s+blogs/.test(data.query), 'generates a delete');
    t.ok(data.callbackCalled, "callback was called");
    t.done();
};