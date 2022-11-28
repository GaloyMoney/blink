import {
  AmountCalculator,
  paymentAmountFromNumber,
  WalletCurrency,
  ZERO_CENTS,
} from "@domain/shared"
import { addAttributesToCurrentSpan } from "@services/tracing"

const calc = AmountCalculator()

export const calculateLimitsInUsd = async ({
  limitName,
  limitAmount,
  priceRatio,

  walletVolumes,
}: {
  limitName:
    | "checkIntraledger"
    | "checkWithdrawal"
    | "checkTradeIntraAccount"
    | "checkTwoFA"
    | "volumesIntraledger"
    | "volumesWithdrawal"
    | "volumesTradeIntraAccount"
    | "volumesTwoFA"
  limitAmount: UsdPaymentAmount
  priceRatio: PriceRatio
  walletVolumes: TxBaseVolumeAmount<WalletCurrency>[]
}): Promise<{
  volumeTotalLimit: UsdPaymentAmount
  volumeUsed: UsdPaymentAmount
  volumeRemaining: UsdPaymentAmount
}> => {
  let volumeInUsdAmount = ZERO_CENTS
  for (const walletVolume of walletVolumes) {
    const outgoingUsdAmount =
      walletVolume.outgoingBaseAmount.currency === WalletCurrency.Btc
        ? await priceRatio.convertFromBtc(
            walletVolume.outgoingBaseAmount as BtcPaymentAmount,
          )
        : (walletVolume.outgoingBaseAmount as UsdPaymentAmount)

    volumeInUsdAmount = calc.add(volumeInUsdAmount, outgoingUsdAmount)
  }

  addAttributesToCurrentSpan({
    "txVolume.outgoingInBase": `${volumeInUsdAmount.amount}`,
    "txVolume.threshold": `${limitAmount.amount}`,
    "txVolume.limitCheck": limitName,
  })

  return {
    volumeTotalLimit: limitAmount,
    volumeUsed: volumeInUsdAmount,
    volumeRemaining: calc.sub(limitAmount, volumeInUsdAmount),
  }
}

const volumeLimitBase =
  ({
    limitName,
    limitAmount,
    priceRatio,
  }: {
    limitName:
      | "volumesIntraledger"
      | "volumesWithdrawal"
      | "volumesTradeIntraAccount"
      | "volumesTwoFA"
    limitAmount: UsdPaymentAmount
    priceRatio: PriceRatio
  }) =>
  async (walletVolumes: TxBaseVolumeAmount<WalletCurrency>[]) =>
    calculateLimitsInUsd({
      limitName,
      limitAmount,
      priceRatio,

      walletVolumes,
    })

export const AccountLimitsVolumes = ({
  accountLimits,
  priceRatio,
}: {
  accountLimits: IAccountLimits
  priceRatio: PriceRatio
}): AccountLimitsVolumes => {
  const accountLimitAmounts = {} as IAccountLimitAmounts
  for (const rawKey of Object.keys(accountLimits)) {
    const key = rawKey as keyof IAccountLimits
    const limitAmount = paymentAmountFromNumber({
      amount: accountLimits[key],
      currency: WalletCurrency.Usd,
    })
    if (limitAmount instanceof Error) return limitAmount
    accountLimitAmounts[key] = limitAmount
  }

  return {
    volumesIntraledger: volumeLimitBase({
      limitName: "volumesIntraledger",
      limitAmount: accountLimitAmounts.intraLedgerLimit,
      priceRatio,
    }),
    volumesWithdrawal: volumeLimitBase({
      limitName: "volumesWithdrawal",
      limitAmount: accountLimitAmounts.withdrawalLimit,
      priceRatio,
    }),
    volumesTradeIntraAccount: volumeLimitBase({
      limitName: "volumesTradeIntraAccount",
      limitAmount: accountLimitAmounts.tradeIntraAccountLimit,
      priceRatio,
    }),
  }
}

export const TwoFALimitsVolumes = ({
  twoFALimits,
  priceRatio,
}: {
  twoFALimits: TwoFALimits
  priceRatio: PriceRatio
}): TwoFALimitsVolumes => {
  const twoFALimitAmounts = {} as TwoFALimitAmounts
  for (const rawKey of Object.keys(twoFALimits)) {
    const key = rawKey as keyof TwoFALimits
    const limitAmount = paymentAmountFromNumber({
      amount: twoFALimits[key],
      currency: WalletCurrency.Usd,
    })
    if (limitAmount instanceof Error) return limitAmount
    twoFALimitAmounts[key] = limitAmount
  }

  return {
    volumesTwoFA: volumeLimitBase({
      limitName: "volumesTwoFA",
      limitAmount: twoFALimitAmounts.threshold,
      priceRatio,
    }),
  }
}
