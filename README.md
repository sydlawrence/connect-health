# connect-health

A Connect middleware for Node/Express apps. It adds a /health endpoint which checks that MongoDB and Redis are present and writable (and that the app itself and its stack are running, obviously).

Knocked up with our Express boilerplate in mind, so your mileage may vary.

## Installation
It's on NPM under `connect-health`

## Example
Both Redis and MongoDB can be omitted and they won't be checked. 

The Redis option should be a redis client, eg: `require("redis").createClient()`

The Mongo option expects an object containing a mongodb client. Eg: `{client: db.sharedClient()}`. This is wrapped in an object so that we can pass a reference in and add the client later in our boilerplate's initialisation.

```javascript
// requires
var connectHealth = require('connect-health');

// db setup (you'll already have something like this)
var redisClient = require("redis").createClient()
  , db = require('./modules/database');

// adding the middleware to your app config
app.use(connectHealth({redis: redisClient, mongodb: db}));
```

MIT License