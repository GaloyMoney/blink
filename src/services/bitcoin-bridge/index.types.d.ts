interface IBitcoinService {
  getWalletBalanceSummary(): Promise<true | Error>
}
