import { DealerPriceService } from "test/mocks/dealer-price"

const dealerFns = DealerPriceService()

describe("testing dealer mock", () => {
  it("dealer buys low", async () => {
    {
      const sats = 10_000 as Satoshis
      const result = await dealerFns.getCentsFromSatsForImmediateBuy(sats)
      expect(result).toBeLessThan(Number(sats) / 20)
    }
    {
      const cents = 1_000 as UsdCents
      const result = await dealerFns.getSatsFromCentsForImmediateBuy(cents)
      expect(result).toBeLessThan(Number(cents) * 20)
    }
  })
  it("dealer sell high", async () => {
    {
      const cents = 1_000 as UsdCents
      const result = await dealerFns.getSatsFromCentsForImmediateSell(cents)
      expect(result).toBeGreaterThan(Number(cents) * 20)
    }
    {
      const sats = 1_000_000 as Satoshis
      const result = await dealerFns.getCentsFromSatsForImmediateSell(sats)
      expect(result).toBeGreaterThan(Number(sats) / 20)
    }
  })
})
