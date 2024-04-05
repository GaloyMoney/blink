import {
  EventAugmentationMissingError,
  ExpectedAddressInfoMissingInEventError,
  ExpectedPayoutBroadcastPayloadNotFoundError,
  ExpectedPayoutCancelledPayloadNotFoundError,
  ExpectedPayoutCommittedPayloadNotFoundError,
  ExpectedPayoutSettledPayloadNotFoundError,
  ExpectedPayoutSubmittedPayloadNotFoundError,
  ExpectedUtxoDetectedPayloadNotFoundError,
  ExpectedUtxoDroppedPayloadNotFoundError,
  ExpectedUtxoSettledPayloadNotFoundError,
  NoPayloadFoundError,
  UnknownPayloadTypeReceivedError,
} from "./errors"

import { BriaEventRepo } from "./event-repository"

import { BriaEvent as RawBriaEvent, SubscribeAllRequest } from "./proto/bria_pb"

import { ErrorLevel, WalletCurrency, paymentAmountFromNumber } from "@/domain/shared"

import { baseLogger } from "@/services/logger"
import {
  addAttributesToCurrentSpan,
  recordExceptionInCurrentSpan,
} from "@/services/tracing"

export const BriaPayloadType = {
  UtxoDetected: "utxo_detected",
  UtxoDropped: "utxo_dropped",
  UtxoSettled: "utxo_settled",
  PayoutSubmitted: "payout_submitted",
  PayoutCommitted: "payout_committed",
  PayoutBroadcast: "payout_broadcast",
  PayoutSettled: "payout_settled",
  PayoutCancelled: "payout_cancelled",
} as const

const eventRepo = BriaEventRepo()

// This should never compile if 'payloadCase' is not never
const assertUnreachable = (payloadCase: never): Error =>
  new UnknownPayloadTypeReceivedError(payloadCase)

export const eventDataHandler =
  (eventHandler: BriaEventHandler) =>
  async (stream: Stream<RawBriaEvent, SubscribeAllRequest>, data: RawBriaEvent) => {
    addAttributesToCurrentSpan({
      rawEvent: JSON.stringify(data.toObject()),
    })

    const event = translate(data)
    if (event instanceof Error) {
      recordExceptionInCurrentSpan({ error: event, level: ErrorLevel.Critical })
      throw event
    }

    const result = await eventHandler(event)
    if (result instanceof Error) {
      baseLogger.error({ error: result, event }, "eventDataHandler error")
      recordExceptionInCurrentSpan({ error: result, level: ErrorLevel.Critical })
      stream.request.setAfterSequence(event.sequence - 1)
      stream.reconnect()
      return
    }

    const persisted = await eventRepo.persistEvent(event)
    if (persisted instanceof Error) {
      baseLogger.error({ error: persisted, event }, "eventDataHandler error")
      recordExceptionInCurrentSpan({ error: persisted, level: ErrorLevel.Critical })
      stream.request.setAfterSequence(event.sequence - 1)
      stream.reconnect()
    }
  }

