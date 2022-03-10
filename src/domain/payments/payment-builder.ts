import { ValidationError, WalletCurrency } from "@domain/shared"
import { PaymentInitiationMethod, SettlementMethod } from "@domain/wallets"
import { checkedToBtcPaymentAmount, checkedToUsdPaymentAmount } from "@domain/payments"

export const LightningPaymentBuilder = (
  builderState: LightningPaymentBuilderState,
): LightningPaymentBuilder => {
  const withSenderWallet = <T extends WalletCurrency>(
    senderWallet: WalletDescriptor<T>,
  ) => {
    if (builderState.validationError) {
      return LightningPaymentBuilder(builderState)
    }

    if (builderState.uncheckedAmount) {
      if (senderWallet.currency === WalletCurrency.Btc) {
        const paymentAmount = checkedToBtcPaymentAmount(builderState.uncheckedAmount)
        if (paymentAmount instanceof ValidationError) {
          return LightningPaymentBuilder({
            ...builderState,
            validationError: paymentAmount,
          })
        }
        return LightningPaymentBuilder({
          ...builderState,
          uncheckedAmount: undefined,
          senderWalletId: senderWallet.id,
          senderWalletCurrency: senderWallet.currency,
          btcPaymentAmount: paymentAmount,
        })
      } else {
        const paymentAmount = checkedToUsdPaymentAmount(builderState.uncheckedAmount)
        if (paymentAmount instanceof ValidationError) {
          return LightningPaymentBuilder({
            ...builderState,
            validationError: paymentAmount,
          })
        }
        return LightningPaymentBuilder({
          ...builderState,
          uncheckedAmount: undefined,
          senderWalletId: senderWallet.id,
          senderWalletCurrency: senderWallet.currency,
          usdPaymentAmount: paymentAmount,
        })
      }
    }

    return LightningPaymentBuilder({
      ...builderState,
      senderWalletId: senderWallet.id,
      senderWalletCurrency: senderWallet.currency,
    })
  }

  const withInvoice = (invoice: LnInvoice) => {
    const newState = {
      btcPaymentAmount: invoice.paymentAmount || undefined,
      ...builderState,
      invoice,
    }

    if (builderState.localNodeIds.includes(invoice.destination)) {
      return LightningPaymentBuilder({
        ...newState,
        settlementMethod: SettlementMethod.IntraLedger,
      })
    } else {
      return LightningPaymentBuilder({
        ...newState,
        settlementMethod: SettlementMethod.Lightning,
      })
    }
  }

  const withUncheckedAmount = (amount: number) => {
    const builder = LightningPaymentBuilder({ ...builderState, uncheckedAmount: amount })
    const { senderWalletId, senderWalletCurrency } = builderState
    if (senderWalletCurrency && senderWalletId) {
      return builder.withSenderWallet({
        id: senderWalletId,
        currency: senderWalletCurrency,
      })
    }
    return builder
  }

  const payment = (): Payment | ValidationError => {
    if (builderState.validationError) {
      return builderState.validationError
    }

    const {
      senderWalletId,
      senderWalletCurrency,
      settlementMethod,
      btcFeeAmount,
      usdPaymentAmount,
      btcPaymentAmount,
      invoice,
    } = builderState

    if (senderWalletId && senderWalletCurrency && settlementMethod) {
      return {
        senderWalletId,
        senderWalletCurrency,
        settlementMethod,
        paymentInitiationMethod: PaymentInitiationMethod.Lightning,
        btcFeeAmount,
        usdPaymentAmount,
        btcPaymentAmount,
        paymentRequest: invoice?.paymentRequest,
      }
    }

    throw new Error("PaymentBuilder not complete")
  }

  return {
    withSenderWallet,
    withInvoice,
    withUncheckedAmount,
    payment,
  }
}
