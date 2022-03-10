import { ValidationError, WalletCurrency } from "@domain/shared"
import { PaymentInitiationMethod, SettlementMethod } from "@domain/wallets"
import { checkedToBtcPaymentAmount, checkedToUsdPaymentAmount } from "@domain/payments"

import { Payment } from "./payment"

export const LightningPaymentBuilder = <S extends WalletCurrency>(
  builderState: LightningPaymentBuilderState<S>,
): LightningPaymentBuilder<S> => {
  const withSenderWallet = (
    senderWallet: WalletDescriptor<S>,
  ): LightningPaymentBuilder<S> => {
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

  const withInvoice = (invoice: LnInvoice): LightningPaymentBuilder<S> => {
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

  const withUncheckedAmount = (amount: number): LightningPaymentBuilder<S> => {
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

  const withRouteResult = ({
    pubkey,
    rawRoute,
  }: {
    pubkey: Pubkey
    rawRoute: RawRoute
  }): LightningPaymentBuilder<S> => {
    const btcProtocolFee = {
      currency: WalletCurrency.Btc,
      amount: BigInt(Math.ceil(rawRoute.fee)),
    }
    return LightningPaymentBuilder({
      ...builderState,
      outgoingNodePubkey: pubkey,
      cachedRoute: rawRoute,
      btcProtocolFee,
    })
  }

  const needsProtocolFee = () => {
    return builderState.settlementMethod !== SettlementMethod.IntraLedger
  }

  const payment = (): Payment<S> | ValidationError => {
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
      return Payment({
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
