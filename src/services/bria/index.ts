import { credentials, Metadata } from "@grpc/grpc-js"

import { BRIA_PROFILE_API_KEY } from "@config"
import { UnknownOnChainServiceError } from "@domain/bitcoin/onchain"

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
} as const

export const BriaService = (): INewOnChainService => {
  const metadata = new Metadata()
  metadata.set("x-bria-api-key", BRIA_PROFILE_API_KEY)

  return {
    subscribeToAll: (callback: BriaEventHandler) => {
      const subscribeAll = bitcoinBridgeClient.subscribeAll.bind(bitcoinBridgeClient)

      let listener: ClientReadableStream<BriaEvent>
      try {
        listener = subscribeAll({}, metadata)

        listener.on("data", callback)

        listener.on("error", (error) => {
          if (!error.message.includes("Cancelled on client")) {
            throw error
          }
        })
      } catch (error) {
        return new UnknownOnChainServiceError(error.message || error)
      }

      return listener
    },
  }
}
