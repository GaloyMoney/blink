export namespace SwapClientService {
    namespace loopOut {
        export const path: string;
        export const requestStream: boolean;
        export const responseStream: boolean;
        export const requestType: typeof loop_pb.LoopOutRequest;
        export const responseType: typeof loop_pb.SwapResponse;
        export { serialize_looprpc_LoopOutRequest as requestSerialize };
        export { deserialize_looprpc_LoopOutRequest as requestDeserialize };
        export { serialize_looprpc_SwapResponse as responseSerialize };
        export { deserialize_looprpc_SwapResponse as responseDeserialize };
    }
    namespace loopIn {
        const path_1: string;
        export { path_1 as path };
        const requestStream_1: boolean;
        export { requestStream_1 as requestStream };
        const responseStream_1: boolean;
        export { responseStream_1 as responseStream };
        const requestType_1: typeof loop_pb.LoopInRequest;
        export { requestType_1 as requestType };
        const responseType_1: typeof loop_pb.SwapResponse;
        export { responseType_1 as responseType };
        export { serialize_looprpc_LoopInRequest as requestSerialize };
        export { deserialize_looprpc_LoopInRequest as requestDeserialize };
        export { serialize_looprpc_SwapResponse as responseSerialize };
        export { deserialize_looprpc_SwapResponse as responseDeserialize };
    }
    namespace monitor {
        const path_2: string;
        export { path_2 as path };
        const requestStream_2: boolean;
        export { requestStream_2 as requestStream };
        const responseStream_2: boolean;
        export { responseStream_2 as responseStream };
        const requestType_2: typeof loop_pb.MonitorRequest;
        export { requestType_2 as requestType };
        const responseType_2: typeof loop_pb.SwapStatus;
        export { responseType_2 as responseType };
        export { serialize_looprpc_MonitorRequest as requestSerialize };
        export { deserialize_looprpc_MonitorRequest as requestDeserialize };
        export { serialize_looprpc_SwapStatus as responseSerialize };
        export { deserialize_looprpc_SwapStatus as responseDeserialize };
    }
    namespace listSwaps {
        const path_3: string;
        export { path_3 as path };
        const requestStream_3: boolean;
        export { requestStream_3 as requestStream };
        const responseStream_3: boolean;
        export { responseStream_3 as responseStream };
        const requestType_3: typeof loop_pb.ListSwapsRequest;
        export { requestType_3 as requestType };
        const responseType_3: typeof loop_pb.ListSwapsResponse;
        export { responseType_3 as responseType };
        export { serialize_looprpc_ListSwapsRequest as requestSerialize };
        export { deserialize_looprpc_ListSwapsRequest as requestDeserialize };
        export { serialize_looprpc_ListSwapsResponse as responseSerialize };
        export { deserialize_looprpc_ListSwapsResponse as responseDeserialize };
    }
    namespace swapInfo {
        const path_4: string;
        export { path_4 as path };
        const requestStream_4: boolean;
        export { requestStream_4 as requestStream };
        const responseStream_4: boolean;
        export { responseStream_4 as responseStream };
        const requestType_4: typeof loop_pb.SwapInfoRequest;
        export { requestType_4 as requestType };
        const responseType_4: typeof loop_pb.SwapStatus;
        export { responseType_4 as responseType };
        export { serialize_looprpc_SwapInfoRequest as requestSerialize };
        export { deserialize_looprpc_SwapInfoRequest as requestDeserialize };
        export { serialize_looprpc_SwapStatus as responseSerialize };
        export { deserialize_looprpc_SwapStatus as responseDeserialize };
    }
    namespace loopOutTerms {
        const path_5: string;
        export { path_5 as path };
        const requestStream_5: boolean;
        export { requestStream_5 as requestStream };
        const responseStream_5: boolean;
        export { responseStream_5 as responseStream };
        const requestType_5: typeof loop_pb.TermsRequest;
        export { requestType_5 as requestType };
        const responseType_5: typeof loop_pb.OutTermsResponse;
        export { responseType_5 as responseType };
        export { serialize_looprpc_TermsRequest as requestSerialize };
        export { deserialize_looprpc_TermsRequest as requestDeserialize };
        export { serialize_looprpc_OutTermsResponse as responseSerialize };
        export { deserialize_looprpc_OutTermsResponse as responseDeserialize };
    }
    namespace loopOutQuote {
        const path_6: string;
        export { path_6 as path };
        const requestStream_6: boolean;
        export { requestStream_6 as requestStream };
        const responseStream_6: boolean;
        export { responseStream_6 as responseStream };
        const requestType_6: typeof loop_pb.QuoteRequest;
        export { requestType_6 as requestType };
        const responseType_6: typeof loop_pb.OutQuoteResponse;
        export { responseType_6 as responseType };
        export { serialize_looprpc_QuoteRequest as requestSerialize };
        export { deserialize_looprpc_QuoteRequest as requestDeserialize };
        export { serialize_looprpc_OutQuoteResponse as responseSerialize };
        export { deserialize_looprpc_OutQuoteResponse as responseDeserialize };
    }
    namespace getLoopInTerms {
        const path_7: string;
        export { path_7 as path };
        const requestStream_7: boolean;
        export { requestStream_7 as requestStream };
        const responseStream_7: boolean;
        export { responseStream_7 as responseStream };
        const requestType_7: typeof loop_pb.TermsRequest;
        export { requestType_7 as requestType };
        const responseType_7: typeof loop_pb.InTermsResponse;
        export { responseType_7 as responseType };
        export { serialize_looprpc_TermsRequest as requestSerialize };
        export { deserialize_looprpc_TermsRequest as requestDeserialize };
        export { serialize_looprpc_InTermsResponse as responseSerialize };
        export { deserialize_looprpc_InTermsResponse as responseDeserialize };
    }
    namespace getLoopInQuote {
        const path_8: string;
        export { path_8 as path };
        const requestStream_8: boolean;
        export { requestStream_8 as requestStream };
        const responseStream_8: boolean;
        export { responseStream_8 as responseStream };
        const requestType_8: typeof loop_pb.QuoteRequest;
        export { requestType_8 as requestType };
        const responseType_8: typeof loop_pb.InQuoteResponse;
        export { responseType_8 as responseType };
        export { serialize_looprpc_QuoteRequest as requestSerialize };
        export { deserialize_looprpc_QuoteRequest as requestDeserialize };
        export { serialize_looprpc_InQuoteResponse as responseSerialize };
        export { deserialize_looprpc_InQuoteResponse as responseDeserialize };
    }
    namespace probe {
        const path_9: string;
        export { path_9 as path };
        const requestStream_9: boolean;
        export { requestStream_9 as requestStream };
        const responseStream_9: boolean;
        export { responseStream_9 as responseStream };
        const requestType_9: typeof loop_pb.ProbeRequest;
        export { requestType_9 as requestType };
        const responseType_9: typeof loop_pb.ProbeResponse;
        export { responseType_9 as responseType };
        export { serialize_looprpc_ProbeRequest as requestSerialize };
        export { deserialize_looprpc_ProbeRequest as requestDeserialize };
        export { serialize_looprpc_ProbeResponse as responseSerialize };
        export { deserialize_looprpc_ProbeResponse as responseDeserialize };
    }
    namespace getLsatTokens {
        const path_10: string;
        export { path_10 as path };
        const requestStream_10: boolean;
        export { requestStream_10 as requestStream };
        const responseStream_10: boolean;
        export { responseStream_10 as responseStream };
        const requestType_10: typeof loop_pb.TokensRequest;
        export { requestType_10 as requestType };
        const responseType_10: typeof loop_pb.TokensResponse;
        export { responseType_10 as responseType };
        export { serialize_looprpc_TokensRequest as requestSerialize };
        export { deserialize_looprpc_TokensRequest as requestDeserialize };
        export { serialize_looprpc_TokensResponse as responseSerialize };
        export { deserialize_looprpc_TokensResponse as responseDeserialize };
    }
    namespace getLiquidityParams {
        const path_11: string;
        export { path_11 as path };
        const requestStream_11: boolean;
        export { requestStream_11 as requestStream };
        const responseStream_11: boolean;
        export { responseStream_11 as responseStream };
        const requestType_11: typeof loop_pb.GetLiquidityParamsRequest;
        export { requestType_11 as requestType };
        const responseType_11: typeof loop_pb.LiquidityParameters;
        export { responseType_11 as responseType };
        export { serialize_looprpc_GetLiquidityParamsRequest as requestSerialize };
        export { deserialize_looprpc_GetLiquidityParamsRequest as requestDeserialize };
        export { serialize_looprpc_LiquidityParameters as responseSerialize };
        export { deserialize_looprpc_LiquidityParameters as responseDeserialize };
    }
    namespace setLiquidityParams {
        const path_12: string;
        export { path_12 as path };
        const requestStream_12: boolean;
        export { requestStream_12 as requestStream };
        const responseStream_12: boolean;
        export { responseStream_12 as responseStream };
        const requestType_12: typeof loop_pb.SetLiquidityParamsRequest;
        export { requestType_12 as requestType };
        const responseType_12: typeof loop_pb.SetLiquidityParamsResponse;
        export { responseType_12 as responseType };
        export { serialize_looprpc_SetLiquidityParamsRequest as requestSerialize };
        export { deserialize_looprpc_SetLiquidityParamsRequest as requestDeserialize };
        export { serialize_looprpc_SetLiquidityParamsResponse as responseSerialize };
        export { deserialize_looprpc_SetLiquidityParamsResponse as responseDeserialize };
    }
    namespace suggestSwaps {
        const path_13: string;
        export { path_13 as path };
        const requestStream_13: boolean;
        export { requestStream_13 as requestStream };
        const responseStream_13: boolean;
        export { responseStream_13 as responseStream };
        const requestType_13: typeof loop_pb.SuggestSwapsRequest;
        export { requestType_13 as requestType };
        const responseType_13: typeof loop_pb.SuggestSwapsResponse;
        export { responseType_13 as responseType };
        export { serialize_looprpc_SuggestSwapsRequest as requestSerialize };
        export { deserialize_looprpc_SuggestSwapsRequest as requestDeserialize };
        export { serialize_looprpc_SuggestSwapsResponse as responseSerialize };
        export { deserialize_looprpc_SuggestSwapsResponse as responseDeserialize };
    }
}
export var SwapClientClient: grpc.ServiceClientConstructor;
import loop_pb = require("./loop_pb.js");
declare function serialize_looprpc_LoopOutRequest(arg: any): Buffer;
declare function deserialize_looprpc_LoopOutRequest(buffer_arg: any): loop_pb.LoopOutRequest;
declare function serialize_looprpc_SwapResponse(arg: any): Buffer;
declare function deserialize_looprpc_SwapResponse(buffer_arg: any): loop_pb.SwapResponse;
declare function serialize_looprpc_LoopInRequest(arg: any): Buffer;
declare function deserialize_looprpc_LoopInRequest(buffer_arg: any): loop_pb.LoopInRequest;
declare function serialize_looprpc_MonitorRequest(arg: any): Buffer;
declare function deserialize_looprpc_MonitorRequest(buffer_arg: any): loop_pb.MonitorRequest;
declare function serialize_looprpc_SwapStatus(arg: any): Buffer;
declare function deserialize_looprpc_SwapStatus(buffer_arg: any): loop_pb.SwapStatus;
declare function serialize_looprpc_ListSwapsRequest(arg: any): Buffer;
declare function deserialize_looprpc_ListSwapsRequest(buffer_arg: any): loop_pb.ListSwapsRequest;
declare function serialize_looprpc_ListSwapsResponse(arg: any): Buffer;
declare function deserialize_looprpc_ListSwapsResponse(buffer_arg: any): loop_pb.ListSwapsResponse;
declare function serialize_looprpc_SwapInfoRequest(arg: any): Buffer;
declare function deserialize_looprpc_SwapInfoRequest(buffer_arg: any): loop_pb.SwapInfoRequest;
declare function serialize_looprpc_TermsRequest(arg: any): Buffer;
declare function deserialize_looprpc_TermsRequest(buffer_arg: any): loop_pb.TermsRequest;
declare function serialize_looprpc_OutTermsResponse(arg: any): Buffer;
declare function deserialize_looprpc_OutTermsResponse(buffer_arg: any): loop_pb.OutTermsResponse;
declare function serialize_looprpc_QuoteRequest(arg: any): Buffer;
declare function deserialize_looprpc_QuoteRequest(buffer_arg: any): loop_pb.QuoteRequest;
declare function serialize_looprpc_OutQuoteResponse(arg: any): Buffer;
declare function deserialize_looprpc_OutQuoteResponse(buffer_arg: any): loop_pb.OutQuoteResponse;
declare function serialize_looprpc_InTermsResponse(arg: any): Buffer;
declare function deserialize_looprpc_InTermsResponse(buffer_arg: any): loop_pb.InTermsResponse;
declare function serialize_looprpc_InQuoteResponse(arg: any): Buffer;
declare function deserialize_looprpc_InQuoteResponse(buffer_arg: any): loop_pb.InQuoteResponse;
declare function serialize_looprpc_ProbeRequest(arg: any): Buffer;
declare function deserialize_looprpc_ProbeRequest(buffer_arg: any): loop_pb.ProbeRequest;
declare function serialize_looprpc_ProbeResponse(arg: any): Buffer;
declare function deserialize_looprpc_ProbeResponse(buffer_arg: any): loop_pb.ProbeResponse;
declare function serialize_looprpc_TokensRequest(arg: any): Buffer;
declare function deserialize_looprpc_TokensRequest(buffer_arg: any): loop_pb.TokensRequest;
declare function serialize_looprpc_TokensResponse(arg: any): Buffer;
declare function deserialize_looprpc_TokensResponse(buffer_arg: any): loop_pb.TokensResponse;
declare function serialize_looprpc_GetLiquidityParamsRequest(arg: any): Buffer;
declare function deserialize_looprpc_GetLiquidityParamsRequest(buffer_arg: any): loop_pb.GetLiquidityParamsRequest;
declare function serialize_looprpc_LiquidityParameters(arg: any): Buffer;
declare function deserialize_looprpc_LiquidityParameters(buffer_arg: any): loop_pb.LiquidityParameters;
declare function serialize_looprpc_SetLiquidityParamsRequest(arg: any): Buffer;
declare function deserialize_looprpc_SetLiquidityParamsRequest(buffer_arg: any): loop_pb.SetLiquidityParamsRequest;
declare function serialize_looprpc_SetLiquidityParamsResponse(arg: any): Buffer;
declare function deserialize_looprpc_SetLiquidityParamsResponse(buffer_arg: any): loop_pb.SetLiquidityParamsResponse;
declare function serialize_looprpc_SuggestSwapsRequest(arg: any): Buffer;
declare function deserialize_looprpc_SuggestSwapsRequest(buffer_arg: any): loop_pb.SuggestSwapsRequest;
declare function serialize_looprpc_SuggestSwapsResponse(arg: any): Buffer;
declare function deserialize_looprpc_SuggestSwapsResponse(buffer_arg: any): loop_pb.SuggestSwapsResponse;
import grpc = require("@grpc/grpc-js");
export {};
