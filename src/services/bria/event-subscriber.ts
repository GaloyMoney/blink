import {
  asyncRunInSpan,
  SemanticAttributes,
  recordExceptionInCurrentSpan,
} from "@services/tracing"
import { UnknownOnChainServiceError, OnChainServiceError } from "@domain/bitcoin/onchain"
import { WalletCurrency } from "@domain/shared/primitives"

import { BriaClient } from "./client"
import { BriaEventRepo } from "./repo"
import { ListenerWrapper } from "./listener_wrapper"
import { BriaEvent as ProtoBriaEvent } from "./proto/bria_pb"
import { BriaEventError } from "./errors"

export { ListenerWrapper } from "./listener_wrapper"

export const BriaPayloadType = {
  UtxoDetected: "utxo_detected",
  UtxoSettled: "utxo_settled",
  PayoutSubmitted: "payout_submitted",
  PayoutCommitted: "payout_committed",
  PayoutBroadcast: "payout_broadcast",
  PayoutSettled: "payout_settled",
} as const

const eventRepo = BriaEventRepo()

const bria = BriaClient("" as BriaWalletName)

export const BriaSubscriber = () => {
  const subscribeToAll = async (
    eventHandler: BriaEventHandler,
  ): Promise<ListenerWrapper | OnChainServiceError> => {
    let listenerWrapper: ListenerWrapper
    const lastSequence = await eventRepo.getLatestSequence()
    if (lastSequence instanceof Error) {
      return lastSequence
    }

    const listener = bria.subscribeAll({ augment: true, afterSequence: lastSequence })
    if (listener instanceof Error) return listener

    try {
      listenerWrapper = new ListenerWrapper(listener, (error: Error) => {
        if (!error.message.includes("CANCELLED")) {
          listenerWrapper._listener.cancel()
          throw error
        }
      })
    } catch (error) {
      return new UnknownOnChainServiceError(error.message || error)
    }

    listenerWrapper._setDataHandler((rawEvent: ProtoBriaEvent) => {
      asyncRunInSpan(
        "service.bria.eventReceived",
        {
          attributes: {
            [SemanticAttributes.CODE_FUNCTION]: "eventReceived",
            [SemanticAttributes.CODE_NAMESPACE]: "services.bria",
            rawEvent: JSON.stringify(rawEvent.toObject()),
          },
        },
        async () => {
          const event = translate(rawEvent)
          if (event instanceof BriaEventError) {
            recordExceptionInCurrentSpan({ error: event })
            throw event
          }
          const result = await eventHandler(event)

          if (result instanceof Error) {
            recordExceptionInCurrentSpan({ error: result })
            const resubscribe = await subscribeToAll(eventHandler)
            if (resubscribe instanceof Error) {
              throw resubscribe
            }
            listenerWrapper._merge(resubscribe)
          }

          const res = await eventRepo.persistEvent(event)
          if (res instanceof Error) {
            recordExceptionInCurrentSpan({ error: res })
            throw res
          }
        },
      )
    })

    return listenerWrapper
  }

  return {
    subscribeToAll,
  }
}

const translate = (rawEvent: ProtoBriaEvent): BriaEvent | BriaEventError => {
  const sequence = rawEvent.getSequence()
  const rawAugmentation = rawEvent.getAugmentation()

  if (!rawAugmentation) {
    return new BriaEventError("augmentation is not initialized.")
  }
  let augmentation: BriaEventAugmentation | undefined
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

  let payload: BriaPayload | undefined
  let rawPayload
  switch (rawEvent.getPayloadCase()) {
    case ProtoBriaEvent.PayloadCase.PAYLOAD_NOT_SET:
      return new BriaEventError("payload is not set.")
    case ProtoBriaEvent.PayloadCase.UTXO_DETECTED:
      rawPayload = rawEvent.getUtxoDetected()
      if (!rawPayload) {
        return new BriaEventError("utxo_detected is not initialized.")
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
    case ProtoBriaEvent.PayloadCase.UTXO_SETTLED:
      rawPayload = rawEvent.getUtxoSettled()
      if (!rawPayload) {
        return new BriaEventError("utxo_detected is not initialized.")
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
    case ProtoBriaEvent.PayloadCase.PAYOUT_SUBMITTED:
      rawPayload = rawEvent.getPayoutSubmitted()
      if (!rawPayload) {
        return new BriaEventError("payout_submitted is not initialized.")
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
    case ProtoBriaEvent.PayloadCase.PAYOUT_COMMITTED:
      rawPayload = rawEvent.getPayoutCommitted()
      if (!rawPayload) {
        return new BriaEventError("payout_submitted is not initialized.")
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
    case ProtoBriaEvent.PayloadCase.PAYOUT_BROADCAST:
      rawPayload = rawEvent.getPayoutBroadcast()
      if (!rawPayload) {
        return new BriaEventError("payout_submitted is not initialized.")
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
    case ProtoBriaEvent.PayloadCase.PAYOUT_SETTLED:
      rawPayload = rawEvent.getPayoutSettled()
      if (!rawPayload) {
        return new BriaEventError("payout_submitted is not initialized.")
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
      return new BriaEventError("Unknown payload type.")
  }
  if (!payload || !augmentation) {
    return new BriaEventError("Unknown payload")
  }

  return {
    payload,
    augmentation,
    sequence,
  }
}
