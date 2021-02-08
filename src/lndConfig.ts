const lnService = require('ln-service');

const getAuth = () => {
  // network = process.env.NETWORK // TODO
  const cert = process.env.TLS
  const macaroon = process.env.MACAROON
  const lndip = process.env.LNDIP
  const port = process.env.LNDRPCPORT ?? 10009

  if (!cert || !macaroon || !lndip) {
    console.log({cert, macaroon, lndip})
    throw new Error('missing environment variable for lnd')
  }

  const socket = `${lndip}:${port}`

  return { macaroon, cert, socket };
}

export const lnd = lnService.authenticatedLndGrpc(getAuth()).lnd

export const TIMEOUT_PAYMENT = process.env.NETWORK !== "regtest" ? 45000 : 3000

export const FEECAP = 0.02 // = 2%
export const FEEMIN = 10 // sats
