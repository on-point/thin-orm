var ORM = require('../../main'),
    pg = require('pg'),
    async = require('async'),
    blog = require('./common/blog'),
    prefix = 'thinorm_',
    usersTableName = prefix + 'users',
    blogsTableName = prefix + 'blogs',
    commentsTableName = prefix + 'comments';

function ignore(cb) {
    return function (err, result) {
        cb(null, null);
    }
}

pg.defaults.user = process.env['PG_USER'];
pg.defaults.password = process.env['PG_PW'];
pg.defaults.database = process.env['PG_DB'];

var setup = function(t) {
    pg.connect(function (err, db) {
        if (err) {
            t.fail("cannot connect" + err);
            t.done();
            return;
        }
        async.series([
            function (cb) {
                db.query('delete ' + usersTableName, ignore(cb));
            },
            function (cb) {
                db.query('drop table ' + usersTableName, ignore(cb));
            },
            function (cb) {
                db.query('create table ' + usersTableName + '(id SERIAL, login varchar(30), first varchar(50), last varchar(50))', cb);
            },
            function (cb) {
                db.query('delete ' + blogsTableName, ignore(cb));
            },
            function (cb) {
                db.query('drop table ' + blogsTableName, ignore(cb));
            },
            function (cb) {
                db.query('create table ' + blogsTableName + '(id SERIAL, user_id integer, "text" varchar(65535), created_at date)', cb);
            },
            function (cb) {
                db.query('delete ' + commentsTableName, ignore(cb));
            },
            function (cb) {
                db.query('drop table ' + commentsTableName, ignore(cb));
            },
            function (cb) {
                db.query('create table ' + commentsTableName + '(id SERIAL, blog_id integer, user_id integer, "text" varchar(65535), created_at date)', cb);
            }
        ],
            function (err, result) {
                if (err)
                    t.fail("setup failed" + err);
                t.done();
            }
        );
    });
};

blog.externalSetup({ driver: ORM.createDriver('pg', { pg:pg })});

exports['setup'] = setup;

for (var key in blog) {
    if (key !== "externalSetup")
        exports[key] = blog[key];
}
