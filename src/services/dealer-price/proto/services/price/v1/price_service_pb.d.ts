// package: services.price.v1
// file: services/price/v1/price_service.proto

/* tslint:disable */
/* eslint-disable */

import * as jspb from "google-protobuf"

export class GetExchangeRateForImmediateUsdBuyRequest extends jspb.Message {
  getAmountInSatoshis(): number
  setAmountInSatoshis(value: number): GetExchangeRateForImmediateUsdBuyRequest

  serializeBinary(): Uint8Array
  toObject(includeInstance?: boolean): GetExchangeRateForImmediateUsdBuyRequest.AsObject
  static toObject(
    includeInstance: boolean,
    msg: GetExchangeRateForImmediateUsdBuyRequest,
  ): GetExchangeRateForImmediateUsdBuyRequest.AsObject
  static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> }
  static extensionsBinary: { [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message> }
  static serializeBinaryToWriter(
    message: GetExchangeRateForImmediateUsdBuyRequest,
    writer: jspb.BinaryWriter,
  ): void
  static deserializeBinary(bytes: Uint8Array): GetExchangeRateForImmediateUsdBuyRequest
  static deserializeBinaryFromReader(
    message: GetExchangeRateForImmediateUsdBuyRequest,
    reader: jspb.BinaryReader,
  ): GetExchangeRateForImmediateUsdBuyRequest
}

export namespace GetExchangeRateForImmediateUsdBuyRequest {
  export type AsObject = {
    amountInSatoshis: number
  }
}

export class GetExchangeRateForImmediateUsdSellRequest extends jspb.Message {
  getAmountInUsd(): number
  setAmountInUsd(value: number): GetExchangeRateForImmediateUsdSellRequest

  serializeBinary(): Uint8Array
  toObject(includeInstance?: boolean): GetExchangeRateForImmediateUsdSellRequest.AsObject
  static toObject(
    includeInstance: boolean,
    msg: GetExchangeRateForImmediateUsdSellRequest,
  ): GetExchangeRateForImmediateUsdSellRequest.AsObject
  static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> }
  static extensionsBinary: { [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message> }
  static serializeBinaryToWriter(
    message: GetExchangeRateForImmediateUsdSellRequest,
    writer: jspb.BinaryWriter,
  ): void
  static deserializeBinary(bytes: Uint8Array): GetExchangeRateForImmediateUsdSellRequest
  static deserializeBinaryFromReader(
    message: GetExchangeRateForImmediateUsdSellRequest,
    reader: jspb.BinaryReader,
  ): GetExchangeRateForImmediateUsdSellRequest
}

export namespace GetExchangeRateForImmediateUsdSellRequest {
  export type AsObject = {
    amountInUsd: number
  }
}

export class GetExchangeRateForFutureUsdBuyRequest extends jspb.Message {
  getAmountInSatoshis(): number
  setAmountInSatoshis(value: number): GetExchangeRateForFutureUsdBuyRequest
  getTimeInSeconds(): number
  setTimeInSeconds(value: number): GetExchangeRateForFutureUsdBuyRequest

  serializeBinary(): Uint8Array
  toObject(includeInstance?: boolean): GetExchangeRateForFutureUsdBuyRequest.AsObject
  static toObject(
    includeInstance: boolean,
    msg: GetExchangeRateForFutureUsdBuyRequest,
  ): GetExchangeRateForFutureUsdBuyRequest.AsObject
  static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> }
  static extensionsBinary: { [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message> }
  static serializeBinaryToWriter(
    message: GetExchangeRateForFutureUsdBuyRequest,
    writer: jspb.BinaryWriter,
  ): void
  static deserializeBinary(bytes: Uint8Array): GetExchangeRateForFutureUsdBuyRequest
  static deserializeBinaryFromReader(
    message: GetExchangeRateForFutureUsdBuyRequest,
    reader: jspb.BinaryReader,
  ): GetExchangeRateForFutureUsdBuyRequest
}

export namespace GetExchangeRateForFutureUsdBuyRequest {
  export type AsObject = {
    amountInSatoshis: number
    timeInSeconds: number
  }
}

export class GetExchangeRateForFutureUsdSellRequest extends jspb.Message {
  getAmountInUsd(): number
  setAmountInUsd(value: number): GetExchangeRateForFutureUsdSellRequest
  getTimeInSeconds(): number
  setTimeInSeconds(value: number): GetExchangeRateForFutureUsdSellRequest

  serializeBinary(): Uint8Array
  toObject(includeInstance?: boolean): GetExchangeRateForFutureUsdSellRequest.AsObject
  static toObject(
    includeInstance: boolean,
    msg: GetExchangeRateForFutureUsdSellRequest,
  ): GetExchangeRateForFutureUsdSellRequest.AsObject
  static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> }
  static extensionsBinary: { [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message> }
  static serializeBinaryToWriter(
    message: GetExchangeRateForFutureUsdSellRequest,
    writer: jspb.BinaryWriter,
  ): void
  static deserializeBinary(bytes: Uint8Array): GetExchangeRateForFutureUsdSellRequest
  static deserializeBinaryFromReader(
    message: GetExchangeRateForFutureUsdSellRequest,
    reader: jspb.BinaryReader,
  ): GetExchangeRateForFutureUsdSellRequest
}

