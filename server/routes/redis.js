import express from 'express';
import REDIS from '../src/redis-func.js';
import redis from 'redis';

// let cacheClient = redis.createClient(6379,'172.31.29.112');
let cacheClient = redis.createClient(6379,'127.0.0.1');

let router = express.Router();

/* GET users listing. */
router.get('/', function(req, res, next) {
  res.send('respond with a resource');
});

// router.get('/flushall',(req, res) => {
//   res.send(cacheClient.flushall());
// });
//
// router.get('/redis-load-data',(req, res) => {
//   let period_list = REDIS.setPeriodList(90);
//   REDIS.loadDataToRedis(period_list, cacheClient, res);
// });

module.exports = router;
