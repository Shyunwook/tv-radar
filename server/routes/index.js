import express from 'express';
import moment from 'moment';
import cacheClient from '../src/database.js';
import FUNC from '../src/common.js';

let router = express.Router();

const wrap = asyncFn => {
// FIXME: Promise와 catch를 이용하면 더 간결해질 것 같습니다.
  return (async (req, res, next) => {
    try {
      return await asyncFn(req, res, next)
    } catch (error) {
      return next(error)
    }
  })
}

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index.ejs');
});

router.get('/target', function(req, res, next) {
  res.render('target.ejs',{result : "", other_grouped_weight_data : "", gs_grouped_weight_data : ""});
});

router.get('/schedule', function(req, res, next) {
  res.render('schedule.ejs');
});

router.post('/getScheduleData', wrap(async(req, res) => {
  let period = {dateFrom : req.body.dateFrom, dateTo : req.body.dateTo};
  let raw = {};
  let initial_day = "";

  let redis_data_flag = await (() => {
    return new Promise((resolve, reject) => {
      cacheClient.sort("dateList","alpha",(err,result) => {
        initial_day = result[0];
        if(result.indexOf(period.dateFrom) > 0){
          resolve(true);
        }else{
          resolve(false);
        }
      })
    })
  })();

  if(redis_data_flag){
    raw = await FUNC.getRedisData(period,cacheClient);
    console.log("Redis only!!");
  }else{
    let redis_period = { dateFrom : initial_day, dateTo : req.body.dateTo };
    let dynamo_period = { dateFrom : req.body.dateFrom, dateTo : moment(initial_day).add(-1,'days').format("YYYY-MM-DD")};

    let redis_raw = await FUNC.getRedisData(period,cacheClient);
    let dynamo_raw = await FUNC.getDynamoData(dynamo_period);

    raw = [...redis_raw, ...dynamo_raw];
    console.log("DynamoDB + Redis!!");
  }

  FUNC.setScheduleData(period,raw).then((result) => {
    res.send(result);
  }).catch((error) => {
    console.log(error);
  });
}));




module.exports = router;