export const translate = (rawEvent: RawBriaEvent): BriaEvent | BriaEventError => {
  const sequence = rawEvent.getSequence()
  const rawAugmentation = rawEvent.getAugmentation()

  if (!rawAugmentation) {
    return new EventAugmentationMissingError()
  }
  let augmentation: BriaEventAugmentation | undefined = undefined
  const addressInfo = rawAugmentation.getAddressInfo()
  if (addressInfo) {
    const info = addressInfo.toObject()
    augmentation = {
      addressInfo: {
        address: info.address as OnChainAddress,
        externalId: info.externalId,
      },
    }
  }
  const payoutInfo = rawAugmentation.getPayoutInfo()
  if (payoutInfo) {
    const grpcMeta = payoutInfo.getMetadata()
    const info = payoutInfo.toObject()
    let metadata: undefined | PayoutMetadata = undefined
    if (grpcMeta) {
      metadata = grpcMeta.toJavaScript()
    }
    augmentation = {
      payoutInfo: {
        id: info.id as PayoutId,
        externalId: info.externalId,
        metadata,
      },
    }
  }
  if (augmentation === undefined) {
    return new EventAugmentationMissingError()
  }

  let proportionalFee: BtcPaymentAmount | ValidationError
  let payload: BriaPayload | undefined
  let rawPayload
  const payloadCase = rawEvent.getPayloadCase()
  switch (payloadCase) {
    case RawBriaEvent.PayloadCase.PAYLOAD_NOT_SET:
      return new NoPayloadFoundError()
    case RawBriaEvent.PayloadCase.UTXO_DETECTED:
      if (augmentation.addressInfo === undefined) {
        return new ExpectedAddressInfoMissingInEventError()
      }
      rawPayload = rawEvent.getUtxoDetected()
      if (rawPayload === undefined) {
        return new ExpectedUtxoDetectedPayloadNotFoundError()
      }
      payload = {
        type: BriaPayloadType.UtxoDetected,
        txId: rawPayload.getTxId() as OnChainTxHash,
        vout: rawPayload.getVout() as OnChainTxVout,
        address: augmentation.addressInfo.address as OnChainAddress,
        satoshis: {
          amount: BigInt(rawPayload.getSatoshis()),
          currency: WalletCurrency.Btc,
        },
      }
      break
    case RawBriaEvent.PayloadCase.UTXO_DROPPED:
      if (augmentation.addressInfo === undefined) {
        return new ExpectedAddressInfoMissingInEventError()
      }
      rawPayload = rawEvent.getUtxoDropped()
      if (rawPayload === undefined) {
        return new ExpectedUtxoDroppedPayloadNotFoundError()
      }
      payload = {
        type: BriaPayloadType.UtxoDropped,
        txId: rawPayload.getTxId() as OnChainTxHash,
        vout: rawPayload.getVout() as OnChainTxVout,
        address: augmentation.addressInfo.address as OnChainAddress,
        satoshis: {
          amount: BigInt(rawPayload.getSatoshis()),
          currency: WalletCurrency.Btc,
        },
      }
      break
    case RawBriaEvent.PayloadCase.UTXO_SETTLED:
      if (augmentation.addressInfo === undefined) {
        return new ExpectedAddressInfoMissingInEventError()
      }

      rawPayload = rawEvent.getUtxoSettled()
      if (rawPayload === undefined) {
        return new ExpectedUtxoSettledPayloadNotFoundError()
      }
      payload = {
        type: BriaPayloadType.UtxoSettled,
        txId: rawPayload.getTxId() as OnChainTxHash,
        vout: rawPayload.getVout() as OnChainTxVout,
        address: augmentation.addressInfo.address as OnChainAddress,
        satoshis: {
          amount: BigInt(rawPayload.getSatoshis()),
          currency: WalletCurrency.Btc,
        },
        blockNumber: rawPayload.getBlockHeight(),
      }
      break
    case RawBriaEvent.PayloadCase.PAYOUT_SUBMITTED:
      rawPayload = rawEvent.getPayoutSubmitted()
      if (rawPayload === undefined) {
        return new ExpectedPayoutSubmittedPayloadNotFoundError()
      }
      payload = {
        type: BriaPayloadType.PayoutSubmitted,
        id: rawPayload.getId() as PayoutId,
        satoshis: {
          amount: BigInt(rawPayload.getSatoshis()),
          currency: WalletCurrency.Btc,
        },
      }
      break
    case RawBriaEvent.PayloadCase.PAYOUT_COMMITTED:
      rawPayload = rawEvent.getPayoutCommitted()
      if (rawPayload === undefined) {
        return new ExpectedPayoutCommittedPayloadNotFoundError()
      }
      payload = {
        type: BriaPayloadType.PayoutCommitted,
        id: rawPayload.getId() as PayoutId,
        satoshis: {
          amount: BigInt(rawPayload.getSatoshis()),
          currency: WalletCurrency.Btc,
        },
      }
      break
    case RawBriaEvent.PayloadCase.PAYOUT_BROADCAST:
      rawPayload = rawEvent.getPayoutBroadcast()
      if (rawPayload === undefined) {
        return new ExpectedPayoutBroadcastPayloadNotFoundError()
      }

      proportionalFee = paymentAmountFromNumber({
        amount: rawPayload.getProportionalFeeSats(),
        currency: WalletCurrency.Btc,
      })
      if (proportionalFee instanceof Error) return proportionalFee

      payload = {
        type: BriaPayloadType.PayoutBroadcast,
        id: rawPayload.getId() as PayoutId,
        proportionalFee,
        satoshis: {
          amount: BigInt(rawPayload.getSatoshis()),
          currency: WalletCurrency.Btc,
        },
        txId: rawPayload.getTxId() as OnChainTxHash,
        vout: rawPayload.getVout() as OnChainTxVout,
        address: rawPayload.getOnchainAddress() as OnChainAddress,
      }
      break
    case RawBriaEvent.PayloadCase.PAYOUT_SETTLED:
      rawPayload = rawEvent.getPayoutSettled()
      if (rawPayload === undefined) {
        return new ExpectedPayoutSettledPayloadNotFoundError()
      }

      proportionalFee = paymentAmountFromNumber({
        amount: rawPayload.getProportionalFeeSats(),
        currency: WalletCurrency.Btc,
      })
      if (proportionalFee instanceof Error) return proportionalFee

      payload = {
        type: BriaPayloadType.PayoutSettled,
        id: rawPayload.getId() as PayoutId,
        proportionalFee,
        satoshis: {
          amount: BigInt(rawPayload.getSatoshis()),
          currency: WalletCurrency.Btc,
        },
        txId: rawPayload.getTxId() as OnChainTxHash,
        vout: rawPayload.getVout() as OnChainTxVout,
        address: rawPayload.getOnchainAddress() as OnChainAddress,
      }
      break
    case RawBriaEvent.PayloadCase.PAYOUT_CANCELLED:
      rawPayload = rawEvent.getPayoutCancelled()
      if (rawPayload === undefined) {
        return new ExpectedPayoutCancelledPayloadNotFoundError()
      }

      payload = {
        type: BriaPayloadType.PayoutCancelled,
        id: rawPayload.getId() as PayoutId,
        satoshis: {
          amount: BigInt(rawPayload.getSatoshis()),
          currency: WalletCurrency.Btc,
        },
        address: rawPayload.getOnchainAddress() as OnChainAddress,
      }
      break
    default:
      return assertUnreachable(payloadCase)
  }

  return {
    payload,
    augmentation,
    sequence,
  }
}
