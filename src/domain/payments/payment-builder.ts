import { ValidationError, WalletCurrency } from "@domain/shared"
import { PaymentInitiationMethod, SettlementMethod } from "@domain/wallets"
import { checkedToBtcPaymentAmount, checkedToUsdPaymentAmount } from "@domain/payments"

type PaymentBuilderState = {
  validationError?: ValidationError
  senderWalletId?: WalletId
  senderWalletCurrency?: WalletCurrency
  settlementMethod?: SettlementMethod
  paymentInitiationMethod?: PaymentInitiationMethod
  btcFeeAmount?: BtcPaymentAmount
  btcPaymentAmount?: BtcPaymentAmount
  usdPaymentAmount?: UsdPaymentAmount
  paymentRequest?: EncodedPaymentRequest
  uncheckedAmount?: number
}

export const PaymentBuilder = (
  builderState: PaymentBuilderState = {} as PaymentBuilderState,
): PaymentBuilder => {
  const withSenderWallet = <T extends WalletCurrency>(
    senderWallet: WalletDescriptor<T>,
  ) => {
    if (builderState.validationError) {
      return PaymentBuilder(builderState)
    }

    if (builderState.uncheckedAmount) {
      if (senderWallet.currency === WalletCurrency.Btc) {
        const paymentAmount = checkedToBtcPaymentAmount(builderState.uncheckedAmount)
        if (paymentAmount instanceof ValidationError) {
          return PaymentBuilder({
            validationError: paymentAmount,
          })
        }
        return PaymentBuilder({
          ...builderState,
          uncheckedAmount: undefined,
          senderWalletId: senderWallet.id,
          senderWalletCurrency: senderWallet.currency,
          btcPaymentAmount: paymentAmount,
        })
      } else {
        const paymentAmount = checkedToUsdPaymentAmount(builderState.uncheckedAmount)
        if (paymentAmount instanceof ValidationError) {
          return PaymentBuilder({
            validationError: paymentAmount,
          })
        }
        return PaymentBuilder({
          ...builderState,
          uncheckedAmount: undefined,
          senderWalletId: senderWallet.id,
          senderWalletCurrency: senderWallet.currency,
          usdPaymentAmount: paymentAmount,
        })
      }
    }

    return PaymentBuilder({
      ...builderState,
      senderWalletId: senderWallet.id,
      senderWalletCurrency: senderWallet.currency,
    })
  }

  const withPaymentRequest = (paymentRequest: EncodedPaymentRequest) => {
    return PaymentBuilder({
      ...builderState,
      paymentRequest,
    }).withPaymentInitiationMethod(PaymentInitiationMethod.Lightning)
  }

  const withBtcPaymentAmount = (amount: BtcPaymentAmount) => {
    return PaymentBuilder({ ...builderState, btcPaymentAmount: amount })
  }

  const withUncheckedAmount = (amount: number) => {
    const builder = PaymentBuilder({ ...builderState, uncheckedAmount: amount })
    const { senderWalletId, senderWalletCurrency } = builderState
    if (senderWalletCurrency && senderWalletId) {
      return builder.withSenderWallet({
        id: senderWalletId,
        currency: senderWalletCurrency,
      })
    }
    return builder
  }

  const withSettlementMethod = (settlementMethod: SettlementMethod) => {
    return PaymentBuilder({ ...builderState, settlementMethod })
  }

  const withPaymentInitiationMethod = (
    paymentInitiationMethod: PaymentInitiationMethod,
  ) => {
    return PaymentBuilder({ ...builderState, paymentInitiationMethod })
  }

  const withIsLocal = (isLocal: boolean) => {
    if (isLocal) {
      return PaymentBuilder(builderState).withSettlementMethod(
        SettlementMethod.IntraLedger,
      )
    } else if (builderState.paymentRequest) {
      return PaymentBuilder(builderState).withSettlementMethod(SettlementMethod.Lightning)
    } else {
      return PaymentBuilder(builderState).withSettlementMethod(SettlementMethod.OnChain)
    }
  }

  const payment = (): Payment | ValidationError => {
    if (builderState.validationError) {
      return builderState.validationError
    }

    const {
      senderWalletId,
      senderWalletCurrency,
      settlementMethod,
      paymentInitiationMethod,
      btcFeeAmount,
      usdPaymentAmount,
      btcPaymentAmount,
      paymentRequest,
    } = builderState

    if (
      senderWalletId &&
      senderWalletCurrency &&
      settlementMethod &&
      paymentInitiationMethod
    ) {
      return {
        senderWalletId,
        senderWalletCurrency,
        settlementMethod,
        paymentInitiationMethod,
        btcFeeAmount,
        usdPaymentAmount,
        btcPaymentAmount,
        paymentRequest,
      }
    }

    throw new Error("PaymentBuilder not complete")
  }

  return {
    withSenderWallet,
    withPaymentRequest,
    withBtcPaymentAmount,
    withUncheckedAmount,
    withSettlementMethod,
    withPaymentInitiationMethod,
    withIsLocal,
    payment,
  }
}
