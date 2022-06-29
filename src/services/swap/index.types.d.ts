// @todo - make this more robust and generic
export interface ISwapProvider {
  swapOut: (amount: Satoshis) => Promise<string>
  swapOutTerms?: () => Promise<string>
  swapOutQuote?: () => Promise<string>
  swapIn?: () => Promise<string>
  swapInTerms?: () => Promise<string>
  swapInQuote?: () => Promise<string>
  swapStatus?: () => Promise<string>
  default?: unknown
}
