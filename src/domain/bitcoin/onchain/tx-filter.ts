export const MakeTxFilter = ({
  confsLT,
  confsGTE,
  addresses,
}: TxFilterArgs): TxFilter => {
  const apply = (txs: SubmittedTransaction[]): SubmittedTransaction[] => {
    return txs.filter(({ confirmations, outputAddresses }) => {
      if (!!confsGTE && confirmations < confsGTE) {
        return false
      }
      if (!!confsLT && confirmations >= confsLT) {
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
