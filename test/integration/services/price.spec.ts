import { PriceService } from "@services/price"
import { PriceRange, PriceInterval } from "@domain/price"

describe("Price", () => {
  describe("listHistory", () => {
    const rangesIntervalsToTest = [
      { range: PriceRange.OneDay, interval: PriceInterval.OneHour, ticks: 23 },
      { range: PriceRange.OneWeek, interval: PriceInterval.FourHours, ticks: 42 },
      { range: PriceRange.OneMonth, interval: PriceInterval.OneDay, ticks: 30 },
      { range: PriceRange.OneYear, interval: PriceInterval.OneWeek, ticks: 52 },
    ]
    rangesIntervalsToTest.forEach(({ range, interval, ticks }) => {
      it(`returns ${range} history with ${interval} interval`, async () => {
        const prices = await PriceService().listHistory(range, interval)
        if (prices instanceof Error) throw prices

        expect(prices.length).toBeGreaterThanOrEqual(ticks)

        expect(prices).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              date: expect.any(Date),
              price: expect.any(Number),
            }),
          ]),
        )

        for (let i = 1; i < prices.length; i++) {
          const diffDate = prices[i].date.getTime() - prices[i - 1].date.getTime()
          expect(diffDate).toBe(interval)
        }
      })
    })
  })
})
