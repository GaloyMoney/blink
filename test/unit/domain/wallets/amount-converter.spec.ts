import { toSats } from "@domain/bitcoin"
import { toCents } from "@domain/fiat"
import { AmountConverter, WalletCurrency } from "@domain/wallets"

// simulated price at 100k btc/usd
// or 10 sats per cents

describe("AmountConverter", () => {
  const displayPriceFns = {
    fromSats: (amount: Satoshis) => Number(amount * 2n) as DisplayCurrencyBaseAmount,
    fromCents: (amount: UsdCents) => Number(amount * 20n) as DisplayCurrencyBaseAmount,
  }

  const dealerFns = {
    buyUsd: async (amount: Satoshis): Promise<UsdCents> =>
      BigInt(Math.floor(Number(amount) / 10.02)) as UsdCents,
    buyUsdFromCents: async (amount: UsdCents): Promise<Satoshis> =>
      BigInt(Math.floor(Number(amount) * 9.98)) as Satoshis,
    sellUsd: async (amount: UsdCents) =>
      BigInt(Math.floor(Number(amount) * 10.02)) as Satoshis,
    sellUsdFromSats: async (amount: Satoshis): Promise<UsdCents> =>
      BigInt(Math.floor(Number(amount) / 9.98)) as UsdCents,
  }

  describe("getAmountsReceive", () => {
    it("BTC wallet receives BTC", async () => {
      const converter = AmountConverter({
        displayPriceFns,
        dealerFns,
      })
      const walletCurrency = WalletCurrency.Btc
      const sats = toSats(100_000n)
      const amounts = await converter.getAmountsReceive({
        walletCurrency,
        sats,
      })
      expect(amounts).toEqual(
        expect.objectContaining({
          sats: 100_000n,
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
      const sats = toSats(100_000n)
      const amounts = await converter.getAmountsReceive({
        walletCurrency,
        sats,
      })
      expect(amounts).toEqual(
        expect.objectContaining({
          sats,
          cents: 9_980n,
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
      const cents = toCents(10_000n)
      const amounts = await converter.getAmountsReceive({
        walletCurrency,
        cents,
      })
      expect(amounts).toEqual(
        expect.objectContaining({
          sats: 99_800n,
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
      const sats = toSats(100_000n)
      const amounts = await converter.getAmountsSend({ walletCurrency, sats })
      expect(amounts).toEqual(
        expect.objectContaining({
          sats: 100_000n,
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
      const sats = toSats(100_000n)
      const amounts = await converter.getAmountsSend({ walletCurrency, sats })
      expect(amounts).toEqual(
        expect.objectContaining({
          sats: 100_000n,
          cents: 10_020n,
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
      const cents = toCents(10_000n)
      const amounts = await converter.getAmountsSend({ walletCurrency, cents })
      expect(amounts).toEqual(
        expect.objectContaining({
          sats: 10_0200n,
          cents,
          amountDisplayCurrency: 200_000,
        }),
      )
    })
  })
  it("dealer buys low", async () => {
    {
      const sats = 10_000n as Satoshis
      const result = await dealerFns.buyUsd(sats)
      expect(result).toBeLessThan(Number(sats) / 10)
    }
    {
      const cents = 1_000n as UsdCents
      const result = await dealerFns.buyUsdFromCents(cents)
      expect(result).toBeLessThan(Number(cents) * 10)
    }
  })
  it("dealer sell high", async () => {
    {
      const cents = 1_000n as UsdCents
      const result = await dealerFns.sellUsd(cents)
      expect(result).toBeGreaterThan(Number(cents) * 10)
    }
    {
      const sats = 10_000n as Satoshis
      const result = await dealerFns.sellUsdFromSats(sats)
      expect(result).toBeGreaterThan(Number(sats) / 10)
    }
  })
})
