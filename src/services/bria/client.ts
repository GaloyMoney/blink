import { Metadata, credentials } from "@grpc/grpc-js"

import { BRIA_PROFILE_API_KEY } from "@config"

import { BriaServiceClient } from "./proto/bria_grpc_pb"
import { SubscribeAllRequest } from "./proto/bria_pb"

const briaUrl = process.env.BRIA_HOST ?? "localhost"
const briaPort = process.env.BRIA_PORT ?? "2742"
const fullUrl = `${briaUrl}:${briaPort}`

const briaGrpcClient = new BriaServiceClient(fullUrl, credentials.createInsecure())

export const BriaClient = () => {
  const initialMetadata = new Metadata()
  initialMetadata.set("x-bria-api-key", BRIA_PROFILE_API_KEY)

  const subscribeAll = ({
    afterSequence,
    augment,
  }: {
    afterSequence: number
    augment?: boolean
  }) => {
    const request = new SubscribeAllRequest()
    request.setAfterSequence(afterSequence)
    if (augment !== undefined) {
      request.setAugment(augment)
    }

    const subscribeAll = briaGrpcClient.subscribeAll.bind(briaGrpcClient)
    return subscribeAll(request, initialMetadata)
  }

  return {
    subscribeAll,
  }
}
