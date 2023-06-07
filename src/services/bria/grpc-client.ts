import { promisify } from "util"

import { credentials, Metadata } from "@grpc/grpc-js"

import { getBriaConfig } from "@config"

import {
  FindAddressByExternalIdRequest,
  FindAddressByExternalIdResponse,
  GetWalletBalanceSummaryRequest,
  GetWalletBalanceSummaryResponse,
  NewAddressRequest,
  NewAddressResponse,
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

export const getWalletBalanceSummary = promisify<
  GetWalletBalanceSummaryRequest,
  Metadata,
  GetWalletBalanceSummaryResponse
>(bitcoinBridgeClient.getWalletBalanceSummary.bind(bitcoinBridgeClient))

export const subscribeAll = bitcoinBridgeClient.subscribeAll.bind(bitcoinBridgeClient)
