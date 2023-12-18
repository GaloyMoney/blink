// GENERATED CODE -- DO NOT EDIT!

'use strict';
var grpc = require('@grpc/grpc-js');
var debug_pb = require('./debug_pb.js');

function serialize_looprpc_ForceAutoLoopRequest(arg) {
  if (!(arg instanceof debug_pb.ForceAutoLoopRequest)) {
    throw new Error('Expected argument of type looprpc.ForceAutoLoopRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_looprpc_ForceAutoLoopRequest(buffer_arg) {
  return debug_pb.ForceAutoLoopRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_looprpc_ForceAutoLoopResponse(arg) {
  if (!(arg instanceof debug_pb.ForceAutoLoopResponse)) {
    throw new Error('Expected argument of type looprpc.ForceAutoLoopResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_looprpc_ForceAutoLoopResponse(buffer_arg) {
  return debug_pb.ForceAutoLoopResponse.deserializeBinary(new Uint8Array(buffer_arg));
}


//
// Debug is a service that exposes endpoints intended for testing purposes. These
// endpoints should not operate on mainnet, and should only be included if loop is
// built with the dev build tag.
var DebugService = exports.DebugService = {
  //
// ForceAutoLoop is intended for *testing purposes only* and will not work on
// mainnet. This endpoint ticks our autoloop timer, triggering automated
// dispatch of a swap if one is suggested.
forceAutoLoop: {
    path: '/looprpc.Debug/ForceAutoLoop',
    requestStream: false,
    responseStream: false,
    requestType: debug_pb.ForceAutoLoopRequest,
    responseType: debug_pb.ForceAutoLoopResponse,
    requestSerialize: serialize_looprpc_ForceAutoLoopRequest,
    requestDeserialize: deserialize_looprpc_ForceAutoLoopRequest,
    responseSerialize: serialize_looprpc_ForceAutoLoopResponse,
    responseDeserialize: deserialize_looprpc_ForceAutoLoopResponse,
  },
};

exports.DebugClient = grpc.makeGenericClientConstructor(DebugService);
