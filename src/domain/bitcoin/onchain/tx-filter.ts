export const TxFilter = ({
  confirmationsLessThan,
  confirmationsGreaterThanOrEqual,
  addresses,
}: TxFilterArgs): TxFilter => {
  const apply = (txs: IncomingOnChainTransaction[]): IncomingOnChainTransaction[] => {
    return txs.filter(({ confirmations, rawTx: { outs } }) => {
      if (
        !!confirmationsGreaterThanOrEqual &&
        confirmations < confirmationsGreaterThanOrEqual
      ) {
        return false
      }
      if (!!confirmationsLessThan && confirmations >= confirmationsLessThan) {
        return false
      }
      if (
        !!addresses &&
        !outs.some((out) => out.address !== null && addresses.includes(out.address))
      ) {
        return false
      }
      return true
    })
  }

  return { apply }
}
