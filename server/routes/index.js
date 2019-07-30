import express from 'express';
import moment from 'moment';
import mecab from 'mecab-ya';
import cacheClient from '../src/database.js';
import FUNC from '../src/common.js';
import AWS from 'aws-sdk';
AWS.config.update({
  region: "ap-northeast-2"
});

let dynamodb = new AWS.DynamoDB();

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

router.post('/getLowerItem', wrap(async(req, res) => {
  let name = req.body.name;
  let date = req.body.date;
  let result = await FUNC.getHsmoaDoc(date.toString(), name);
  res.send(result);
}))

// router.get('/db', (req, res) => {
//   var params = {
//     TableName : "CrawlHsmoaSchedule",
//     KeyConditionExpression : "#d = :d",
//     FilterExpression: "crawl_turn = :t",
//     ExpressionAttributeNames : { 
//         "#d" : "date",
//     },
//     ExpressionAttributeValues: {
//         ":d" : {"S" : "2019-07-26"},
//         ":t" : {"S" : "23"}
//     }
//   }


//   dynamodb.query(params, function(err, data){
//     if(err){
//       console.log(err);
//     }else{
//       console.log(data);
//       res.send(data.Items);
//     }
//   });
  
// });

// router.get('/mecab',function(req, res){
//   mecab.pos("[수퍼싱글 1+1] 벨기에 LATEXCO 라텍스 토퍼매트리스",function(err, result){
//     console.log(result);
//   })
// });


module.exports = router;
