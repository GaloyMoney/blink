import { GraphQLError } from "graphql"
import _ from "lodash"

import bitcoindClient from "bitcoin-core"
import { parsePaymentRequest } from "invoices"

// how many block are we looking back for getChainTransactions
export const LOOK_BACK = 2016

import { User } from "./schema"
import axios from "axios"
import { yamlConfig } from "./config"
import { ValidationError } from "./error"
import { baseLogger } from "./logger"

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

const PROXY_CHECK_APIKEY = yamlConfig?.PROXY_CHECK_APIKEY

const connection_obj = {
  network: process.env.NETWORK,
  username: "rpcuser",
  password: process.env.BITCOINDRPCPASS,
  host: process.env.BITCOINDADDR,
  port: process.env.BITCOINDPORT,
  version: "0.21.0",
}

export const BitcoindClient = ({ wallet = "" }) =>
  new bitcoindClient({ ...connection_obj, wallet })
export const bitcoindDefaultClient = BitcoindClient({ wallet: "" })

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

export const amountOnVout = ({ vout, addresses }): number => {
  // TODO: check if this is always [0], ie: there is always a single addresses for vout for lnd output
  return _.sumBy(
    _.filter(vout, (tx) => _.includes(addresses, tx.scriptPubKey.addresses[0])),
    "value",
  )
}

export const myOwnAddressesOnVout = ({ vout, addresses }): string[] => {
  // TODO: check if this is always [0], ie: there is always a single addresses for vout for lnd output
  return _.intersection(
    _.union(vout.map((output) => output.scriptPubKey.addresses[0])),
    addresses,
  )
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

export const isInvoiceAlreadyPaidError = (err) => {
  if (
    "invoice is already paid" ===
    (err[2]?.err?.details || err[2]?.failures?.[0]?.[2]?.err?.details)
  ) {
    return true
  }
  return false
}

export const caseInsensitiveRegex = (input) => {
  return new RegExp(`^${input}$`, "i")
}

// Throws an error if neither or both value1 and value2 are provided
export const inputXOR = (arg1, arg2) => {
  const [[key1, value1]] = Object.entries(arg1)
  const [[key2, value2]] = Object.entries(arg2)
  if (!(!value1 !== !value2)) {
    throw new ValidationError(`Either ${key1} or ${key2} is required, but not both`, {
      logger: baseLogger,
    })
  }
}

export const fetchIP = async ({ ip }) => {
  const { data } = await axios.get(
    `http://proxycheck.io/v2/${ip}?key=${PROXY_CHECK_APIKEY}&vpn=1&asn=1`,
  )
  return data[ip]
}

export const fetchIPDetails = async ({ ip, user, logger }): Promise<void> => {
  if (process.env.NODE_ENV === "test") {
    return
  }

  let ipinfo

  try {
    // skip axios.get call if ip already exists in user object
    if (user.lastIPs.some((ipObject) => ipObject.ip === ip)) {
      return
    }

    // const {data} = await axios.get(`http://proxycheck.io/v2/${ip}?key=${PROXY_CHECK_APIKEY}&vpn=1&asn=1`)
    // ipinfo = data[ip]

    ipinfo = await fetchIP({ ip })
  } catch (error) {
    logger.info({ error }, "Failed to fetch ip details")
  } finally {
    try {
      const res = await User.updateOne(
        { "_id": user._id, "lastIPs.ip": ip },
        { $set: { "lastIPs.$.lastConnection": Date.now() } },
      )
      if (!res.nModified) {
        await User.findOneAndUpdate(
          { "_id": user._id, "lastIPs.ip": { $ne: ip } },
          { $push: { lastIPs: { ip, ...ipinfo, Type: ipinfo?.type } } },
        )
      }
    } catch (err) {
      logger.warn({ err }, "error setting last ip")
    }
  }
}
