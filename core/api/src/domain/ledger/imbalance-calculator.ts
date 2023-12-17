import { toSats } from "@/domain/bitcoin"
import { toCents } from "@/domain/fiat"
import {
  AmountCalculator,
  paymentAmountFromNumber,
  WalletCurrency,
} from "@/domain/shared"
import { WithdrawalFeePriceMethod } from "@/domain/wallets"

const MS_PER_HOUR = (60 * 60 * 1000) as MilliSeconds
const MS_PER_DAY = (24 * MS_PER_HOUR) as MilliSeconds

const calc = AmountCalculator()

export const ImbalanceCalculator = ({
  method,
  volumeAmountLightningFn,
  volumeAmountOnChainFn,
  sinceDaysAgo,
}: ImbalanceCalculatorConfig): ImbalanceCalculator => {
  const since = new Date(new Date().getTime() - sinceDaysAgo * MS_PER_DAY)

  const getNetInboundFlow = async <T extends WalletCurrency>({
    volumeAmountFn,
    wallet,
    since,
  }: {
    volumeAmountFn: GetVolumeAmountSinceFn
    wallet: WalletDescriptor<T>
    since: Date
  }) => {
    const volumeAmount = await volumeAmountFn({
      walletDescriptor: wallet,
      timestamp: since,
    })
    if (volumeAmount instanceof Error) return volumeAmount

    return wallet.currency === WalletCurrency.Btc
      ? toSats(
          calc.sub(volumeAmount.incomingBaseAmount, volumeAmount.outgoingBaseAmount)
            .amount,
        )
      : toCents(
          calc.sub(volumeAmount.incomingBaseAmount, volumeAmount.outgoingBaseAmount)
            .amount,
        )
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
      volumeAmountFn: volumeAmountLightningFn,
    })
    if (lnNetInbound instanceof Error) return lnNetInbound

    const onChainNetInbound = await getNetInboundFlow({
      since,
      wallet,
      volumeAmountFn: volumeAmountOnChainFn,
    })
    if (onChainNetInbound instanceof Error) return onChainNetInbound

    const imbalance = (lnNetInbound - onChainNetInbound) as SwapOutImbalance

    return paymentAmountFromNumber<T>({ amount: imbalance, currency: wallet.currency })
  }

  return {
    getSwapOutImbalanceAmount,
  }
}
