import { GraphQLError } from "graphql"
import { parsePaymentRequest } from "invoices"

export const isTest = require.main?.filename.indexOf(".spec.") !== -1
export const isProd = process.env.NODE_ENV === "production"

// FIXME: super ugly hack.
// for some reason LoggedError get casted as GraphQLError
// in the formatError function that graphqlQL use to parse error before
// sending it back to the client. this is a temporary workaround
export const customLoggerPrefix = `custom: `

export class LoggedError extends GraphQLError {
  constructor(message) {
    super(`${customLoggerPrefix}${message}`)
  }
}

export const getHash = (request) => {
  return parsePaymentRequest({ request }).id
}

export const getAmount = (request): number | undefined => {
  return parsePaymentRequest({ request }).tokens
}

export const btc2sat = (btc: number) => {
  return Math.round(btc * Math.pow(10, 8))
}

export const sat2btc = (sat: number) => {
  return sat / Math.pow(10, 8)
}

export const satsToUsdCached = (sats, price) => {
  return price * sats
}

export const randomIntFromInterval = (min, max) =>
  Math.floor(Math.random() * (max - min + 1) + min)

export async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export function timeout(delay, msg) {
  return new Promise(function (resolve, reject) {
    setTimeout(function () {
      reject(new Error(msg))
    }, delay)
  })
}

export const isInvoiceAlreadyPaidError = (err): boolean => {
  try {
    if (
      "invoice is already paid" ===
      (err[2]?.err?.details || err[2]?.failures?.[0]?.[2]?.err?.details)
    ) {
      return true
    }
  } catch (err) {
    return false
  }
  return false
}

/**
 * Process an iterator with N workers
 * @method async
 * @param  iterator iterator to process
 * @param  processor async function that process each item
 * @param  workers  number of workers to use. 5 by default
 * @param  logger  logger instance, just needed if you want to log processor errors
 * @return       Promise with all workers
 */
export const runInParallel = ({ iterator, processor, logger, workers = 5 }) => {
  const runWorkerInParallel = async (items, index) => {
    for await (const item of items) {
      try {
        await processor(item, index)
      } catch (error) {
        logger.error({ item, error }, `issue with worker ${index}`)
      }
    }
  }
  // starts N workers sharing the same iterator, i.e. process N items in parallel
  const jobWorkers = new Array(workers).fill(iterator).map(runWorkerInParallel)
  return Promise.allSettled(jobWorkers)
}
