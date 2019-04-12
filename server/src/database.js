import redis from 'redis';

module.exports = (() => {
  return redis.createClient(6379,'13.209.15.25');
  // return redis.createClient(6379,'127.0.0.1');
})();
