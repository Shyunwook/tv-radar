import redis from 'redis';

module.exports = (() => {
  return redis.createClient(6379,'172.31.29.112');
  // return redis.createClient(6379,'127.0.0.1');
})();
