import { InvalidMinutesError } from "@/domain/errors"

export const toSeconds = (seconds: number): Seconds => {
  return seconds as Seconds
}

export const toDays = (days: number): Days => {
  return days as Days
}

export const checkedToMinutes = (minutes: number): Minutes | ValidationError => {
  const isMinutes = Number.isInteger(minutes) && minutes >= 0
  if (!isMinutes) return new InvalidMinutesError(`Invalid value for minutes: ${minutes}`)
  return minutes as Minutes
}
