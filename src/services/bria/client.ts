import { Metadata, credentials } from "@grpc/grpc-js"

import { BRIA_PROFILE_API_KEY } from "@config"

import { BriaServiceClient } from "./proto/bria_grpc_pb"

const briaUrl = process.env.BRIA_HOST ?? "localhost"
const briaPort = process.env.BRIA_PORT ?? "2742"
const fullUrl = `${briaUrl}:${briaPort}`

const briaClient = new BriaServiceClient(fullUrl, credentials.createInsecure())
export const bria = {
  subscribeAll: briaClient.subscribeAll.bind(briaClient),
}

const metadata = new Metadata()
metadata.set("x-bria-api-key", BRIA_PROFILE_API_KEY)
export const briaMetadata = metadata
