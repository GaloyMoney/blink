import { InvalidOnChainAddress, InvalidScanDepthAmount } from "@domain/errors"

export * from "./errors"
export * from "./tx-filter"
export * from "./tx-decoder"

export const checkedToOnChainAddress = ({
  network,
  value,
}: {
  network: BtcNetwork
  value: string
}): OnChainAddress | ValidationError => {
  // Regex patterns: https://regexland.com/regex-bitcoin-addresses/
  const regexes = {
    mainnet: [/^[13]{1}[a-km-zA-HJ-NP-Z1-9]{26,34}$/, /^bc1[a-z0-9]{39,59}$/i],
    testnet: [/^[mn2]{1}[a-km-zA-HJ-NP-Z1-9]{26,34}$/, /^tb1[a-z0-9]{39,59}$/i],
    signet: [/^[mn2]{1}[a-km-zA-HJ-NP-Z1-9]{26,34}$/, /^tb1[a-z0-9]{39,59}$/i],
    regtest: [/^bcrt1[a-z0-9]{39,59}$/i],
  }

  if (regexes[network].some((r) => value.match(r))) return value as OnChainAddress
  return new InvalidOnChainAddress()
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
