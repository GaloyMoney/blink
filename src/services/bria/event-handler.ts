import { ErrorLevel, WalletCurrency } from "@domain/shared"

import { baseLogger } from "@services/logger"
import {
  addAttributesToCurrentSpan,
  recordExceptionInCurrentSpan,
} from "@services/tracing"

import {
  EventAugmentationMissingError,
  ExpectedAddressInfoMissingInEventError,
  ExpectedPayoutBroadcastPayloadNotFoundError,
  ExpectedPayoutCommittedPayloadNotFoundError,
  ExpectedPayoutSettledPayloadNotFoundError,
  ExpectedPayoutSubmittedPayloadNotFoundError,
  ExpectedUtxoDetectedPayloadNotFoundError,
  ExpectedUtxoSettledPayloadNotFoundError,
  NoPayloadFoundError,
  UnknownPayloadTypeReceivedError,
} from "./errors"
import { BriaEventRepo } from "./event-repository"
import { BriaEvent as RawBriaEvent, SubscribeAllRequest } from "./proto/bria_pb"

export const BriaPayloadType = {
  UtxoDetected: "utxo_detected",
  UtxoSettled: "utxo_settled",
  PayoutSubmitted: "payout_submitted",
  PayoutCommitted: "payout_committed",
  PayoutBroadcast: "payout_broadcast",
  PayoutSettled: "payout_settled",
} as const

const eventRepo = BriaEventRepo()

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
  const rawInfo = rawAugmentation.getAddressInfo()
  if (rawInfo) {
    const info = rawInfo.toObject()
    augmentation = {
      addressInfo: {
        address: info.address as OnChainAddress,
        externalId: info.externalId,
      },
    }
  }
  if (!augmentation) {
    return new ExpectedAddressInfoMissingInEventError()
  }

  let payload: BriaPayload | undefined
  let rawPayload
  switch (rawEvent.getPayloadCase()) {
    case RawBriaEvent.PayloadCase.PAYLOAD_NOT_SET:
      return new NoPayloadFoundError()
    case RawBriaEvent.PayloadCase.UTXO_DETECTED:
      rawPayload = rawEvent.getUtxoDetected()
      if (!rawPayload) {
        return new ExpectedUtxoDetectedPayloadNotFoundError()
      }
      payload = {
        type: BriaPayloadType.UtxoDetected,
        txId: rawPayload.getTxId() as OnChainTxHash,
        vout: rawPayload.getVout() as OnChainTxVout,
        address: rawPayload.getAddress() as OnChainAddress,
        satoshis: {
          amount: BigInt(rawPayload.getSatoshis()),
          currency: WalletCurrency.Btc,
        },
      }
      break
    case RawBriaEvent.PayloadCase.UTXO_SETTLED:
      rawPayload = rawEvent.getUtxoSettled()
      if (!rawPayload) {
        return new ExpectedUtxoSettledPayloadNotFoundError()
      }
      payload = {
        type: BriaPayloadType.UtxoSettled,
        txId: rawPayload.getTxId() as OnChainTxHash,
        vout: rawPayload.getVout() as OnChainTxVout,
        address: rawPayload.getAddress() as OnChainAddress,
        satoshis: {
          amount: BigInt(rawPayload.getSatoshis()),
          currency: WalletCurrency.Btc,
        },
        blockNumber: rawPayload.getBlockHeight(),
      }
      break
    case RawBriaEvent.PayloadCase.PAYOUT_SUBMITTED:
      rawPayload = rawEvent.getPayoutSubmitted()
      if (!rawPayload) {
        return new ExpectedPayoutSubmittedPayloadNotFoundError()
      }
      payload = {
        type: BriaPayloadType.PayoutSubmitted,
        id: rawPayload.getId(),
        satoshis: {
          amount: BigInt(rawPayload.getSatoshis()),
          currency: WalletCurrency.Btc,
        },
      }
      break
    case RawBriaEvent.PayloadCase.PAYOUT_COMMITTED:
      rawPayload = rawEvent.getPayoutCommitted()
      if (!rawPayload) {
        return new ExpectedPayoutCommittedPayloadNotFoundError()
      }
      payload = {
        type: BriaPayloadType.PayoutCommitted,
        id: rawPayload.getId(),
        satoshis: {
          amount: BigInt(rawPayload.getSatoshis()),
          currency: WalletCurrency.Btc,
        },
      }
      break
    case RawBriaEvent.PayloadCase.PAYOUT_BROADCAST:
      rawPayload = rawEvent.getPayoutBroadcast()
      if (!rawPayload) {
        return new ExpectedPayoutBroadcastPayloadNotFoundError()
      }
      payload = {
        type: BriaPayloadType.PayoutBroadcast,
        id: rawPayload.getId(),
        satoshis: {
          amount: BigInt(rawPayload.getSatoshis()),
          currency: WalletCurrency.Btc,
        },
      }
      break
    case RawBriaEvent.PayloadCase.PAYOUT_SETTLED:
      rawPayload = rawEvent.getPayoutSettled()
      if (!rawPayload) {
        return new ExpectedPayoutSettledPayloadNotFoundError()
      }
      payload = {
        type: BriaPayloadType.PayoutSettled,
        id: rawPayload.getId(),
        satoshis: {
          amount: BigInt(rawPayload.getSatoshis()),
          currency: WalletCurrency.Btc,
        },
      }
      break
    default:
      return new UnknownPayloadTypeReceivedError()
  }

  return {
    payload,
    augmentation,
    sequence,
  }
}
