import { AmountLessThanFeeError } from "@/domain/errors"
import { WalletPriceRatio } from "@/domain/payments"
import { AmountCalculator, WalletCurrency, ZERO_BANK_FEE } from "@/domain/shared"

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

  const priceRatio = WalletPriceRatio({ usd: receivedUsd, btc: receivedBtc })
  if (priceRatio instanceof Error) return priceRatio

  const bankFee = {
    usdBankFee: priceRatio.convertFromBtcToCeil(satsFee),
    btcBankFee: satsFee,
  }

  const btcToCreditReceiver = calc.sub(receivedBtc, satsFee)
  const usdToCreditReceiver = calc.sub(receivedUsd, bankFee.usdBankFee)

  if (btcToCreditReceiver.amount <= 0 || usdToCreditReceiver.amount <= 0) {
    return new AmountLessThanFeeError(`${receivedBtc.amount}`)
  }

  return {
    btcToCreditReceiver,
    usdToCreditReceiver,
    ...bankFee,
    receivedAmount: () =>
      walletAddress.recipientWalletDescriptor.currency === WalletCurrency.Btc
        ? receivedBtc
        : receivedUsd,
    settlementAmounts: () =>
      walletAddress.recipientWalletDescriptor.currency === WalletCurrency.Btc
        ? {
            amountToCreditReceiver: btcToCreditReceiver,
            bankFee: bankFee.btcBankFee,
          }
        : {
            amountToCreditReceiver: usdToCreditReceiver,
            bankFee: bankFee.usdBankFee,
          },
  }
}
