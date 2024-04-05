import { FEECAP_BASIS_POINTS } from "@/domain/bitcoin"
import { MaxFeeTooLargeForRoutelessPaymentError } from "@/domain/bitcoin/lightning"
import {
  WalletCurrency,
  ZERO_SATS,
  ZERO_CENTS,
  paymentAmountFromNumber,
  AmountCalculator,
  ONE_CENT,
} from "@/domain/shared"

const calc = AmountCalculator()

export const LnFees = () => {
  const feeCapBasisPoints = FEECAP_BASIS_POINTS

  const maxProtocolAndBankFee = <T extends WalletCurrency>(amount: PaymentAmount<T>) => {
    if (amount.amount == 0n) {
      return amount
    }

    const maxFee = calc.mulBasisPoints(amount, feeCapBasisPoints)

    return {
      amount: maxFee.amount === 0n ? 1n : maxFee.amount,
      currency: amount.currency,
    }
  }

  const intraLedgerFees = () => {
    return {
      btc: ZERO_SATS,
      usd: ZERO_CENTS,
    }
  }

  const verifyMaxFee = ({
    maxFeeAmount,
    btcPaymentAmount,
    usdPaymentAmount,
    priceRatio,
    senderWalletCurrency,
    isFromNoAmountInvoice,
  }: {
    maxFeeAmount: BtcPaymentAmount
    btcPaymentAmount: BtcPaymentAmount
    usdPaymentAmount: UsdPaymentAmount
    priceRatio: WalletPriceRatio
    senderWalletCurrency: WalletCurrency
    isFromNoAmountInvoice: boolean
  }) => {
    const btcCalculatedMaxFeeAmount = maxProtocolAndBankFee(btcPaymentAmount)
    let calculatedMaxFeeAmount = btcCalculatedMaxFeeAmount
    if (senderWalletCurrency === WalletCurrency.Usd) {
      const maxFeeInUsd = maxProtocolAndBankFee(usdPaymentAmount)
      const usdCalculatedMaxFeeAmount = priceRatio.convertFromUsd(maxFeeInUsd)

      calculatedMaxFeeAmount = usdCalculatedMaxFeeAmount
      if (isFromNoAmountInvoice === false) {
        calculatedMaxFeeAmount =
          btcCalculatedMaxFeeAmount.amount > usdCalculatedMaxFeeAmount.amount
            ? btcCalculatedMaxFeeAmount
            : usdCalculatedMaxFeeAmount
      }
    }

    const calculatedMinFeeAmount = priceRatio.convertFromUsd(ONE_CENT)

    if (
      (senderWalletCurrency === WalletCurrency.Btc ||
        maxFeeAmount.amount > calculatedMinFeeAmount.amount) &&
      maxFeeAmount.amount > calculatedMaxFeeAmount.amount
    ) {
      return new MaxFeeTooLargeForRoutelessPaymentError(
        JSON.stringify({
          btcPaymentAmount: Number(btcPaymentAmount.amount),
          usdPaymentAmount: Number(usdPaymentAmount.amount),
          maxFeeBtcAmount: Number(maxFeeAmount.amount),
          senderWalletCurrency: senderWalletCurrency,
          calculatedMaxFeeBtcAmount: Number(calculatedMaxFeeAmount.amount),
        }),
      )
    }

    return true
  }

  const feeFromRawRoute = (rawRoute: RawRoute): BtcPaymentAmount | ValidationError => {
    const amount = Math.ceil(rawRoute.safe_fee)
    return paymentAmountFromNumber({ amount, currency: WalletCurrency.Btc })
  }

  return {
    intraLedgerFees,
    maxProtocolAndBankFee,
    verifyMaxFee,
    feeFromRawRoute,
  }
}
