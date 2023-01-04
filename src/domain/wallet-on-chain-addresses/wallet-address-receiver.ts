import { PriceRatio } from "@domain/payments"
import { AmountCalculator, WalletCurrency } from "@domain/shared"

const calc = AmountCalculator()

export const WalletAddressReceiver = async <S extends WalletCurrency>({
  walletAddress,
  receivedBtc,
  feeBtc,
  usdFromBtc,
  usdFromBtcMidPrice,
}: WalletAddressReceiverArgs<S>): Promise<
  WalletAddressReceiver | DealerPriceServiceError | ValidationError
> => {
  if (walletAddress.recipientWalletDescriptor.currency === WalletCurrency.Btc) {
    const receivedUsd = await usdFromBtcMidPrice(receivedBtc)
    if (receivedUsd instanceof Error) return receivedUsd

    const priceRatio = PriceRatio({ usd: receivedUsd, btc: receivedBtc })
    if (priceRatio instanceof Error) return priceRatio

    const bankFee = {
      usdBankFee: priceRatio.convertFromBtc(feeBtc),
      btcBankFee: feeBtc,
    }

    return {
      btcToCreditReceiver: calc.sub(receivedBtc, feeBtc),
      usdToCreditReceiver: calc.sub(receivedUsd, bankFee.usdBankFee),
      ...bankFee,
      receivedAmount: () =>
        walletAddress.recipientWalletDescriptor.currency === WalletCurrency.Btc
          ? receivedBtc
          : receivedUsd,
    }
  }

  const receivedUsd = await usdFromBtc(receivedBtc)
  if (receivedUsd instanceof Error) return receivedUsd

  const priceRatio = PriceRatio({ usd: receivedUsd, btc: receivedBtc })
  if (priceRatio instanceof Error) return priceRatio

  const bankFee = {
    usdBankFee: priceRatio.convertFromBtc(feeBtc),
    btcBankFee: feeBtc,
  }

  return {
    btcToCreditReceiver: calc.sub(receivedBtc, feeBtc),
    usdToCreditReceiver: calc.sub(receivedUsd, bankFee.usdBankFee),
    ...bankFee,
    receivedAmount: () =>
      walletAddress.recipientWalletDescriptor.currency === WalletCurrency.Btc
        ? receivedBtc
        : receivedUsd,
  }
}
