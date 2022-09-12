type SwapClientReadableStream<T> = import("@grpc/grpc-js").ClientReadableStream<T>
type SwapServiceError = import("./errors").SwapServiceError
type SwapType = import("./index").SwapType
type SwapProvider = import("./index").SwapProvider
type SwapState = import("./index").SwapState
type LoopdInstanceName = import("./index").LoopdInstanceName

interface ISwapService {
  healthCheck: () => Promise<boolean | SwapServiceError>
  swapOut: (swapOutArgs: SwapOutArgs) => Promise<SwapOutResult | SwapServiceError>
  swapListener: () => SwapClientReadableStream<SwapListenerResponse>
  swapOutTerms: () => Promise<SwapOutTermsResult | SwapServiceError>
  swapOutQuote: (amt: Satoshis) => Promise<SwapOutQuoteResult | SwapServiceError>
}

type SwapOutArgs = {
  amount: Satoshis
  maxSwapFee?: Satoshis
  swapDestAddress?: OnChainAddress
}

type SwapOutResult = {
  swapId: string
  swapIdBytes: string
  htlcAddress: string
  serverMessage: string
}

type SwapListenerResponse =
  | SwapStatusResultWrapper
  | (SwapStatusResult & SwapStatusResultWrapper)
  | SwapServiceError

type SwapStatusResultWrapper = {
  parsedSwapData?: SwapStatusResult
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
  minSwapAmount: number
  maxSwapAmount: number
  minCltvDelta: number
  maxCltvDelta: number
}

type SwapOutQuoteResult = {
  swapFeeSat: number
  prepayAmtSat: number
  htlcSweepFeeSat: number
  swapPaymentDest: string
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
  macaroon: string
  tlsCert: string
  grpcEndpoint: string
  btcNetwork: BtcNetwork
  loopdInstanceName: LoopdInstanceName
}

type SwapId = string & { readonly brand: unique symbol }
type SwapHash = string & { readonly brand: unique symbol }
