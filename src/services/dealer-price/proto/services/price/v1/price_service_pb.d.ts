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

export class GetExchangeRateForImmediateUsdBuyFromCentsRequest extends jspb.Message {
  getAmountInCents(): number
  setAmountInCents(value: number): GetExchangeRateForImmediateUsdBuyFromCentsRequest

  serializeBinary(): Uint8Array
  toObject(
    includeInstance?: boolean,
  ): GetExchangeRateForImmediateUsdBuyFromCentsRequest.AsObject
  static toObject(
    includeInstance: boolean,
    msg: GetExchangeRateForImmediateUsdBuyFromCentsRequest,
  ): GetExchangeRateForImmediateUsdBuyFromCentsRequest.AsObject
  static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> }
  static extensionsBinary: { [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message> }
  static serializeBinaryToWriter(
    message: GetExchangeRateForImmediateUsdBuyFromCentsRequest,
    writer: jspb.BinaryWriter,
  ): void
  static deserializeBinary(
    bytes: Uint8Array,
  ): GetExchangeRateForImmediateUsdBuyFromCentsRequest
  static deserializeBinaryFromReader(
    message: GetExchangeRateForImmediateUsdBuyFromCentsRequest,
    reader: jspb.BinaryReader,
  ): GetExchangeRateForImmediateUsdBuyFromCentsRequest
}

export namespace GetExchangeRateForImmediateUsdBuyFromCentsRequest {
  export type AsObject = {
    amountInCents: number
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

export class GetExchangeRateForImmediateUsdSellFromSatoshisRequest extends jspb.Message {
  getAmountInSatoshis(): number
  setAmountInSatoshis(
    value: number,
  ): GetExchangeRateForImmediateUsdSellFromSatoshisRequest

  serializeBinary(): Uint8Array
  toObject(
    includeInstance?: boolean,
  ): GetExchangeRateForImmediateUsdSellFromSatoshisRequest.AsObject
  static toObject(
    includeInstance: boolean,
    msg: GetExchangeRateForImmediateUsdSellFromSatoshisRequest,
  ): GetExchangeRateForImmediateUsdSellFromSatoshisRequest.AsObject
  static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> }
  static extensionsBinary: { [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message> }
  static serializeBinaryToWriter(
    message: GetExchangeRateForImmediateUsdSellFromSatoshisRequest,
    writer: jspb.BinaryWriter,
  ): void
  static deserializeBinary(
    bytes: Uint8Array,
  ): GetExchangeRateForImmediateUsdSellFromSatoshisRequest
  static deserializeBinaryFromReader(
    message: GetExchangeRateForImmediateUsdSellFromSatoshisRequest,
    reader: jspb.BinaryReader,
  ): GetExchangeRateForImmediateUsdSellFromSatoshisRequest
}

export namespace GetExchangeRateForImmediateUsdSellFromSatoshisRequest {
  export type AsObject = {
    amountInSatoshis: number
  }
}

export class GetQuoteRateForFutureUsdBuyRequest extends jspb.Message {
  getAmountInSatoshis(): number
  setAmountInSatoshis(value: number): GetQuoteRateForFutureUsdBuyRequest
  getTimeInSeconds(): number
  setTimeInSeconds(value: number): GetQuoteRateForFutureUsdBuyRequest

  serializeBinary(): Uint8Array
  toObject(includeInstance?: boolean): GetQuoteRateForFutureUsdBuyRequest.AsObject
  static toObject(
    includeInstance: boolean,
    msg: GetQuoteRateForFutureUsdBuyRequest,
  ): GetQuoteRateForFutureUsdBuyRequest.AsObject
  static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> }
  static extensionsBinary: { [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message> }
  static serializeBinaryToWriter(
    message: GetQuoteRateForFutureUsdBuyRequest,
    writer: jspb.BinaryWriter,
  ): void
  static deserializeBinary(bytes: Uint8Array): GetQuoteRateForFutureUsdBuyRequest
  static deserializeBinaryFromReader(
    message: GetQuoteRateForFutureUsdBuyRequest,
    reader: jspb.BinaryReader,
  ): GetQuoteRateForFutureUsdBuyRequest
}

export namespace GetQuoteRateForFutureUsdBuyRequest {
  export type AsObject = {
    amountInSatoshis: number
    timeInSeconds: number
  }
}

export class GetQuoteRateForFutureUsdSellRequest extends jspb.Message {
  getAmountInUsd(): number
  setAmountInUsd(value: number): GetQuoteRateForFutureUsdSellRequest
  getTimeInSeconds(): number
  setTimeInSeconds(value: number): GetQuoteRateForFutureUsdSellRequest

  serializeBinary(): Uint8Array
  toObject(includeInstance?: boolean): GetQuoteRateForFutureUsdSellRequest.AsObject
  static toObject(
    includeInstance: boolean,
    msg: GetQuoteRateForFutureUsdSellRequest,
  ): GetQuoteRateForFutureUsdSellRequest.AsObject
  static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> }
  static extensionsBinary: { [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message> }
  static serializeBinaryToWriter(
    message: GetQuoteRateForFutureUsdSellRequest,
    writer: jspb.BinaryWriter,
  ): void
  static deserializeBinary(bytes: Uint8Array): GetQuoteRateForFutureUsdSellRequest
  static deserializeBinaryFromReader(
    message: GetQuoteRateForFutureUsdSellRequest,
    reader: jspb.BinaryReader,
  ): GetQuoteRateForFutureUsdSellRequest
}

export namespace GetQuoteRateForFutureUsdSellRequest {
  export type AsObject = {
    amountInUsd: number
    timeInSeconds: number
  }
}

export class GetExchangeRateForImmediateUsdBuyResponse extends jspb.Message {
  getAmountInUsd(): number
  setAmountInUsd(value: number): GetExchangeRateForImmediateUsdBuyResponse

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
    amountInUsd: number
  }
}

export class GetExchangeRateForImmediateUsdBuyFromCentsResponse extends jspb.Message {
  getAmountInSatoshis(): number
  setAmountInSatoshis(value: number): GetExchangeRateForImmediateUsdBuyFromCentsResponse

