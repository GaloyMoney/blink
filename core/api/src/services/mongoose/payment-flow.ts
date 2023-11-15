import { parseRepositoryError } from "./utils"

import { PaymentFlowState } from "./schema"

import {
  CouldNotFindLightningPaymentFlowError,
  CouldNotUpdateLightningPaymentFlowError,
  NoExpiredLightningPaymentFlowsError,
  BadInputsForFindError,
  UnknownRepositoryError,
} from "@/domain/errors"
import { InvalidLightningPaymentFlowStateError, PaymentFlow } from "@/domain/payments"
import { paymentAmountFromNumber, WalletCurrency } from "@/domain/shared"
import { safeBigInt } from "@/domain/shared/safe"
import { elapsedSinceTimestamp } from "@/utils"

export const PaymentFlowStateRepository = (
  expiryTimeInSeconds: Seconds,
): IPaymentFlowRepository => {
  const persistNew = async <S extends WalletCurrency, R extends WalletCurrency>(
    paymentFlow: PaymentFlow<S, R>,
  ): Promise<PaymentFlow<S, R> | RepositoryError | ValidationError> => {
    try {
      const rawPaymentFlowState = rawFromPaymentFlow(paymentFlow)
      if (rawPaymentFlowState instanceof Error) return rawPaymentFlowState

      const paymentFlowState = new PaymentFlowState(rawPaymentFlowState)
      await paymentFlowState.save()
      return paymentFlowFromRaw(paymentFlowState.toObject())
    } catch (err) {
      return parseRepositoryError(err)
    }
  }

  const findLightningPaymentFlow = async <
    S extends WalletCurrency,
    R extends WalletCurrency,
  >(
    args: XorPaymentHashProperty & {
      walletId: WalletId
      inputAmount: bigint
    },
  ): Promise<PaymentFlow<S, R> | RepositoryError | ValidationError> => {
    const { walletId, paymentHash, intraLedgerHash, inputAmount } = args

    const hash = paymentHash
      ? { paymentHash }
      : intraLedgerHash
        ? { intraLedgerHash }
        : new BadInputsForFindError(JSON.stringify(args))
    if (hash instanceof Error) return hash

    try {
      const result = await PaymentFlowState.findOne<PaymentFlowStateRecord>({
        ...hash,
        senderWalletId: walletId,
        inputAmount: Number(inputAmount),
      })
      if (!result) return new CouldNotFindLightningPaymentFlowError()

      const paymentFlow: PaymentFlow<S, R> | ValidationError = paymentFlowFromRaw(result)
      if (paymentFlow instanceof Error) return paymentFlow

      if (isExpired({ paymentFlow, expiryTimeInSeconds })) {
        deleteLightningPaymentFlow({ ...hash, walletId, inputAmount })
        return new CouldNotFindLightningPaymentFlowError()
      }

      return paymentFlow
    } catch (err) {
      return parseRepositoryError(err)
    }
  }

  const updateLightningPaymentFlow = async <
    S extends WalletCurrency,
    R extends WalletCurrency,
  >(
    paymentFlow: PaymentFlow<S, R>,
  ): Promise<true | RepositoryError> => {
    try {
      const rawPaymentFlowState = rawFromPaymentFlow(paymentFlow)
      if (rawPaymentFlowState instanceof Error) return rawPaymentFlowState

      const result = await PaymentFlowState.findOneAndUpdate(
        {
          senderWalletId: paymentFlow.senderWalletId,
          paymentHash: paymentFlow.paymentHash,
          inputAmount: Number(paymentFlow.inputAmount),
        },
        rawPaymentFlowState,
        {
          new: true,
        },
      )
      if (!result) {
        return new CouldNotUpdateLightningPaymentFlowError()
      }
      return true
    } catch (err) {
      return parseRepositoryError(err)
    }
  }

  const markLightningPaymentFlowNotPending = async <
    S extends WalletCurrency,
    R extends WalletCurrency,
  >(
    paymentFlowIndex: PaymentFlowStateIndex,
  ): Promise<PaymentFlow<S, R> | RepositoryError | ValidationError> => {
    const rawPaymentFlowIndex = rawIndexFromPaymentFlowIndex(paymentFlowIndex)
    if (rawPaymentFlowIndex instanceof Error) return rawPaymentFlowIndex

    try {
      const result = await PaymentFlowState.findOneAndUpdate<PaymentFlowStateRecord>(
        rawPaymentFlowIndex,
        { paymentSentAndPending: false },
        {
          new: true,
        },
      )
      if (!result) {
        return new CouldNotUpdateLightningPaymentFlowError()
      }
      return paymentFlowFromRaw(result)
    } catch (err) {
      return parseRepositoryError(err)
    }
  }

  const deleteLightningPaymentFlow = async ({
    walletId,
    paymentHash,
    intraLedgerHash,
    inputAmount,
  }: XorPaymentHashProperty & {
    walletId: WalletId
    inputAmount: bigint
  }): Promise<boolean | RepositoryError> => {
    const hash = paymentHash ? { paymentHash } : { intraLedgerHash }
    try {
      const result = await PaymentFlowState.deleteOne({
        ...hash,
        senderWalletId: walletId,
        inputAmount: Number(inputAmount),
      })
      if (result.deletedCount === 0) {
        return new CouldNotFindLightningPaymentFlowError(paymentHash)
      }
      return true
    } catch (error) {
      return new UnknownRepositoryError(error)
    }
  }

  const deleteExpiredLightningPaymentFlows = async (): Promise<
    number | RepositoryError
  > => {
    const EXPIRY_TIME_IN_MS = expiryTimeInSeconds * 1000
    const timestampExpired = new Date(Date.now() - EXPIRY_TIME_IN_MS)

    try {
      const result = await PaymentFlowState.deleteMany({
        createdAt: { $lte: timestampExpired },
        paymentSentAndPending: false,
      })
      if (result.deletedCount === 0) {
        return new NoExpiredLightningPaymentFlowsError()
      }
      return result.deletedCount
    } catch (error) {
      return new UnknownRepositoryError(error)
    }
  }

  return {
    findLightningPaymentFlow,
    persistNew,
    updateLightningPaymentFlow,
    markLightningPaymentFlowNotPending,
    deleteExpiredLightningPaymentFlows,
  }
}

