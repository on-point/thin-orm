# thin-orm

Thin-orm is a lightweight Object Relational Mapper (ORM). Thin-orm provides you with a
mongodb inspired API for accessing your favorite SQL database.

The _thin_ in thin-orm means that very little additional processing is done; your queries will run
just about as fast as if you had written them in native SQL.

Thin-orm sits on top of a node client for your database. It has built in support for the following clients:
* postgres: [node-postgres (pg)|https://github.com/brianc/node-postgres]
* sqlite3: [node-sqlite3|https://github.com/developmentseed/node-sqlite3]
If your SQL database is not listed here, don't worry. Interfacing to a node database driver is
really easy. Take a look at the examples in the drivers directory.


## Installation

```bash
npm install thin-orm
npm install pg # required for postgres
npm install sqlite3 # required for sqlite3
```



## Overview

Before you can start executing queries, you need to define your tables your tables using thin-orm's fluent
interface. The minimal configuration is shown here:

```js
var orm = require('thin-orm'),
    sqlite3 = require('sqlite3').verbose(),
    db = new sqlite3.Database(':memory:');

orm.table('users')
   .columns('id', 'login', 'firstName', 'lastName', 'createdAt');
```

Now we are ready to create a client driver connection and run queries:

```js
var driver = orm.createDriver('sqlite', { db: db }) });
var userClient = ORM.createClient(driver, 'users');

userClient.create({ data: { login: 'joe', firstName: 'Joe', lastName: 'Smith'}}, callback);
// callback result: { id: 1 }

userClient.findMany({ criteria: { firstName: 'Joe' }, callback)
// callback result: { count: 1, rows: { id: 1, login: joe, firstName: "Joe", lastName: "Smith" }}

userClient.update({ criteria: { id: 1 }, data: { firstName: "Joseph" }}, callback)
// updates row with id == 1

userClient.remove(1, callback)
// deletes row with id == 1
```

## Features

* joins
* sorting
* filtering
* paging (maximum rows and row offset)
* optionally maps javascript camelcase names to database names (e.g. `firstName` to `first_name`)

## License

MIT

