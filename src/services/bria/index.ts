import { asyncRunInSpan, SemanticAttributes } from "@services/tracing"
import { credentials, Metadata } from "@grpc/grpc-js"
import { BRIA_PROFILE_API_KEY } from "@config"
import { UnknownOnChainServiceError } from "@domain/bitcoin/onchain"
import { WalletCurrency } from "@domain/shared/primitives"

import { BriaEvent as ProtoBriaEvent } from "./proto/bria_pb"
import { BriaProtoDescriptor } from "./grpc"

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

export const BriaSubscriber = () => {
  const metadata = new Metadata()
  metadata.set("x-bria-api-key", BRIA_PROFILE_API_KEY)

  return {
    subscribeToAll: (eventHandler: BriaEventHandler) => {
      const subscribeAll = bitcoinBridgeClient.subscribeAll.bind(bitcoinBridgeClient)

      let listener: ClientReadableStream<ProtoBriaEvent>
      try {
        listener = subscribeAll({ augment: true }, metadata)
      } catch (error) {
        return new UnknownOnChainServiceError(error.message || error)
      }

      listener.on("data", (rawEvent) => {
        asyncRunInSpan(
          "service.bria.eventReceived",
          {
            attributes: {
              [SemanticAttributes.CODE_FUNCTION]: "eventReceived",
              [SemanticAttributes.CODE_NAMESPACE]: "services.bria",
              rawEvent,
            },
          },
          async () => {
            const event = translate(rawEvent)
            if (event instanceof BriaEventError) {
              throw event
            }
            const result = await eventHandler(event)

            if (result instanceof Error) {
              throw result
            }
          },
        )
      })

      return listener
    },
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
        metadata: unpackStruct(rawAugmentation.address_info.metadata) as {
          galoy?: GaloyAddressMetadata
        },
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

const unpackStruct = (struct) => {
  const jsonObj = {}

  for (const key in struct.fields) {
    const field = struct.fields[key]
    if (field.kind === "structValue") {
      jsonObj[key] = unpackStruct(field.structValue)
    } else {
      jsonObj[key] = field[field.kind]
    }
  }

  return jsonObj
}
