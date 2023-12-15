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
  OneDay: "OneDay",
  OneWeek: "OneWeek",
  OneMonth: "OneMonth",
  OneYear: "OneYear",
  FiveYears: "FiveYears",
} as const
