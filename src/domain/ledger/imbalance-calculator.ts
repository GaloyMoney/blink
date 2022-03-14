import { toSats } from "@domain/bitcoin"
import { WithdrawalFeePriceMethod } from "@domain/wallets"

const MS_PER_HOUR = (60 * 60 * 1000) as MilliSeconds
const MS_PER_DAY = (24 * MS_PER_HOUR) as MilliSeconds

export const ImbalanceCalculator = ({
  method,
  volumeLightningFn,
  volumeOnChainFn,
  sinceDaysAgo,
}: ImbalanceCalculatorConfig): ImbalanceCalculator => {
  const since = new Date(new Date().getTime() - sinceDaysAgo * MS_PER_DAY)

  const getNetInboundFlow = async ({
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

    return toSats(volume_.incomingBaseAmount - volume_.outgoingBaseAmount)
  }

  const getSwapOutImbalance = async (walletId: WalletId) => {
    if (method === WithdrawalFeePriceMethod.flat) return 0 as SwapOutImbalance

    const lnNetInbound = await getNetInboundFlow({
      since,
      walletId,
      volumeFn: volumeLightningFn,
    })
    if (lnNetInbound instanceof Error) return lnNetInbound

    const onChainNetInbound = await getNetInboundFlow({
      since,
      walletId,
      volumeFn: volumeOnChainFn,
    })
    if (onChainNetInbound instanceof Error) return onChainNetInbound

    return (lnNetInbound - onChainNetInbound) as SwapOutImbalance
  }

  return {
    getSwapOutImbalance,
  }
}
