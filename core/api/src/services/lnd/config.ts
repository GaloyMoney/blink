import { lndsConnect } from "./auth"

import {
  NoValidNodeForPubkeyError,
  OffChainServiceUnavailableError,
} from "@/domain/bitcoin/lightning"

import { OnChainServiceUnavailableError } from "@/domain/bitcoin/onchain"

export const getLnds = ({
  type,
  active,
}: { type?: LndNodeType; active?: boolean } = {}): LndConnect[] => {
  let result = lndsConnect

  if (type) {
    result = result.filter((node) => node.type.some((nodeType) => nodeType === type))
  }

  if (active) {
    result = result.filter(({ active }) => active)
  }

  return result
}

export const offchainLnds = getLnds({ type: "offchain" })

// only returning the first one for now
export const getActiveLnd = (): LndConnect | LightningServiceError => {
  const lnds = getLnds({ active: true, type: "offchain" })
  if (lnds.length === 0) {
    return new OffChainServiceUnavailableError("no active lightning node (for offchain)")
  }
  return lnds[0]

  // an alternative that would load balance would be:
  // const index = Math.floor(Math.random() * lnds.length)
  // return lnds[index]
}

export const getActiveOnchainLnd = (): LndConnect | OnChainServiceError => {
  const lnds = getLnds({ active: true, type: "onchain" })
  if (lnds.length === 0) {
    return new OnChainServiceUnavailableError("no active lightning node (for onchain)")
  }
  return lnds[0]
}

export const onchainLnds = getLnds({ type: "onchain" })

export const nodesPubKey = offchainLnds.map((item) => item.pubkey)

export const getLndFromPubkey = ({
  pubkey,
}: {
  pubkey: string
}): AuthenticatedLnd | LightningServiceError => {
  const lnds = getLnds({ active: true })
  const lndParams = lnds.find(({ pubkey: nodePubKey }) => nodePubKey === pubkey)
  return (
    lndParams?.lnd ||
    new NoValidNodeForPubkeyError(`lnd with pubkey:${pubkey} is offline`)
  )
}

// A rough description of the error type we get back from the
// 'lightning' library can be described as:
//
// [
//   0: <Error Classification Code Number>
//   1: <Error Type String>
//   2: {
//     err?: <Error Code Details Object>
//     failures?: [
//       [
//         0: <Error Code Number>
//         1: <Error Code Message String>
//         2: {
//           err?: <Error Code Details Object>
//         }
//       ]
//     ]
//   }
// ]
//
// where '<Error Code Details Object>' is an Error object with
// the usual 'message', 'stack' etc. properties and additional
// properties: 'code', 'details', 'metadata'.
/* eslint @typescript-eslint/ban-ts-comment: "off" */
// @ts-ignore-next-line no-implicit-any error
export const parseLndErrorDetails = (err) =>
  err[2]?.err?.details || err[2]?.failures?.[0]?.[2]?.err?.details || err[1]
