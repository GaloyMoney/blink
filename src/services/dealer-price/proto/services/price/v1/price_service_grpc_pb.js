// GENERATED CODE -- DO NOT EDIT!

"use strict"
var grpc = require("@grpc/grpc-js")
var services_price_v1_price_service_pb = require("../../../services/price/v1/price_service_pb.js")

function serialize_services_price_v1_GetExchangeRateForFutureUsdBuyRequest(arg) {
  if (
    !(
      arg instanceof
      services_price_v1_price_service_pb.GetExchangeRateForFutureUsdBuyRequest
    )
  ) {
    throw new Error(
      "Expected argument of type services.price.v1.GetExchangeRateForFutureUsdBuyRequest",
    )
  }
  return Buffer.from(arg.serializeBinary())
}

function deserialize_services_price_v1_GetExchangeRateForFutureUsdBuyRequest(buffer_arg) {
  return services_price_v1_price_service_pb.GetExchangeRateForFutureUsdBuyRequest.deserializeBinary(
    new Uint8Array(buffer_arg),
  )
}

function serialize_services_price_v1_GetExchangeRateForFutureUsdBuyResponse(arg) {
  if (
    !(
      arg instanceof
      services_price_v1_price_service_pb.GetExchangeRateForFutureUsdBuyResponse
    )
  ) {
    throw new Error(
      "Expected argument of type services.price.v1.GetExchangeRateForFutureUsdBuyResponse",
    )
  }
  return Buffer.from(arg.serializeBinary())
}

function deserialize_services_price_v1_GetExchangeRateForFutureUsdBuyResponse(
  buffer_arg,
) {
  return services_price_v1_price_service_pb.GetExchangeRateForFutureUsdBuyResponse.deserializeBinary(
    new Uint8Array(buffer_arg),
  )
}

function serialize_services_price_v1_GetExchangeRateForFutureUsdSellRequest(arg) {
  if (
    !(
      arg instanceof
      services_price_v1_price_service_pb.GetExchangeRateForFutureUsdSellRequest
    )
  ) {
    throw new Error(
      "Expected argument of type services.price.v1.GetExchangeRateForFutureUsdSellRequest",
    )
  }
  return Buffer.from(arg.serializeBinary())
}

function deserialize_services_price_v1_GetExchangeRateForFutureUsdSellRequest(
  buffer_arg,
) {
  return services_price_v1_price_service_pb.GetExchangeRateForFutureUsdSellRequest.deserializeBinary(
    new Uint8Array(buffer_arg),
  )
}

function serialize_services_price_v1_GetExchangeRateForFutureUsdSellResponse(arg) {
  if (
    !(
      arg instanceof
      services_price_v1_price_service_pb.GetExchangeRateForFutureUsdSellResponse
    )
  ) {
    throw new Error(
      "Expected argument of type services.price.v1.GetExchangeRateForFutureUsdSellResponse",
    )
  }
  return Buffer.from(arg.serializeBinary())
}

function deserialize_services_price_v1_GetExchangeRateForFutureUsdSellResponse(
  buffer_arg,
) {
  return services_price_v1_price_service_pb.GetExchangeRateForFutureUsdSellResponse.deserializeBinary(
    new Uint8Array(buffer_arg),
  )
}

function serialize_services_price_v1_GetExchangeRateForImmediateUsdBuyRequest(arg) {
  if (
    !(
      arg instanceof
      services_price_v1_price_service_pb.GetExchangeRateForImmediateUsdBuyRequest
    )
  ) {
    throw new Error(
      "Expected argument of type services.price.v1.GetExchangeRateForImmediateUsdBuyRequest",
    )
  }
  return Buffer.from(arg.serializeBinary())
}

function deserialize_services_price_v1_GetExchangeRateForImmediateUsdBuyRequest(
  buffer_arg,
) {
  return services_price_v1_price_service_pb.GetExchangeRateForImmediateUsdBuyRequest.deserializeBinary(
    new Uint8Array(buffer_arg),
  )
}

function serialize_services_price_v1_GetExchangeRateForImmediateUsdBuyResponse(arg) {
  if (
    !(
      arg instanceof
      services_price_v1_price_service_pb.GetExchangeRateForImmediateUsdBuyResponse
    )
  ) {
    throw new Error(
      "Expected argument of type services.price.v1.GetExchangeRateForImmediateUsdBuyResponse",
    )
  }
  return Buffer.from(arg.serializeBinary())
}

function deserialize_services_price_v1_GetExchangeRateForImmediateUsdBuyResponse(
  buffer_arg,
) {
  return services_price_v1_price_service_pb.GetExchangeRateForImmediateUsdBuyResponse.deserializeBinary(
    new Uint8Array(buffer_arg),
  )
}

