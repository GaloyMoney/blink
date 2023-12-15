import {
  displayAmountFromWalletAmount,
  priceAmountFromDisplayPriceRatio,
} from "./display-currency"

import { UsdDisplayCurrency } from "./primitives"

export const DisplayAmountsConverter = <D extends DisplayCurrency>(
  displayPriceRatio: DisplayPriceRatio<"BTC", D>,
): DisplayAmountsConverter<D> => {
  const convert = (args: AmountsAndFees) => {
    const displayCurrency = displayPriceRatio.displayCurrency

    let displayAmount = displayPriceRatio.convertFromWallet(args.btcPaymentAmount)
    let displayFee = displayPriceRatio.convertFromWalletToCeil(args.btcProtocolAndBankFee)
    if (displayCurrency === UsdDisplayCurrency) {
      displayAmount = displayAmountFromWalletAmount<D>(args.usdPaymentAmount)
      displayFee = displayAmountFromWalletAmount<D>(args.usdProtocolAndBankFee)
    }

    return {
      displayAmount,
      displayFee,
      displayCurrency,

      // Note: This should come from the WalletPriceRatio too if currency is USD, but
      //       this is left as-is for now since we don't have precise wallet ratios yet.
      displayPrice: priceAmountFromDisplayPriceRatio(displayPriceRatio),
    }
  }

  return { convert }
}
