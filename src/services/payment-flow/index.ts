import { UnknownRepositoryError } from "@domain/errors"
import { CouldNotFindLightningPaymentFlowError, PaymentFlow } from "@domain/payments"
import { WalletCurrency } from "@domain/shared"

import { PaymentFlowState } from "./schema"

export const PaymentFlowStateRepository = (): IPaymentFlowRepository => {
  const persistNew = async <S extends WalletCurrency, R extends WalletCurrency>(
    paymentFlow: PaymentFlow<S, R>,
  ): Promise<PaymentFlow<S, R> | RepositoryError> => {
    try {
      const rawPaymentFlowState = rawFromPaymentFlow(paymentFlow)
      const paymentFlowState = new PaymentFlowState(rawPaymentFlowState)
      await paymentFlowState.save()
      return paymentFlowFromRaw(paymentFlowState)
    } catch (err) {
      return new UnknownRepositoryError(err)
    }
  }

  const findLightningPaymentFlow = async <S extends WalletCurrency>({
    walletId,
    paymentHash,
    inputAmount,
  }: {
    walletId: WalletId
    paymentHash: PaymentHash
    inputAmount: BigInt
  }): Promise<PaymentFlow<S, WalletCurrency> | RepositoryError> => {
    try {
      const result = await PaymentFlowState.findOne({
        senderWalletId: walletId,
        paymentHash,
        inputAmount: Number(inputAmount),
      })
      if (!result) return new CouldNotFindLightningPaymentFlowError()
      return paymentFlowFromRaw(result)
    } catch (err) {
      return new UnknownRepositoryError(err)
    }
  }

  return {
    findLightningPaymentFlow,
    persistNew,
  }
}

const paymentFlowFromRaw = <S extends WalletCurrency, R extends WalletCurrency>(
  paymentFlowState: PaymentFlowStateRecord,
): PaymentFlow<S, R> =>
  PaymentFlow<S, R>({
    senderWalletId: paymentFlowState.senderWalletId as WalletId,
    senderWalletCurrency: paymentFlowState.senderWalletCurrency as S,
    settlementMethod: paymentFlowState.settlementMethod as SettlementMethod,
    paymentInitiationMethod:
      paymentFlowState.paymentInitiationMethod as PaymentInitiationMethod,
    paymentHash: paymentFlowState.paymentHash as PaymentHash,
    descriptionFromInvoice: paymentFlowState.descriptionFromInvoice,
    createdAt: paymentFlowState.createdAt,
    paymentSentAndPending: paymentFlowState.paymentSentAndPending,

    btcPaymentAmount: {
      currency: WalletCurrency.Btc,
      amount: BigInt(paymentFlowState.btcPaymentAmount),
    },
    usdPaymentAmount: {
      currency: WalletCurrency.Usd,
      amount: BigInt(paymentFlowState.usdPaymentAmount),
    },
    inputAmount: BigInt(paymentFlowState.inputAmount),

    btcProtocolFee: {
      currency: WalletCurrency.Btc,
      amount: BigInt(paymentFlowState.btcProtocolFee),
    },
    usdProtocolFee: {
      currency: WalletCurrency.Usd,
      amount: BigInt(paymentFlowState.usdProtocolFee),
    },

    recipientWalletId: (paymentFlowState.recipientWalletId as WalletId) || undefined,
    recipientWalletCurrency: (paymentFlowState.recipientWalletCurrency as R) || undefined,
    recipientPubkey: (paymentFlowState.recipientPubkey as Pubkey) || undefined,
    recipientUsername: (paymentFlowState.recipientUsername as Username) || undefined,

    outgoingNodePubkey: (paymentFlowState.outgoingNodePubkey as Pubkey) || undefined,
    cachedRoute: paymentFlowState.cachedRoute,
  })

const rawFromPaymentFlow = <S extends WalletCurrency, R extends WalletCurrency>(
  paymentFlow: PaymentFlow<S, R>,
): PaymentFlowStateRecordPartial => ({
  senderWalletId: paymentFlow.senderWalletId,
  senderWalletCurrency: paymentFlow.senderWalletCurrency,
  settlementMethod: paymentFlow.settlementMethod,
  paymentInitiationMethod: paymentFlow.paymentInitiationMethod,
  paymentHash: paymentFlow.paymentHash,
  descriptionFromInvoice: paymentFlow.descriptionFromInvoice,
  createdAt: paymentFlow.createdAt,
  paymentSentAndPending: paymentFlow.paymentSentAndPending,

  btcPaymentAmount: Number(paymentFlow.btcPaymentAmount.amount),
  usdPaymentAmount: Number(paymentFlow.usdPaymentAmount.amount),
  inputAmount: Number(paymentFlow.inputAmount),

  btcProtocolFee: Number(paymentFlow.btcProtocolFee.amount),
  usdProtocolFee: Number(paymentFlow.usdProtocolFee.amount),

  recipientWalletId: paymentFlow.recipientWalletId,
  recipientWalletCurrency: paymentFlow.recipientWalletCurrency,
  recipientPubkey: paymentFlow.recipientPubkey,
  recipientUsername: paymentFlow.recipientUsername,

  outgoingNodePubkey: paymentFlow.outgoingNodePubkey,
  cachedRoute: paymentFlow.cachedRoute,
})
