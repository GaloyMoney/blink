// package: services.price.v1
// file: services/price/v1/price_service.proto

/* tslint:disable */
/* eslint-disable */

import * as grpc from "@grpc/grpc-js"
import * as services_price_v1_price_service_pb from "../../../services/price/v1/price_service_pb"

interface IPriceServiceService
  extends grpc.ServiceDefinition<grpc.UntypedServiceImplementation> {
  getExchangeRateForImmediateUsdBuy: IPriceServiceService_IGetExchangeRateForImmediateUsdBuy
  getExchangeRateForImmediateUsdSell: IPriceServiceService_IGetExchangeRateForImmediateUsdSell
  getExchangeRateForFutureUsdBuy: IPriceServiceService_IGetExchangeRateForFutureUsdBuy
  getExchangeRateForFutureUsdSell: IPriceServiceService_IGetExchangeRateForFutureUsdSell
}

interface IPriceServiceService_IGetExchangeRateForImmediateUsdBuy
  extends grpc.MethodDefinition<
    services_price_v1_price_service_pb.GetExchangeRateForImmediateUsdBuyRequest,
    services_price_v1_price_service_pb.GetExchangeRateForImmediateUsdBuyResponse
  > {
  path: "/services.price.v1.PriceService/GetExchangeRateForImmediateUsdBuy"
  requestStream: false
  responseStream: false
  requestSerialize: grpc.serialize<services_price_v1_price_service_pb.GetExchangeRateForImmediateUsdBuyRequest>
  requestDeserialize: grpc.deserialize<services_price_v1_price_service_pb.GetExchangeRateForImmediateUsdBuyRequest>
  responseSerialize: grpc.serialize<services_price_v1_price_service_pb.GetExchangeRateForImmediateUsdBuyResponse>
  responseDeserialize: grpc.deserialize<services_price_v1_price_service_pb.GetExchangeRateForImmediateUsdBuyResponse>
}
interface IPriceServiceService_IGetExchangeRateForImmediateUsdSell
  extends grpc.MethodDefinition<
    services_price_v1_price_service_pb.GetExchangeRateForImmediateUsdSellRequest,
    services_price_v1_price_service_pb.GetExchangeRateForImmediateUsdSellResponse
  > {
  path: "/services.price.v1.PriceService/GetExchangeRateForImmediateUsdSell"
  requestStream: false
  responseStream: false
  requestSerialize: grpc.serialize<services_price_v1_price_service_pb.GetExchangeRateForImmediateUsdSellRequest>
  requestDeserialize: grpc.deserialize<services_price_v1_price_service_pb.GetExchangeRateForImmediateUsdSellRequest>
  responseSerialize: grpc.serialize<services_price_v1_price_service_pb.GetExchangeRateForImmediateUsdSellResponse>
  responseDeserialize: grpc.deserialize<services_price_v1_price_service_pb.GetExchangeRateForImmediateUsdSellResponse>
}
interface IPriceServiceService_IGetExchangeRateForFutureUsdBuy
  extends grpc.MethodDefinition<
    services_price_v1_price_service_pb.GetExchangeRateForFutureUsdBuyRequest,
    services_price_v1_price_service_pb.GetExchangeRateForFutureUsdBuyResponse
  > {
  path: "/services.price.v1.PriceService/GetExchangeRateForFutureUsdBuy"
  requestStream: false
  responseStream: false
  requestSerialize: grpc.serialize<services_price_v1_price_service_pb.GetExchangeRateForFutureUsdBuyRequest>
  requestDeserialize: grpc.deserialize<services_price_v1_price_service_pb.GetExchangeRateForFutureUsdBuyRequest>
  responseSerialize: grpc.serialize<services_price_v1_price_service_pb.GetExchangeRateForFutureUsdBuyResponse>
  responseDeserialize: grpc.deserialize<services_price_v1_price_service_pb.GetExchangeRateForFutureUsdBuyResponse>
}
interface IPriceServiceService_IGetExchangeRateForFutureUsdSell
  extends grpc.MethodDefinition<
    services_price_v1_price_service_pb.GetExchangeRateForFutureUsdSellRequest,
    services_price_v1_price_service_pb.GetExchangeRateForFutureUsdSellResponse
  > {
  path: "/services.price.v1.PriceService/GetExchangeRateForFutureUsdSell"
  requestStream: false
  responseStream: false
  requestSerialize: grpc.serialize<services_price_v1_price_service_pb.GetExchangeRateForFutureUsdSellRequest>
  requestDeserialize: grpc.deserialize<services_price_v1_price_service_pb.GetExchangeRateForFutureUsdSellRequest>
  responseSerialize: grpc.serialize<services_price_v1_price_service_pb.GetExchangeRateForFutureUsdSellResponse>
  responseDeserialize: grpc.deserialize<services_price_v1_price_service_pb.GetExchangeRateForFutureUsdSellResponse>
}

