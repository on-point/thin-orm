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

exports['reset text of all of a user\'s blogs'] = function (t) {
    setup();
    var text = "This blog has been removed";
    blogs.update({ criteria:{ userId:7 }, data: { text: text }}, callback);
    t.equal(data.params.length, 2);
    t.equal(data.params[0], text);
    t.equal(data.params[1], 7);
    t.ok(/UPDATE\s+blogs\s+SET\s+text\s+=\s+\$1\s+WHERE\s+user_id\s+=\s+\$2/.test(data.query), 'generates an update');
    t.ok(data.callbackCalled, "callback was called");
    t.done();
};

exports['reset text of all blogs'] = function (t) {
    setup();
    var text = "This blog has been removed";
    blogs.update({ data:{ text: text }}, callback);
    t.equal(data.params.length, 1);
    t.equal(data.params[0], text);
    t.ok(/UPDATE\s+blogs\s+SET\s+text\s+=\s+\$1/.test(data.query), 'generates an update');
    t.ok(data.callbackCalled, "callback was called");
    t.done();
};