  serializeBinary(): Uint8Array
  toObject(
    includeInstance?: boolean,
  ): GetExchangeRateForImmediateUsdBuyFromCentsResponse.AsObject
  static toObject(
    includeInstance: boolean,
    msg: GetExchangeRateForImmediateUsdBuyFromCentsResponse,
  ): GetExchangeRateForImmediateUsdBuyFromCentsResponse.AsObject
  static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> }
  static extensionsBinary: { [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message> }
  static serializeBinaryToWriter(
    message: GetExchangeRateForImmediateUsdBuyFromCentsResponse,
    writer: jspb.BinaryWriter,
  ): void
  static deserializeBinary(
    bytes: Uint8Array,
  ): GetExchangeRateForImmediateUsdBuyFromCentsResponse
  static deserializeBinaryFromReader(
    message: GetExchangeRateForImmediateUsdBuyFromCentsResponse,
    reader: jspb.BinaryReader,
  ): GetExchangeRateForImmediateUsdBuyFromCentsResponse
}

export namespace GetExchangeRateForImmediateUsdBuyFromCentsResponse {
  export type AsObject = {
    amountInSatoshis: number
  }
}

export class GetExchangeRateForImmediateUsdSellResponse extends jspb.Message {
  getAmountInSatoshis(): number
  setAmountInSatoshis(value: number): GetExchangeRateForImmediateUsdSellResponse

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
    amountInSatoshis: number
  }
}

export class GetExchangeRateForImmediateUsdSellFromSatoshisResponse extends jspb.Message {
  getAmountInUsd(): number
  setAmountInUsd(value: number): GetExchangeRateForImmediateUsdSellFromSatoshisResponse

  serializeBinary(): Uint8Array
  toObject(
    includeInstance?: boolean,
  ): GetExchangeRateForImmediateUsdSellFromSatoshisResponse.AsObject
  static toObject(
    includeInstance: boolean,
    msg: GetExchangeRateForImmediateUsdSellFromSatoshisResponse,
  ): GetExchangeRateForImmediateUsdSellFromSatoshisResponse.AsObject
  static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> }
  static extensionsBinary: { [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message> }
  static serializeBinaryToWriter(
    message: GetExchangeRateForImmediateUsdSellFromSatoshisResponse,
    writer: jspb.BinaryWriter,
  ): void
  static deserializeBinary(
    bytes: Uint8Array,
  ): GetExchangeRateForImmediateUsdSellFromSatoshisResponse
  static deserializeBinaryFromReader(
    message: GetExchangeRateForImmediateUsdSellFromSatoshisResponse,
    reader: jspb.BinaryReader,
  ): GetExchangeRateForImmediateUsdSellFromSatoshisResponse
}

export namespace GetExchangeRateForImmediateUsdSellFromSatoshisResponse {
  export type AsObject = {
    amountInUsd: number
  }
}

export class GetQuoteRateForFutureUsdBuyResponse extends jspb.Message {
  getAmountInUsd(): number
  setAmountInUsd(value: number): GetQuoteRateForFutureUsdBuyResponse

  serializeBinary(): Uint8Array
  toObject(includeInstance?: boolean): GetQuoteRateForFutureUsdBuyResponse.AsObject
  static toObject(
    includeInstance: boolean,
    msg: GetQuoteRateForFutureUsdBuyResponse,
  ): GetQuoteRateForFutureUsdBuyResponse.AsObject
  static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> }
  static extensionsBinary: { [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message> }
  static serializeBinaryToWriter(
    message: GetQuoteRateForFutureUsdBuyResponse,
    writer: jspb.BinaryWriter,
  ): void
  static deserializeBinary(bytes: Uint8Array): GetQuoteRateForFutureUsdBuyResponse
  static deserializeBinaryFromReader(
    message: GetQuoteRateForFutureUsdBuyResponse,
    reader: jspb.BinaryReader,
  ): GetQuoteRateForFutureUsdBuyResponse
}

export namespace GetQuoteRateForFutureUsdBuyResponse {
  export type AsObject = {
    amountInUsd: number
  }
}

export class GetQuoteRateForFutureUsdSellResponse extends jspb.Message {
  getAmountInSatoshis(): number
  setAmountInSatoshis(value: number): GetQuoteRateForFutureUsdSellResponse

  serializeBinary(): Uint8Array
  toObject(includeInstance?: boolean): GetQuoteRateForFutureUsdSellResponse.AsObject
  static toObject(
    includeInstance: boolean,
    msg: GetQuoteRateForFutureUsdSellResponse,
  ): GetQuoteRateForFutureUsdSellResponse.AsObject
  static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> }
  static extensionsBinary: { [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message> }
  static serializeBinaryToWriter(
    message: GetQuoteRateForFutureUsdSellResponse,
    writer: jspb.BinaryWriter,
  ): void
  static deserializeBinary(bytes: Uint8Array): GetQuoteRateForFutureUsdSellResponse
  static deserializeBinaryFromReader(
    message: GetQuoteRateForFutureUsdSellResponse,
    reader: jspb.BinaryReader,
  ): GetQuoteRateForFutureUsdSellResponse
}

export namespace GetQuoteRateForFutureUsdSellResponse {
  export type AsObject = {
    amountInSatoshis: number
  }
}
