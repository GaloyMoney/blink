import { credentials, Metadata } from "@grpc/grpc-js"

import { BRIA_HEADERS } from "@config"
import { UnknownOnChainServiceError } from "@domain/bitcoin/onchain"

import { BriaProtoDescriptor } from "./grpc"

const briaUrl = process.env.BRIA_HOST ?? "localhost"
const briaPort = process.env.BRIA_PORT ?? "2742"
const fullUrl = `${briaUrl}:${briaPort}`

const bitcoinBridgeClient = new BriaProtoDescriptor.services.bria.v1.BriaService(
  fullUrl,
  credentials.createInsecure(),
)

const metadata = new Metadata()
let key: keyof typeof BRIA_HEADERS
for (key in BRIA_HEADERS) {
  metadata.set(key, BRIA_HEADERS[key])
}

export const BriaService = (): INewOnChainService => {
  return {
    subscribeToAll: (callback: UtxoEventHandler) => {
      const subscribeAll = bitcoinBridgeClient.subscribeAll.bind(bitcoinBridgeClient)

      let listener: ClientReadableStream<UtxoEvent>
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
