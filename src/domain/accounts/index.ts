import { toSats } from "@domain/bitcoin"
import {
  InvalidCoordinatesError,
  InvalidBusinessTitleLengthError,
  InvalidAccountStatusError,
  InvalidUsername,
  InvalidContactAlias,
  InvalidWithdrawFeeError,
} from "@domain/errors"

export * from "./errors"
export * from "./limits-checker"
export * from "./new-limits-checker"
export * from "./account-validator"

export const AccountLevel = {
  One: 1,
  Two: 2,
} as const

export const AccountStatus = {
  Locked: "locked",
  Active: "active",
} as const

export const checkedCoordinates = ({
  latitude,
  longitude,
}: {
  latitude: number
  longitude: number
}) => {
  if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
    return new InvalidCoordinatesError()
  }
  const coordinates: Coordinates = { latitude, longitude }
  return coordinates
}

export const checkedMapTitle = (title: string) => {
  if (title.length < 3 || title.length > 100) {
    return new InvalidBusinessTitleLengthError()
  }
  return title as BusinessMapTitle
}

export const checkedAccountStatus = (status: string) => {
  if (!Object.values(AccountStatus).includes(status as AccountStatus)) {
    return new InvalidAccountStatusError()
  }
  return status as AccountStatus
}

export const UsernameRegex = /(?!^(1|3|bc1|lnbc1))^[0-9a-z_]{3,50}$/i

export const checkedToUsername = (username: string): Username | ValidationError => {
  if (!username.match(UsernameRegex)) {
    return new InvalidUsername(username)
  }
  return username as Username
}

export const ContactAliasRegex = /^[0-9A-Za-z_]{3,50}$/i

export const checkedToContactAlias = (alias: string): ContactAlias | ValidationError => {
  if (!alias.match(ContactAliasRegex)) {
    return new InvalidContactAlias(alias)
  }
  return alias as ContactAlias
}

const minWithdrawalFeeAccount = toSats(0)
const maxWithdrawalFeeAccount = toSats(100_000)

export const sanityCheckedDefaultAccountWithdrawFee = (
  fee: number,
): Satoshis | ValidationError => {
  if (fee < minWithdrawalFeeAccount || fee > maxWithdrawalFeeAccount) {
    return new InvalidWithdrawFeeError(fee.toString())
  }
  return toSats(fee)
}
