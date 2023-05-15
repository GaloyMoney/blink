import {
  asyncRunInSpan,
  SemanticAttributes,
  recordExceptionInCurrentSpan,
} from "@services/tracing"
import { credentials, Metadata } from "@grpc/grpc-js"
import { BRIA_PROFILE_API_KEY } from "@config"
import { UnknownOnChainServiceError, OnChainServiceError } from "@domain/bitcoin/onchain"
import { WalletCurrency } from "@domain/shared/primitives"

import { SequenceRepo } from "./sequence"
import { ListenerWrapper } from "./listener_wrapper"
import { BriaServiceClient } from "./proto/bria_grpc_pb"
import { SubscribeAllRequest, BriaEvent as RawBriaEvent } from "./proto/bria_pb"

export { ListenerWrapper } from "./listener_wrapper"

const briaUrl = process.env.BRIA_HOST ?? "localhost"
const briaPort = process.env.BRIA_PORT ?? "2742"
const fullUrl = `${briaUrl}:${briaPort}`

const bitcoinBridgeClient = new BriaServiceClient(fullUrl, credentials.createInsecure())

export const BriaPayloadType = {
  UtxoDetected: "utxo_detected",
  UtxoSettled: "utxo_settled",
  PayoutSubmitted: "payout_submitted",
  PayoutCommitted: "payout_committed",
  PayoutBroadcast: "payout_broadcast",
  PayoutSettled: "payout_settled",
} as const

const sequenceRepo = SequenceRepo()

export const BriaSubscriber = () => {
  const metadata = new Metadata()
  metadata.set("x-bria-api-key", BRIA_PROFILE_API_KEY)

  const subscribeToAll = async (
    eventHandler: BriaEventHandler,
  ): Promise<ListenerWrapper | OnChainServiceError> => {
    const subscribeAll = bitcoinBridgeClient.subscribeAll.bind(bitcoinBridgeClient)

    let listenerWrapper: ListenerWrapper
    try {
      const lastSequence = await sequenceRepo.getSequence()
      if (lastSequence instanceof Error) {
        return lastSequence
      }

      const request = new SubscribeAllRequest()
      request.setAugment(true)
      request.setAfterSequence(lastSequence)

      listenerWrapper = new ListenerWrapper(
        subscribeAll(request, metadata),
        (error: Error) => {
          if (!error.message.includes("CANCELLED")) {
            throw error
          }
        },
      )
    } catch (error) {
      return new UnknownOnChainServiceError(error.message || error)
    }

    listenerWrapper._setDataHandler((rawEvent: RawBriaEvent) => {
      asyncRunInSpan(
        "service.bria.eventReceived",
        {
          attributes: {
            [SemanticAttributes.CODE_FUNCTION]: "eventReceived",
            [SemanticAttributes.CODE_NAMESPACE]: "services.bria",
            rawEvent: JSON.stringify(rawEvent),
          },
        },
        async () => {
          const sequence = rawEvent.getSequence()
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

          await sequenceRepo.updateSequence(sequence)
        },
      )
    })

    return listenerWrapper
  }

  return {
    subscribeToAll,
  }
}

class BriaEventError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "UninitializedFieldError"
  }
}

const translate = (rawEvent: RawBriaEvent): BriaEvent | BriaEventError => {
  const sequence = BigInt(rawEvent.getSequence())
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
  let id, rawPayload
  switch (rawEvent.getPayloadCase()) {
    case RawBriaEvent.PayloadCase.PAYLOAD_NOT_SET:
      return new BriaEventError("payload is not set.")
    case RawBriaEvent.PayloadCase.UTXO_DETECTED:
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
    case RawBriaEvent.PayloadCase.UTXO_SETTLED:
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
    case RawBriaEvent.PayloadCase.PAYOUT_SUBMITTED:
      id = rawEvent.getPayoutSettled()?.getId()
      if (!id) {
        return new BriaEventError("id is not initialized.")
      }
      payload = {
        id,
        type: BriaPayloadType.PayoutSubmitted,
      }
      break
    case RawBriaEvent.PayloadCase.PAYOUT_COMMITTED:
      id = rawEvent.getPayoutSettled()?.getId()
      if (!id) {
        return new BriaEventError("id is not initialized.")
      }
      payload = {
        id,
        type: BriaPayloadType.PayoutCommitted,
      }
      break
    case RawBriaEvent.PayloadCase.PAYOUT_BROADCAST:
      id = rawEvent.getPayoutSettled()?.getId()
      if (!id) {
        return new BriaEventError("id is not initialized.")
      }
      payload = {
        id,
        type: BriaPayloadType.PayoutBroadcast,
      }
      break
    case RawBriaEvent.PayloadCase.PAYOUT_SETTLED:
      id = rawEvent.getPayoutSettled()?.getId()
      if (!id) {
        return new BriaEventError("id is not initialized.")
      }
      payload = {
        id,
        type: BriaPayloadType.PayoutSettled,
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
