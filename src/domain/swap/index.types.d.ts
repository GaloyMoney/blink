// eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any
type ClientReadableStream<T> = any

type SwapServiceError = import("./errors").SwapServiceError
type SwapType = import("./index").SwapType
type SwapProvider = import("./index").SwapProvider
type SwapState = import("./index").SwapState
interface ISwapService {
  healthCheck: () => Promise<boolean>
  swapOut: (amount: Satoshis) => Promise<SwapOutResult | SwapServiceError>
  swapListener: () => ClientReadableStream<unknown | SwapServiceError> // TODO: type for different providers (LOOP, PEERSWAP etc)
  swapOutTerms?: () => Promise<string> // TODO: Implement these
  swapOutQuote?: () => Promise<string>
  swapIn?: () => Promise<string>
  swapInTerms?: () => Promise<string>
  swapInQuote?: () => Promise<string>
  swapStatus?: () => Promise<string>
}

type SwapOutResult = {
  swapId: string
  swapIdBytes: string
  htlcAddress: string
  serverMessage: string
}

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

type SwapConfig = {
  minOutboundLiquidityBalance: Satoshis
  swapOutAmount: Satoshis
  loopRestEndpoint: string
  loopRpcEndpoint: string
  swapProviders: Array<SwapProvider>
}
