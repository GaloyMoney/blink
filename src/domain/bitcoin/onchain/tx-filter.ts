export const TxFilter = ({
  confirmationsLessThan,
  confirmationsGreaterThanOrEqual,
  addresses,
}: TxFilterArgs): TxFilter => {
  const apply = (txs: SubmittedTransaction[]): SubmittedTransaction[] => {
    return txs.filter(({ confirmations, outputAddresses }) => {
      if (
        !!confirmationsGreaterThanOrEqual &&
        confirmations < confirmationsGreaterThanOrEqual
      ) {
        return false
      }
      if (!!confirmationsLessThan && confirmations >= confirmationsLessThan) {
        return false
      }
      if (!!addresses && !outputAddresses.some((addr) => addresses.includes(addr))) {
        return false
      }
      return true
    })
  }

  return { apply }
}
