import express from 'express';
import moment from 'moment';
import mecab from 'mecab-ya';
import cacheClient from '../src/database.js';
import FUNC from '../src/common.js';
import AWS from 'aws-sdk';
import logger from '../logger';

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


router.post('/getScheduleData', async (req, res) => {
  let items = [];
  let start_date = moment(req.body.dateFrom,'YYYY-MM-DD').format('YYYY-MM-DD');
  let promise = [];

  for(let i = 0; i < 7; i ++ ){

    let func = (function(date){
      return new Promise(async (resolve, reject) => {
        let turn;
        let diff = moment().diff(moment(date), 'days');

        if(diff > 0){
          turn = "23";
        }else{
          turn = moment().add(-2, 'hours').format('HH');
        }
        // console.log('날짜 : ', date);
        // console.log('crawl_turn : ', turn);
        // console.log('-----------------');

        let params = {
          TableName : "CrawlHsmoaSchedule",
          IndexName: "date-crawl_turn-index",
          KeyConditionExpression : "#d = :d and crawl_turn = :t",
          ExpressionAttributeNames : { 
              "#d" : "date",
          },
          ExpressionAttributeValues: {
              ":d" : {"S" : date},
              ":t" : {"S" : turn}
          }
        }
        
        dynamodb.query(params, function(err, data){
          if(err){
            console.log(err);
            reject();
          }else{
            // console.log(date + '----- 성공!!');
            // console.log(data.Items.length);
            let item = data.Items.map((item) => {
              return AWS.DynamoDB.Converter.unmarshall(item)
            })
            items = [...items, ...item];
            resolve();
          }
        });
      });
    })(moment(start_date, 'YYYY-MM-DD').add(i, 'days').format('YYYY-MM-DD'));

    promise.push(func);
  }

  await Promise.all(promise);
  res.send(items);
})

router.post('/getTargeteData', async (req, res) => {
  let period = {dateFrom : req.body.dateFrom, dateTo : req.body.dateTo};
  let items = [];
  let promise = [];
  let diff = moment(period.dateTo, 'YYYY-MM-DD').diff(moment(period.dateFrom, 'YYYY-MM-DD'), 'days');

  for(let i = 0; i <= diff; i ++ ){

    let func = (function(date){
      return new Promise((resolve, reject) => {
        // let params = {
        //   TableName : "CrawlHsmoaSchedule",
        //   KeyConditionExpression : "#d = :d",
        //   FilterExpression: "crawl_turn = :t",
        //   ExpressionAttributeNames : { 
        //       "#d" : "date",
        //   },
        //   ExpressionAttributeValues: {
        //       ":d" : {"S" : date},
        //       ":t" : {"S" : "23"}
        //   }
        // }
        let params = {
          TableName : "CrawlHsmoaSchedule",
          IndexName: "date-crawl_turn-index",
          KeyConditionExpression : "#d = :d and crawl_turn = :t",
          ExpressionAttributeNames : {
              "#d" : "date",
          },
          ExpressionAttributeValues: {
              ":d" : {"S" : date},
              ":t" : {"S" : "23"}
          }
        }
      
        dynamodb.query(params, function(err, data){
          if(err){
            console.log(err);
            reject();
          }else{
            let item = data.Items.map((item) => {
              return AWS.DynamoDB.Converter.unmarshall(item)
            })
            items = [...items, ...item];
            resolve();
          }
        });
      });
    })(moment(period.dateFrom, 'YYYY-MM-DD').add(i, 'days').format('YYYY-MM-DD'));

    promise.push(func);
  }

  await Promise.all(promise);

  FUNC.setScheduleData(period,items).then((result) => {
    res.send(result);
  }).catch((error) => {
    console.log(error);
  });
});

router.get('/getPeriodData/:dateFrom&:dateTo', async(req, res) => {
  let items = [];
  let start_date = moment(req.params.dateFrom,'YYYY-MM-DD').format('YYYY-MM-DD');
  let end_date = moment(req.params.dateTo,'YYYY-MM-DD').format('YYYY-MM-DD');
  let diff = moment(end_date).diff(moment(start_date), 'days');
  let promise = [];
  for(let i = 0; i <= diff; i ++ ){

    let func = (function(date){
      return new Promise(async (resolve, reject) => {
        let turn;
        let diff = moment().diff(moment(date), 'days');

        if(diff > 0){
          turn = "23";
        }else{
          turn = moment().add(-2, 'hours').format('HH');
        }
        // console.log('날짜 : ', date);
        // console.log('crawl_turn : ', turn);
        // console.log('-----------------');

        let params = {
          TableName : "CrawlHsmoaSchedule",
          IndexName: "date-crawl_turn-index",
          KeyConditionExpression : "#d = :d and crawl_turn = :t",
          ExpressionAttributeNames : { 
              "#d" : "date",
          },
          ExpressionAttributeValues: {
              ":d" : {"S" : date},
              ":t" : {"S" : turn}
          }
        }
        
        dynamodb.query(params, function(err, data){
          if(err){
            console.log(err);
            reject();
          }else{
            // console.log(date + '----- 성공!!');
            // console.log(data.Items.length);
            let item = data.Items.map((item) => {
              return AWS.DynamoDB.Converter.unmarshall(item)
            })
            items = [...items, ...item];
            resolve();
          }
        });
      });
    })(moment(start_date, 'YYYY-MM-DD').add(i, 'days').format('YYYY-MM-DD'));

    promise.push(func);
  }

  await Promise.all(promise);
  res.send(items);
})

router.get('/readDic', async (req, res) => {
  let result = await FUNC.readDic();
  res.send(result);
});

// router.post('/getLowerItem', wrap(async(req, res) => {
//   let name = req.body.name;
//   let date = req.body.date;
//   let result = await FUNC.getHsmoaDoc(date.toString(), name);
//   res.send(result);
// }))


// router.get('/mecab',function(req, res){
//   mecab.pos("[수퍼싱글 1+1] 벨기에 LATEXCO 라텍스 토퍼매트리스",function(err, result){
//     console.log(result);
//   })
// });


module.exports = router;
