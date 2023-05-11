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
        listener = subscribeAll({}, metadata)
      } catch (error) {
        return new UnknownOnChainServiceError(error.message || error)
      }

      listener.on("data", (rawEvent: ProtoBriaEvent) => {
        try {
          const event = translate(rawEvent)
          if (event instanceof UninitializedFieldError) {
            // console.error("Error translating BriaEvent:", event.message)
            return
          }
          const result = eventHandler(event)

          if (result instanceof Error) {
            console.error("Error handling BriaEvent:", result.message)
          }
        } catch (error) {
          console.error("Error translating BriaEvent:", error.message)
        }
      })

      return listener
    },
  }
}

class UninitializedFieldError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "UninitializedFieldError"
  }
}

const translate = (rawEvent: ProtoBriaEvent): BriaEvent | UninitializedFieldError => {
  const sequence = rawEvent.getSequence()
  const augmentation = rawEvent.getAugmentation()
  const addressInfo = augmentation?.getAddressInfo()

  if (!addressInfo) {
    return new UninitializedFieldError("AddressInfo is not initialized.")
  }

  const address = addressInfo.getAddress()
  const externalId = addressInfo.getExternalId()
  const metadata = addressInfo.getMetadata()

  if (!address || !externalId || !metadata) {
    return new UninitializedFieldError(
      "One or more fields in AddressInfo are not initialized.",
    )
  }

  const addressAugmentation: AddressAugmentation = {
    address: address as OnChainAddress,
    externalId,
    metadata,
  }

  const briaEventAugmentation: BriaEventAugmentation = {
    addressInfo: addressAugmentation,
  }

  let payload: BriaPayload

  if (rawEvent.hasUtxoDetected()) {
    const type = BriaPayloadType.UtxoDetected
    const utxoDetected = rawEvent.getUtxoDetected()

    if (!utxoDetected) {
      return new UninitializedFieldError("UtxoDetected is not initialized.")
    }

    const txId = utxoDetected.getTxId() as OnChainTxHash
    const vout = utxoDetected.getVout()
    const amount = BigInt(utxoDetected.getSatoshis())
    const address = utxoDetected.getAddress() as OnChainAddress

    if (!txId || !vout || !amount || !address) {
      return new UninitializedFieldError(
        "One or more fields in UtxoDetected are not initialized.",
      )
    }

    payload = {
      type,
      txId,
      vout,
      satoshis: { amount, currency: WalletCurrency.Btc },
      address,
    }
  } else if (rawEvent.hasUtxoSettled()) {
    const type = BriaPayloadType.UtxoSettled
    const utxoSettled = rawEvent.getUtxoSettled()

    if (!utxoSettled) {
      return new UninitializedFieldError("UtxoSettled is not initialized.")
    }

    const txId = utxoSettled.getTxId() as OnChainTxHash
    const vout = utxoSettled.getVout()
    const amount = BigInt(utxoSettled.getSatoshis())
    const address = utxoSettled.getAddress() as OnChainAddress
    const blockNumber = utxoSettled.getBlockHeight()

    if (!txId || !vout || !amount || !address || !blockNumber) {
      return new UninitializedFieldError(
        "One or more fields in UtxoSettled are not initialized.",
      )
    }

    payload = {
      type,
      txId,
      vout,
      satoshis: { amount, currency: WalletCurrency.Btc },
      address,
      blockNumber,
    }
  } else if (rawEvent.hasPayoutSubmitted()) {
    const type = BriaPayloadType.PayoutSubmitted
    const payoutSubmitted = rawEvent.getPayoutSubmitted()

    if (!payoutSubmitted) {
      return new UninitializedFieldError("PayoutSubmitted is not initialized.")
    }

    const id = payoutSubmitted.getId()

    if (!id) {
      return new UninitializedFieldError(
        "One or more fields in PayoutSubmitted are not initialized.",
      )
    }

    payload = {
      type,
      id,
    }
  } else if (rawEvent.hasPayoutCommitted()) {
    const type = BriaPayloadType.PayoutCommitted
    const payoutCommitted = rawEvent.getPayoutSubmitted()

    if (!payoutCommitted) {
      return new UninitializedFieldError("PayoutCommitted is not initialized.")
    }

    const id = payoutCommitted.getId()

    if (!id) {
      return new UninitializedFieldError(
        "One or more fields in PayoutCommitted are not initialized.",
      )
    }

    payload = {
      type,
      id,
    }
  } else if (rawEvent.hasPayoutBroadcast()) {
    const type = BriaPayloadType.PayoutBroadcast
    const payoutBroadcast = rawEvent.getPayoutSubmitted()

    if (!payoutBroadcast) {
      return new UninitializedFieldError("PayoutBroadcast is not initialized.")
    }

    const id = payoutBroadcast.getId()

    if (!id) {
      return new UninitializedFieldError(
        "One or more fields in PayoutBroadcast are not initialized.",
      )
    }

    payload = {
      type,
      id,
    }
  } else if (rawEvent.hasPayoutSettled()) {
    const type = BriaPayloadType.PayoutSettled
    const payoutSettled = rawEvent.getPayoutSubmitted()

    if (!payoutSettled) {
      return new UninitializedFieldError("PayoutSettled is not initialized.")
    }

    const id = payoutSettled.getId()

    if (!id) {
      return new UninitializedFieldError(
        "One or more fields in PayoutSettled are not initialized.",
      )
    }

    payload = {
      type,
      id,
    }
  } else {
    return new UninitializedFieldError("Invalid payload type")
  }

  return {
    payload,
    augmentation: briaEventAugmentation,
    sequence: sequence as BriaEventSequence,
  }
}
