import Redlock, { Lock } from 'redlock';
import redis from "redis"
import bluebird from 'bluebird';
const { using } = bluebird;

  
// the maximum amount of time you want the resource locked,
// keeping in mind that you can extend the lock up until
// the point when it expires
// TODO: use TIMEOUTs env variable 
const ttl = process.env.NETWORK !== "regtest" ? 60000 : 10000

function errorWrapper({logger}) {
  return function unlockErrorHandler(err) {
    logger.error(err, `unable to release redis lock`);
  }
}

let redlock_singleton

const getRedLock = () => {
  if (redlock_singleton) { 
    return redlock_singleton
  } 
  
  redlock_singleton = new Redlock(
  // you should have one client for each independent redis node
  // or cluster
  [redis.createClient(process.env.REDIS_PORT, process.env.REDIS_IP)],
  {
    // the expected clock drift; for more details
    // see http://redis.io/topics/distlock
    driftFactor: 0.01, // time in ms

    // the max number of times Redlock will attempt
    // to lock a resource before erroring
    retryCount:  15,

    // the time in ms between attempts
    retryDelay:  250, // time in ms

    // the max time in ms randomly added to retries
    // to improve performance under high contention
    // see https://www.awsarchitectureblog.com/2015/03/backoff.html
    retryJitter:  200 // time in ms
  })

  return redlock_singleton
}

export const getResource = path => `locks:account:${path}`;

interface IRedLock {
  path: string,
  logger: any,
  lock?: typeof Lock
}

export const redlock = async ({path, logger, lock}: IRedLock, async_fn: (arg0: typeof Lock) => Promise<any>) => {
  if (!!lock && lock.expiration > Date.now()) {
    return await async_fn(lock)
  }
  return await using(getRedLock().disposer(getResource(path), ttl, errorWrapper({logger})), async (lock) => {
    return await async_fn(lock)
  })
}