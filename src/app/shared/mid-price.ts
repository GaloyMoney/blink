import { getDealerConfig } from "@config"

import { getCurrentPriceAsPriceRatio } from "@app/prices"

import { DisplayCurrency } from "@domain/fiat"
import { ErrorLevel, ExchangeCurrencyUnit, WalletCurrency } from "@domain/shared"

import {
  addAttributesToCurrentSpan,
  asyncRunInSpan,
  recordExceptionInCurrentSpan,
  SemanticAttributes,
} from "@services/tracing"
import { DealerPriceService } from "@services/dealer-price"

const usdHedgeEnabled = getDealerConfig().usd.hedgingEnabled
const dealer = DealerPriceService()

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

export const getMidPriceRatio = async (
  usdHedgeEnabled: YamlSchema["dealer"][keyof YamlSchema["dealer"]]["hedgingEnabled"],
): Promise<PriceRatio | PriceServiceError> => {
  if (usdHedgeEnabled) {
    const priceRatio = await dealer.getCentsPerSatsExchangeMidRate()
    if (priceRatio instanceof Error) {
      recordExceptionInCurrentSpan({
        error: priceRatio,
        level: ErrorLevel.Warn,
      })
      return getCurrentPriceAsPriceRatio({ currency: DisplayCurrency.Usd })
    }
    return priceRatio
  }

  return getCurrentPriceAsPriceRatio({ currency: DisplayCurrency.Usd })
}
