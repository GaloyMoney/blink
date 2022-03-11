import { ValidationError, WalletCurrency } from "@domain/shared"
import { PaymentInitiationMethod, SettlementMethod } from "@domain/wallets"
import { checkedToBtcPaymentAmount, checkedToUsdPaymentAmount } from "@domain/payments"

import { LnFees } from "./ln-fees"
import { PriceRatio } from "./price-ratio"
import { PaymentFlow } from "./payment-flow"

export const LightningPaymentFlowBuilderOld = <S extends WalletCurrency>(
  builderState: LightningPaymentBuilderState<S>,
): LightningPaymentFlowBuilder<S> => {
  const withSenderWallet = (
    senderWallet: WalletDescriptor<S>,
  ): LightningPaymentFlowBuilder<S> => {
    if (builderState.validationError) {
      return LightningPaymentFlowBuilderOld(builderState)
    }

    if (builderState.uncheckedAmount) {
      if (senderWallet.currency === WalletCurrency.Btc) {
        const paymentAmount = checkedToBtcPaymentAmount(builderState.uncheckedAmount)
        if (paymentAmount instanceof ValidationError) {
          return LightningPaymentFlowBuilderOld({
            ...builderState,
            validationError: paymentAmount,
          })
        }
        const btcProtocolFee = LnFees().maxProtocolFee(paymentAmount)
        return LightningPaymentFlowBuilderOld({
          ...builderState,
          uncheckedAmount: undefined,
          senderWalletId: senderWallet.id,
          senderWalletCurrency: senderWallet.currency,
          btcPaymentAmount: paymentAmount,
          inputAmount: paymentAmount.amount,
          btcProtocolFee,
        })
      } else {
        const paymentAmount = checkedToUsdPaymentAmount(builderState.uncheckedAmount)
        if (paymentAmount instanceof ValidationError) {
          return LightningPaymentFlowBuilderOld({
            ...builderState,
            validationError: paymentAmount,
          })
        }

        const usdProtocolFee = LnFees().maxProtocolFee(paymentAmount)
        return LightningPaymentFlowBuilderOld({
          ...builderState,
          uncheckedAmount: undefined,
          senderWalletId: senderWallet.id,
          senderWalletCurrency: senderWallet.currency,
          usdPaymentAmount: paymentAmount,
          usdProtocolFee,
          inputAmount: paymentAmount.amount,
        })
      }
    }

    return LightningPaymentFlowBuilderOld({
      ...builderState,
      senderWalletId: senderWallet.id,
      senderWalletCurrency: senderWallet.currency,
    })
  }

  const withInvoice = (invoice: LnInvoice): LightningPaymentFlowBuilder<S> => {
    const newState = {
      btcPaymentAmount: invoice.paymentAmount || undefined,
      inputAmount: invoice.paymentAmount?.amount || undefined,
      ...builderState,
      invoice,
    }

    if (builderState.localNodeIds.includes(invoice.destination)) {
      const { btc: btcProtocolFee, usd: usdProtocolFee } = LnFees().intraLedgerFees()
      return LightningPaymentFlowBuilderOld({
        ...newState,
        settlementMethod: SettlementMethod.IntraLedger,
        btcProtocolFee,
        usdProtocolFee,
      })
    } else {
      return LightningPaymentFlowBuilderOld({
        ...newState,
        settlementMethod: SettlementMethod.Lightning,
      })
    }
  }

  const withUncheckedAmount = (amount: number): LightningPaymentFlowBuilder<S> => {
    const builder = LightningPaymentFlowBuilderOld({
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

  const withBtcAmount = (amount: BtcPaymentAmount): LightningPaymentFlowBuilder<S> => {
    const btcPaymentAmountState: Partial<LightningPaymentBuilderState<S>> = {}
    if (builderState.btcPaymentAmount === undefined) {
      btcPaymentAmountState.btcPaymentAmount = amount
    }
    return LightningPaymentFlowBuilderOld({
      ...builderState,
      ...btcPaymentAmountState,
    })
  }

  const withRouteResult = ({
    pubkey,
    rawRoute,
  }: {
    pubkey: Pubkey
    rawRoute: RawRoute
  }): LightningPaymentFlowBuilder<S> => {
    const btcProtocolFee = LnFees().feeFromRawRoute(rawRoute)
    let usdProtocolFee: UsdPaymentAmount | undefined = undefined
    if (builderState.btcPaymentAmount && builderState.usdPaymentAmount) {
      usdProtocolFee = PriceRatio({
        btc: builderState.btcPaymentAmount,
        usd: builderState.usdPaymentAmount,
      }).convertFromBtc(btcProtocolFee)
    }
    return LightningPaymentFlowBuilderOld({
      ...builderState,
      outgoingNodePubkey: pubkey,
      cachedRoute: rawRoute,
      btcProtocolFee,
      usdProtocolFee,
    })
  }

  const needsProtocolFee = () => {
    return builderState.settlementMethod !== SettlementMethod.IntraLedger
  }

  const payment = (): PaymentFlowOld<S> | ValidationError => {
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
      inputAmount,
    } = builderState

    if (
      btcProtocolFee &&
      senderWalletId &&
      senderWalletCurrency &&
      settlementMethod &&
      invoice &&
      inputAmount
    ) {
      return PaymentFlow({
        senderWalletId,
        senderWalletCurrency,
        settlementMethod,
        paymentInitiationMethod: PaymentInitiationMethod.Lightning,
        paymentHash: invoice.paymentHash,

        btcProtocolFee,
        usdProtocolFee,

        usdPaymentAmount,
        btcPaymentAmount,

        inputAmount,
      })
    }

    throw new Error("PaymentBuilder not complete")
  }

  return {
    needsProtocolFee,
    withSenderWallet,
    withInvoice,
    withUncheckedAmount,
    withBtcAmount,
    withRouteResult,
    btcPaymentAmount: () => builderState.btcPaymentAmount,
    usdPaymentAmount: () => builderState.usdPaymentAmount,
    payment,
  }
}