const paymentFlowFromRaw = <S extends WalletCurrency, R extends WalletCurrency>(
  paymentFlowState: PaymentFlowStateRecord,
): PaymentFlow<S, R> | ValidationError => {
  const inputAmount = safeBigInt(paymentFlowState.inputAmount)
  if (inputAmount instanceof Error) return inputAmount

  const { paymentHash, intraLedgerHash } = paymentFlowState
  const hash = paymentHash
    ? { paymentHash: paymentHash as PaymentHash }
    : intraLedgerHash
      ? { intraLedgerHash: intraLedgerHash as IntraLedgerHash }
      : new InvalidLightningPaymentFlowStateError(
          "Missing valid 'paymentHash' or 'intraLedgerHash'",
        )
  if (hash instanceof Error) return hash

  const btcPaymentAmount = paymentAmountFromNumber({
    amount: paymentFlowState.btcPaymentAmount,
    currency: WalletCurrency.Btc,
  })
  if (btcPaymentAmount instanceof Error) return btcPaymentAmount

  const usdPaymentAmount = paymentAmountFromNumber({
    amount: paymentFlowState.usdPaymentAmount,
    currency: WalletCurrency.Usd,
  })
  if (usdPaymentAmount instanceof Error) return usdPaymentAmount

  const btcProtocolAndBankFee = paymentAmountFromNumber({
    amount: paymentFlowState.btcProtocolAndBankFee,
    currency: WalletCurrency.Btc,
  })
  if (btcProtocolAndBankFee instanceof Error) return btcProtocolAndBankFee

  const usdProtocolAndBankFee = paymentAmountFromNumber({
    amount: paymentFlowState.usdProtocolAndBankFee,
    currency: WalletCurrency.Usd,
  })
  if (usdProtocolAndBankFee instanceof Error) return usdProtocolAndBankFee

  return PaymentFlow<S, R>({
    ...hash,

    senderWalletId: paymentFlowState.senderWalletId as WalletId,
    senderWalletCurrency: paymentFlowState.senderWalletCurrency as S,
    senderAccountId: paymentFlowState.senderAccountId as AccountId,
    settlementMethod: paymentFlowState.settlementMethod as SettlementMethod,
    paymentInitiationMethod:
      paymentFlowState.paymentInitiationMethod as PaymentInitiationMethod,
    descriptionFromInvoice: paymentFlowState.descriptionFromInvoice,
    skipProbeForDestination: paymentFlowState.skipProbeForDestination,
    createdAt: paymentFlowState.createdAt,
    paymentSentAndPending: paymentFlowState.paymentSentAndPending,

    btcPaymentAmount,
    usdPaymentAmount,
    inputAmount,

    btcProtocolAndBankFee,
    usdProtocolAndBankFee,

    recipientWalletId: (paymentFlowState.recipientWalletId as WalletId) || undefined,
    recipientWalletCurrency: (paymentFlowState.recipientWalletCurrency as R) || undefined,
    recipientAccountId: (paymentFlowState.recipientAccountId as AccountId) || undefined,
    recipientPubkey: (paymentFlowState.recipientPubkey as Pubkey) || undefined,
    recipientUsername: (paymentFlowState.recipientUsername as Username) || undefined,
    recipientUserId: (paymentFlowState.recipientUserId as UserId) || undefined,

    outgoingNodePubkey: (paymentFlowState.outgoingNodePubkey as Pubkey) || undefined,
    cachedRoute: paymentFlowState.cachedRoute,
  })
}

