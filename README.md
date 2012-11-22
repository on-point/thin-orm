# thin-orm

Thin-orm is a lightweight Object Relational Mapper (ORM). Thin-orm provides you with a
mongodb inspired API for accessing your favorite SQL database.

The _thin_ in thin-orm means that very little additional processing is done; your queries will run
just about as fast as if you had written them in native SQL.

Thin-orm sits on top of a node client for your database. It has built in support for the following clients:
* postgresql: [node-postgres (pg)](https://github.com/brianc/node-postgres)
* sqlite3: [node-sqlite3](https://github.com/developmentseed/node-sqlite3)

If your SQL database is not listed here, don't worry. Interfacing to a node database driver is
really easy. Take a look at the examples in the drivers directory.


## Installation

```bash
npm install thin-orm
npm install pg # required for postgres
npm install sqlite3 # required for sqlite3
```

## Overview

Before you can start executing queries, you need to define your tables using thin-orm's fluent
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
// callback result: { count: 1, rows: \[ { id: 1, login: "joe", firstName: "Joe", lastName: "Smith" } \] }

userClient.update({ criteria: { id: 1 }, data: { firstName: 'Joseph' }}, callback)
// updates row with id == 1

userClient.remove(1, callback)
// deletes row with id == 1
```

You can see a working example of thin-orm in the [sample web app](https://github.com/on-point/nodecellar).

## Features

* filtering
* sorting
* paging (maximum rows and row offset)
* joins
* optionally maps javascript camelcase names to database names (e.g. `firstName` to `first_name`)
* helps protect against SQL injection attacks

## Filtering

#### Fetching a single record

You can fetch a single row from a database table using the primary index:

```js
userClient.findById(1, callback)
// callback result: { id: 1, login: "joe", firstName: "Joe", lastName: "Smith" }
```

Or using criteria that uniquely identifies a row:

```js
userClient.findOne({ criteria: { firstName: 'Joe', lastName: 'Smith' } }, callback)
// callback result: { id: 1, login: "joe", firstName: "Joe", lastName: "Smith" }
```

#### Fetching a multiple records

A *criteria* object specifies the filter that is applied to the rows in a table.

A simple equality filter:

```js
userClient.findMany({ criteria: { firstName: 'Joe' } }, callback)
// callback result: { count: 2, rows: \[ { id: 1, login: "joe", firstName: "Joe", lastName: "Smith" }
//                                       { id: 16, login: "joep", firstName: "Joe", lastName: "Peters" } \] }
```

You can use the operators LT (less than), LTE (less than or equal), GT (greater than), GTE (greater than or equal),
NE (not equal) and LIKE (wild card match) as part of your criteria:

```js
userClient.findMany({ criteria: { id: { LT: 3 } } }, callback)
// callback result: { count: 2, rows: \[ { id: 1, login: "joe", firstName: "Joe", lastName: "Smith" }
//                                       { id: 2, login: "mary", firstName: "Mary", lastName: "Katz" } \] }
```

#### Sorting

You can sort the rows returned by the query.

```js
userClient.findMany({ criteria: { firstName: { LIKE: { 'J%' }}}, sort: { lastName: "DESC" }}, callback);
// callback result: { count: 2, rows: \[ { id: 1, login: "joe", firstName: "Joe", lastName: "Smith" }
//                                       { id: 16, login: "joep", firstName: "Joe", lastName: "Peters" } \] }
```

If you need to sort on multiple columns, you can pass an array of sort criteria with the primary sort
column listed first.
```js
userClient.findMany({ sort: [ { lastName: "ASC" }, { firstName: "ASC" } ] }, callback);
// callback result: { count: 211, rows: \[ { id: 21, login: "sama" , firstName: "Sam", lastName: "Abrams" }
//                                       { id: 116, login: "trevora", firstName: "Trevor", lastName: "Abrams" }
//                                       ...                                                                    \] }
```

#### Paging

Thin-orm supports a maximum number of rows to return and an offset into the result set at
which to begin counting. So the following query will return rows 60 to 80 of the result set.
Note that you should always sort the results if you are using an offset.

```js
widgetClient.findMany({ sort: { itemId: "ASC" }, offset: 60, limit: 20 }, callback);
// callback result: { count: 20, rows: \[ { itemId: 1267, name: "super deluxe widget", price: 24.99 }
//                                       { itemId: 1288, name: "average ordinary widget", price: 14.99 }
//                                       ...                                                                    \] }
```

#### Joins

One-to-one and one-to-many joins are supported by thin-orm. In a one-to-one join, columns from the join
table are promoted into the array of objects returned by the query. However, in a one-to-many
join, the columns of the join table become child objects of each object returned.

All joins need to be defined when you define the table. A join can be specified as a "default" join; these
joins will automatically be added to all queries against the table.

Currently, you cannot nest joins.

Here are some examples:

```js
orm.table('users')
   .columns('id', 'login', 'firstName', 'lastName', 'createdAt');
orm.table('blogs')
   .columns('id', 'userId', 'text', 'createdAt')
   .join('comments').oneToMany('comments').on({ id: 'blogId' })
   .join('login').oneToOne('users').on({ userId: 'id' }).columnMap({ name: 'login' });
orm.table('comments')
   .columns('id', 'userId', 'blogId', 'text', 'createdAt'])
   .join('login').oneToOne('users').on({ userId:'id' }).columnMap({ name:'login' }).default();

blogClient.findMany({ criteria:{ userId: 1 }, joins: \[ 'login' \] }, callback);
// callback result: { count: 2, rows: \[
//      { id: 1, userId: 1, text: 'some blog text', createdAt: 1352576196772, name: 'joe' }
//      { id: 7, userId: 1, text: 'another blog text', createdAt: 135257633821, name: 'joe' }
//  \] }
// (note that the `name: 'joe'` field was added from the `login` column of the `users` table)

blogClient.findMany({ criteria:{ userId:1 }, joins: \[ 'comments' \] }, callback);
// callback result: { count: 3, rows: \[
//      { id: 1, userId: 3, text: "blog text 1", createdAt: "2012-11-22T00:00:00.000Z", name : "samuel", comments:\[
//            { id: 2, userId:2, blogId: 1, text: "you must be kidding", createdAt: "2012-11-22T00:00:00.000Z"}
//      \]}, ...
```

## Integration with HTTP servers

If you wish, thin-orm can automatically send a JSON response to a REST request. Instead of passing a callback
function as the last response, pass in a response object. If the response object has a `send` method, then
thin-orm will call that method with the result rows. The data returned to the caller wil be:
* `findById` or `findOne` will return a single object
* `findMany` will return an array of JSON objects
* `create` will return an object with an `id` field set to the id of the new record
* `delete` or `update` will return an HTTP 200 code if successful, 500 if it fails

## License

MIT

