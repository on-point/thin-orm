if(!process.env.MySQL_URL){
    console.error('Set environment variable MySQL_URL');
    console.error('For example, like this before running tests:');
    console.error('export MySQL_URL="mysql://username:password@localhost/dbname?reconnect=true"; npm test');
    process.exit(1);
}

var ORM = require('../../main');
var db = require('mysql').createConnection(process.env.MySQL_URL);
var async = require('async');
var blog = require('./common/blog');
var prefix = 'vodolaz095_',
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
            db.query('delete ' + usersTableName, ignore(cb));
        },
        function (cb) {
            db.query('drop table ' + usersTableName, ignore(cb));
        },
        function (cb) {
            db.query('create table ' + usersTableName + '(id INTEGER PRIMARY KEY, login varchar(30), first varchar(50), last varchar(50))', cb);
        },
        function (cb) {
            db.query('delete ' + blogsTableName, ignore(cb));
        },
        function (cb) {
            db.query('drop table ' + blogsTableName, ignore(cb));
        },
        function (cb) {
            db.query('create table ' + blogsTableName + '(id INTEGER PRIMARY KEY, user_id integer, "text" varchar(65535), created_at date)', cb);
        },
        function (cb) {
            db.query('delete ' + commentsTableName, ignore(cb));
        },
        function (cb) {
            db.query('drop table ' + commentsTableName, ignore(cb));
        },
        function (cb) {
            db.query('create table ' + commentsTableName + '(id INTEGER PRIMARY KEY, blog_id integer, user_id integer, "text" varchar(65535), created_at date)', cb);
        }
    ], function (err, result) {
            if (err)
                t.fail("setup failed" + err);
            t.done();
        }
    );
};

blog.externalSetup({ driver: ORM.createDriver('mysql', { db: db }) });

exports['setup'] = setup;

for (var key in blog) {
    if (key !== "externalSetup")
        exports[key] = blog[key];
}
