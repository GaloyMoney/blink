import { GraphQLError } from "graphql"
import { parsePaymentRequest } from "invoices"

import { getIpConfig } from "@config/app"

import { User } from "@services/mongoose/schema"

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

const ipConfig = getIpConfig()

export const addContact = async ({ uid, username }) => {
  // https://stackoverflow.com/questions/37427610/mongodb-update-or-insert-object-in-array

  const result = await User.update(
    {
      "_id": uid,
      "contacts.id": username,
    },
    {
      $inc: { "contacts.$.transactionsCount": 1 },
    },
  )

  if (!result.nModified) {
    await User.update(
      {
        _id: uid,
      },
      {
        $addToSet: {
          contacts: {
            id: username,
          },
        },
      },
    )
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

// Throws an error if neither or both value1 and value2 are provided
export const inputXOR = (arg1, arg2) => {
  const [[key1, value1]] = Object.entries(arg1)
  const [[key2, value2]] = Object.entries(arg2)
  if (!(!value1 !== !value2)) {
    // will be deleted with current Samer PR
    throw new Error(`Either ${key1} or ${key2} is required, but not both`)
  }
}

export const isIPTypeBlacklisted = ({ type }) =>
  ipConfig.blacklistedIPTypes.includes(type)

export const isIPBlacklisted = ({ ip }) => ipConfig.blacklistedIPs.includes(ip)

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
