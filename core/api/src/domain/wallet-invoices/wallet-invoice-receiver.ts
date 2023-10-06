import {
  InvalidZeroAmountPriceRatioInputError,
  WalletPriceRatio,
} from "@/domain/payments"
import { AmountCalculator, WalletCurrency, ZERO_BANK_FEE } from "@/domain/shared"

const calc = AmountCalculator()

export const WalletInvoiceReceiver = ({
  walletInvoice,
  recipientWalletDescriptors,
  receivedBtc,
  satsFee = ZERO_BANK_FEE.btcBankFee,
}: WalletInvoiceReceiverArgs): WalletInvoiceReceiver => {
  const {
    recipientWalletDescriptor: partialWalletDescriptor,
    usdAmount: usdAmountFromInvoice,
  } = walletInvoice

  const recipientWalletDescriptor = {
    ...partialWalletDescriptor,
    accountId: recipientWalletDescriptors[WalletCurrency.Btc].accountId,
  }

  const withConversion = async ({
    hedgeBuyUsd,
    mid,
  }: WalletInvoiceWithConversionArgs): Promise<
    ReceivedWalletInvoice | ValidationError | DealerPriceServiceError
  > => {
    // Setup conditions
    const isBtcRecipient = recipientWalletDescriptor.currency === WalletCurrency.Btc

    // Define conversion methods
    const receivedWalletInvoiceFromBtcAmountMid = async (
      newRecipientWalletDescriptor?: WalletDescriptor<"BTC">,
    ) => {
      const receivedUsd = await mid.usdFromBtc(receivedBtc)
      if (receivedUsd instanceof Error) return receivedUsd

      const priceRatio = WalletPriceRatio({ usd: receivedUsd, btc: receivedBtc })
      if (priceRatio instanceof Error) return priceRatio

      const btcBankFee = satsFee
      const usdBankFee = priceRatio.convertFromBtcToCeil(btcBankFee)

      const walletDescriptor =
        newRecipientWalletDescriptor !== undefined
          ? newRecipientWalletDescriptor
          : recipientWalletDescriptor

      return {
        btcToCreditReceiver: calc.sub(receivedBtc, btcBankFee),
        usdToCreditReceiver: calc.sub(receivedUsd, usdBankFee),
        usdBankFee,
        btcBankFee,
        recipientWalletDescriptor: walletDescriptor,
        receivedAmount: () =>
          walletDescriptor.currency === WalletCurrency.Btc ? receivedBtc : receivedUsd,
      }
    }

    const receivedWalletInvoiceFromUsdAmountRatio = async (
      receivedUsd: UsdPaymentAmount,
    ) => {
      const priceRatio = WalletPriceRatio({ usd: receivedUsd, btc: receivedBtc })
      if (priceRatio instanceof Error) return priceRatio

      const btcBankFee = satsFee
      const usdBankFee = priceRatio.convertFromBtcToCeil(btcBankFee)

      return {
        btcToCreditReceiver: calc.sub(receivedBtc, btcBankFee),
        usdToCreditReceiver: calc.sub(receivedUsd, usdBankFee),
        usdBankFee,
        btcBankFee,
        recipientWalletDescriptor,
        receivedAmount: () =>
          recipientWalletDescriptor.currency === WalletCurrency.Btc
            ? receivedBtc
            : receivedUsd,
      }
    }

    const receivedWalletInvoiceFromBtcAmountDealer = async () => {
      const receivedUsd = await hedgeBuyUsd.usdFromBtc(receivedBtc)
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
        recipientWalletDescriptor,
        receivedAmount: () =>
          recipientWalletDescriptor.currency === WalletCurrency.Btc
            ? receivedBtc
            : receivedUsd,
      }
    }

    // Apply conversion methods based on conditional checks
    if (isBtcRecipient) {
      return receivedWalletInvoiceFromBtcAmountMid()
    }

    if (usdAmountFromInvoice) {
      return receivedWalletInvoiceFromUsdAmountRatio(usdAmountFromInvoice)
    }

    const received = await receivedWalletInvoiceFromBtcAmountDealer()
    if (!(received instanceof InvalidZeroAmountPriceRatioInputError)) return received

    const recipientBtcWalletDescriptor = recipientWalletDescriptors[WalletCurrency.Btc]
    return receivedWalletInvoiceFromBtcAmountMid(recipientBtcWalletDescriptor)
  }

  return { withConversion }
}
