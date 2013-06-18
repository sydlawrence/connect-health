var redis
  , mongodb
  , timeout;

module.exports = function(options) {
  options = options || {};
  redis = options['redis']
  mongodb = options['mongodb'];
  timeout = 10;

  return middleware;
}

var middleware = function(req, res, next) {
  var matchingPath = req.url.match(/^\/health$/);
  
  if (!matchingPath) {
    next(); return;
  }

  runChecks(function(err) {    
    var response = {
      memory: process.memoryUsage(),
      uptime: process.uptime(),
      status: err ? 'fail' : 'ok'
    };

    if (err) {
      response.error = err;
    }

    var responseCode = err ? 503 : 200;
    res.status(responseCode).send(response);
  });
}

var runChecks = function(callback) {
  // prep
  var accountsToCheck = 0;
  if (redis) accountsToCheck++;
  if (mongodb) accountsToCheck++;
  var errors = [];
  
  var completion = function(err) {
    if (err) errors.push(err);
    if (--accountsToCheck == 0) {
      if (errors.length) {
        callback(errors.join('. '));
      } else {
        callback();
      }
    }
  }

  if (redis) checkRedis(completion);
  if (mongodb) checkMongodb(completion);
}

var checkRedis = function(callback) {
  var hasTimedOut = false;
  var testKey = "health:test:" + Math.random();
  
  redis.setex(testKey, timeout, true, function(err, result) {
    if (err) return callback(err);

    redis.exists(testKey, function(err, exists) {
      if (!exists && !error) {
        err = "Test redis write failed";
      }
      
      if (!hasTimedOut) {        
        clearTimeout(timeoutTimeout);
        callback(err);
      }
    });
  });
  
  var timeoutTimeout = setTimeout(function() {
    hasTimedOut = true;
    callback('Redis timed out');
  }, timeout*1000);
}
  
var checkMongodb = function(callback) {
  var hasTimedOut = false;
  
  mongodb.client.collection("health:test:", function(err, testCollection) {
    if (err) return callback(err);
    testCollection.ensureIndex({status:1}, { expireAfterSeconds: timeout });
    
    
    var details = {random: Math.random(), status: new Date()};
    testCollection.insert(details, function(err, tests) {
      if (err) return callback(err);
      
      testCollection.findOne(details, function(err, test) {
        if (!test && !error) {
          err = "Test Mongodb write failed";
        }
        
        if (!hasTimedOut) {
          clearTimeout(timeoutTimeout);
          callback(err);
        }
      });
    });
  });
  
  var timeoutTimeout = setTimeout(function() {
    hasTimedOut = true;
    callback('Mongodb timed out');
  }, timeout*1000);
}
