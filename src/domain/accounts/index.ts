import { toSats } from "@domain/bitcoin"
import {
  InvalidCoordinatesError,
  InvalidBusinessTitleLengthError,
  InvalidAccountStatusError,
  InvalidUsername,
  InvalidContactAlias,
  InvalidWithdrawFeeError,
  InvalidUserId,
  InvalidAccountLevelError,
} from "@domain/errors"

import { InvalidAccountIdError } from "./errors"

import { AccountLevel, AccountStatus } from "./primitives"

export * from "./errors"
export * from "./limits-checker"
export * from "./account-validator"
export * from "./primitives"

const KratosUserIdRegex =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

// device id format from AppCheck: 1:72279297366:android:35666807ae916c5aa75af7
const DeviceIdRegex = /^[0-9]+:[0-9]+:[a-z]+:[0-9a-z]+$/i

export const checkedToUserId = (userId: string): UserId | ValidationError => {
  if (userId.match(KratosUserIdRegex)) {
    return userId as UserId
  }
  if (userId.match(DeviceIdRegex)) {
    return userId as UserId
  }
  return new InvalidUserId(userId)
}

export const isDeviceId = (deviceId: string) => {
  return deviceId.match(DeviceIdRegex)
}

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
    return new InvalidAccountStatusError(status)
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

export const checkedToAccountId = (
  accountId: string,
): AccountId | InvalidAccountIdError => {
  if (accountId.length !== 24) {
    // TODO: move to a uuid-v4
    return new InvalidAccountIdError(accountId)
  }
  return accountId as AccountId
}

export const checkedToAccountLevel = (level: number): AccountLevel | ValidationError => {
  if (Object.values<number>(AccountLevel).includes(level)) return level as AccountLevel
  return new InvalidAccountLevelError()
}
