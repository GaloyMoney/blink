import * as jwt from 'jsonwebtoken'
import * as lnService from "ln-service"
import { filter, find, includes, intersection, sumBy, union } from "lodash"
import * as moment from 'moment'
export const validate = require("validate.js")
const BitcoindClient = require('bitcoin-core')
const { parsePaymentRequest } = require('invoices');
const axios = require('axios').default;


export const baseLogger = require('pino')({ level: process.env.LOGLEVEL || "info" })

// how many block are we looking back for getChainTransactions
export const LOOK_BACK = 2016


// @ts-ignore
import { GraphQLError } from "graphql";

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

export const amountOnVout = ({ vout, onchain_addresses }): number => {
  // TODO: check if this is always [0], ie: there is always a single addresses for vout for lnd output
  return sumBy(filter(vout, tx => includes(onchain_addresses, tx.scriptPubKey.addresses[0])), "value")
}

export const myOwnAddressesOnVout = ({ vout, onchain_addresses }) => {
  // TODO: check if this is always [0], ie: there is always a single addresses for vout for lnd output
  return intersection(union(vout.map(output => output.scriptPubKey.addresses[0])), onchain_addresses)
}

export const bitcoindClient = new BitcoindClient(connection_obj)

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
  const id = result.public_key
  return {
    peersCount,
    channelsCount,
    id
  }
}

export async function getBosScore() {
  try {
    const { data } = await axios.get('https://bos.lightning.jorijn.com/data/export.json')

    // FIXME: make it dynamic
    const publicKey = "0325bb9bda523a85dc834b190289b7e25e8d92615ab2f2abffbe97983f0bb12ffb"
    const bosScore = find(data.data, { publicKey })
    return bosScore.score
  } catch (err) {
    baseLogger.error({ err, err2: err.toJson() }, `issue getting bos rank`)
  }
}

export const isInvoiceAlreadyPaidError = (err) => {
  if ("invoice is already paid" === (err[2]?.err?.details || err[2]?.failures[0]?.[2]?.err?.details)) {
    return true
  }
  return false
}

export const isUserActive = (uid) => {
  
}