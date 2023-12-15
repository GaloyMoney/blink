import { Wallets, OnChain } from "@/app"

import {
  AmountLessThanFeeError,
  CouldNotFindWalletFromOnChainAddressError,
  LessThanDustThresholdError,
  NoTransactionToUpdateError,
} from "@/domain/errors"

import { NoTransactionToSettleError } from "@/services/ledger/domain/errors"
import * as LedgerFacade from "@/services/ledger/facade"
import { baseLogger } from "@/services/logger"
import { BriaPayloadType } from "@/services/bria"
import {
  EventAugmentationMissingError,
  UnknownPayloadTypeReceivedError,
} from "@/services/bria/errors"
import { addAttributesToCurrentSpan } from "@/services/tracing"

// This should never compile if 'payloadType' is not never
const assertUnreachable = (payloadType: never): Error =>
  new UnknownPayloadTypeReceivedError(payloadType)

const isBriaPayoutEvent = (payload: BriaPayload): payload is BriaPayoutPayload => {
  return (payload as BriaPayoutPayload).id !== undefined
}

export const briaEventHandler = async (event: BriaEvent): Promise<true | DomainError> => {
  baseLogger.info(
    {
      sequence: event.sequence,
      type: event.payload.type,
      ...(isBriaPayoutEvent(event.payload) ? { id: event.payload.id } : {}),
    },
    "bria event handler",
  )
  addAttributesToCurrentSpan({
    ["event.sequence"]: event.sequence,
    ["event.type"]: event.payload.type,
  })

  const payloadType = event.payload.type
  switch (payloadType) {
    case BriaPayloadType.UtxoDetected:
      return utxoDetectedEventHandler({
        event: event.payload,
      })

    case BriaPayloadType.UtxoDropped:
      return utxoDroppedEventHandler({ event: event.payload })

    case BriaPayloadType.UtxoSettled:
      return utxoSettledEventHandler({ event: event.payload })

    case BriaPayloadType.PayoutSubmitted:
      if (event.augmentation.payoutInfo === undefined) {
        return new EventAugmentationMissingError()
      }
      return payoutSubmittedEventHandler({
        event: event.payload,
        payoutInfo: event.augmentation.payoutInfo,
      })

    case BriaPayloadType.PayoutCommitted:
      return true

    case BriaPayloadType.PayoutCancelled:
      if (event.augmentation.payoutInfo === undefined) {
        return new EventAugmentationMissingError()
      }
      return payoutCancelledEventHandler({
        event: event.payload,
        payoutInfo: event.augmentation.payoutInfo,
      })

    case BriaPayloadType.PayoutBroadcast:
      if (event.augmentation.payoutInfo === undefined) {
        return new EventAugmentationMissingError()
      }
      return payoutBroadcastEventHandler({
        event: event.payload,
        payoutInfo: event.augmentation.payoutInfo,
      })

    case BriaPayloadType.PayoutSettled:
      return payoutSettledEventHandler({ event: event.payload })

    default:
      return assertUnreachable(payloadType)
  }
}

export const utxoDetectedEventHandler = async ({
  event,
}: {
  event: UtxoDetected
}): Promise<true | DomainError> => {
  const res = await Wallets.addPendingTransaction(event)
  if (res instanceof AmountLessThanFeeError) {
    return true
  }
  if (res instanceof LessThanDustThresholdError) {
    return true
  }
  if (res instanceof CouldNotFindWalletFromOnChainAddressError) {
    return true
  }

  return res
}

export const utxoDroppedEventHandler = async ({
  event,
}: {
  event: UtxoDropped
}): Promise<true | DomainError> => {
  const res = await Wallets.removePendingTransaction(event)
  if (res instanceof CouldNotFindWalletFromOnChainAddressError) {
    return true
  }

  return res
}

export const utxoSettledEventHandler = async ({
  event,
}: {
  event: UtxoSettled
}): Promise<true | DomainError> => {
  const res = await Wallets.addSettledTransaction(event)
  if (res instanceof AmountLessThanFeeError) {
    return true
  }
  if (res instanceof LessThanDustThresholdError) {
    return true
  }
  if (res instanceof CouldNotFindWalletFromOnChainAddressError) {
    return true
  }

  return res
}

export const payoutSubmittedEventHandler = async ({
  event,
  payoutInfo,
}: {
  event: PayoutSubmitted
  payoutInfo: PayoutAugmentation
}): Promise<true | ApplicationError> => {
  const res = await LedgerFacade.setOnChainTxPayoutId({
    journalId: payoutInfo.externalId as LedgerJournalId,
    payoutId: event.id,
  })
  if (res instanceof NoTransactionToUpdateError) {
    return true
  }

  return res
}

export const payoutCancelledEventHandler = async ({
  event,
  payoutInfo,
}: {
  event: PayoutCancelled
  payoutInfo: PayoutAugmentation
}): Promise<true | ApplicationError> => {
  const res = await LedgerFacade.recordOnChainSendRevert({
    journalId: payoutInfo.externalId as LedgerJournalId,
    payoutId: event.id,
  })
  if (res instanceof NoTransactionToUpdateError) {
    return true
  }

  return res
}

export const payoutBroadcastEventHandler = async ({
  event,
  payoutInfo,
}: {
  event: PayoutBroadcast
  payoutInfo: PayoutAugmentation
}): Promise<true | ApplicationError> => {
  if (payoutInfo.metadata?.galoy?.rebalanceToColdWallet) {
    return OnChain.recordHotToColdTransfer(event)
  }
  const res = await Wallets.registerBroadcastedPayout({
    payoutId: event.id,
    proportionalFee: event.proportionalFee,
    txId: event.txId,
    vout: event.vout,
  })
  if (res instanceof NoTransactionToUpdateError) {
    return true
  }

  return res
}

export const payoutSettledEventHandler = async ({
  event,
}: {
  event: PayoutSettled
}): Promise<true | ApplicationError> => {
  const res = await Wallets.settlePayout(event.id)
  if (res instanceof NoTransactionToSettleError) {
    return true
  }

  return res
}
