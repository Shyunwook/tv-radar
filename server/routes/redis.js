import express from 'express';
import REDIS from '../src/redis-func.js';
import cacheClient from '../src/database.js';
import cron from 'node-cron';
import moment from 'moment';

let router = express.Router();

/* GET users listing. */

// router.get('/flushall',(req, res) => {
//   res.send(cacheClient.flushall());
// });
//
// router.get('/redis-load-data',(req, res) => {
//   let period_list = REDIS.setPeriodList(90);
//   REDIS.loadDataToRedis(period_list, cacheClient, res);
// });

cron.schedule('0 17 1 * * *',() => {
  console.log('wow');
  console.log(moment());
  let today = moment().add(0,'days').format("YYYY-MM-DD");
  let period = [{dateFrom : today, dateTo : today}];
  REDIS.loadDataToRedis(period, cacheClient);
})

module.exports = router;
