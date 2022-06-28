// @todo - make this more robust and generic
export interface ISwapProvider {
  loopOut: (amount: Satoshis) => Promise<string>
  loopOutTerms?: () => Promise<string>
  loopOutQuote?: () => Promise<string>
  loopIn?: () => Promise<string>
  loopInTerms?: () => Promise<string>
  loopInQuote?: () => Promise<string>
  swapStatus?: () => Promise<string>
  default?: unknown
}