function serialize_services_price_v1_GetExchangeRateForImmediateUsdSellRequest(arg) {
  if (
    !(
      arg instanceof
      services_price_v1_price_service_pb.GetExchangeRateForImmediateUsdSellRequest
    )
  ) {
    throw new Error(
      "Expected argument of type services.price.v1.GetExchangeRateForImmediateUsdSellRequest",
    )
  }
  return Buffer.from(arg.serializeBinary())
}

function deserialize_services_price_v1_GetExchangeRateForImmediateUsdSellRequest(
  buffer_arg,
) {
  return services_price_v1_price_service_pb.GetExchangeRateForImmediateUsdSellRequest.deserializeBinary(
    new Uint8Array(buffer_arg),
  )
}

function serialize_services_price_v1_GetExchangeRateForImmediateUsdSellResponse(arg) {
  if (
    !(
      arg instanceof
      services_price_v1_price_service_pb.GetExchangeRateForImmediateUsdSellResponse
    )
  ) {
    throw new Error(
      "Expected argument of type services.price.v1.GetExchangeRateForImmediateUsdSellResponse",
    )
  }
  return Buffer.from(arg.serializeBinary())
}

function deserialize_services_price_v1_GetExchangeRateForImmediateUsdSellResponse(
  buffer_arg,
) {
  return services_price_v1_price_service_pb.GetExchangeRateForImmediateUsdSellResponse.deserializeBinary(
    new Uint8Array(buffer_arg),
  )
}

var PriceServiceService = (exports.PriceServiceService = {
  getExchangeRateForImmediateUsdBuy: {
    path: "/services.price.v1.PriceService/GetExchangeRateForImmediateUsdBuy",
    requestStream: false,
    responseStream: false,
    requestType:
      services_price_v1_price_service_pb.GetExchangeRateForImmediateUsdBuyRequest,
    responseType:
      services_price_v1_price_service_pb.GetExchangeRateForImmediateUsdBuyResponse,
    requestSerialize:
      serialize_services_price_v1_GetExchangeRateForImmediateUsdBuyRequest,
    requestDeserialize:
      deserialize_services_price_v1_GetExchangeRateForImmediateUsdBuyRequest,
    responseSerialize:
      serialize_services_price_v1_GetExchangeRateForImmediateUsdBuyResponse,
    responseDeserialize:
      deserialize_services_price_v1_GetExchangeRateForImmediateUsdBuyResponse,
  },
  getExchangeRateForImmediateUsdSell: {
    path: "/services.price.v1.PriceService/GetExchangeRateForImmediateUsdSell",
    requestStream: false,
    responseStream: false,
    requestType:
      services_price_v1_price_service_pb.GetExchangeRateForImmediateUsdSellRequest,
    responseType:
      services_price_v1_price_service_pb.GetExchangeRateForImmediateUsdSellResponse,
    requestSerialize:
      serialize_services_price_v1_GetExchangeRateForImmediateUsdSellRequest,
    requestDeserialize:
      deserialize_services_price_v1_GetExchangeRateForImmediateUsdSellRequest,
    responseSerialize:
      serialize_services_price_v1_GetExchangeRateForImmediateUsdSellResponse,
    responseDeserialize:
      deserialize_services_price_v1_GetExchangeRateForImmediateUsdSellResponse,
  },
  getExchangeRateForFutureUsdBuy: {
    path: "/services.price.v1.PriceService/GetExchangeRateForFutureUsdBuy",
    requestStream: false,
    responseStream: false,
    requestType: services_price_v1_price_service_pb.GetExchangeRateForFutureUsdBuyRequest,
    responseType:
      services_price_v1_price_service_pb.GetExchangeRateForFutureUsdBuyResponse,
    requestSerialize: serialize_services_price_v1_GetExchangeRateForFutureUsdBuyRequest,
    requestDeserialize:
      deserialize_services_price_v1_GetExchangeRateForFutureUsdBuyRequest,
    responseSerialize: serialize_services_price_v1_GetExchangeRateForFutureUsdBuyResponse,
    responseDeserialize:
      deserialize_services_price_v1_GetExchangeRateForFutureUsdBuyResponse,
  },
  getExchangeRateForFutureUsdSell: {
    path: "/services.price.v1.PriceService/GetExchangeRateForFutureUsdSell",
    requestStream: false,
    responseStream: false,
    requestType:
      services_price_v1_price_service_pb.GetExchangeRateForFutureUsdSellRequest,
    responseType:
      services_price_v1_price_service_pb.GetExchangeRateForFutureUsdSellResponse,
    requestSerialize: serialize_services_price_v1_GetExchangeRateForFutureUsdSellRequest,
    requestDeserialize:
      deserialize_services_price_v1_GetExchangeRateForFutureUsdSellRequest,
    responseSerialize:
      serialize_services_price_v1_GetExchangeRateForFutureUsdSellResponse,
    responseDeserialize:
      deserialize_services_price_v1_GetExchangeRateForFutureUsdSellResponse,
  },
})

exports.PriceServiceClient = grpc.makeGenericClientConstructor(PriceServiceService)
