import { toSats } from "@domain/bitcoin"
import { toCents } from "@domain/fiat"
import { AmountConverter, WalletCurrency } from "@domain/wallets"
import { Dealer } from "@services/dealer"

const dealerFns = Dealer()

describe("AmountConverter", () => {
  const displayPriceFns = {
    fromSats: (amount: Satoshis) => Number(amount * 2) as DisplayCurrencyBaseAmount,
    fromCents: (amount: UsdCents) => Number(amount * 20) as DisplayCurrencyBaseAmount,
  }

  describe("getAmountsReceive", () => {
    it("BTC wallet receives BTC", async () => {
      const converter = AmountConverter({
        displayPriceFns,
        dealerFns,
      })
      const walletCurrency = WalletCurrency.Btc
      const sats = toSats(100_000)
      const amounts = await converter.getAmountsReceive({
        walletCurrency,
        sats,
        order: "immediate",
      })
      expect(amounts).toEqual(
        expect.objectContaining({
          sats: 100_000,
          cents: undefined,
          amountDisplayCurrency: 200_000,
        }),
      )
    })

    it("USD wallet receives BTC from sats amount (ie: tipping page, or amountless invoice)", async () => {
      const converter = AmountConverter({
        displayPriceFns,
        dealerFns,
      })
      const walletCurrency = WalletCurrency.Usd
      const sats = toSats(100_000)
      const amounts = await converter.getAmountsReceive({
        walletCurrency,
        sats,
        order: "immediate",
      })
      expect(amounts).toEqual(
        expect.objectContaining({
          sats,
          cents: 4_990,
          amountDisplayCurrency: 200_000,
        }),
      )
    })

    it("USD wallet receives BTC from cents amount (prepaid usd option)", async () => {
      const converter = AmountConverter({
        displayPriceFns,
        dealerFns,
      })
      const walletCurrency = WalletCurrency.Usd
      const cents = toCents(10_000)
      const amounts = await converter.getAmountsReceive({
        walletCurrency,
        cents,
        order: "quote",
      })
      expect(amounts).toEqual(
        expect.objectContaining({
          sats: 199_200,
          cents,
          amountDisplayCurrency: 200_000,
        }),
      )
    })
  })

  describe("getAmountsSend", () => {
    it("BTC wallet sends BTC", async () => {
      const converter = AmountConverter({
        displayPriceFns,
        dealerFns,
      })
      const walletCurrency = WalletCurrency.Btc
      const sats = toSats(100_000)
      const amounts = await converter.getAmountsSend({
        walletCurrency,
        sats,
        order: "immediate",
      })
      expect(amounts).toEqual(
        expect.objectContaining({
          sats: 100_000,
          cents: undefined,
          amountDisplayCurrency: 200_000,
        }),
      )
    })
    it("USD wallet sends BTC from sats amount (ie: scan invoice with amount)", async () => {
      const converter = AmountConverter({
        displayPriceFns,
        dealerFns,
      })
      const walletCurrency = WalletCurrency.Usd
      const sats = toSats(100_000)
      const amounts = await converter.getAmountsSend({
        walletCurrency,
        sats,
        order: "immediate",
      })
      expect(amounts).toEqual(
        expect.objectContaining({
          sats: 100_000,
          cents: 5_010,
          amountDisplayCurrency: 200_000,
        }),
      )
    })
    it("USD wallet sends BTC from usd amount (ie: scan amountless invoice)", async () => {
      const converter = AmountConverter({
        displayPriceFns,
        dealerFns,
      })
      const walletCurrency = WalletCurrency.Usd
      const cents = toCents(10_000)
      const amounts = await converter.getAmountsSend({
        walletCurrency,
        cents,
        order: "immediate",
      })
      expect(amounts).toEqual(
        expect.objectContaining({
          sats: 200_400,
          cents,
          amountDisplayCurrency: 200_000,
        }),
      )
    })
  })
  it("dealer buys low", async () => {
    {
      const sats = 10_000 as Satoshis
      const result = await dealerFns.buyUsdImmediate(sats)
      expect(result).toBeLessThan(Number(sats) / 20)
    }
    {
      const cents = 1_000 as UsdCents
      const result = await dealerFns.buyUsdImmediateFromCents(cents)
      expect(result).toBeLessThan(Number(cents) * 20)
    }
  })
  it("dealer sell high", async () => {
    {
      const cents = 1_000 as UsdCents
      const result = await dealerFns.sellUsdImmediate(cents)
      expect(result).toBeGreaterThan(Number(cents) * 20)
    }
    {
      const sats = 1_000_000 as Satoshis
      const result = await dealerFns.sellUsdImmediateFromSats(sats)
      expect(result).toBeGreaterThan(Number(sats) / 20)
    }
  })
})
