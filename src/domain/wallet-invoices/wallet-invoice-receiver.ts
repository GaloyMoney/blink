import {
  InvalidZeroAmountPriceRatioInputError,
  WalletPriceRatio,
  ZeroAmountForUsdRecipientError,
} from "@domain/payments"
import { AmountCalculator, WalletCurrency, ZERO_BANK_FEE } from "@domain/shared"

const calc = AmountCalculator()

export const WalletInvoiceReceiver = async ({
  walletInvoice,
  receivedBtc,
  satsFee = ZERO_BANK_FEE.btcBankFee,
  usdFromBtc,
  usdFromBtcMidPrice,
}: WalletInvoiceReceiverArgs): Promise<
  WalletInvoiceReceiver | DealerPriceServiceError | ValidationError
> => {
  if (walletInvoice.recipientWalletDescriptor.currency === WalletCurrency.Btc) {
    const receivedUsd = await usdFromBtcMidPrice(receivedBtc)
    if (receivedUsd instanceof Error) return receivedUsd

    const priceRatio = WalletPriceRatio({ usd: receivedUsd, btc: receivedBtc })
    if (priceRatio instanceof Error) return priceRatio

    const btcBankFee = satsFee
    const usdBankFee = priceRatio.convertFromBtcToCeil(btcBankFee)

    return {
      btcToCreditReceiver: calc.sub(receivedBtc, btcBankFee),
      usdToCreditReceiver: calc.sub(receivedUsd, usdBankFee),
      usdBankFee,
      btcBankFee,
      receivedAmount: () =>
        walletInvoice.recipientWalletDescriptor.currency === WalletCurrency.Btc
          ? receivedBtc
          : receivedUsd,
    }
  }

  if (walletInvoice.usdAmount) {
    const receivedUsd = walletInvoice.usdAmount

    const priceRatio = WalletPriceRatio({ usd: receivedUsd, btc: receivedBtc })
    if (priceRatio instanceof Error) return priceRatio

    const btcBankFee = satsFee
    const usdBankFee = priceRatio.convertFromBtcToCeil(btcBankFee)

    return {
      btcToCreditReceiver: calc.sub(receivedBtc, btcBankFee),
      usdToCreditReceiver: calc.sub(receivedUsd, usdBankFee),
      usdBankFee,
      btcBankFee,
      receivedAmount: () =>
        walletInvoice.recipientWalletDescriptor.currency === WalletCurrency.Btc
          ? receivedBtc
          : receivedUsd,
    }
  }

  const receivedUsd = await usdFromBtc(receivedBtc)
  if (receivedUsd instanceof Error) return receivedUsd

  const priceRatio = WalletPriceRatio({ usd: receivedUsd, btc: receivedBtc })
  if (
    priceRatio instanceof Error &&
    !(priceRatio instanceof InvalidZeroAmountPriceRatioInputError)
  ) {
    return priceRatio
  }
  // At this point we have a usd recipient and a btc send amount. If the ratio
  // comes back with this zero-amount error, it means the btc send amount is
  // under 1-cent.
  if (priceRatio instanceof InvalidZeroAmountPriceRatioInputError) {
    return new ZeroAmountForUsdRecipientError()
  }

  const btcBankFee = satsFee
  const usdBankFee = priceRatio.convertFromBtcToCeil(btcBankFee)

  return {
    btcToCreditReceiver: calc.sub(receivedBtc, btcBankFee),
    usdToCreditReceiver: calc.sub(receivedUsd, usdBankFee),
    usdBankFee,
    btcBankFee,
    receivedAmount: () =>
      walletInvoice.recipientWalletDescriptor.currency === WalletCurrency.Btc
        ? receivedBtc
        : receivedUsd,
  }
}
