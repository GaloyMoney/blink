export * from "./errors"

const oneHourMs = 1000 * 60 * 60
const oneDayMs = oneHourMs * 24

export const PriceInterval = {
  OneHour: oneHourMs,
  FourHours: oneHourMs * 4,
  OneDay: oneDayMs,
  OneWeek: oneDayMs * 7,
  OneMonth: oneDayMs * 30,
} as const

export const PriceRange = {
  OneDay: "1d",
  OneWeek: "1w",
  OneMonth: "1m",
  OneYear: "1y",
  FiveYears: "5y",
} as const
