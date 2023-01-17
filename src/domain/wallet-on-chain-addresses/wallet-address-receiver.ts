import { PriceRatio } from "@domain/payments"
import { AmountCalculator, WalletCurrency, ZERO_BANK_FEE } from "@domain/shared"

const calc = AmountCalculator()

export const WalletAddressReceiver = async <S extends WalletCurrency>({
  walletAddress,
  receivedBtc,
  satsFee = ZERO_BANK_FEE.btcBankFee,
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
    usdBankFee: priceRatio.convertFromBtcToCeil(satsFee),
    btcBankFee: satsFee,
  }

  return {
    btcToCreditReceiver: calc.sub(receivedBtc, satsFee),
    usdToCreditReceiver: calc.sub(receivedUsd, bankFee.usdBankFee),
    ...bankFee,
    receivedAmount: () =>
      walletAddress.recipientWalletDescriptor.currency === WalletCurrency.Btc
        ? receivedBtc
        : receivedUsd,
  }
}
