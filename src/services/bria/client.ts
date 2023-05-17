import util from "util"

import { Metadata, ServiceError, credentials } from "@grpc/grpc-js"

import { BRIA_PROFILE_API_KEY } from "@config"

import { BriaServiceClient } from "./proto/bria_grpc_pb"
import {
  SubmitPayoutRequest,
  SubmitPayoutResponse,
  SubscribeAllRequest,
} from "./proto/bria_pb"

const briaUrl = process.env.BRIA_HOST ?? "localhost"
const briaPort = process.env.BRIA_PORT ?? "2742"
const fullUrl = `${briaUrl}:${briaPort}`

const briaGrpcClient = new BriaServiceClient(fullUrl, credentials.createInsecure())

export const BriaClient = (walletName: BriaWalletName) => {
  const initialMetadata = new Metadata()
  initialMetadata.set("x-bria-api-key", BRIA_PROFILE_API_KEY)

  const submitPayout = async ({
    priority,
    address,
    amount,
    externalId,
  }: {
    priority: PayoutPriority
    address: OnChainAddress
    amount: BtcPaymentAmount
    externalId?: string
  }): Promise<PayoutId> => {
    const request = new SubmitPayoutRequest()
    request.setWalletName(walletName)
    request.setPayoutQueueName(priority)
    request.setOnchainAddress(address)
    request.setSatoshis(Number(amount.amount))
    if (externalId) {
      request.setExternalId(externalId)
    }

    const submitPayoutWithMetadataOverload = (
      { request, metadata }: { request: SubmitPayoutRequest; metadata: Metadata },
      callback: (error: ServiceError | null, response: SubmitPayoutResponse) => void,
    ) => {
      const submitPayout = briaGrpcClient.submitPayout.bind(briaGrpcClient)
      return submitPayout(request, metadata, callback)
    }

    const submitPayoutWithMetadata = util.promisify(submitPayoutWithMetadataOverload)
    const response = await submitPayoutWithMetadata({
      request,
      metadata: initialMetadata,
    })

    return response.getId() as PayoutId
  }

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

    submitPayout,
  }
}
