// GENERATED CODE -- DO NOT EDIT!

"use strict"
var grpc = require("@grpc/grpc-js")
var services_price_v1_price_service_pb = require("../../../services/price/v1/price_service_pb.js")

function serialize_services_price_v1_GetExchangeRateForImmediateUsdBuyFromCentsRequest(
  arg,
) {
  if (
    !(
      arg instanceof
      services_price_v1_price_service_pb.GetExchangeRateForImmediateUsdBuyFromCentsRequest
    )
  ) {
    throw new Error(
      "Expected argument of type services.price.v1.GetExchangeRateForImmediateUsdBuyFromCentsRequest",
    )
  }
  return Buffer.from(arg.serializeBinary())
}

function deserialize_services_price_v1_GetExchangeRateForImmediateUsdBuyFromCentsRequest(
  buffer_arg,
) {
  return services_price_v1_price_service_pb.GetExchangeRateForImmediateUsdBuyFromCentsRequest.deserializeBinary(
    new Uint8Array(buffer_arg),
  )
}

function serialize_services_price_v1_GetExchangeRateForImmediateUsdBuyFromCentsResponse(
  arg,
) {
  if (
    !(
      arg instanceof
      services_price_v1_price_service_pb.GetExchangeRateForImmediateUsdBuyFromCentsResponse
    )
  ) {
    throw new Error(
      "Expected argument of type services.price.v1.GetExchangeRateForImmediateUsdBuyFromCentsResponse",
    )
  }
  return Buffer.from(arg.serializeBinary())
}