export const PriceServiceService: IPriceServiceService

export interface IPriceServiceServer extends grpc.UntypedServiceImplementation {
  getExchangeRateForImmediateUsdBuy: grpc.handleUnaryCall<
    services_price_v1_price_service_pb.GetExchangeRateForImmediateUsdBuyRequest,
    services_price_v1_price_service_pb.GetExchangeRateForImmediateUsdBuyResponse
  >
  getExchangeRateForImmediateUsdSell: grpc.handleUnaryCall<
    services_price_v1_price_service_pb.GetExchangeRateForImmediateUsdSellRequest,
    services_price_v1_price_service_pb.GetExchangeRateForImmediateUsdSellResponse
  >
  getExchangeRateForFutureUsdBuy: grpc.handleUnaryCall<
    services_price_v1_price_service_pb.GetExchangeRateForFutureUsdBuyRequest,
    services_price_v1_price_service_pb.GetExchangeRateForFutureUsdBuyResponse
  >
  getExchangeRateForFutureUsdSell: grpc.handleUnaryCall<
    services_price_v1_price_service_pb.GetExchangeRateForFutureUsdSellRequest,
    services_price_v1_price_service_pb.GetExchangeRateForFutureUsdSellResponse
  >
}

export interface IPriceServiceClient {
  getExchangeRateForImmediateUsdBuy(
    request: services_price_v1_price_service_pb.GetExchangeRateForImmediateUsdBuyRequest,
    callback: (
      error: grpc.ServiceError | null,
      response: services_price_v1_price_service_pb.GetExchangeRateForImmediateUsdBuyResponse,
    ) => void,
  ): grpc.ClientUnaryCall
  getExchangeRateForImmediateUsdBuy(
    request: services_price_v1_price_service_pb.GetExchangeRateForImmediateUsdBuyRequest,
    metadata: grpc.Metadata,
    callback: (
      error: grpc.ServiceError | null,
      response: services_price_v1_price_service_pb.GetExchangeRateForImmediateUsdBuyResponse,
    ) => void,
  ): grpc.ClientUnaryCall
  getExchangeRateForImmediateUsdBuy(
    request: services_price_v1_price_service_pb.GetExchangeRateForImmediateUsdBuyRequest,
    metadata: grpc.Metadata,
    options: Partial<grpc.CallOptions>,
    callback: (
      error: grpc.ServiceError | null,
      response: services_price_v1_price_service_pb.GetExchangeRateForImmediateUsdBuyResponse,
    ) => void,
  ): grpc.ClientUnaryCall
  getExchangeRateForImmediateUsdSell(
    request: services_price_v1_price_service_pb.GetExchangeRateForImmediateUsdSellRequest,
    callback: (
      error: grpc.ServiceError | null,
      response: services_price_v1_price_service_pb.GetExchangeRateForImmediateUsdSellResponse,
    ) => void,
  ): grpc.ClientUnaryCall
  getExchangeRateForImmediateUsdSell(
    request: services_price_v1_price_service_pb.GetExchangeRateForImmediateUsdSellRequest,
    metadata: grpc.Metadata,
    callback: (
      error: grpc.ServiceError | null,
      response: services_price_v1_price_service_pb.GetExchangeRateForImmediateUsdSellResponse,
    ) => void,
  ): grpc.ClientUnaryCall
  getExchangeRateForImmediateUsdSell(
    request: services_price_v1_price_service_pb.GetExchangeRateForImmediateUsdSellRequest,
    metadata: grpc.Metadata,
    options: Partial<grpc.CallOptions>,
    callback: (
      error: grpc.ServiceError | null,
      response: services_price_v1_price_service_pb.GetExchangeRateForImmediateUsdSellResponse,
    ) => void,
  ): grpc.ClientUnaryCall
  getExchangeRateForFutureUsdBuy(
    request: services_price_v1_price_service_pb.GetExchangeRateForFutureUsdBuyRequest,
    callback: (
      error: grpc.ServiceError | null,
      response: services_price_v1_price_service_pb.GetExchangeRateForFutureUsdBuyResponse,
    ) => void,
  ): grpc.ClientUnaryCall
  getExchangeRateForFutureUsdBuy(
    request: services_price_v1_price_service_pb.GetExchangeRateForFutureUsdBuyRequest,
    metadata: grpc.Metadata,
    callback: (
      error: grpc.ServiceError | null,
      response: services_price_v1_price_service_pb.GetExchangeRateForFutureUsdBuyResponse,
    ) => void,
  ): grpc.ClientUnaryCall
  getExchangeRateForFutureUsdBuy(
    request: services_price_v1_price_service_pb.GetExchangeRateForFutureUsdBuyRequest,
    metadata: grpc.Metadata,
    options: Partial<grpc.CallOptions>,
    callback: (
      error: grpc.ServiceError | null,
      response: services_price_v1_price_service_pb.GetExchangeRateForFutureUsdBuyResponse,
    ) => void,
  ): grpc.ClientUnaryCall
  getExchangeRateForFutureUsdSell(
    request: services_price_v1_price_service_pb.GetExchangeRateForFutureUsdSellRequest,
    callback: (
      error: grpc.ServiceError | null,
      response: services_price_v1_price_service_pb.GetExchangeRateForFutureUsdSellResponse,
    ) => void,
  ): grpc.ClientUnaryCall
  getExchangeRateForFutureUsdSell(
    request: services_price_v1_price_service_pb.GetExchangeRateForFutureUsdSellRequest,
    metadata: grpc.Metadata,
    callback: (
      error: grpc.ServiceError | null,
      response: services_price_v1_price_service_pb.GetExchangeRateForFutureUsdSellResponse,
    ) => void,
  ): grpc.ClientUnaryCall
  getExchangeRateForFutureUsdSell(
    request: services_price_v1_price_service_pb.GetExchangeRateForFutureUsdSellRequest,
    metadata: grpc.Metadata,
    options: Partial<grpc.CallOptions>,
    callback: (
      error: grpc.ServiceError | null,
      response: services_price_v1_price_service_pb.GetExchangeRateForFutureUsdSellResponse,
    ) => void,
  ): grpc.ClientUnaryCall
}

