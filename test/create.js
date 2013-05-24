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


exports['table definition'] = function (t) {
    var driver = ORM.createDriver("test", options);
    ORM.table(tableName)
        .columns(columns);
    blogs = ORM.createClient(driver, tableName);
    t.done();
};

exports['create a blog entry'] = function (t) {
    setup();
    var text = "Dont't be a hater";
    blogs.create({ data: { userId: 7, text: text }}, function(err,result){
        if(err) throw err;
        t.equal(data.params.length, 3);
        t.equal(data.params[0], 7);
        t.equal(data.params[1], text);
        // third param is the create date
        t.ok(/INSERT\s+INTO\s+blogs\s+\(\s*user_id.*text.*created_at\s*\)\s+VALUES\s+\(\s*\$1,\s*\$2,\s*\$3\s*\)/.test(data.query), 'generates a create');
        t.done();
    });
};