const rawFromPaymentFlow = <S extends WalletCurrency, R extends WalletCurrency>(
  paymentFlow: PaymentFlow<S, R>,
): PaymentFlowStateRecordPartial | ValidationError => {
  const { paymentHash, intraLedgerHash } = paymentFlow
  const hash = paymentHash
    ? { paymentHash }
    : intraLedgerHash
      ? { intraLedgerHash }
      : new InvalidLightningPaymentFlowStateError(
          "Missing valid 'paymentHash' or 'intraLedgerHash'",
        )
  if (hash instanceof Error) return hash

  return {
    ...hash,

    senderWalletId: paymentFlow.senderWalletId,
    senderWalletCurrency: paymentFlow.senderWalletCurrency,
    senderAccountId: paymentFlow.senderAccountId,
    settlementMethod: paymentFlow.settlementMethod,
    paymentInitiationMethod: paymentFlow.paymentInitiationMethod,
    descriptionFromInvoice: paymentFlow.descriptionFromInvoice,
    skipProbeForDestination: paymentFlow.skipProbeForDestination,
    createdAt: paymentFlow.createdAt,
    paymentSentAndPending: paymentFlow.paymentSentAndPending,

    btcPaymentAmount: Number(paymentFlow.btcPaymentAmount.amount),
    usdPaymentAmount: Number(paymentFlow.usdPaymentAmount.amount),
    inputAmount: Number(paymentFlow.inputAmount),

    btcProtocolAndBankFee: Number(paymentFlow.btcProtocolAndBankFee.amount),
    usdProtocolAndBankFee: Number(paymentFlow.usdProtocolAndBankFee.amount),

    recipientWalletId: paymentFlow.recipientWalletId,
    recipientWalletCurrency: paymentFlow.recipientWalletCurrency,
    recipientAccountId: paymentFlow.recipientAccountId,
    recipientPubkey: paymentFlow.recipientPubkey,
    recipientUsername: paymentFlow.recipientUsername,
    recipientUserId: paymentFlow.recipientUserId,

    outgoingNodePubkey: paymentFlow.outgoingNodePubkey,
    cachedRoute: paymentFlow.cachedRoute,
  }
}

const rawIndexFromPaymentFlowIndex = (
  paymentFlowIndex: PaymentFlowStateIndex,
): PaymentFlowStateRecordIndex | ValidationError => {
  const { paymentHash, intraLedgerHash } = paymentFlowIndex
  const hash = paymentHash
    ? { paymentHash }
    : intraLedgerHash
      ? { intraLedgerHash }
      : new InvalidLightningPaymentFlowStateError(
          "Missing valid 'paymentHash' or 'intraLedgerHash'",
        )
  if (hash instanceof Error) return hash

  return {
    ...hash,
    senderWalletId: paymentFlowIndex.walletId,
    inputAmount: Number(paymentFlowIndex.inputAmount),
  }
}

const isExpired = ({
  paymentFlow,
  expiryTimeInSeconds,
}: {
  paymentFlow: PaymentFlow<WalletCurrency, WalletCurrency>
  expiryTimeInSeconds: Seconds
}): boolean => {
  if (paymentFlow.paymentSentAndPending) return false

  return elapsedSinceTimestamp(paymentFlow.createdAt) > expiryTimeInSeconds
}