export namespace GetExchangeRateForFutureUsdSellRequest {
  export type AsObject = {
    amountInUsd: number
    timeInSeconds: number
  }
}

export class GetExchangeRateForImmediateUsdBuyResponse extends jspb.Message {
  getPriceInUsd(): number
  setPriceInUsd(value: number): GetExchangeRateForImmediateUsdBuyResponse

  serializeBinary(): Uint8Array
  toObject(includeInstance?: boolean): GetExchangeRateForImmediateUsdBuyResponse.AsObject
  static toObject(
    includeInstance: boolean,
    msg: GetExchangeRateForImmediateUsdBuyResponse,
  ): GetExchangeRateForImmediateUsdBuyResponse.AsObject
  static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> }
  static extensionsBinary: { [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message> }
  static serializeBinaryToWriter(
    message: GetExchangeRateForImmediateUsdBuyResponse,
    writer: jspb.BinaryWriter,
  ): void
  static deserializeBinary(bytes: Uint8Array): GetExchangeRateForImmediateUsdBuyResponse
  static deserializeBinaryFromReader(
    message: GetExchangeRateForImmediateUsdBuyResponse,
    reader: jspb.BinaryReader,
  ): GetExchangeRateForImmediateUsdBuyResponse
}

export namespace GetExchangeRateForImmediateUsdBuyResponse {
  export type AsObject = {
    priceInUsd: number
  }
}

export class GetExchangeRateForImmediateUsdSellResponse extends jspb.Message {
  getPriceInSatoshis(): number
  setPriceInSatoshis(value: number): GetExchangeRateForImmediateUsdSellResponse

  serializeBinary(): Uint8Array
  toObject(includeInstance?: boolean): GetExchangeRateForImmediateUsdSellResponse.AsObject
  static toObject(
    includeInstance: boolean,
    msg: GetExchangeRateForImmediateUsdSellResponse,
  ): GetExchangeRateForImmediateUsdSellResponse.AsObject
  static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> }
  static extensionsBinary: { [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message> }
  static serializeBinaryToWriter(
    message: GetExchangeRateForImmediateUsdSellResponse,
    writer: jspb.BinaryWriter,
  ): void
  static deserializeBinary(bytes: Uint8Array): GetExchangeRateForImmediateUsdSellResponse
  static deserializeBinaryFromReader(
    message: GetExchangeRateForImmediateUsdSellResponse,
    reader: jspb.BinaryReader,
  ): GetExchangeRateForImmediateUsdSellResponse
}

export namespace GetExchangeRateForImmediateUsdSellResponse {
  export type AsObject = {
    priceInSatoshis: number
  }
}

export class GetExchangeRateForFutureUsdBuyResponse extends jspb.Message {
  getPriceInUsd(): number
  setPriceInUsd(value: number): GetExchangeRateForFutureUsdBuyResponse

  serializeBinary(): Uint8Array
  toObject(includeInstance?: boolean): GetExchangeRateForFutureUsdBuyResponse.AsObject
  static toObject(
    includeInstance: boolean,
    msg: GetExchangeRateForFutureUsdBuyResponse,
  ): GetExchangeRateForFutureUsdBuyResponse.AsObject
  static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> }
  static extensionsBinary: { [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message> }
  static serializeBinaryToWriter(
    message: GetExchangeRateForFutureUsdBuyResponse,
    writer: jspb.BinaryWriter,
  ): void
  static deserializeBinary(bytes: Uint8Array): GetExchangeRateForFutureUsdBuyResponse
  static deserializeBinaryFromReader(
    message: GetExchangeRateForFutureUsdBuyResponse,
    reader: jspb.BinaryReader,
  ): GetExchangeRateForFutureUsdBuyResponse
}

export namespace GetExchangeRateForFutureUsdBuyResponse {
  export type AsObject = {
    priceInUsd: number
  }
}

export class GetExchangeRateForFutureUsdSellResponse extends jspb.Message {
  getPriceInSatoshis(): number
  setPriceInSatoshis(value: number): GetExchangeRateForFutureUsdSellResponse

  serializeBinary(): Uint8Array
  toObject(includeInstance?: boolean): GetExchangeRateForFutureUsdSellResponse.AsObject
  static toObject(
    includeInstance: boolean,
    msg: GetExchangeRateForFutureUsdSellResponse,
  ): GetExchangeRateForFutureUsdSellResponse.AsObject
  static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> }
  static extensionsBinary: { [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message> }
  static serializeBinaryToWriter(
    message: GetExchangeRateForFutureUsdSellResponse,
    writer: jspb.BinaryWriter,
  ): void
  static deserializeBinary(bytes: Uint8Array): GetExchangeRateForFutureUsdSellResponse
  static deserializeBinaryFromReader(
    message: GetExchangeRateForFutureUsdSellResponse,
    reader: jspb.BinaryReader,
  ): GetExchangeRateForFutureUsdSellResponse
}

export namespace GetExchangeRateForFutureUsdSellResponse {
  export type AsObject = {
    priceInSatoshis: number
  }
}
