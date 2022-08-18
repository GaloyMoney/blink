import { WalletCurrency } from "@domain/shared"
import { LnFees } from "@domain/payments"

describe("LnFees", () => {
  describe("maxProtocolFee", () => {
    it("returns the maxProtocolFee", () => {
      const btcAmount = {
        amount: 10_000n,
        currency: WalletCurrency.Btc,
      }
      expect(LnFees().maxProtocolFee(btcAmount)).toEqual({
        amount: 50n,
        currency: WalletCurrency.Btc,
      })
    })

    it("correctly rounds the fee", () => {
      const btcAmount = {
        amount: 25844n,
        currency: WalletCurrency.Btc,
      }
      expect(LnFees().maxProtocolFee(btcAmount)).toEqual({
        amount: 129n,
        currency: WalletCurrency.Btc,
      })
    })

    it("handles a small amount", () => {
      const btcAmount = {
        amount: 1n,
        currency: WalletCurrency.Btc,
      }
      expect(LnFees().maxProtocolFee(btcAmount)).toEqual({
        amount: 1n,
        currency: WalletCurrency.Btc,
      })
    })
  })
})
