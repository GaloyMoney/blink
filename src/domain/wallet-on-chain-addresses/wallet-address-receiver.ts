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
  const usdFromBtcFn =
    walletAddress.recipientWalletDescriptor.currency === WalletCurrency.Btc
      ? usdFromBtcMidPrice
      : usdFromBtc

  const receivedUsd = await usdFromBtcFn(receivedBtc)
  if (receivedUsd instanceof Error) return receivedUsd

  const priceRatio = PriceRatio({ usd: receivedUsd, btc: receivedBtc })
  if (priceRatio instanceof Error) return priceRatio

  const bankFee = {
    usdBankFee: priceRatio.convertFromBtcToCeil(feeBtc),
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
