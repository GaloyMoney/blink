type SwapClientReadableStream<T> = import("@grpc/grpc-js").ClientReadableStream<T>
type SwapServiceError = import("./errors").SwapServiceError
type SwapProvider =
  typeof import("./index").SwapProvider[keyof typeof import("./index").SwapProvider]
type SwapType = typeof import("./index").SwapType[keyof typeof import("./index").SwapType]
type SwapState =
  typeof import("./index").SwapState[keyof typeof import("./index").SwapState]

interface ISwapService {
  healthCheck: () => Promise<boolean>
  swapOut: (swapOutArgs: SwapOutArgs) => Promise<SwapOutResult | SwapServiceError>
  swapListener: () => SwapClientReadableStream<SwapListenerResponse | SwapServiceError>
  swapOutTerms: () => Promise<SwapOutTermsResult | SwapServiceError>
  swapOutQuote: (amt: BtcPaymentAmount) => Promise<SwapOutQuoteResult | SwapServiceError>
}

type SwapOutArgs = {
  amount: BtcPaymentAmount
  maxSwapFee?: BtcPaymentAmount
  swapDestAddress?: OnChainAddress
}

type SwapOutResult = {
  swapId: SwapId
  swapIdBytes: string
  htlcAddress: OnChainAddress
  serverMessage: string
  noOp?: true
}

type SwapListenerResponse =
  | SwapStatusResultWrapper
  | (SwapStatusResult & SwapStatusResultWrapper)

type SwapStatusResultWrapper = {
  parsedSwapData: SwapStatusResult
}

type SwapStatusResult = {
  amt: bigint
  id: string
  state: SwapState
  htlcAddress: string
  serviceProviderFee: bigint
  onchainMinerFee: bigint
  offchainRoutingFee: bigint
  message: string
  swapType: SwapType
}

type SwapOutTermsResult = {
  minSwapAmount: BtcPaymentAmount
  maxSwapAmount: BtcPaymentAmount
  minCltvDelta: number
  maxCltvDelta: number
}

type SwapOutQuoteResult = {
  swapFeeSat: BtcPaymentAmount
  prepayAmtSat: BtcPaymentAmount
  htlcSweepFeeSat: BtcPaymentAmount
  swapPaymentDest: OnChainAddress
  cltvDelta: number
  confTarget: number
}

type SwapConfig = {
  loopOutWhenHotWalletLessThan: BtcPaymentAmount
  swapOutAmount: BtcPaymentAmount
  lnd1loopRestEndpoint: string
  lnd2loopRestEndpoint: string
  lnd1loopRpcEndpoint: string
  lnd2loopRpcEndpoint: string
  swapProviders: Array<SwapProvider>
}

type LoopdConfig = {
  macaroon: Macaroon
  tlsCert: string
  grpcEndpoint: string
  btcNetwork: BtcNetwork
  lndInstanceName: string
}

type SwapId = string & { readonly brand: unique symbol }
type SwapHash = string & { readonly brand: unique symbol }
