import { getCurrentPrice } from "@app/prices"
import { getDealerConfig } from "@config"
import { CENTS_PER_USD } from "@domain/fiat"
import { toPriceRatio } from "@domain/payments"
import { ErrorLevel, ExchangeCurrencyUnit, WalletCurrency } from "@domain/shared"
import { NewDealerPriceService } from "@services/dealer-price"
import {
  addAttributesToCurrentSpan,
  asyncRunInSpan,
  recordExceptionInCurrentSpan,
  SemanticAttributes,
} from "@services/tracing"

const usdHedgeEnabled = getDealerConfig().usd.hedgingEnabled
const dealer = NewDealerPriceService()

export const usdFromBtcMidPriceFn = async (
  amount: BtcPaymentAmount,
): Promise<UsdPaymentAmount | DealerPriceServiceError> =>
  asyncRunInSpan(
    "app.payments.usdFromBtcMidPriceFn",
    {
      attributes: {
        [SemanticAttributes.CODE_FUNCTION]: "usdFromBtcMidPriceFn",
        [SemanticAttributes.CODE_NAMESPACE]: "app.payments",
      },
    },
    async () => {
      const midPriceRatio = await getMidPriceRatio(usdHedgeEnabled)
      if (midPriceRatio instanceof Error) return midPriceRatio

      const usdPaymentAmount = midPriceRatio.convertFromBtc(amount)

      addAttributesToCurrentSpan({
        "usdFromBtcMidPriceFn.midPriceRatio": midPriceRatio.usdPerSat(),
        "usdFromBtcMidPriceFn.incoming.amount": Number(amount.amount),
        "usdFromBtcMidPriceFn.incoming.unit":
          amount.currency === WalletCurrency.Btc
            ? ExchangeCurrencyUnit.Btc
            : ExchangeCurrencyUnit.Usd,
        "usdFromBtcMidPriceFn.outgoing.amount": Number(usdPaymentAmount.amount),
        "usdFromBtcMidPriceFn.outgoing.unit":
          usdPaymentAmount.currency === WalletCurrency.Usd
            ? ExchangeCurrencyUnit.Usd
            : ExchangeCurrencyUnit.Btc,
      })

      return usdPaymentAmount
    },
  )

export const btcFromUsdMidPriceFn = async (
  amount: UsdPaymentAmount,
): Promise<BtcPaymentAmount | DealerPriceServiceError> =>
  asyncRunInSpan(
    "app.payments.btcFromUsdMidPriceFn",
    {
      attributes: {
        [SemanticAttributes.CODE_FUNCTION]: "btcFromUsdMidPriceFn",
        [SemanticAttributes.CODE_NAMESPACE]: "app.payments",
      },
    },
    async () => {
      const midPriceRatio = await getMidPriceRatio(usdHedgeEnabled)
      if (midPriceRatio instanceof Error) return midPriceRatio

      const btcPaymentAmount = midPriceRatio.convertFromUsd(amount)

      addAttributesToCurrentSpan({
        "btcFromUsdMidPriceFn.midPriceRatio": midPriceRatio.usdPerSat(),
        "btcFromUsdMidPriceFn.incoming.amount": Number(amount.amount),
        "btcFromUsdMidPriceFn.incoming.unit":
          amount.currency === WalletCurrency.Usd
            ? ExchangeCurrencyUnit.Usd
            : ExchangeCurrencyUnit.Btc,
        "btcFromUsdMidPriceFn.outgoing.amount": Number(btcPaymentAmount.amount),
        "btcFromUsdMidPriceFn.outgoing.unit":
          btcPaymentAmount.currency === WalletCurrency.Btc
            ? ExchangeCurrencyUnit.Btc
            : ExchangeCurrencyUnit.Usd,
      })

      return btcPaymentAmount
    },
  )

export const getCurrentPriceInCentsPerSat = async (): Promise<
  PriceRatio | PriceServiceError
> => {
  const price = await getCurrentPrice()
  if (price instanceof Error) return price

  return toPriceRatio(price * CENTS_PER_USD)
}

export const getMidPriceRatio = async (
  usdHedgeEnabled: YamlSchema["dealer"][keyof YamlSchema["dealer"]]["hedgingEnabled"],
): Promise<PriceRatio | PriceServiceError> => {
  if (usdHedgeEnabled) {
    const priceRatio = await dealer.getCentsPerSatsExchangeMidRate()
    if (priceRatio instanceof Error) {
      recordExceptionInCurrentSpan({
        error: priceRatio,
        level: ErrorLevel.Critical,
      })
      return getCurrentPriceInCentsPerSat()
    }
    return priceRatio
  }

  return getCurrentPriceInCentsPerSat()
}
