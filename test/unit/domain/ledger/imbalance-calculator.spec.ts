import { ONE_DAY } from "@config"
import { toSats } from "@domain/bitcoin"
import { ImbalanceCalculator } from "@domain/ledger/imbalance-calculator"
import { WalletCurrency } from "@domain/shared"
import { WithdrawalFeePriceMethod } from "@domain/wallets"

const btcWallet: Wallet = {
  id: "walletId" as WalletId,
  type: "checking",
  currency: WalletCurrency.Btc,
  accountId: "a1" as AccountId,
  onChainAddressIdentifiers: [],
  onChainAddresses: () => [],
}

const VolumeAfterLightningReceiptFn = () =>
  Promise.resolve({ outgoingBaseAmount: toSats(0), incomingBaseAmount: toSats(500) })
const VolumeAfterLightningPaymentFn = () =>
  Promise.resolve({ outgoingBaseAmount: toSats(600), incomingBaseAmount: toSats(0) })
const VolumeAfterOnChainReceiptFn = () =>
  Promise.resolve({ outgoingBaseAmount: toSats(0), incomingBaseAmount: toSats(700) })
const VolumeAfterOnChainPaymentFn = () =>
  Promise.resolve({ outgoingBaseAmount: toSats(800), incomingBaseAmount: toSats(0) })
const NoVolumeFn = () =>
  Promise.resolve({ outgoingBaseAmount: toSats(0), incomingBaseAmount: toSats(0) })

describe("ImbalanceCalculator", () => {
  describe("for WithdrawalFeePriceMethod.proportionalOnImbalance", () => {
    const method = WithdrawalFeePriceMethod.proportionalOnImbalance
    it("return positive imbalance when receiving sats on ln", async () => {
      const calculator = ImbalanceCalculator({
        method,
        sinceDaysAgo: ONE_DAY,
        volumeLightningFn: VolumeAfterLightningReceiptFn,
        volumeOnChainFn: NoVolumeFn,
      })
      const imbalance = await calculator.getSwapOutImbalanceAmount(btcWallet)
      if (imbalance instanceof Error) throw imbalance
      expect(imbalance.amount).toBe(500n)
    })
    it("return negative imbalance when sending sats on ln", async () => {
      const calculator = ImbalanceCalculator({
        method,
        sinceDaysAgo: ONE_DAY,
        volumeLightningFn: VolumeAfterLightningPaymentFn,
        volumeOnChainFn: NoVolumeFn,
      })
      const imbalance = await calculator.getSwapOutImbalanceAmount(btcWallet)
      if (imbalance instanceof Error) throw imbalance
      expect(imbalance.amount).toBe(-600n)
    })
    it("return negative imbalance when receiving sats onchain", async () => {
      const calculator = ImbalanceCalculator({
        method,
        sinceDaysAgo: ONE_DAY,
        volumeLightningFn: NoVolumeFn,
        volumeOnChainFn: VolumeAfterOnChainReceiptFn,
      })
      const imbalance = await calculator.getSwapOutImbalanceAmount(btcWallet)
      if (imbalance instanceof Error) throw imbalance
      expect(imbalance.amount).toBe(-700n)
    })
    it("return positive imbalance when sending sats onchain", async () => {
      const calculator = ImbalanceCalculator({
        method,
        sinceDaysAgo: ONE_DAY,
        volumeLightningFn: NoVolumeFn,
        volumeOnChainFn: VolumeAfterOnChainPaymentFn,
      })
      const imbalance = await calculator.getSwapOutImbalanceAmount(btcWallet)
      if (imbalance instanceof Error) throw imbalance
      expect(imbalance.amount).toBe(800n)
    })
    it("swap out increase imbalance", async () => {
      const calculator = ImbalanceCalculator({
        method,
        sinceDaysAgo: ONE_DAY,
        volumeLightningFn: VolumeAfterLightningReceiptFn,
        volumeOnChainFn: VolumeAfterOnChainPaymentFn,
      })
      const imbalance = await calculator.getSwapOutImbalanceAmount(btcWallet)
      if (imbalance instanceof Error) throw imbalance
      expect(imbalance.amount).toBe(800n + 500n)
    })
    it("swap in reduce decrease imbalance", async () => {
      const calculator = ImbalanceCalculator({
        method,
        sinceDaysAgo: ONE_DAY,
        volumeLightningFn: VolumeAfterLightningPaymentFn,
        volumeOnChainFn: VolumeAfterOnChainReceiptFn,
      })
      const imbalance = await calculator.getSwapOutImbalanceAmount(btcWallet)
      if (imbalance instanceof Error) throw imbalance
      expect(imbalance.amount).toBe(-700n - 600n)
    })
  })

  describe("for WithdrawalFeePriceMethod.proportionalOnImbalance", () => {
    const method = WithdrawalFeePriceMethod.flat
    it("no imbalance with flat fees", async () => {
      const calculator = ImbalanceCalculator({
        method,
        sinceDaysAgo: ONE_DAY,
        volumeLightningFn: VolumeAfterLightningReceiptFn,
        volumeOnChainFn: NoVolumeFn,
      })
      const imbalance = await calculator.getSwapOutImbalanceAmount(btcWallet)
      if (imbalance instanceof Error) throw imbalance
      expect(imbalance.amount).toBe(0n)
    })
  })
})
