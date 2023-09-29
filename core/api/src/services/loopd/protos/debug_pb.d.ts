// package: looprpc
// file: debug.proto

import * as jspb from "google-protobuf";

export class ForceAutoLoopRequest extends jspb.Message {
  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): ForceAutoLoopRequest.AsObject;
  static toObject(includeInstance: boolean, msg: ForceAutoLoopRequest): ForceAutoLoopRequest.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: ForceAutoLoopRequest, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): ForceAutoLoopRequest;
  static deserializeBinaryFromReader(message: ForceAutoLoopRequest, reader: jspb.BinaryReader): ForceAutoLoopRequest;
}

export namespace ForceAutoLoopRequest {
  export type AsObject = {
  }
}

export class ForceAutoLoopResponse extends jspb.Message {
  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): ForceAutoLoopResponse.AsObject;
  static toObject(includeInstance: boolean, msg: ForceAutoLoopResponse): ForceAutoLoopResponse.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: ForceAutoLoopResponse, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): ForceAutoLoopResponse;
  static deserializeBinaryFromReader(message: ForceAutoLoopResponse, reader: jspb.BinaryReader): ForceAutoLoopResponse;
}

export namespace ForceAutoLoopResponse {
  export type AsObject = {
  }
}

