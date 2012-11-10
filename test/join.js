var ORM = require('../main'),
    blogs,
    userClient,
    blogClient,
    commentClient,
    usersTableName = 'users',
    blogsTableName = 'blogs',
    commentsTableName = 'comments',
    userColumns = ['id', 'login', 'first', 'last'],
    blogColumns = ['id', 'userId', 'text', 'createdAt'],
    commentColumns = ['id', 'userId', 'blogId', 'text', 'createdAt'],
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

exports['table definitions'] = function (t) {
    var driver = ORM.createDriver("test", options);
    ORM.table(usersTableName)
        .columns(userColumns);
    userClient = ORM.createClient(driver, usersTableName);
    ORM.table(blogsTableName)
        .columns(blogColumns)
        .join('comments').oneToMany(commentsTableName).on({ id: 'blogId' })
        .join('login').oneToOne(usersTableName).on({ userId: 'id' }).columnMap({ name: 'login' });
    blogClient = ORM.createClient(driver, blogsTableName);
    ORM.table(commentsTableName)
        .columns(commentColumns)
        .join('login').oneToOne(usersTableName).on({ userId:'id' }).columnMap({ name:'login' }).default();
    commentClient = ORM.createClient(driver, commentsTableName);
    t.done();
};

exports['caller can specify a one to one join'] = function (t) {
    setup();
    blogClient.findMany({ criteria:{ userId: 1 }, joins:[ 'login' ] }, callback);
    t.equal(data.params.length, 1);
    t.ok(/SELECT\s+blogs.id.*blogs.user_id.*blogs.text.*blogs.created_at.*users.login\s+AS\s+"name"\s+FROM\s+blogs\s+JOIN\s+users\s+ON\s+blogs.user_id\s+=\s+users.id\s+WHERE\s+blogs.user_id\s+=\s+\$1/.test(data.query), 'generates a select');
    t.ok(data.callbackCalled, "callback was called");
    t.done();
};

exports['caller can specify a one to many join'] = function (t) {
    setup();
    blogClient.findMany({ criteria:{ userId:1 }, joins:[ 'comments' ] }, callback);
    t.equal(data.params.length, 1);
    t.ok(/SELECT\s+blogs.id.*blogs.user_id.*blogs.text.*blogs.created_at.*.*comments.id.*comments.user_id.*comments.blog_id.*comments.text.*comments.created_at.*FROM\s+blogs\s+JOIN\s+comments\s+ON\s+blogs.id\s+=\s+comments.blog_id\s+WHERE\s+blogs.user_id\s+=\s+\$1/.test(data.query), 'generates a select');
    t.ok(data.callbackCalled, "callback was called");
    t.done();
};

exports['a default join should always be incorporated into the query'] = function (t) {
    setup();
    commentClient.findMany({ criteria:{ userId:1 }}, callback);
    t.equal(data.params.length, 1);
    t.ok(/SELECT\s+comments.id.*comments.user_id.*comments.blog_id.*comments.text.*comments.created_at.*users.login.*FROM\s+comments\s+JOIN\s+users\s+ON\s+comments.user_id\s+=\s+users.id\s+WHERE\s+comments.user_id\s+=\s+\$1/.test(data.query), 'generates a select');
    t.ok(data.callbackCalled, "callback was called");
    t.done();
};
