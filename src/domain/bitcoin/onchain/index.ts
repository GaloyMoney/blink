import { InvalidScanDepthAmount } from "@domain/errors"

export * from "./errors"
export * from "./tx-filter"
export * from "./tx-decoder"

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
