import { ClientReadableStream } from "@grpc/grpc-js"
import { SwapStatus } from "@services/swap/providers/lightning-labs/protos/loop_pb"
export type SwapServiceError = import("./errors").SwapServiceError

// TODO - make this more robust and generic
export interface ISwapService {
  healthCheck: () => Promise<boolean>
  swapOut: (amount: Satoshis) => Promise<SwapOutResult | SwapServiceError>
  swapListener: () => ClientReadableStream<SwapStatus | SwapServiceError>
  swapOutTerms?: () => Promise<string>
  swapOutQuote?: () => Promise<string>
  swapIn?: () => Promise<string>
  swapInTerms?: () => Promise<string>
  swapInQuote?: () => Promise<string>
  swapStatus?: () => Promise<string>
}

export type SwapOutResult = {
  swapId: string
  swapIdBytes: string
  // swapIdBytes: string
  htlcAddress: string
  // "htlc_address_np2wsh": <string>
  // "htlc_address_p2wsh": <string>
  serverMessage: string
}

export type SwapStatusResult = {
  amt: string
  id: string
  // "id_bytes": <byte>
  // "type": <looprpcSwapType>
  state: SwapState
  // "failure_reason": <looprpcFailureReason>
  // "initiation_time": <string>
  // "last_update_time": <string>
  htlcAddress: string
  // "htlc_address_p2wsh": <string>
  // "htlc_address_np2wsh": <string>
  costServer: string
  cost_onchain: string
  cost_offchain: string
  // "last_hop": <byte>
  // "outgoing_chan_set": <array string>
  // "label": <string>
}

export type SwapConfig = {
  minOutboundLiquidityBalance: Satoshis
  swapOutAmount: Satoshis
  loopRestEndpoint: string
  loopRpcEndpoint: string
  swapProviders: Array<SwapProvider>
}

export enum SwapState {
  INITIATED,
  PREIMAGE_REVEALED,
  HTLC_PUBLISHED,
  SUCCESS,
  FAILED,
  INVOICE_SETTLED,
}

export enum SwapProvider {
  LOOP,
  PEERSWAP,
}
