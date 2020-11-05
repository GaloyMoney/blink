import * as jwt from 'jsonwebtoken'
import * as lnService from "ln-service"
import { filter, includes, sumBy } from "lodash"
import * as moment from 'moment'
import { Price } from "./priceImpl"
export const validate = require("validate.js")
const lightningPayReq = require('bolt11')
const BitcoindClient = require('bitcoin-core')

export const baseLogger = require('pino')({ level: process.env.LOGLEVEL || "info" })
const util = require('util')

// @ts-ignore
import { GraphQLError } from "graphql";
import { DbVersion } from "./mongodb"
import { mainCache } from "./cache"

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

const connection_obj = {
  network: process.env.NETWORK, username: 'rpcuser', password: 'rpcpass',
  host: process.env.BITCOINDADDR, port: process.env.BITCOINDPORT
}

export const amountOnVout = ({ vout, onchain_addresses }) => {
  // TODO: check if this is always [0], ie: there is always a single addresses for vout for lnd output
  return sumBy(filter(vout, tx => includes(onchain_addresses, tx.scriptPubKey.addresses[0])), "value")
}

export const bitcoindClient = new BitcoindClient(connection_obj)

export const getHash = (request) => {
  const decoded = lightningPayReq.decode(request)
  return decoded.tags.filter(item => item.tagName === "payment_hash")[0].data
}

export const getAmount = (request): number | undefined => {
  const decoded = lightningPayReq.decode(request)
  return decoded.satoshis
}

export const btc2sat = (btc: number) => {
  return btc * Math.pow(10, 8)
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

export const createToken = ({ uid, currency, network }) => jwt.sign(
  { uid, network, currency }, process.env.JWT_SECRET, {
  // TODO use asymetric signature
  // and verify the signature from the client
  // otherwise we could get subject to DDos attack
  //
  // we will also need access token for this to work
  // otherwise, the client could still receive a fake invoice/on chain address
  // from a malicious address and the client app would not be able to
  // verify signature
  //
  // see: https://www.theregister.com/2018/04/24/myetherwallet_dns_hijack/
  algorithm: 'HS256',
})

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

export const getAuth = () => {
  // network = process.env.NETWORK // TODO
  const cert = process.env.TLS
  const macaroon = process.env.MACAROON
  const lndip = process.env.LNDIP
  const port = process.env.LNDRPCPORT ?? 10009

  if (!cert || !macaroon || !lndip) {
    throw new Error('missing environment variable for lnd')
  }

  const socket = `${lndip}:${port}`

  return { macaroon, cert, socket };
}

export async function measureTime(operation: Promise<any>): Promise<[any, number]> {
  const startTime = process.hrtime()
  const result = await operation
  const timeElapsed = process.hrtime(startTime)
  const timeElapsedms = timeElapsed[0] * 1000 + timeElapsed[1] / 1000000
  return [result, timeElapsedms]
}

export async function nodeStats({ lnd }) {
  const result = await lnService.getWalletInfo({ lnd })
  const peersCount = result.peers_count
  const channelsCount = result.active_channels_count
  return {
    peersCount,
    channelsCount
  }
}

export const getMinBuildNumber = async () => {
  const key = "minBuildNumber"
  let value

  value = mainCache.get(key);
  if ( value === undefined ){
    const { minBuildNumber, lastBuildNumber } = await DbVersion.findOne({}, { minBuildNumber: 1, lastBuildNumber: 1, _id: 0 })
    mainCache.set( key, { minBuildNumber, lastBuildNumber }, [ 3600 ] )
    value = { minBuildNumber, lastBuildNumber }
  }

  return value
}