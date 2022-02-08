// package: services.price.v1
// file: services/price/v1/price_service.proto

/* tslint:disable */
/* eslint-disable */

import * as grpc from "@grpc/grpc-js"
import * as services_price_v1_price_service_pb from "../../../services/price/v1/price_service_pb"

interface IPriceServiceService
  extends grpc.ServiceDefinition<grpc.UntypedServiceImplementation> {
  getExchangeRateForImmediateUsdBuy: IPriceServiceService_IGetExchangeRateForImmediateUsdBuy
  getExchangeRateForImmediateUsdBuyFromCents: IPriceServiceService_IGetExchangeRateForImmediateUsdBuyFromCents
  getExchangeRateForImmediateUsdSell: IPriceServiceService_IGetExchangeRateForImmediateUsdSell
  getExchangeRateForImmediateUsdSellFromSatoshis: IPriceServiceService_IGetExchangeRateForImmediateUsdSellFromSatoshis
  getQuoteRateForFutureUsdBuy: IPriceServiceService_IGetQuoteRateForFutureUsdBuy
  getQuoteRateForFutureUsdSell: IPriceServiceService_IGetQuoteRateForFutureUsdSell
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
interface IPriceServiceService_IGetExchangeRateForImmediateUsdBuyFromCents
  extends grpc.MethodDefinition<
    services_price_v1_price_service_pb.GetExchangeRateForImmediateUsdBuyFromCentsRequest,
    services_price_v1_price_service_pb.GetExchangeRateForImmediateUsdBuyFromCentsResponse
  > {
  path: "/services.price.v1.PriceService/GetExchangeRateForImmediateUsdBuyFromCents"
  requestStream: false
  responseStream: false
  requestSerialize: grpc.serialize<services_price_v1_price_service_pb.GetExchangeRateForImmediateUsdBuyFromCentsRequest>
  requestDeserialize: grpc.deserialize<services_price_v1_price_service_pb.GetExchangeRateForImmediateUsdBuyFromCentsRequest>
  responseSerialize: grpc.serialize<services_price_v1_price_service_pb.GetExchangeRateForImmediateUsdBuyFromCentsResponse>
  responseDeserialize: grpc.deserialize<services_price_v1_price_service_pb.GetExchangeRateForImmediateUsdBuyFromCentsResponse>
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
interface IPriceServiceService_IGetExchangeRateForImmediateUsdSellFromSatoshis
  extends grpc.MethodDefinition<
    services_price_v1_price_service_pb.GetExchangeRateForImmediateUsdSellFromSatoshisRequest,
    services_price_v1_price_service_pb.GetExchangeRateForImmediateUsdSellFromSatoshisResponse
  > {
  path: "/services.price.v1.PriceService/GetExchangeRateForImmediateUsdSellFromSatoshis"
  requestStream: false
  responseStream: false
  requestSerialize: grpc.serialize<services_price_v1_price_service_pb.GetExchangeRateForImmediateUsdSellFromSatoshisRequest>
  requestDeserialize: grpc.deserialize<services_price_v1_price_service_pb.GetExchangeRateForImmediateUsdSellFromSatoshisRequest>
  responseSerialize: grpc.serialize<services_price_v1_price_service_pb.GetExchangeRateForImmediateUsdSellFromSatoshisResponse>
  responseDeserialize: grpc.deserialize<services_price_v1_price_service_pb.GetExchangeRateForImmediateUsdSellFromSatoshisResponse>
}
interface IPriceServiceService_IGetQuoteRateForFutureUsdBuy
  extends grpc.MethodDefinition<
    services_price_v1_price_service_pb.GetQuoteRateForFutureUsdBuyRequest,
    services_price_v1_price_service_pb.GetQuoteRateForFutureUsdBuyResponse
  > {
  path: "/services.price.v1.PriceService/GetQuoteRateForFutureUsdBuy"
  requestStream: false
  responseStream: false
  requestSerialize: grpc.serialize<services_price_v1_price_service_pb.GetQuoteRateForFutureUsdBuyRequest>
  requestDeserialize: grpc.deserialize<services_price_v1_price_service_pb.GetQuoteRateForFutureUsdBuyRequest>
  responseSerialize: grpc.serialize<services_price_v1_price_service_pb.GetQuoteRateForFutureUsdBuyResponse>
  responseDeserialize: grpc.deserialize<services_price_v1_price_service_pb.GetQuoteRateForFutureUsdBuyResponse>
}
interface IPriceServiceService_IGetQuoteRateForFutureUsdSell
  extends grpc.MethodDefinition<
    services_price_v1_price_service_pb.GetQuoteRateForFutureUsdSellRequest,
    services_price_v1_price_service_pb.GetQuoteRateForFutureUsdSellResponse
  > {
  path: "/services.price.v1.PriceService/GetQuoteRateForFutureUsdSell"
  requestStream: false
  responseStream: false
  requestSerialize: grpc.serialize<services_price_v1_price_service_pb.GetQuoteRateForFutureUsdSellRequest>
  requestDeserialize: grpc.deserialize<services_price_v1_price_service_pb.GetQuoteRateForFutureUsdSellRequest>
  responseSerialize: grpc.serialize<services_price_v1_price_service_pb.GetQuoteRateForFutureUsdSellResponse>
  responseDeserialize: grpc.deserialize<services_price_v1_price_service_pb.GetQuoteRateForFutureUsdSellResponse>
}

export const PriceServiceService: IPriceServiceService

export interface IPriceServiceServer extends grpc.UntypedServiceImplementation {
  getExchangeRateForImmediateUsdBuy: grpc.handleUnaryCall<
    services_price_v1_price_service_pb.GetExchangeRateForImmediateUsdBuyRequest,
    services_price_v1_price_service_pb.GetExchangeRateForImmediateUsdBuyResponse
  >
  getExchangeRateForImmediateUsdBuyFromCents: grpc.handleUnaryCall<
    services_price_v1_price_service_pb.GetExchangeRateForImmediateUsdBuyFromCentsRequest,
    services_price_v1_price_service_pb.GetExchangeRateForImmediateUsdBuyFromCentsResponse
  >
  getExchangeRateForImmediateUsdSell: grpc.handleUnaryCall<
    services_price_v1_price_service_pb.GetExchangeRateForImmediateUsdSellRequest,
    services_price_v1_price_service_pb.GetExchangeRateForImmediateUsdSellResponse
  >
  getExchangeRateForImmediateUsdSellFromSatoshis: grpc.handleUnaryCall<
    services_price_v1_price_service_pb.GetExchangeRateForImmediateUsdSellFromSatoshisRequest,
    services_price_v1_price_service_pb.GetExchangeRateForImmediateUsdSellFromSatoshisResponse
  >
  getQuoteRateForFutureUsdBuy: grpc.handleUnaryCall<
    services_price_v1_price_service_pb.GetQuoteRateForFutureUsdBuyRequest,
    services_price_v1_price_service_pb.GetQuoteRateForFutureUsdBuyResponse
  >
  getQuoteRateForFutureUsdSell: grpc.handleUnaryCall<
    services_price_v1_price_service_pb.GetQuoteRateForFutureUsdSellRequest,
    services_price_v1_price_service_pb.GetQuoteRateForFutureUsdSellResponse
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
  getExchangeRateForImmediateUsdBuyFromCents(
    request: services_price_v1_price_service_pb.GetExchangeRateForImmediateUsdBuyFromCentsRequest,
    callback: (
      error: grpc.ServiceError | null,
      response: services_price_v1_price_service_pb.GetExchangeRateForImmediateUsdBuyFromCentsResponse,
    ) => void,
  ): grpc.ClientUnaryCall
  getExchangeRateForImmediateUsdBuyFromCents(
    request: services_price_v1_price_service_pb.GetExchangeRateForImmediateUsdBuyFromCentsRequest,
    metadata: grpc.Metadata,
    callback: (
      error: grpc.ServiceError | null,
      response: services_price_v1_price_service_pb.GetExchangeRateForImmediateUsdBuyFromCentsResponse,
    ) => void,
  ): grpc.ClientUnaryCall
  getExchangeRateForImmediateUsdBuyFromCents(
    request: services_price_v1_price_service_pb.GetExchangeRateForImmediateUsdBuyFromCentsRequest,
    metadata: grpc.Metadata,
    options: Partial<grpc.CallOptions>,
    callback: (
      error: grpc.ServiceError | null,
      response: services_price_v1_price_service_pb.GetExchangeRateForImmediateUsdBuyFromCentsResponse,
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
  getExchangeRateForImmediateUsdSellFromSatoshis(
    request: services_price_v1_price_service_pb.GetExchangeRateForImmediateUsdSellFromSatoshisRequest,
    callback: (
      error: grpc.ServiceError | null,
      response: services_price_v1_price_service_pb.GetExchangeRateForImmediateUsdSellFromSatoshisResponse,
    ) => void,
  ): grpc.ClientUnaryCall
  getExchangeRateForImmediateUsdSellFromSatoshis(
    request: services_price_v1_price_service_pb.GetExchangeRateForImmediateUsdSellFromSatoshisRequest,
    metadata: grpc.Metadata,
    callback: (
      error: grpc.ServiceError | null,
      response: services_price_v1_price_service_pb.GetExchangeRateForImmediateUsdSellFromSatoshisResponse,
    ) => void,
  ): grpc.ClientUnaryCall
  getExchangeRateForImmediateUsdSellFromSatoshis(
    request: services_price_v1_price_service_pb.GetExchangeRateForImmediateUsdSellFromSatoshisRequest,
    metadata: grpc.Metadata,
    options: Partial<grpc.CallOptions>,
    callback: (
      error: grpc.ServiceError | null,
      response: services_price_v1_price_service_pb.GetExchangeRateForImmediateUsdSellFromSatoshisResponse,
    ) => void,
  ): grpc.ClientUnaryCall
  getQuoteRateForFutureUsdBuy(
    request: services_price_v1_price_service_pb.GetQuoteRateForFutureUsdBuyRequest,
    callback: (
      error: grpc.ServiceError | null,
      response: services_price_v1_price_service_pb.GetQuoteRateForFutureUsdBuyResponse,
    ) => void,
  ): grpc.ClientUnaryCall
  getQuoteRateForFutureUsdBuy(
    request: services_price_v1_price_service_pb.GetQuoteRateForFutureUsdBuyRequest,
    metadata: grpc.Metadata,
    callback: (
      error: grpc.ServiceError | null,
      response: services_price_v1_price_service_pb.GetQuoteRateForFutureUsdBuyResponse,
    ) => void,
  ): grpc.ClientUnaryCall
  getQuoteRateForFutureUsdBuy(
    request: services_price_v1_price_service_pb.GetQuoteRateForFutureUsdBuyRequest,
    metadata: grpc.Metadata,
    options: Partial<grpc.CallOptions>,
    callback: (
      error: grpc.ServiceError | null,
      response: services_price_v1_price_service_pb.GetQuoteRateForFutureUsdBuyResponse,
    ) => void,
  ): grpc.ClientUnaryCall
  getQuoteRateForFutureUsdSell(
    request: services_price_v1_price_service_pb.GetQuoteRateForFutureUsdSellRequest,
    callback: (
      error: grpc.ServiceError | null,
      response: services_price_v1_price_service_pb.GetQuoteRateForFutureUsdSellResponse,
    ) => void,
  ): grpc.ClientUnaryCall
  getQuoteRateForFutureUsdSell(
    request: services_price_v1_price_service_pb.GetQuoteRateForFutureUsdSellRequest,
    metadata: grpc.Metadata,
    callback: (
      error: grpc.ServiceError | null,
      response: services_price_v1_price_service_pb.GetQuoteRateForFutureUsdSellResponse,
    ) => void,
  ): grpc.ClientUnaryCall
  getQuoteRateForFutureUsdSell(
    request: services_price_v1_price_service_pb.GetQuoteRateForFutureUsdSellRequest,
    metadata: grpc.Metadata,
    options: Partial<grpc.CallOptions>,
    callback: (
      error: grpc.ServiceError | null,
      response: services_price_v1_price_service_pb.GetQuoteRateForFutureUsdSellResponse,
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
  public getExchangeRateForImmediateUsdBuyFromCents(
    request: services_price_v1_price_service_pb.GetExchangeRateForImmediateUsdBuyFromCentsRequest,
    callback: (
      error: grpc.ServiceError | null,
      response: services_price_v1_price_service_pb.GetExchangeRateForImmediateUsdBuyFromCentsResponse,
    ) => void,
  ): grpc.ClientUnaryCall
  public getExchangeRateForImmediateUsdBuyFromCents(
    request: services_price_v1_price_service_pb.GetExchangeRateForImmediateUsdBuyFromCentsRequest,
    metadata: grpc.Metadata,
    callback: (
      error: grpc.ServiceError | null,
      response: services_price_v1_price_service_pb.GetExchangeRateForImmediateUsdBuyFromCentsResponse,
    ) => void,
  ): grpc.ClientUnaryCall
  public getExchangeRateForImmediateUsdBuyFromCents(
    request: services_price_v1_price_service_pb.GetExchangeRateForImmediateUsdBuyFromCentsRequest,
    metadata: grpc.Metadata,
    options: Partial<grpc.CallOptions>,
    callback: (
      error: grpc.ServiceError | null,
      response: services_price_v1_price_service_pb.GetExchangeRateForImmediateUsdBuyFromCentsResponse,
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
  public getExchangeRateForImmediateUsdSellFromSatoshis(
    request: services_price_v1_price_service_pb.GetExchangeRateForImmediateUsdSellFromSatoshisRequest,
    callback: (
      error: grpc.ServiceError | null,
      response: services_price_v1_price_service_pb.GetExchangeRateForImmediateUsdSellFromSatoshisResponse,
    ) => void,
  ): grpc.ClientUnaryCall
  public getExchangeRateForImmediateUsdSellFromSatoshis(
    request: services_price_v1_price_service_pb.GetExchangeRateForImmediateUsdSellFromSatoshisRequest,
    metadata: grpc.Metadata,
    callback: (
      error: grpc.ServiceError | null,
      response: services_price_v1_price_service_pb.GetExchangeRateForImmediateUsdSellFromSatoshisResponse,
    ) => void,
  ): grpc.ClientUnaryCall
  public getExchangeRateForImmediateUsdSellFromSatoshis(
    request: services_price_v1_price_service_pb.GetExchangeRateForImmediateUsdSellFromSatoshisRequest,
    metadata: grpc.Metadata,
    options: Partial<grpc.CallOptions>,
    callback: (
      error: grpc.ServiceError | null,
      response: services_price_v1_price_service_pb.GetExchangeRateForImmediateUsdSellFromSatoshisResponse,
    ) => void,
  ): grpc.ClientUnaryCall
  public getQuoteRateForFutureUsdBuy(
    request: services_price_v1_price_service_pb.GetQuoteRateForFutureUsdBuyRequest,
    callback: (
      error: grpc.ServiceError | null,
      response: services_price_v1_price_service_pb.GetQuoteRateForFutureUsdBuyResponse,
    ) => void,
  ): grpc.ClientUnaryCall
  public getQuoteRateForFutureUsdBuy(
    request: services_price_v1_price_service_pb.GetQuoteRateForFutureUsdBuyRequest,
    metadata: grpc.Metadata,
    callback: (
      error: grpc.ServiceError | null,
      response: services_price_v1_price_service_pb.GetQuoteRateForFutureUsdBuyResponse,
    ) => void,
  ): grpc.ClientUnaryCall
  public getQuoteRateForFutureUsdBuy(
    request: services_price_v1_price_service_pb.GetQuoteRateForFutureUsdBuyRequest,
    metadata: grpc.Metadata,
    options: Partial<grpc.CallOptions>,
    callback: (
      error: grpc.ServiceError | null,
      response: services_price_v1_price_service_pb.GetQuoteRateForFutureUsdBuyResponse,
    ) => void,
  ): grpc.ClientUnaryCall
  public getQuoteRateForFutureUsdSell(
    request: services_price_v1_price_service_pb.GetQuoteRateForFutureUsdSellRequest,
    callback: (
      error: grpc.ServiceError | null,
      response: services_price_v1_price_service_pb.GetQuoteRateForFutureUsdSellResponse,
    ) => void,
  ): grpc.ClientUnaryCall
  public getQuoteRateForFutureUsdSell(
    request: services_price_v1_price_service_pb.GetQuoteRateForFutureUsdSellRequest,
    metadata: grpc.Metadata,
    callback: (
      error: grpc.ServiceError | null,
      response: services_price_v1_price_service_pb.GetQuoteRateForFutureUsdSellResponse,
    ) => void,
  ): grpc.ClientUnaryCall
  public getQuoteRateForFutureUsdSell(
    request: services_price_v1_price_service_pb.GetQuoteRateForFutureUsdSellRequest,
    metadata: grpc.Metadata,
    options: Partial<grpc.CallOptions>,
    callback: (
      error: grpc.ServiceError | null,
      response: services_price_v1_price_service_pb.GetQuoteRateForFutureUsdSellResponse,
    ) => void,
  ): grpc.ClientUnaryCall
}
