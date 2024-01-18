import { ONE_DAY } from "@/config"
import { ImbalanceCalculator } from "@/domain/ledger/imbalance-calculator"
import { BtcPaymentAmount, WalletCurrency, ZERO_SATS } from "@/domain/shared"
import { WithdrawalFeePriceMethod } from "@/domain/wallets"

const btcWallet: Wallet = {
  id: "walletId" as WalletId,
  type: "checking",
  currency: WalletCurrency.Btc,
  accountId: "a1" as AccountId,
  onChainAddressIdentifiers: [],
  onChainAddresses: () => [],
}

const VolumeAmountAfterLightningReceiptFn = <S extends WalletCurrency>() =>
  Promise.resolve(BtcPaymentAmount(500n) as PaymentAmount<S>)
const VolumeAmountAfterLightningPaymentFn = <S extends WalletCurrency>() =>
  Promise.resolve(BtcPaymentAmount(-600n) as PaymentAmount<S>)
const VolumeAmountAfterOnChainReceiptFn = <S extends WalletCurrency>() =>
  Promise.resolve(BtcPaymentAmount(700n) as PaymentAmount<S>)
const VolumeAmountAfterOnChainPaymentFn = <S extends WalletCurrency>() =>
  Promise.resolve(BtcPaymentAmount(-800n) as PaymentAmount<S>)
const NoVolumeFn = <S extends WalletCurrency>() =>
  Promise.resolve(ZERO_SATS as PaymentAmount<S>)

describe("ImbalanceCalculator", () => {
  describe("for WithdrawalFeePriceMethod.proportionalOnImbalance", () => {
    const method = WithdrawalFeePriceMethod.proportionalOnImbalance
    it("return positive imbalance when receiving sats on ln", async () => {
      const calculator = ImbalanceCalculator({
        method,
        sinceDaysAgo: ONE_DAY,
        netInVolumeAmountLightningFn: VolumeAmountAfterLightningReceiptFn,
        netInVolumeAmountOnChainFn: NoVolumeFn,
      })
      const imbalance = await calculator.getSwapOutImbalanceAmount(btcWallet)
      if (imbalance instanceof Error) throw imbalance
      expect(imbalance.amount).toBe(500n)
    })
    it("return negative imbalance when sending sats on ln", async () => {
      const calculator = ImbalanceCalculator({
        method,
        sinceDaysAgo: ONE_DAY,
        netInVolumeAmountLightningFn: VolumeAmountAfterLightningPaymentFn,
        netInVolumeAmountOnChainFn: NoVolumeFn,
      })
      const imbalance = await calculator.getSwapOutImbalanceAmount(btcWallet)
      if (imbalance instanceof Error) throw imbalance
      expect(imbalance.amount).toBe(-600n)
    })
    it("return negative imbalance when receiving sats onchain", async () => {
      const calculator = ImbalanceCalculator({
        method,
        sinceDaysAgo: ONE_DAY,
        netInVolumeAmountLightningFn: NoVolumeFn,
        netInVolumeAmountOnChainFn: VolumeAmountAfterOnChainReceiptFn,
      })
      const imbalance = await calculator.getSwapOutImbalanceAmount(btcWallet)
      if (imbalance instanceof Error) throw imbalance
      expect(imbalance.amount).toBe(-700n)
    })
    it("return positive imbalance when sending sats onchain", async () => {
      const calculator = ImbalanceCalculator({
        method,
        sinceDaysAgo: ONE_DAY,
        netInVolumeAmountLightningFn: NoVolumeFn,
        netInVolumeAmountOnChainFn: VolumeAmountAfterOnChainPaymentFn,
      })
      const imbalance = await calculator.getSwapOutImbalanceAmount(btcWallet)
      if (imbalance instanceof Error) throw imbalance
      expect(imbalance.amount).toBe(800n)
    })
    it("swap out increase imbalance", async () => {
      const calculator = ImbalanceCalculator({
        method,
        sinceDaysAgo: ONE_DAY,
        netInVolumeAmountLightningFn: VolumeAmountAfterLightningReceiptFn,
        netInVolumeAmountOnChainFn: VolumeAmountAfterOnChainPaymentFn,
      })
      const imbalance = await calculator.getSwapOutImbalanceAmount(btcWallet)
      if (imbalance instanceof Error) throw imbalance
      expect(imbalance.amount).toBe(800n + 500n)
    })
    it("swap in reduce decrease imbalance", async () => {
      const calculator = ImbalanceCalculator({
        method,
        sinceDaysAgo: ONE_DAY,
        netInVolumeAmountLightningFn: VolumeAmountAfterLightningPaymentFn,
        netInVolumeAmountOnChainFn: VolumeAmountAfterOnChainReceiptFn,
      })
      const imbalance = await calculator.getSwapOutImbalanceAmount(btcWallet)
      if (imbalance instanceof Error) throw imbalance
      expect(imbalance.amount).toBe(-700n - 600n)
    })
  })

  describe("for WithdrawalFeePriceMethod.flat", () => {
    const method = WithdrawalFeePriceMethod.flat
    it("no imbalance with flat fees", async () => {
      const calculator = ImbalanceCalculator({
        method,
        sinceDaysAgo: ONE_DAY,
        netInVolumeAmountLightningFn: VolumeAmountAfterLightningReceiptFn,
        netInVolumeAmountOnChainFn: NoVolumeFn,
      })
      const imbalance = await calculator.getSwapOutImbalanceAmount(btcWallet)
      if (imbalance instanceof Error) throw imbalance
      expect(imbalance.amount).toBe(0n)
    })
  })
})
