import * as ecc from "tiny-secp256k1"
import { address, initEccLib, Network, networks } from "bitcoinjs-lib"

import { InvalidOnChainAddress, InvalidScanDepthAmount } from "@/domain/errors"

export * from "./errors"
export * from "./tx-filter"
export * from "./tx-decoder"
export * from "./rebalance-checker"

initEccLib(ecc)

const networkMap: Record<BtcNetwork, Network> = {
  mainnet: networks.bitcoin,
  testnet: networks.testnet,
  signet: networks.testnet, // Signet uses testnet parameters
  regtest: networks.regtest,
}

export const checkedToOnChainAddress = ({
  network,
  value,
}: {
  network: BtcNetwork
  value: string
}): OnChainAddress | ValidationError => {
  try {
    const bitcoinNetwork = networkMap[network]
    address.toOutputScript(value, bitcoinNetwork)
    return value as OnChainAddress
  } catch (e) {
    return new InvalidOnChainAddress(e)
  }
}

export const checkedToScanDepth = (value: number): ScanDepth | ValidationError => {
  // 1 month as max scan depth
  if (value && value > 0 && value <= 4380) return value as ScanDepth
  return new InvalidScanDepthAmount()
}

export const IncomingOnChainTransaction = ({
  confirmations,
  rawTx,
  fee,
  createdAt,
}: {
  confirmations: number
  rawTx: OnChainTransaction
  fee: Satoshis
  createdAt: Date
}): IncomingOnChainTransaction => ({
  confirmations,
  rawTx,
  fee,
  createdAt,
  uniqueAddresses: () => uniqueAddressesForTxn(rawTx),
})

export const OutgoingOnChainTransaction = ({
  confirmations,
  rawTx,
  fee,
  createdAt,
}: {
  confirmations: number
  rawTx: OnChainTransaction
  fee: Satoshis
  createdAt: Date
}): OutgoingOnChainTransaction => ({
  confirmations,
  rawTx,
  fee,
  createdAt,
  uniqueAddresses: () => uniqueAddressesForTxn(rawTx),
})

export const uniqueAddressesForTxn = (rawTx: OnChainTransaction) =>
  rawTx.outs.reduce<OnChainAddress[]>((a: OnChainAddress[], o: TxOut) => {
    if (o.address && !a.includes(o.address)) a.push(o.address)
    return a
  }, [])

export const PayoutSpeed = {
  Fast: "fast",
} as const