export class PriceServiceClient extends grpc.Client implements IPriceServiceClient {
  constructor(
    address: string,
    credentials: grpc.ChannelCredentials,
    options?: Partial<grpc.ClientOptions>,
  )
  public getExchangeRateForImmediateUsdBuy(
    request: services_price_v1_price_service_pb.GetExchangeRateForImmediateUsdBuyRequest,
    callback: (
      error: grpc.ServiceError | null,
      response: services_price_v1_price_service_pb.GetExchangeRateForImmediateUsdBuyResponse,
    ) => void,
  ): grpc.ClientUnaryCall
  public getExchangeRateForImmediateUsdBuy(
    request: services_price_v1_price_service_pb.GetExchangeRateForImmediateUsdBuyRequest,
    metadata: grpc.Metadata,
    callback: (
      error: grpc.ServiceError | null,
      response: services_price_v1_price_service_pb.GetExchangeRateForImmediateUsdBuyResponse,
    ) => void,
  ): grpc.ClientUnaryCall
  public getExchangeRateForImmediateUsdBuy(
    request: services_price_v1_price_service_pb.GetExchangeRateForImmediateUsdBuyRequest,
    metadata: grpc.Metadata,
    options: Partial<grpc.CallOptions>,
    callback: (
      error: grpc.ServiceError | null,
      response: services_price_v1_price_service_pb.GetExchangeRateForImmediateUsdBuyResponse,
    ) => void,
  ): grpc.ClientUnaryCall
  public getExchangeRateForImmediateUsdSell(
    request: services_price_v1_price_service_pb.GetExchangeRateForImmediateUsdSellRequest,
    callback: (
      error: grpc.ServiceError | null,
      response: services_price_v1_price_service_pb.GetExchangeRateForImmediateUsdSellResponse,
    ) => void,
  ): grpc.ClientUnaryCall
  public getExchangeRateForImmediateUsdSell(
    request: services_price_v1_price_service_pb.GetExchangeRateForImmediateUsdSellRequest,
    metadata: grpc.Metadata,
    callback: (
      error: grpc.ServiceError | null,
      response: services_price_v1_price_service_pb.GetExchangeRateForImmediateUsdSellResponse,
    ) => void,
  ): grpc.ClientUnaryCall
  public getExchangeRateForImmediateUsdSell(
    request: services_price_v1_price_service_pb.GetExchangeRateForImmediateUsdSellRequest,
    metadata: grpc.Metadata,
    options: Partial<grpc.CallOptions>,
    callback: (
      error: grpc.ServiceError | null,
      response: services_price_v1_price_service_pb.GetExchangeRateForImmediateUsdSellResponse,
    ) => void,
  ): grpc.ClientUnaryCall
  public getExchangeRateForFutureUsdBuy(
    request: services_price_v1_price_service_pb.GetExchangeRateForFutureUsdBuyRequest,
    callback: (
      error: grpc.ServiceError | null,
      response: services_price_v1_price_service_pb.GetExchangeRateForFutureUsdBuyResponse,
    ) => void,
  ): grpc.ClientUnaryCall
  public getExchangeRateForFutureUsdBuy(
    request: services_price_v1_price_service_pb.GetExchangeRateForFutureUsdBuyRequest,
    metadata: grpc.Metadata,
    callback: (
      error: grpc.ServiceError | null,
      response: services_price_v1_price_service_pb.GetExchangeRateForFutureUsdBuyResponse,
    ) => void,
  ): grpc.ClientUnaryCall
  public getExchangeRateForFutureUsdBuy(
    request: services_price_v1_price_service_pb.GetExchangeRateForFutureUsdBuyRequest,
    metadata: grpc.Metadata,
    options: Partial<grpc.CallOptions>,
    callback: (
      error: grpc.ServiceError | null,
      response: services_price_v1_price_service_pb.GetExchangeRateForFutureUsdBuyResponse,
    ) => void,
  ): grpc.ClientUnaryCall
  public getExchangeRateForFutureUsdSell(
    request: services_price_v1_price_service_pb.GetExchangeRateForFutureUsdSellRequest,
    callback: (
      error: grpc.ServiceError | null,
      response: services_price_v1_price_service_pb.GetExchangeRateForFutureUsdSellResponse,
    ) => void,
  ): grpc.ClientUnaryCall
  public getExchangeRateForFutureUsdSell(
    request: services_price_v1_price_service_pb.GetExchangeRateForFutureUsdSellRequest,
    metadata: grpc.Metadata,
    callback: (
      error: grpc.ServiceError | null,
      response: services_price_v1_price_service_pb.GetExchangeRateForFutureUsdSellResponse,
    ) => void,
  ): grpc.ClientUnaryCall
  public getExchangeRateForFutureUsdSell(
    request: services_price_v1_price_service_pb.GetExchangeRateForFutureUsdSellRequest,
    metadata: grpc.Metadata,
    options: Partial<grpc.CallOptions>,
    callback: (
      error: grpc.ServiceError | null,
      response: services_price_v1_price_service_pb.GetExchangeRateForFutureUsdSellResponse,
    ) => void,
  ): grpc.ClientUnaryCall
}
