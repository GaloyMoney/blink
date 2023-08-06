import { authenticatedLndGrpc, unauthenticatedLndGrpc } from "lightning"
import { env } from "@config"

const addProps = (array: LndParams[]) => {
  const result: LndConnect[] = array.map((input) => {
    const socket = `${input.node}:${input.port}`
    return {
      ...input,
      socket,
      lnd: authenticatedLndGrpc({ ...input, socket }).lnd,
      lndGrpcUnauth: unauthenticatedLndGrpc({ ...input, socket }).lnd,
      active: false,
    }
  })
  return result
}

const lndArray: LndParams[] = []

if (
  env.LND1_PUBKEY &&
  env.LND1_TLS &&
  env.LND1_MACAROON &&
  env.LND1_DNS &&
  env.LND1_RPCPORT &&
  env.LND1_TYPE &&
  env.LND1_NAME
) {
  const lnd1 = {
    pubkey: env.LND1_PUBKEY as Pubkey,
    cert: env.LND1_TLS,
    macaroon: env.LND1_MACAROON,
    node: env.LND1_DNS,
    port: env.LND1_RPCPORT,
    type: env.LND1_TYPE as LndNodeType[],
    name: env.LND1_NAME,
  }
  lndArray.push(lnd1)
}

if (
  env.LND2_PUBKEY &&
  env.LND2_TLS &&
  env.LND2_MACAROON &&
  env.LND2_DNS &&
  env.LND2_RPCPORT &&
  env.LND2_TYPE &&
  env.LND2_NAME
) {
  const lnd2 = {
    pubkey: env.LND2_PUBKEY as Pubkey,
    cert: env.LND2_TLS,
    macaroon: env.LND2_MACAROON,
    node: env.LND2_DNS,
    port: env.LND2_RPCPORT,
    type: env.LND2_TYPE as LndNodeType[],
    name: env.LND2_NAME,
  }
  if (env.LND_PRIORITY === "lnd2") {
    lndArray.unshift(lnd2)
  } else {
    lndArray.push(lnd2)
  }
}

export const lndsConnect: LndConnect[] = addProps(lndArray)
