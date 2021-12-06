export * from "./errors"
export * from "./tx-filter"
export * from "./tx-decoder"

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
  uniqueAddresses: () =>
    rawTx.outs.reduce<OnChainAddress[]>((a: OnChainAddress[], o: TxOut) => {
      if (o.address && !a.includes(o.address)) a.push(o.address)
      return a
    }, []),
})
