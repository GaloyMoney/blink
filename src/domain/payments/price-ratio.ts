import { WalletCurrency } from "@domain/shared"

export const PriceRatio = ({
  usd,
  btc,
}: {
  usd: UsdPaymentAmount
  btc: BtcPaymentAmount
}): PriceRatio => {
  const convertFromUsd = (convert: UsdPaymentAmount): BtcPaymentAmount => {
    return {
      amount: (convert.amount * btc.amount) / usd.amount,
      currency: WalletCurrency.Btc,
    }
  }
  const convertFromBtc = (convert: BtcPaymentAmount): UsdPaymentAmount => {
    return {
      amount: (convert.amount * usd.amount) / btc.amount,
      currency: WalletCurrency.Usd,
    }
  }
  return {
    convertFromUsd,
    convertFromBtc,
  }
}
