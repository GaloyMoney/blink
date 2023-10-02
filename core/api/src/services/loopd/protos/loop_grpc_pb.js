// GENERATED CODE -- DO NOT EDIT!

'use strict';
var grpc = require('@grpc/grpc-js');
var loop_pb = require('./loop_pb.js');
var swapserverrpc_common_pb = require('./swapserverrpc/common_pb.js');

function serialize_looprpc_GetLiquidityParamsRequest(arg) {
  if (!(arg instanceof loop_pb.GetLiquidityParamsRequest)) {
    throw new Error('Expected argument of type looprpc.GetLiquidityParamsRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_looprpc_GetLiquidityParamsRequest(buffer_arg) {
  return loop_pb.GetLiquidityParamsRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_looprpc_InQuoteResponse(arg) {
  if (!(arg instanceof loop_pb.InQuoteResponse)) {
    throw new Error('Expected argument of type looprpc.InQuoteResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_looprpc_InQuoteResponse(buffer_arg) {
  return loop_pb.InQuoteResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_looprpc_InTermsResponse(arg) {
  if (!(arg instanceof loop_pb.InTermsResponse)) {
    throw new Error('Expected argument of type looprpc.InTermsResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_looprpc_InTermsResponse(buffer_arg) {
  return loop_pb.InTermsResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_looprpc_LiquidityParameters(arg) {
  if (!(arg instanceof loop_pb.LiquidityParameters)) {
    throw new Error('Expected argument of type looprpc.LiquidityParameters');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_looprpc_LiquidityParameters(buffer_arg) {
  return loop_pb.LiquidityParameters.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_looprpc_ListSwapsRequest(arg) {
  if (!(arg instanceof loop_pb.ListSwapsRequest)) {
    throw new Error('Expected argument of type looprpc.ListSwapsRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_looprpc_ListSwapsRequest(buffer_arg) {
  return loop_pb.ListSwapsRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_looprpc_ListSwapsResponse(arg) {
  if (!(arg instanceof loop_pb.ListSwapsResponse)) {
    throw new Error('Expected argument of type looprpc.ListSwapsResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_looprpc_ListSwapsResponse(buffer_arg) {
  return loop_pb.ListSwapsResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_looprpc_LoopInRequest(arg) {
  if (!(arg instanceof loop_pb.LoopInRequest)) {
    throw new Error('Expected argument of type looprpc.LoopInRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_looprpc_LoopInRequest(buffer_arg) {
  return loop_pb.LoopInRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_looprpc_LoopOutRequest(arg) {
  if (!(arg instanceof loop_pb.LoopOutRequest)) {
    throw new Error('Expected argument of type looprpc.LoopOutRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_looprpc_LoopOutRequest(buffer_arg) {
  return loop_pb.LoopOutRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_looprpc_MonitorRequest(arg) {
  if (!(arg instanceof loop_pb.MonitorRequest)) {
    throw new Error('Expected argument of type looprpc.MonitorRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_looprpc_MonitorRequest(buffer_arg) {
  return loop_pb.MonitorRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_looprpc_OutQuoteResponse(arg) {
  if (!(arg instanceof loop_pb.OutQuoteResponse)) {
    throw new Error('Expected argument of type looprpc.OutQuoteResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_looprpc_OutQuoteResponse(buffer_arg) {
  return loop_pb.OutQuoteResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_looprpc_OutTermsResponse(arg) {
  if (!(arg instanceof loop_pb.OutTermsResponse)) {
    throw new Error('Expected argument of type looprpc.OutTermsResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_looprpc_OutTermsResponse(buffer_arg) {
  return loop_pb.OutTermsResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_looprpc_ProbeRequest(arg) {
  if (!(arg instanceof loop_pb.ProbeRequest)) {
    throw new Error('Expected argument of type looprpc.ProbeRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_looprpc_ProbeRequest(buffer_arg) {
  return loop_pb.ProbeRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_looprpc_ProbeResponse(arg) {
  if (!(arg instanceof loop_pb.ProbeResponse)) {
    throw new Error('Expected argument of type looprpc.ProbeResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_looprpc_ProbeResponse(buffer_arg) {
  return loop_pb.ProbeResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_looprpc_QuoteRequest(arg) {
  if (!(arg instanceof loop_pb.QuoteRequest)) {
    throw new Error('Expected argument of type looprpc.QuoteRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_looprpc_QuoteRequest(buffer_arg) {
  return loop_pb.QuoteRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_looprpc_SetLiquidityParamsRequest(arg) {
  if (!(arg instanceof loop_pb.SetLiquidityParamsRequest)) {
    throw new Error('Expected argument of type looprpc.SetLiquidityParamsRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_looprpc_SetLiquidityParamsRequest(buffer_arg) {
  return loop_pb.SetLiquidityParamsRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_looprpc_SetLiquidityParamsResponse(arg) {
  if (!(arg instanceof loop_pb.SetLiquidityParamsResponse)) {
    throw new Error('Expected argument of type looprpc.SetLiquidityParamsResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_looprpc_SetLiquidityParamsResponse(buffer_arg) {
  return loop_pb.SetLiquidityParamsResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_looprpc_SuggestSwapsRequest(arg) {
  if (!(arg instanceof loop_pb.SuggestSwapsRequest)) {
    throw new Error('Expected argument of type looprpc.SuggestSwapsRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_looprpc_SuggestSwapsRequest(buffer_arg) {
  return loop_pb.SuggestSwapsRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_looprpc_SuggestSwapsResponse(arg) {
  if (!(arg instanceof loop_pb.SuggestSwapsResponse)) {
    throw new Error('Expected argument of type looprpc.SuggestSwapsResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_looprpc_SuggestSwapsResponse(buffer_arg) {
  return loop_pb.SuggestSwapsResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_looprpc_SwapInfoRequest(arg) {
  if (!(arg instanceof loop_pb.SwapInfoRequest)) {
    throw new Error('Expected argument of type looprpc.SwapInfoRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_looprpc_SwapInfoRequest(buffer_arg) {
  return loop_pb.SwapInfoRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_looprpc_SwapResponse(arg) {
  if (!(arg instanceof loop_pb.SwapResponse)) {
    throw new Error('Expected argument of type looprpc.SwapResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_looprpc_SwapResponse(buffer_arg) {
  return loop_pb.SwapResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_looprpc_SwapStatus(arg) {
  if (!(arg instanceof loop_pb.SwapStatus)) {
    throw new Error('Expected argument of type looprpc.SwapStatus');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_looprpc_SwapStatus(buffer_arg) {
  return loop_pb.SwapStatus.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_looprpc_TermsRequest(arg) {
  if (!(arg instanceof loop_pb.TermsRequest)) {
    throw new Error('Expected argument of type looprpc.TermsRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_looprpc_TermsRequest(buffer_arg) {
  return loop_pb.TermsRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_looprpc_TokensRequest(arg) {
  if (!(arg instanceof loop_pb.TokensRequest)) {
    throw new Error('Expected argument of type looprpc.TokensRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_looprpc_TokensRequest(buffer_arg) {
  return loop_pb.TokensRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_looprpc_TokensResponse(arg) {
  if (!(arg instanceof loop_pb.TokensResponse)) {
    throw new Error('Expected argument of type looprpc.TokensResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_looprpc_TokensResponse(buffer_arg) {
  return loop_pb.TokensResponse.deserializeBinary(new Uint8Array(buffer_arg));
}


//
// SwapClient is a service that handles the client side process of onchain/offchain
// swaps. The service is designed for a single client.
var SwapClientService = exports.SwapClientService = {
  // loop: `out`
// LoopOut initiates an loop out swap with the given parameters. The call
// returns after the swap has been set up with the swap server. From that
// point onwards, progress can be tracked via the SwapStatus stream that is
// returned from Monitor().
loopOut: {
    path: '/looprpc.SwapClient/LoopOut',
    requestStream: false,
    responseStream: false,
    requestType: loop_pb.LoopOutRequest,
    responseType: loop_pb.SwapResponse,
    requestSerialize: serialize_looprpc_LoopOutRequest,
    requestDeserialize: deserialize_looprpc_LoopOutRequest,
    responseSerialize: serialize_looprpc_SwapResponse,
    responseDeserialize: deserialize_looprpc_SwapResponse,
  },
  // loop: `in`
// LoopIn initiates a loop in swap with the given parameters. The call
// returns after the swap has been set up with the swap server. From that
// point onwards, progress can be tracked via the SwapStatus stream
// that is returned from Monitor().
loopIn: {
    path: '/looprpc.SwapClient/LoopIn',
    requestStream: false,
    responseStream: false,
    requestType: loop_pb.LoopInRequest,
    responseType: loop_pb.SwapResponse,
    requestSerialize: serialize_looprpc_LoopInRequest,
    requestDeserialize: deserialize_looprpc_LoopInRequest,
    responseSerialize: serialize_looprpc_SwapResponse,
    responseDeserialize: deserialize_looprpc_SwapResponse,
  },
  // loop: `monitor`
// Monitor will return a stream of swap updates for currently active swaps.
monitor: {
    path: '/looprpc.SwapClient/Monitor',
    requestStream: false,
    responseStream: true,
    requestType: loop_pb.MonitorRequest,
    responseType: loop_pb.SwapStatus,
    requestSerialize: serialize_looprpc_MonitorRequest,
    requestDeserialize: deserialize_looprpc_MonitorRequest,
    responseSerialize: serialize_looprpc_SwapStatus,
    responseDeserialize: deserialize_looprpc_SwapStatus,
  },
  // loop: `listswaps`
// ListSwaps returns a list of all currently known swaps and their current
// status.
listSwaps: {
    path: '/looprpc.SwapClient/ListSwaps',
    requestStream: false,
    responseStream: false,
    requestType: loop_pb.ListSwapsRequest,
    responseType: loop_pb.ListSwapsResponse,
    requestSerialize: serialize_looprpc_ListSwapsRequest,
    requestDeserialize: deserialize_looprpc_ListSwapsRequest,
    responseSerialize: serialize_looprpc_ListSwapsResponse,
    responseDeserialize: deserialize_looprpc_ListSwapsResponse,
  },
  // loop: `swapinfo`
// SwapInfo returns all known details about a single swap.
swapInfo: {
    path: '/looprpc.SwapClient/SwapInfo',
    requestStream: false,
    responseStream: false,
    requestType: loop_pb.SwapInfoRequest,
    responseType: loop_pb.SwapStatus,
    requestSerialize: serialize_looprpc_SwapInfoRequest,
    requestDeserialize: deserialize_looprpc_SwapInfoRequest,
    responseSerialize: serialize_looprpc_SwapStatus,
    responseDeserialize: deserialize_looprpc_SwapStatus,
  },
  // loop: `terms`
// LoopOutTerms returns the terms that the server enforces for a loop out swap.
loopOutTerms: {
    path: '/looprpc.SwapClient/LoopOutTerms',
    requestStream: false,
    responseStream: false,
    requestType: loop_pb.TermsRequest,
    responseType: loop_pb.OutTermsResponse,
    requestSerialize: serialize_looprpc_TermsRequest,
    requestDeserialize: deserialize_looprpc_TermsRequest,
    responseSerialize: serialize_looprpc_OutTermsResponse,
    responseDeserialize: deserialize_looprpc_OutTermsResponse,
  },
  // loop: `quote`
// LoopOutQuote returns a quote for a loop out swap with the provided
// parameters.
loopOutQuote: {
    path: '/looprpc.SwapClient/LoopOutQuote',
    requestStream: false,
    responseStream: false,
    requestType: loop_pb.QuoteRequest,
    responseType: loop_pb.OutQuoteResponse,
    requestSerialize: serialize_looprpc_QuoteRequest,
    requestDeserialize: deserialize_looprpc_QuoteRequest,
    responseSerialize: serialize_looprpc_OutQuoteResponse,
    responseDeserialize: deserialize_looprpc_OutQuoteResponse,
  },
  // loop: `terms`
// GetTerms returns the terms that the server enforces for swaps.
getLoopInTerms: {
    path: '/looprpc.SwapClient/GetLoopInTerms',
    requestStream: false,
    responseStream: false,
    requestType: loop_pb.TermsRequest,
    responseType: loop_pb.InTermsResponse,
    requestSerialize: serialize_looprpc_TermsRequest,
    requestDeserialize: deserialize_looprpc_TermsRequest,
    responseSerialize: serialize_looprpc_InTermsResponse,
    responseDeserialize: deserialize_looprpc_InTermsResponse,
  },
  // loop: `quote`
// GetQuote returns a quote for a swap with the provided parameters.
getLoopInQuote: {
    path: '/looprpc.SwapClient/GetLoopInQuote',
    requestStream: false,
    responseStream: false,
    requestType: loop_pb.QuoteRequest,
    responseType: loop_pb.InQuoteResponse,
    requestSerialize: serialize_looprpc_QuoteRequest,
    requestDeserialize: deserialize_looprpc_QuoteRequest,
    responseSerialize: serialize_looprpc_InQuoteResponse,
    responseDeserialize: deserialize_looprpc_InQuoteResponse,
  },
  //
// Probe asks he sever to probe the route to us to have a better upfront
// estimate about routing fees when loopin-in.
probe: {
    path: '/looprpc.SwapClient/Probe',
    requestStream: false,
    responseStream: false,
    requestType: loop_pb.ProbeRequest,
    responseType: loop_pb.ProbeResponse,
    requestSerialize: serialize_looprpc_ProbeRequest,
    requestDeserialize: deserialize_looprpc_ProbeRequest,
    responseSerialize: serialize_looprpc_ProbeResponse,
    responseDeserialize: deserialize_looprpc_ProbeResponse,
  },
  // loop: `listauth`
// GetLsatTokens returns all LSAT tokens the daemon ever paid for.
getLsatTokens: {
    path: '/looprpc.SwapClient/GetLsatTokens',
    requestStream: false,
    responseStream: false,
    requestType: loop_pb.TokensRequest,
    responseType: loop_pb.TokensResponse,
    requestSerialize: serialize_looprpc_TokensRequest,
    requestDeserialize: deserialize_looprpc_TokensRequest,
    responseSerialize: serialize_looprpc_TokensResponse,
    responseDeserialize: deserialize_looprpc_TokensResponse,
  },
  // loop: `getparams`
// GetLiquidityParams gets the parameters that the daemon's liquidity manager
// is currently configured with. This may be nil if nothing is configured.
// [EXPERIMENTAL]: endpoint is subject to change.
getLiquidityParams: {
    path: '/looprpc.SwapClient/GetLiquidityParams',
    requestStream: false,
    responseStream: false,
    requestType: loop_pb.GetLiquidityParamsRequest,
    responseType: loop_pb.LiquidityParameters,
    requestSerialize: serialize_looprpc_GetLiquidityParamsRequest,
    requestDeserialize: deserialize_looprpc_GetLiquidityParamsRequest,
    responseSerialize: serialize_looprpc_LiquidityParameters,
    responseDeserialize: deserialize_looprpc_LiquidityParameters,
  },
  // loop: `setparams`
// SetLiquidityParams sets a new set of parameters for the daemon's liquidity
// manager. Note that the full set of parameters must be provided, because
// this call fully overwrites our existing parameters.
// [EXPERIMENTAL]: endpoint is subject to change.
setLiquidityParams: {
    path: '/looprpc.SwapClient/SetLiquidityParams',
    requestStream: false,
    responseStream: false,
    requestType: loop_pb.SetLiquidityParamsRequest,
    responseType: loop_pb.SetLiquidityParamsResponse,
    requestSerialize: serialize_looprpc_SetLiquidityParamsRequest,
    requestDeserialize: deserialize_looprpc_SetLiquidityParamsRequest,
    responseSerialize: serialize_looprpc_SetLiquidityParamsResponse,
    responseDeserialize: deserialize_looprpc_SetLiquidityParamsResponse,
  },
  // loop: `suggestswaps`
// SuggestSwaps returns a list of recommended swaps based on the current
// state of your node's channels and it's liquidity manager parameters.
// Note that only loop out suggestions are currently supported.
// [EXPERIMENTAL]: endpoint is subject to change.
suggestSwaps: {
    path: '/looprpc.SwapClient/SuggestSwaps',
    requestStream: false,
    responseStream: false,
    requestType: loop_pb.SuggestSwapsRequest,
    responseType: loop_pb.SuggestSwapsResponse,
    requestSerialize: serialize_looprpc_SuggestSwapsRequest,
    requestDeserialize: deserialize_looprpc_SuggestSwapsRequest,
    responseSerialize: serialize_looprpc_SuggestSwapsResponse,
    responseDeserialize: deserialize_looprpc_SuggestSwapsResponse,
  },
};

exports.SwapClientClient = grpc.makeGenericClientConstructor(SwapClientService);
