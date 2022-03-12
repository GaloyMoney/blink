const MS_PER_HOUR = (60 * 60 * 1000) as MilliSeconds
const MS_PER_DAY = (24 * MS_PER_HOUR) as MilliSeconds

export const ImbalanceCalculator = ({
  volumeLightningFn,
  volumeOnChainFn,
  sinceDaysAgo,
}: ImbalanceCalculatorConfig): ImbalanceCalculator => {
  const since = new Date(new Date().getTime() - sinceDaysAgo * MS_PER_DAY)

  const getImbalance = async ({
    volumeFn,
    walletId,
    since,
  }: {
    volumeFn: GetVolumeSinceFn
    walletId: WalletId
    since: Date
  }) => {
    const volume_ = await volumeFn({
      walletId,
      timestamp: since,
    })
    if (volume_ instanceof Error) return volume_

    return (volume_.incomingBaseAmount - volume_.outgoingBaseAmount) as Imbalance
  }

  const getSwapOutImbalance = async (walletId: WalletId) => {
    const lnImbalance = await getImbalance({
      since,
      walletId,
      volumeFn: volumeLightningFn,
    })
    if (lnImbalance instanceof Error) return lnImbalance

    const onChainImbalance = await getImbalance({
      since,
      walletId,
      volumeFn: volumeOnChainFn,
    })
    if (onChainImbalance instanceof Error) return onChainImbalance

    return (lnImbalance - onChainImbalance) as Imbalance
  }

  return {
    getSwapOutImbalance,
  }
}
