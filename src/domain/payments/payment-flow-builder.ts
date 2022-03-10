import { ValidationError, WalletCurrency } from "@domain/shared"
import { PaymentInitiationMethod, SettlementMethod } from "@domain/wallets"
import { checkedToBtcPaymentAmount, checkedToUsdPaymentAmount } from "@domain/payments"

import { PaymentFlow } from "./payment-flow"

export const LightningPaymentFlowBuilder = <S extends WalletCurrency>(
  builderState: LightningPaymentBuilderState<S>,
): LightningPaymentFlowBuilder<S> => {
  const withSenderWallet = (
    senderWallet: WalletDescriptor<S>,
  ): LightningPaymentFlowBuilder<S> => {
    if (builderState.validationError) {
      return LightningPaymentFlowBuilder(builderState)
    }

    if (builderState.uncheckedAmount) {
      if (senderWallet.currency === WalletCurrency.Btc) {
        const paymentAmount = checkedToBtcPaymentAmount(builderState.uncheckedAmount)
        if (paymentAmount instanceof ValidationError) {
          return LightningPaymentFlowBuilder({
            ...builderState,
            validationError: paymentAmount,
          })
        }
        return LightningPaymentFlowBuilder({
          ...builderState,
          uncheckedAmount: undefined,
          senderWalletId: senderWallet.id,
          senderWalletCurrency: senderWallet.currency,
          btcPaymentAmount: paymentAmount,
        })
      } else {
        const paymentAmount = checkedToUsdPaymentAmount(builderState.uncheckedAmount)
        if (paymentAmount instanceof ValidationError) {
          return LightningPaymentFlowBuilder({
            ...builderState,
            validationError: paymentAmount,
          })
        }
        return LightningPaymentFlowBuilder({
          ...builderState,
          uncheckedAmount: undefined,
          senderWalletId: senderWallet.id,
          senderWalletCurrency: senderWallet.currency,
          usdPaymentAmount: paymentAmount,
        })
      }
    }

    return LightningPaymentFlowBuilder({
      ...builderState,
      senderWalletId: senderWallet.id,
      senderWalletCurrency: senderWallet.currency,
    })
  }

  const withInvoice = (invoice: LnInvoice): LightningPaymentFlowBuilder<S> => {
    const newState = {
      btcPaymentAmount: invoice.paymentAmount || undefined,
      ...builderState,
      invoice,
    }

    if (builderState.localNodeIds.includes(invoice.destination)) {
      return LightningPaymentFlowBuilder({
        ...newState,
        settlementMethod: SettlementMethod.IntraLedger,
      })
    } else {
      return LightningPaymentFlowBuilder({
        ...newState,
        settlementMethod: SettlementMethod.Lightning,
      })
    }
  }

  const withUncheckedAmount = (amount: number): LightningPaymentFlowBuilder<S> => {
    const builder = LightningPaymentFlowBuilder({
      ...builderState,
      uncheckedAmount: amount,
    })
    const { senderWalletId, senderWalletCurrency } = builderState
    if (senderWalletCurrency && senderWalletId) {
      return builder.withSenderWallet({
        id: senderWalletId,
        currency: senderWalletCurrency,
      })
    }
    return builder
  }

  const withRouteResult = ({
    pubkey,
    rawRoute,
  }: {
    pubkey: Pubkey
    rawRoute: RawRoute
  }): LightningPaymentFlowBuilder<S> => {
    const btcProtocolFee = {
      currency: WalletCurrency.Btc,
      amount: BigInt(Math.ceil(rawRoute.fee)),
    }
    return LightningPaymentFlowBuilder({
      ...builderState,
      outgoingNodePubkey: pubkey,
      cachedRoute: rawRoute,
      btcProtocolFee,
    })
  }

  const needsProtocolFee = () => {
    return builderState.settlementMethod !== SettlementMethod.IntraLedger
  }

  const payment = (): PaymentFlow<S> | ValidationError => {
    if (builderState.validationError) {
      return builderState.validationError
    }

    const {
      senderWalletId,
      senderWalletCurrency,
      settlementMethod,
      usdPaymentAmount,
      btcPaymentAmount,
      btcProtocolFee,
      usdProtocolFee,
      invoice,
    } = builderState

    if (
      btcProtocolFee &&
      senderWalletId &&
      senderWalletCurrency &&
      settlementMethod &&
      invoice
    ) {
      return PaymentFlow({
        senderWalletId,
        senderWalletCurrency,
        settlementMethod,
        paymentInitiationMethod: PaymentInitiationMethod.Lightning,
        paymentRequest: invoice.paymentRequest,

        btcProtocolFee,
        usdProtocolFee,

        usdPaymentAmount,
        btcPaymentAmount,
      })
    }

    throw new Error("PaymentBuilder not complete")
  }

  return {
    needsProtocolFee,
    withSenderWallet,
    withInvoice,
    withUncheckedAmount,
    withRouteResult,
    payment,
  }
}
