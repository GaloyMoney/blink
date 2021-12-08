import { InvalidOnChainAddress, InvalidScanDepthAmount } from "@domain/errors"

export * from "./errors"
export * from "./tx-filter"
export * from "./tx-decoder"

export const checkedToOnChainAddress = (
  value: string,
): OnChainAddress | ValidationError => {
  // Regex patterns: https://regexland.com/regex-bitcoin-addresses/
  const regexes = [
    /^[13]{1}[a-km-zA-HJ-NP-Z1-9]{26,34}$/, // mainnet non-segwit
    /^[mn2]{1}[a-km-zA-HJ-NP-Z1-9]{26,34}$/, // testnet non-segwit
    /^bc1[a-z0-9]{39,59}$/i, // mainnet segwit
    /^tb1[a-z0-9]{39,59}$/i, // testnet segwit
    /^bcrt1[a-z0-9]{39,59}$/i, // regtest segwit
  ]

  if (regexes.some((r) => value.match(r))) return value as OnChainAddress
  return new InvalidOnChainAddress()
}

export const checkedToScanDepth = (value: number): ScanDepth | ValidationError => {
  // 1 month as max scan depth
  if (value && value > 0 && value <= 4380) return value as ScanDepth
  return new InvalidScanDepthAmount()
}

export const BaseOnChainTransaction = ({
  confirmations,
  rawTx,
  fee,
  createdAt,
}: {
  confirmations: number
  rawTx: OnChainTransaction
  fee: Satoshis
  createdAt: Date
}): BaseOnChainTransaction => ({
  confirmations,
  rawTx,
  fee,
  createdAt,
  uniqueAddresses: () =>
    rawTx.outs.reduce<OnChainAddress[]>((a: OnChainAddress[], o: TxOut) => {
      if (o.address && !a.includes(o.address)) a.push(o.address)
      return a
    }, []),
})

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
}): IncomingOnChainTransaction =>
  BaseOnChainTransaction({
    confirmations,
    rawTx,
    fee,
    createdAt,
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
}): OutgoingOnChainTransaction =>
  BaseOnChainTransaction({
    confirmations,
    rawTx,
    fee,
    createdAt,
  })
