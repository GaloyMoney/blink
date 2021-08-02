import Redlock, { Lock } from "redlock"
import bluebird from "bluebird"

import { redis } from "@services/redis"

const { using } = bluebird

// the maximum amount of time you want the resource locked,
// keeping in mind that you can extend the lock up until
// the point when it expires
// TODO: use TIMEOUTs env variable
const ttl = process.env.NETWORK !== "regtest" ? 180000 : 10000

function errorWrapper({ logger }) {
  return function unlockErrorHandler(err) {
    logger.error(err, `unable to release redis lock`)
  }
}

const redlockClient = new Redlock(
  // you should have one client for each independent redis node
  // or cluster
  [redis],
  {
    // the expected clock drift; for more details
    // see http://redis.io/topics/distlock
    driftFactor: 0.01, // time in ms

    // the max number of times Redlock will attempt
    // to lock a resource before erroring
    retryCount: 5,

    // the time in ms between attempts
    retryDelay: 400, // time in ms

    // the max time in ms randomly added to retries
    // to improve performance under high contention
    // see https://www.awsarchitectureblog.com/2015/03/backoff.html
    retryJitter: 200, // time in ms
  },
)

export const getResource = (path) => `locks:account:${path}`

interface IRedLock {
  path: string
  logger: Logger
  lock?: typeof Lock
}

export const redlock = async ({ path, logger, lock }: IRedLock, async_fn) => {
  if (!!lock && lock.expiration > Date.now()) {
    return await async_fn(lock)
  }
  return await using(
    redlockClient.disposer(getResource(path), ttl, errorWrapper({ logger })),
    async (lock) => {
      return await async_fn(lock)
    },
  )
}

const logLockTimeout = ({ logger, lock }) => {
  const expiration = lock.expiration
  const now = new Date().getTime()
  const remaining = expiration - now
  logger.debug({ expiration, now, remaining }, "lock status")
}

export const lockExtendOrThrow = async ({ lock, logger }, async_fn) => {
  logLockTimeout({ logger, lock })

  return await new Promise((resolve, reject) => {
    lock.extend(120000, async (err) => {
      // if we can't extend the lock, typically because it would have expired
      // then we throw an error
      if (err) {
        const error = "unable to extend the lock"
        logger.error({ err }, error)
        reject(new Error(error))
        return
      }

      const result = await async_fn()
      resolve(result)
    })
  })
}
