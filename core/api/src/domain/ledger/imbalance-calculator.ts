import { toSats } from "@/domain/bitcoin"
import { toCents } from "@/domain/fiat"
import { paymentAmountFromNumber, WalletCurrency } from "@/domain/shared"
import { WithdrawalFeePriceMethod } from "@/domain/wallets"

const MS_PER_HOUR = (60 * 60 * 1000) as MilliSeconds
const MS_PER_DAY = (24 * MS_PER_HOUR) as MilliSeconds

export const ImbalanceCalculator = ({
  method,
  netInVolumeAmountLightningFn,
  netInVolumeAmountOnChainFn,
  sinceDaysAgo,
}: ImbalanceCalculatorConfig): ImbalanceCalculator => {
  const since = new Date(new Date().getTime() - sinceDaysAgo * MS_PER_DAY)

  const getNetInboundFlow = async <T extends WalletCurrency>({
    netInVolumeAmountFn,
    wallet,
    since,
  }: {
    netInVolumeAmountFn: NewGetVolumeAmountSinceFn
    wallet: WalletDescriptor<T>
    since: Date
  }) => {
    const volumeAmount = await netInVolumeAmountFn({
      walletDescriptor: wallet,
      timestamp: since,
    })
    if (volumeAmount instanceof Error) return volumeAmount

    return wallet.currency === WalletCurrency.Btc
      ? toSats(volumeAmount.amount)
      : toCents(volumeAmount.amount)
  }

  const getSwapOutImbalanceAmount = async <T extends WalletCurrency>(
    wallet: WalletDescriptor<T>,
  ): Promise<PaymentAmount<T> | LedgerServiceError | ValidationError> => {
    if (method === WithdrawalFeePriceMethod.flat) {
      return paymentAmountFromNumber<T>({ amount: 0, currency: wallet.currency })
    }

    const lnNetInbound = await getNetInboundFlow({
      since,
      wallet,
      netInVolumeAmountFn: netInVolumeAmountLightningFn,
    })
    if (lnNetInbound instanceof Error) return lnNetInbound

    const onChainNetInbound = await getNetInboundFlow({
      since,
      wallet,
      netInVolumeAmountFn: netInVolumeAmountOnChainFn,
    })
    if (onChainNetInbound instanceof Error) return onChainNetInbound

    const imbalance = (lnNetInbound - onChainNetInbound) as SwapOutImbalance

    return paymentAmountFromNumber<T>({ amount: imbalance, currency: wallet.currency })
  }

  return {
    getSwapOutImbalanceAmount,
  }
}
