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

  describe("feeFromRawRoute", () => {
    it("returns the feeFromRawRoute", () => {
      const rawRoute = { total_mtokens: "21000000", safe_fee: 210 } as RawRoute
      expect(LnFees().feeFromRawRoute(rawRoute)).toEqual({
        amount: 210n,
        currency: WalletCurrency.Btc,
      })
    })
  })
})
