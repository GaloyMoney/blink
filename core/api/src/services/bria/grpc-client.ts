import { promisify } from "util"

import { credentials, Metadata } from "@grpc/grpc-js"

import {
  EstimatePayoutFeeRequest,
  EstimatePayoutFeeResponse,
  GetAddressRequest,
  GetAddressResponse,
  GetPayoutRequest,
  GetPayoutResponse,
  GetWalletBalanceSummaryRequest,
  GetWalletBalanceSummaryResponse,
  NewAddressRequest,
  NewAddressResponse,
  SubmitPayoutRequest,
  SubmitPayoutResponse,
} from "./proto/bria_pb"
import { BriaServiceClient } from "./proto/bria_grpc_pb"

import { BRIA_HOST, BRIA_PORT } from "@/config"

const briaEndpoint = `${BRIA_HOST}:${BRIA_PORT}`

const bitcoinBridgeClient = new BriaServiceClient(
  briaEndpoint,
  credentials.createInsecure(),
)

export const newAddress = promisify<NewAddressRequest, Metadata, NewAddressResponse>(
  bitcoinBridgeClient.newAddress.bind(bitcoinBridgeClient),
)

export const getAddress = promisify<GetAddressRequest, Metadata, GetAddressResponse>(
  bitcoinBridgeClient.getAddress.bind(bitcoinBridgeClient),
)

export const getPayout = promisify<GetPayoutRequest, Metadata, GetPayoutResponse>(
  bitcoinBridgeClient.getPayout.bind(bitcoinBridgeClient),
)

export const getWalletBalanceSummary = promisify<
  GetWalletBalanceSummaryRequest,
  Metadata,
  GetWalletBalanceSummaryResponse
>(bitcoinBridgeClient.getWalletBalanceSummary.bind(bitcoinBridgeClient))

export const submitPayout = promisify<
  SubmitPayoutRequest,
  Metadata,
  SubmitPayoutResponse
>(bitcoinBridgeClient.submitPayout.bind(bitcoinBridgeClient))

export const estimatePayoutFee = promisify<
  EstimatePayoutFeeRequest,
  Metadata,
  EstimatePayoutFeeResponse
>(bitcoinBridgeClient.estimatePayoutFee.bind(bitcoinBridgeClient))

export const subscribeAll = bitcoinBridgeClient.subscribeAll.bind(bitcoinBridgeClient)
