import { UncaughtTypescriptError } from "@domain/errors"

export const TxFilter = ({
  confirmationsLessThan,
  confirmationsGreaterThanOrEqual,
  addresses,
}: TxFilterArgs): TxFilter => {
  const apply = (
    txs: IncomingOnChainTransaction[],
  ): IncomingOnChainTransaction[] | UncaughtTypescriptError => {
    try {
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
    } catch (err) {
      // txs.filter has thrown TypeError recently unexpectedly
      return new UncaughtTypescriptError(`${txs}`)
    }
  }

  return { apply }
}
