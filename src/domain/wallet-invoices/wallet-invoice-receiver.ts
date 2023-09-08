import { WalletPriceRatio } from "@domain/payments"
import { AmountCalculator, WalletCurrency, ZERO_BANK_FEE } from "@domain/shared"

const calc = AmountCalculator()

export const WalletInvoiceReceiver = ({
  walletInvoice,
  recipientAccountId,
  recipientWalletDescriptorsForAccount,
  receivedBtc,
  satsFee = ZERO_BANK_FEE.btcBankFee,
}: WalletInvoiceReceiverArgs): WalletInvoiceReceiver => {
  const {
    recipientWalletDescriptor: partialWalletDescriptor,
    usdAmount: usdAmountFromInvoice,
  } = walletInvoice

  const recipientWalletDescriptor = {
    ...partialWalletDescriptor,
    accountId: recipientAccountId,
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
    const receivedWalletInvoiceFromBtcAmountMid = async () => {
      const receivedUsd = await mid.usdFromBtc(receivedBtc)
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

    const receivedWalletInvoiceFromUsdAmountMid = async (
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
      return receivedWalletInvoiceFromUsdAmountMid(usdAmountFromInvoice)
    }

    return receivedWalletInvoiceFromBtcAmountDealer()
  }

  return { withConversion }
}
