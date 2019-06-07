import redis from 'redis';

module.exports = (() => {
  let ip = '';
  if(process.env.NODE_ENV != "dev"){
    ip = '172.31.29.112';
  }else{
    ip = '127.0.0.1';
  }
  console.log(ip);
  
  let client = redis.createClient(6379,ip);

  client.on('connect', () => {
    console.log(`redis connected on ${ip}...!`) ;
  })

  return client;

  // return redis.createClient(6379,'172.31.29.112');
  // return redis.createClient(6379,'13.209.15.25');
  // return redis.createClient(6379,'127.0.0.1');
})();
