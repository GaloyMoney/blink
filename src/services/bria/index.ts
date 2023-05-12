import {
  asyncRunInSpan,
  SemanticAttributes,
  recordExceptionInCurrentSpan,
} from "@services/tracing"
import { credentials, Metadata } from "@grpc/grpc-js"
import { BRIA_PROFILE_API_KEY } from "@config"
import { UnknownOnChainServiceError, OnChainServiceError } from "@domain/bitcoin/onchain"
import { WalletCurrency } from "@domain/shared/primitives"

import { BriaProtoDescriptor } from "./grpc"
import { SequenceRepo } from "./sequence"
import { ListenerWrapper } from "./listener_wrapper"

export { ListenerWrapper } from "./listener_wrapper"

const briaUrl = process.env.BRIA_HOST ?? "localhost"
const briaPort = process.env.BRIA_PORT ?? "2742"
const fullUrl = `${briaUrl}:${briaPort}`

const bitcoinBridgeClient = new BriaProtoDescriptor.services.bria.v1.BriaService(
  fullUrl,
  credentials.createInsecure(),
)

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
      listenerWrapper = new ListenerWrapper(
        subscribeAll({ augment: true, after_sequence: lastSequence }, metadata),
        (error: Error) => {
          if (!error.message.includes("CANCELLED")) {
            throw error
          }
        },
      )
    } catch (error) {
      return new UnknownOnChainServiceError(error.message || error)
    }

    listenerWrapper._setDataHandler((rawEvent) => {
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
          const sequence = rawEvent.sequence
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

const translate = (rawEvent): BriaEvent | BriaEventError => {
  const sequence = BigInt(rawEvent.sequence)
  const rawAugmentation = rawEvent.augmentation

  if (!rawAugmentation) {
    return new BriaEventError("augmentation is not initialized.")
  }
  let augmentation: BriaEventAugmentation | undefined
  if (rawAugmentation.address_info) {
    augmentation = {
      addressInfo: {
        address: rawAugmentation.address_info.address as OnChainAddress,
        externalId: rawAugmentation.address_info.external_id,
      },
    }
  }

  let payload: BriaPayload | undefined
  if (rawEvent.payload == BriaPayloadType.UtxoDetected) {
    payload = {
      type: BriaPayloadType.UtxoDetected,
      txId: rawEvent.utxo_detected.tx_id,
      vout: rawEvent.utxo_detected.vout,
      address: rawEvent.utxo_detected.address as OnChainAddress,
      satoshis: {
        amount: BigInt(rawEvent.utxo_detected.satoshis),
        currency: WalletCurrency.Btc,
      },
    }
  } else if (rawEvent.payload == BriaPayloadType.UtxoSettled) {
    payload = {
      type: BriaPayloadType.UtxoSettled,
      txId: rawEvent.utxo_settled.tx_id,
      vout: rawEvent.utxo_settled.vout,
      address: rawEvent.utxo_settled.address as OnChainAddress,
      satoshis: {
        amount: BigInt(rawEvent.utxo_settled.satoshis),
        currency: WalletCurrency.Btc,
      },
      blockNumber: rawEvent.utxo_settled.block_number,
    }
  } else if (rawEvent.payload == BriaPayloadType.PayoutSubmitted) {
    payload = rawEvent.payout_submitted as PayoutSubmitted
    payload.type = BriaPayloadType.PayoutSubmitted
  } else if (rawEvent.payload == BriaPayloadType.PayoutCommitted) {
    payload = rawEvent.payout_committed as PayoutCommitted
    payload.type = BriaPayloadType.PayoutCommitted
  } else if (rawEvent.payload == BriaPayloadType.PayoutBroadcast) {
    payload = rawEvent.payout_broadcast as PayoutBroadcast
    payload.type = BriaPayloadType.PayoutBroadcast
  } else if (rawEvent.payload == BriaPayloadType.PayoutSettled) {
    payload = rawEvent.payout_settled as PayoutSettled
    payload.type = BriaPayloadType.PayoutSettled
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
