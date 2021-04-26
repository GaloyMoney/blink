// @ts-ignore
import { GraphQLError } from "graphql"
import _ from 'lodash';

import * as moment from 'moment'
import validate from "validate.js"
import bitcoindClient from 'bitcoin-core'
import { parsePaymentRequest } from 'invoices';

import pino from 'pino'
export const baseLogger = pino({ level: process.env.LOGLEVEL || "info" })

// how many block are we looking back for getChainTransactions
export const LOOK_BACK = 2016


// @ts-ignore
import { GraphQLError } from "graphql";
import { User } from "./schema";
import axios from "axios";
import { yamlConfig } from "./config";


// FIXME: super ugly hack.
// for some reason LoggedError get casted as GraphQLError
// in the formatError function that graphqlQL use to parse error before
// sending it back to the client. this is a temporary workaround
export const customLoggerPrefix = `custom: `

export class LoggedError extends GraphQLError {
  
  constructor(message) {
    super(`${customLoggerPrefix}${message}`);
  }
}

const PROXY_CHECK_APIKEY = yamlConfig?.PROXY_CHECK_APIKEY

const connection_obj = {
  network: process.env.NETWORK,
  username: 'rpcuser',
  password: 'rpcpass',
  host: process.env.BITCOINDADDR,
  port: process.env.BITCOINDPORT,
  version: '0.21.0',
}


export const addContact = async ({ uid, username }) => {
  // https://stackoverflow.com/questions/37427610/mongodb-update-or-insert-object-in-array

  const result = await User.update(
    {
      _id: uid,
      "contacts.id": username
    },
    {
      $inc: { "contacts.$.transactionsCount": 1 },
    },
  )

  if(!result.nModified) {
    await User.update(
      {
        _id: uid
      },
      {
        $addToSet: {
          contacts: {
            id: username
          }
        }
      }
    );
  }
}

export const BitcoindClient = ({ wallet = "" }) => new bitcoindClient({ ...connection_obj, wallet })
export const bitcoindDefaultClient = BitcoindClient({ wallet: "" })

export const amountOnVout = ({ vout, onchain_addresses }): number => {
  // TODO: check if this is always [0], ie: there is always a single addresses for vout for lnd output
  return _.sumBy(_.filter(vout, tx => _.includes(onchain_addresses, tx.scriptPubKey.addresses[0])), "value")
}

export const myOwnAddressesOnVout = ({ vout, onchain_addresses }) => {
  // TODO: check if this is always [0], ie: there is always a single addresses for vout for lnd output
  return _.intersection(_.union(vout.map(output => output.scriptPubKey.addresses[0])), onchain_addresses)
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
  return new Promise(resolve => setTimeout(resolve, ms));
}

export function timeout(delay, msg) {
  return new Promise(function(resolve, reject) {
    setTimeout(function() {
      reject(new Error(msg));
    }, delay);
  });
}

// we are extending validate so that we can validate dates
// which are not supported date by default
validate.extend(validate.validators.datetime, {
  // The value is guaranteed not to be null or undefined but otherwise it
  // could be anything.
  parse: function(value: any, options: any) {
    return +moment.utc(value);
  },
  // Input is a unix timestamp
  format: function(value: any, options: any) {
    const format = options.dateOnly ? "YYYY-MM-DD" : "YYYY-MM-DD hh:mm:ss";
    return moment.utc(value).format(format);
  }
})


export async function measureTime(operation: Promise<any>): Promise<[any, number]> {
  const startTime = process.hrtime()
  const result = await operation
  const timeElapsed = process.hrtime(startTime)
  const timeElapsedms = timeElapsed[0] * 1000 + timeElapsed[1] / 1000000
  return [result, timeElapsedms]
}

export const isInvoiceAlreadyPaidError = (err) => {
  if("invoice is already paid" === (err[2]?.err?.details || err[2]?.failures?.[0]?.[2]?.err?.details)) {
    return true
  }
  return false
}

export const caseInsensitiveRegex = (input) => {
  return new RegExp(`^${input}$`, 'i')
}

// Throws an error if neither or both value1 and value2 are provided
export const inputXOR = (arg1, arg2) => {
  const [[key1, value1]] = Object.entries(arg1)
  const [[key2, value2]] = Object.entries(arg2)
  if(!(!value1 != !value2)) {
    throw new LoggedError(`Either ${key1} or ${key2} is required, but not both`);
  }
}

export const fetchIPDetails = async ({currentIP, user, logger}) => {
  if (process.env.NODE_ENV === "test") {
    return
  }
  
  try {
    if(user.lastIPs.some(ipObject => ipObject.ip === currentIP)) {
      return
    }

    const {data} = await axios.get(`http://proxycheck.io/v2/${currentIP}?key=${PROXY_CHECK_APIKEY}&vpn=1&asn=1`)
    const ipinfo = (({provider, country, region, city, type}) => ({provider, country, region, city, type}))(data[currentIP])
    await User.updateOne({_id: user._id}, {$push: {lastIPs: { ip: currentIP, ...ipinfo }}})
  } catch (error) {
    logger.info({error}, 'Failed to fetch ip details')
  }
}
