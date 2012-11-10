var ORM = require('../../../main'),
    async = require('async'),
    driver,
    userClient,
    blogClient,
    commentClient,
    userIds = {},
    blogIds = {},
    commentIds = {},
    prefix = 'thinorm_',
    usersTableName = prefix + 'users',
    blogsTableName = prefix + 'blogs',
    commentsTableName = prefix + 'comments',
    userColumns = ['id', 'login', 'first', 'last'],
    blogColumns = ['id', 'userId', 'text', 'createdAt'],
    commentColumns = ['id', 'userId', 'blogId', 'text', 'createdAt'];

exports['externalSetup'] = function(options) {
    driver = options.driver;
};

exports['table definition'] = function (t) {
    ORM.table(usersTableName)
        .columns(userColumns);
    userClient = ORM.createClient(driver, usersTableName);
    ORM.table(blogsTableName)
        .columns(blogColumns)
        .join('login').oneToOne(usersTableName).on({ userId: 'id' }).columnMap({ name: 'login' });
    blogClient = ORM.createClient(driver, blogsTableName);
    ORM.table(commentsTableName)
        .columns(commentColumns);
    commentClient = ORM.createClient(driver, commentsTableName);

    t.done();
};

exports['load test data'] = function(t) {

    var userIterator = function(info, cb) {
        userClient.create(info, function(err, result) {
           if (!err) userIds[info.data.login] = result.id;
           cb(err);
        });
    };
    var blogIterator = function (info, cb) {
        var counter = 1;
        blogClient.create(info, function (err, result) {
            if (!err) blogIds["" + info.data.userId + counter++] = result.id;
            cb(err);
        });
    };
    var commentIterator = function (info, cb) {
        var counter = 1;
        commentClient.create(info, function (err, result) {
            if (!err) commentIds["" + info.data.userId + counter++] = result.id;
            cb(err);
        });
    };

    var now = Date.now();
    async.series([
        function(callback) {
            async.forEachSeries([
                { data: { login: 'joe', first: 'Joe', last: 'Smith'}},
                { data: { login: 'martha', first: 'Martha', last: 'Jones'}},
                { data: { login: 'sam', first: 'Sam', last: 'Jackson'}}
            ], userIterator, function(err) {
                callback(err);
            });
        },
        function (callback) {
            async.forEachSeries([
                {  data:{userId: userIds['sam'], text:'blog text 1'}},
                {  data:{userId: userIds['sam'], text:'blog text 2'}},
                {  data:{userId: userIds['sam'], text:'blog text 3'}},
                {  data:{userId: userIds['martha'], text:'blog text 1'}},
                {  data:{userId: userIds['martha'], text:'blog text 2'}},
                {  data:{userId: userIds['joe'], text:'blog text 1'}}
            ], blogIterator, function (err) {
                callback(err);
            });
        },

        function (callback) {
            async.forEachSeries([
                { data:{userId: userIds['sam'], blogId:blogIds['martha4'], text:'so true'}},
                { data:{userId: userIds['martha'], blogId:blogIds['sam1'], text:'you must be kidding'}},
                { data:{userId: userIds['martha'], blogId:blogIds['sam2'], text:'TL;DR'}},
                { data:{userId: userIds['joe'], blogId:blogIds['martha5'], text:'click here for best prices on Viagra'}}
            ], commentIterator, function (err) {
                callback(err);
            });
        }
        ],
        function(err) {
            if (err)
                t.fail("load failed" + err);
            t.done();
        }
    );
};



exports['find user joe by id'] = function (t) {
    userClient.findById(userIds['joe'],
        function(err, result) {
            if (err)
                t.fail("query failed" + err);
            t.equal(result.rows[0].first, 'Joe');
            t.done();
        }
    );
};

exports['find all blogs authored by sam'] = function (t) {
    blogClient.findMany({criteria: {userId: userIds['sam']}, limit: 2},
        function(err, result) {
            if (err)
                t.fail("query failed" + err);
            t.equal(result.rows.length, 2);
            t.equal(result.rows[0].userId, userIds['sam']);
            t.equal(result.rows[1].userId, userIds['sam']);
            t.done();
        }
    );
};

exports['an ad hoc SQL query to find the number of blogs written by each user'] = function (t) {
    userClient.query('SELECT login, count(b.id) AS "blogCount" FROM '
        + usersTableName + ' u JOIN ' + blogsTableName
        + ' b ON u.id = b.user_id GROUP BY 1', [],
        function (err, result) {
            if (err)
                t.fail("query failed" + err);
            var count = {};
            t.equal(result.rows.length, 3);
            for (var i = 0; i < result.rows.length; i++) {
                ['joe', 'martha', 'sam'].forEach(function(name) {
                    if (result.rows[i].login === name) count[name] = result.rows[i].blogCount;
                });
            }
            t.equal(count.sam, 3);
            t.equal(count.martha, 2);
            t.equal(count.joe, 1);
            t.done();
        }
    );
};

exports['use a one to one join to include the login name of the user in the result'] = function (t) {
    blogClient.findMany({ criteria: { userId: userIds['sam'] }, joins: [ 'login' ] },
        function(err, result) {
            if (err)
                t.fail("query failed" + err);
            t.equal(result.rows.length, 3);
            t.equal(result.rows[0].name, 'sam');
            t.equal(result.rows[1].name, 'sam');
            t.equal(result.rows[2].name, 'sam');
            t.done();
        }
    );
};

exports['update a user\'s first name and login'] = function (t) {
    userClient.update({ criteria:{ id: userIds['sam'] }, data: { 'first': 'Samuel', login: 'samuel' } },
        function (err, result) {
            if (err)
                t.fail("update failed" + err);
            t.done();
        }
    );
};

exports['a query of the blog postings should now show the new login'] = function (t) {
    blogClient.findMany({ criteria:{ userId: userIds['sam'] }, joins:[ 'login' ] },
        function (err, result) {
            if (err)
                t.fail("query failed" + err);
            t.equal(result.rows.length, 3);
            t.equal(result.rows[0].name, 'samuel');
            t.done();
        }
    );
};

exports['delete all of sam\'s comments'] = function(t) {
   commentClient.remove({ criteria: { userId: userIds['sam'] }} ,
       function (err, result) {
           if (err)
               t.fail("query failed" + err);
           t.done();
       }
   );
};

exports['sam should not have any rows in the comment table'] = function (t) {
    commentClient.findMany({ criteria:{ userId:userIds['sam'] }},
        function (err, result) {
            if (err)
                t.fail("query failed" + err);
            t.equal(result.rows.length, 0);
            t.done();
        }
    );
};

exports['but martha should still have rows in the comment table'] = function (t) {
    commentClient.findMany({ criteria:{ userId:userIds['martha'] }},
        function (err, result) {
            if (err)
                t.fail("query failed" + err);
            t.equal(result.rows.length, 2);
            t.done();
        }
    );
};

exports['delete all comments'] = function (t) {
    commentClient.remove({ },
        function (err, result) {
            if (err)
                t.fail("query failed" + err);
            t.done();
        }
    );
};

exports['there should be no rows in the comment table'] = function (t) {
    commentClient.findMany({ },
        function (err, result) {
            if (err)
                t.fail("query failed" + err);
            t.equal(result.rows.length, 0);
            t.done();
        }
    );
};