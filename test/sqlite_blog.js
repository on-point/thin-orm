var ORM = require('../../main');
var sqlite3 = require('sqlite3').verbose();
var db = new sqlite3.Database(':memory:');
var async = require('async');
var blog = require('./common/blog');
var prefix = 'thinorm_',
    usersTableName = prefix + 'users',
    blogsTableName = prefix + 'blogs',
    commentsTableName = prefix + 'comments';

function ignore(cb) {
    return function (err, result) {
        cb(null, null);
    }
}

var setup = function(t) {
    async.series([
        function (cb) {
            db.run('delete ' + usersTableName, ignore(cb));
        },
        function (cb) {
            db.run('drop table ' + usersTableName, ignore(cb));
        },
        function (cb) {
            db.run('create table ' + usersTableName + '(id INTEGER PRIMARY KEY, login varchar(30), first varchar(50), last varchar(50))', cb);
        },
        function (cb) {
            db.run('delete ' + blogsTableName, ignore(cb));
        },
        function (cb) {
            db.run('drop table ' + blogsTableName, ignore(cb));
        },
        function (cb) {
            db.run('create table ' + blogsTableName + '(id INTEGER PRIMARY KEY, user_id integer, "text" varchar(65535), created_at date)', cb);
        },
        function (cb) {
            db.run('delete ' + commentsTableName, ignore(cb));
        },
        function (cb) {
            db.run('drop table ' + commentsTableName, ignore(cb));
        },
        function (cb) {
            db.run('create table ' + commentsTableName + '(id INTEGER PRIMARY KEY, blog_id integer, user_id integer, "text" varchar(65535), created_at date)', cb);
        }
    ], function (err, result) {
            if (err)
                t.fail("setup failed" + err);
            t.done();
        }
    );
};

blog.externalSetup({ driver: ORM.createDriver('sqlite', { db: db }) });

exports['setup'] = setup;

for (var key in blog) {
    if (key !== "externalSetup")
        exports[key] = blog[key];
}
