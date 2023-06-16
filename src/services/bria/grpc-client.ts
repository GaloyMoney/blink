import { promisify } from "util"

import { credentials, Metadata } from "@grpc/grpc-js"

import { getBriaConfig } from "@config"

import {
  EstimatePayoutFeeRequest,
  EstimatePayoutFeeResponse,
  FindAddressByExternalIdRequest,
  FindAddressByExternalIdResponse,
  FindPayoutByExternalIdRequest,
  FindPayoutByExternalIdResponse,
  GetWalletBalanceSummaryRequest,
  GetWalletBalanceSummaryResponse,
  NewAddressRequest,
  NewAddressResponse,
  SubmitPayoutRequest,
  SubmitPayoutResponse,
} from "./proto/bria_pb"
import { BriaServiceClient } from "./proto/bria_grpc_pb"

const briaConfig = getBriaConfig()

const bitcoinBridgeClient = new BriaServiceClient(
  briaConfig.endpoint,
  credentials.createInsecure(),
)

export const newAddress = promisify<NewAddressRequest, Metadata, NewAddressResponse>(
  bitcoinBridgeClient.newAddress.bind(bitcoinBridgeClient),
)

export const findAddressByExternalId = promisify<
  FindAddressByExternalIdRequest,
  Metadata,
  FindAddressByExternalIdResponse
>(bitcoinBridgeClient.findAddressByExternalId.bind(bitcoinBridgeClient))

export const findPayoutByExternalId = promisify<
  FindPayoutByExternalIdRequest,
  Metadata,
  FindPayoutByExternalIdResponse
>(bitcoinBridgeClient.findPayoutByExternalId.bind(bitcoinBridgeClient))

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