function deserialize_services_price_v1_GetExchangeRateForImmediateUsdBuyFromCentsResponse(
  buffer_arg,
) {
  return services_price_v1_price_service_pb.GetExchangeRateForImmediateUsdBuyFromCentsResponse.deserializeBinary(
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

function serialize_services_price_v1_GetExchangeRateForImmediateUsdSellFromSatoshisRequest(
  arg,
) {
  if (
    !(
      arg instanceof
      services_price_v1_price_service_pb.GetExchangeRateForImmediateUsdSellFromSatoshisRequest
    )
  ) {
    throw new Error(
      "Expected argument of type services.price.v1.GetExchangeRateForImmediateUsdSellFromSatoshisRequest",
    )
  }
  return Buffer.from(arg.serializeBinary())
}

function deserialize_services_price_v1_GetExchangeRateForImmediateUsdSellFromSatoshisRequest(
  buffer_arg,
) {
  return services_price_v1_price_service_pb.GetExchangeRateForImmediateUsdSellFromSatoshisRequest.deserializeBinary(
    new Uint8Array(buffer_arg),
  )
}

function serialize_services_price_v1_GetExchangeRateForImmediateUsdSellFromSatoshisResponse(
  arg,
) {
  if (
    !(
      arg instanceof
      services_price_v1_price_service_pb.GetExchangeRateForImmediateUsdSellFromSatoshisResponse
    )
  ) {
    throw new Error(
      "Expected argument of type services.price.v1.GetExchangeRateForImmediateUsdSellFromSatoshisResponse",
    )
  }
  return Buffer.from(arg.serializeBinary())
}

function deserialize_services_price_v1_GetExchangeRateForImmediateUsdSellFromSatoshisResponse(
  buffer_arg,
) {
  return services_price_v1_price_service_pb.GetExchangeRateForImmediateUsdSellFromSatoshisResponse.deserializeBinary(
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

function serialize_services_price_v1_GetQuoteRateForFutureUsdBuyRequest(arg) {
  if (
    !(
      arg instanceof services_price_v1_price_service_pb.GetQuoteRateForFutureUsdBuyRequest
    )
  ) {
    throw new Error(
      "Expected argument of type services.price.v1.GetQuoteRateForFutureUsdBuyRequest",
    )
  }
  return Buffer.from(arg.serializeBinary())
}

function deserialize_services_price_v1_GetQuoteRateForFutureUsdBuyRequest(buffer_arg) {
  return services_price_v1_price_service_pb.GetQuoteRateForFutureUsdBuyRequest.deserializeBinary(
    new Uint8Array(buffer_arg),
  )
}

function serialize_services_price_v1_GetQuoteRateForFutureUsdBuyResponse(arg) {
  if (
    !(
      arg instanceof
      services_price_v1_price_service_pb.GetQuoteRateForFutureUsdBuyResponse
    )
  ) {
    throw new Error(
      "Expected argument of type services.price.v1.GetQuoteRateForFutureUsdBuyResponse",
    )
  }
  return Buffer.from(arg.serializeBinary())
}

function deserialize_services_price_v1_GetQuoteRateForFutureUsdBuyResponse(buffer_arg) {
  return services_price_v1_price_service_pb.GetQuoteRateForFutureUsdBuyResponse.deserializeBinary(
    new Uint8Array(buffer_arg),
  )
}

function serialize_services_price_v1_GetQuoteRateForFutureUsdSellRequest(arg) {
  if (
    !(
      arg instanceof
      services_price_v1_price_service_pb.GetQuoteRateForFutureUsdSellRequest
    )
  ) {
    throw new Error(
      "Expected argument of type services.price.v1.GetQuoteRateForFutureUsdSellRequest",
    )
  }
  return Buffer.from(arg.serializeBinary())
}

function deserialize_services_price_v1_GetQuoteRateForFutureUsdSellRequest(buffer_arg) {
  return services_price_v1_price_service_pb.GetQuoteRateForFutureUsdSellRequest.deserializeBinary(
    new Uint8Array(buffer_arg),
  )
}

function serialize_services_price_v1_GetQuoteRateForFutureUsdSellResponse(arg) {
  if (
    !(
      arg instanceof
      services_price_v1_price_service_pb.GetQuoteRateForFutureUsdSellResponse
    )
  ) {
    throw new Error(
      "Expected argument of type services.price.v1.GetQuoteRateForFutureUsdSellResponse",
    )
  }
  return Buffer.from(arg.serializeBinary())
}

function deserialize_services_price_v1_GetQuoteRateForFutureUsdSellResponse(buffer_arg) {
  return services_price_v1_price_service_pb.GetQuoteRateForFutureUsdSellResponse.deserializeBinary(
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
  getExchangeRateForImmediateUsdBuyFromCents: {
    path: "/services.price.v1.PriceService/GetExchangeRateForImmediateUsdBuyFromCents",
    requestStream: false,
    responseStream: false,
    requestType:
      services_price_v1_price_service_pb.GetExchangeRateForImmediateUsdBuyFromCentsRequest,
    responseType:
      services_price_v1_price_service_pb.GetExchangeRateForImmediateUsdBuyFromCentsResponse,
    requestSerialize:
      serialize_services_price_v1_GetExchangeRateForImmediateUsdBuyFromCentsRequest,
    requestDeserialize:
      deserialize_services_price_v1_GetExchangeRateForImmediateUsdBuyFromCentsRequest,
    responseSerialize:
      serialize_services_price_v1_GetExchangeRateForImmediateUsdBuyFromCentsResponse,
    responseDeserialize:
      deserialize_services_price_v1_GetExchangeRateForImmediateUsdBuyFromCentsResponse,
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
  getExchangeRateForImmediateUsdSellFromSatoshis: {
    path: "/services.price.v1.PriceService/GetExchangeRateForImmediateUsdSellFromSatoshis",
    requestStream: false,
    responseStream: false,
    requestType:
      services_price_v1_price_service_pb.GetExchangeRateForImmediateUsdSellFromSatoshisRequest,
    responseType:
      services_price_v1_price_service_pb.GetExchangeRateForImmediateUsdSellFromSatoshisResponse,
    requestSerialize:
      serialize_services_price_v1_GetExchangeRateForImmediateUsdSellFromSatoshisRequest,
    requestDeserialize:
      deserialize_services_price_v1_GetExchangeRateForImmediateUsdSellFromSatoshisRequest,
    responseSerialize:
      serialize_services_price_v1_GetExchangeRateForImmediateUsdSellFromSatoshisResponse,
    responseDeserialize:
      deserialize_services_price_v1_GetExchangeRateForImmediateUsdSellFromSatoshisResponse,
  },
  getQuoteRateForFutureUsdBuy: {
    path: "/services.price.v1.PriceService/GetQuoteRateForFutureUsdBuy",
    requestStream: false,
    responseStream: false,
    requestType: services_price_v1_price_service_pb.GetQuoteRateForFutureUsdBuyRequest,
    responseType: services_price_v1_price_service_pb.GetQuoteRateForFutureUsdBuyResponse,
    requestSerialize: serialize_services_price_v1_GetQuoteRateForFutureUsdBuyRequest,
    requestDeserialize: deserialize_services_price_v1_GetQuoteRateForFutureUsdBuyRequest,
    responseSerialize: serialize_services_price_v1_GetQuoteRateForFutureUsdBuyResponse,
    responseDeserialize:
      deserialize_services_price_v1_GetQuoteRateForFutureUsdBuyResponse,
  },
  getQuoteRateForFutureUsdSell: {
    path: "/services.price.v1.PriceService/GetQuoteRateForFutureUsdSell",
    requestStream: false,
    responseStream: false,
    requestType: services_price_v1_price_service_pb.GetQuoteRateForFutureUsdSellRequest,
    responseType: services_price_v1_price_service_pb.GetQuoteRateForFutureUsdSellResponse,
    requestSerialize: serialize_services_price_v1_GetQuoteRateForFutureUsdSellRequest,
    requestDeserialize: deserialize_services_price_v1_GetQuoteRateForFutureUsdSellRequest,
    responseSerialize: serialize_services_price_v1_GetQuoteRateForFutureUsdSellResponse,
    responseDeserialize:
      deserialize_services_price_v1_GetQuoteRateForFutureUsdSellResponse,
  },
})

exports.PriceServiceClient = grpc.makeGenericClientConstructor(PriceServiceService)
