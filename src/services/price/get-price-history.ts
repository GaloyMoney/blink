import { PriceRange, UnknownPriceServiceError } from "@domain/price"
import { PriceHistory } from "./schema"

export const getPriceHistory = async ({
  pair,
  exchange,
  range,
  interval,
}: GetPriceHistoryArgs): Promise<Tick[] | PriceServiceError> => {
  const startDate = new Date(getRangeStartDate(range))
  const endDate = new Date()

  const query = [
    { $match: { "pair.name": pair, "pair.exchange.name": exchange } },
    { $unwind: "$pair.exchange.price" },
    { $match: { "pair.exchange.price._id": { $gte: startDate, $lt: endDate } } },
    {
      $group: {
        _id: {
          $toDate: {
            $subtract: [
              { $toLong: "$pair.exchange.price._id" },
              { $mod: [{ $toLong: "$pair.exchange.price._id" }, interval] },
            ],
          },
        },
        o: { $last: "$pair.exchange.price.o" },
      },
    },
    { $sort: { _id: 1 } },
  ]

  try {
    const result = await PriceHistory.aggregate(query)
    return result.map((t: { _id: Date; o: UsdPerSat }) => ({ date: t._id, price: t.o }))
  } catch (err) {
    return new UnknownPriceServiceError(err)
  }
}

const getRangeStartDate = (range: PriceRange): number => {
  const startDate = new Date(Date.now())
  const resetHours = (date: Date) => date.setHours(0, 0, 0, 0)
  switch (range) {
    case PriceRange.OneDay:
      return startDate.setHours(startDate.getHours() - 24)
    case PriceRange.OneWeek:
      startDate.setHours(startDate.getHours() - 24 * 7)
      return resetHours(startDate)
    case PriceRange.OneMonth:
      startDate.setMonth(startDate.getMonth() - 1)
      return resetHours(startDate)
    case PriceRange.OneYear:
      startDate.setMonth(startDate.getMonth() - 12)
      return resetHours(startDate)
    case PriceRange.FiveYears:
      startDate.setMonth(startDate.getMonth() - 60)
      return resetHours(startDate)
  }
}
