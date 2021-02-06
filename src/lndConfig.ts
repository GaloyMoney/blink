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

const lnService = require('ln-service');
export const lnd = lnService.authenticatedLndGrpc(getAuth()).lnd
