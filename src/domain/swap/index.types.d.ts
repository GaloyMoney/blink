type SwapClientReadableStream<T> = import("@grpc/grpc-js").ClientReadableStream<T>
type SwapServiceError = import("./errors").SwapServiceError
type SwapProvider =
  typeof import("./index").SwapProvider[keyof typeof import("./index").SwapProvider]
type SwapType = typeof import("./index").SwapType[keyof typeof import("./index").SwapType]
type SwapState =
  typeof import("./index").SwapState[keyof typeof import("./index").SwapState]
type LoopdInstanceName =
  typeof import("./index").LoopdInstanceName[keyof typeof import("./index").LoopdInstanceName]

interface ISwapService {
  healthCheck: () => Promise<true | SwapServiceError>
  swapOut: (swapOutArgs: SwapOutArgs) => Promise<SwapOutResult | SwapServiceError>
  swapListener: () => SwapClientReadableStream<SwapListenerResponse | SwapServiceError>
  swapOutTerms: () => Promise<SwapOutTermsResult | SwapServiceError>
  swapOutQuote: (amt: Satoshis) => Promise<SwapOutQuoteResult | SwapServiceError>
}

type SwapOutArgs = {
  amount: Satoshis
  maxSwapFee?: Satoshis
  swapDestAddress?: OnChainAddress
}

type SwapOutResult = {
  swapId: SwapId
  swapIdBytes: string
  htlcAddress: OnChainAddress
  serverMessage: string
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
  minSwapAmount: Satoshis
  maxSwapAmount: Satoshis
  minCltvDelta: number
  maxCltvDelta: number
}

type SwapOutQuoteResult = {
  swapFeeSat: Satoshis
  prepayAmtSat: Satoshis
  htlcSweepFeeSat: Satoshis
  swapPaymentDest: OnChainAddress
  cltvDelta: number
  confTarget: number
}

type SwapConfig = {
  minOnChainHotWalletBalance: Satoshis
  swapOutAmount: Satoshis
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
  loopdInstanceName: LoopdInstanceName
}

type SwapId = string & { readonly brand: unique symbol }
type SwapHash = string & { readonly brand: unique symbol }
