import util from "util"

import { credentials } from "@grpc/grpc-js"

import { BriaProtoDescriptor } from "./grpc"

const priceUrl = process.env.PRICE_HOST ?? "galoy-price"
const pricePort = process.env.PRICE_PORT ?? "50051"
const fullUrl = `${priceUrl}:${pricePort}`

const bitcoinBridgeClient = new BriaProtoDescriptor.BriaService(
  fullUrl,
  credentials.createInsecure(),
)

export const BitcoinService = (): IBitcoinService => {
  const getWalletBalanceSummary = async (): Promise<true | Error> =>
    util.promisify(bitcoinBridgeClient.getWalletBalanceSummary).bind(bitcoinBridgeClient)

  return {
    getWalletBalanceSummary,
  }
}
