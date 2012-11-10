
# thin-orm

Thin-orm is a minimalist Object Relational Mapper (ORM). Thin-orm provides you with a
mongodb inspired API for accessing your favorite SQL database (as long as your favorite
is postgresql or mysql.

bloat-free

The _thin_ in thin-orm means that very little processing is done; your queries will run
just about as fast as if you had written them in native SQL.

Thin-orm sits on top of a node client for your database. It uses the following clients:
* postgres: pg
* mysql: something


## Installation

```bash
npm install thin-orm
npm install pg # required for postgres
npm install mysql # required for mysql
```

## How to use

First, require `socket.io`:

```js
var io = require('socket.io');
```

Next, attach it to a HTTP/HTTPS server. If you're using the fantastic `express`
web framework:

## License

MIT
=======
thin-orm
========

A node.js object relation mapper for SQL databases

