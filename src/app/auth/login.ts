import { updateAccountStatus } from "@app/accounts"
import { createAccountForEmailIdentifier } from "@app/accounts/create-account"
import {
  getDefaultAccountsConfig,
  getFailedLoginAttemptPerIpLimits,
  getFailedLoginAttemptPerPhoneLimits,
  getTestAccounts,
  getTwilioConfig,
} from "@config"
import { TwilioClient } from "@services/twilio"

import { AccountLevel, AccountStatus, checkedToUserId } from "@domain/accounts"
import { TestAccountsChecker } from "@domain/accounts/test-accounts-checker"
import { LikelyNoUserWithThisPhoneExistError } from "@domain/authentication/errors"

import {
  CouldNotFindAccountFromKratosIdError,
  CouldNotListWalletsFromWalletCurrencyError,
  NotImplementedError,
} from "@domain/errors"
import { RateLimitConfig, RateLimitPrefix } from "@domain/rate-limit"
import { RateLimiterExceededError } from "@domain/rate-limit/errors"
import { checkedToEmailAddress } from "@domain/users"
import { AuthWithPhonePasswordlessService } from "@services/kratos"

import { PhoneCodeInvalidError } from "@domain/phone-provider"
import { LedgerService } from "@services/ledger"
import {
  AccountsRepository,
  UsersRepository,
  WalletsRepository,
} from "@services/mongoose"
import { RedisRateLimitService, consumeLimiter } from "@services/rate-limit"
import { addAttributesToCurrentSpan } from "@services/tracing"

import { Accounts, Payments } from "@app"
import { WalletCurrency } from "@domain/shared"
import { AuthWithDeviceAccountService } from "@services/kratos/auth-device-account"

export const loginWithPhoneToken = async ({
  phone,
  code,
  ip,
}: {
  phone: PhoneNumber
  code: PhoneCode
  ip: IpAddress
}): Promise<SessionToken | ApplicationError> => {
  {
    const limitOk = await checkFailedLoginAttemptPerIpLimits(ip)
    if (limitOk instanceof Error) return limitOk
  }

  {
    const limitOk = await checkFailedLoginAttemptPerPhoneLimits(phone)
    if (limitOk instanceof Error) return limitOk
  }

  // TODO:
  // add fibonachi on failed login
  // https://github.com/animir/node-rate-limiter-flexible/wiki/Overall-example#dynamic-block-duration

  const validCode = await isCodeValid({ phone, code })
  if (validCode instanceof Error) return validCode

  await rewardFailedLoginAttemptPerIpLimits(ip)
  await rewardFailedLoginAttemptPerPhoneLimits(phone)

  const authService = AuthWithPhonePasswordlessService()

  let kratosResult = await authService.loginToken({ phone })
  // FIXME: this is a fuzzy error.
  // it exists because we currently make no difference between a registration and login
  if (kratosResult instanceof LikelyNoUserWithThisPhoneExistError) {
    // user is a new user
    kratosResult = await authService.createIdentityWithSession({ phone })
    if (kratosResult instanceof Error) return kratosResult
    addAttributesToCurrentSpan({ "login.newAccount": true })
  } else if (kratosResult instanceof Error) {
    return kratosResult
  }
  return kratosResult.sessionToken
}

export const loginWithPhoneCookie = async ({
  phone,
  code,
  ip,
}: {
  phone: PhoneNumber
  code: PhoneCode
  ip: IpAddress
}): Promise<WithCookieResponse | ApplicationError> => {
  {
    const limitOk = await checkFailedLoginAttemptPerIpLimits(ip)
    if (limitOk instanceof Error) return limitOk
  }

  {
    const limitOk = await checkFailedLoginAttemptPerPhoneLimits(phone)
    if (limitOk instanceof Error) return limitOk
  }

  // TODO:
  // add fibonachi on failed login
  // https://github.com/animir/node-rate-limiter-flexible/wiki/Overall-example#dynamic-block-duration

  const validCode = await isCodeValid({ phone, code })
  if (validCode instanceof Error) return validCode

  await Promise.all([
    rewardFailedLoginAttemptPerIpLimits(ip),
    rewardFailedLoginAttemptPerPhoneLimits(phone),
  ])

  const authService = AuthWithPhonePasswordlessService()

  let kratosResult = await authService.loginCookie({ phone })
  // FIXME: this is a fuzzy error.
  // it exists because we currently make no difference between a registration and login
  if (kratosResult instanceof LikelyNoUserWithThisPhoneExistError) {
    // user is a new user
    kratosResult = await authService.createIdentityWithCookie({ phone })
    if (kratosResult instanceof Error) return kratosResult
    addAttributesToCurrentSpan({ "login.cookie.newAccount": true })
  }
  return kratosResult
}

export const loginUpgradeWithPhone = async ({
  phone,
  code,
  ip,
  account,
}: {
  authToken: SessionToken
  phone: PhoneNumber
  code: PhoneCode
  ip: IpAddress
  account: Account
}): Promise<SessionToken | ApplicationError> => {
  {
    const limitOk = await checkFailedLoginAttemptPerIpLimits(ip)
    if (limitOk instanceof Error) return limitOk
  }

  {
    const limitOk = await checkFailedLoginAttemptPerPhoneLimits(phone)
    if (limitOk instanceof Error) return limitOk
  }

  // TODO:
  // add fibonachi on failed login
  // https://github.com/animir/node-rate-limiter-flexible/wiki/Overall-example#dynamic-block-duration

  const validCode = await isCodeValid({ phone, code })
  if (validCode instanceof Error) return validCode

  await rewardFailedLoginAttemptPerIpLimits(ip)
  await rewardFailedLoginAttemptPerPhoneLimits(phone)

  // scenario 1 and 4 most common

  // scenario 1.
  // deviceAccount / zeroConfAccount
  // DeviceAccount has no tx. phone identity doesn't exist, domainAccount has no tx.
  //
  // --> migrate schema for the identity
  // don't deactivate orgDomainAccount
  // balance transfer not needed

  // scenario 2.
  // DeviceAccount has no tx. phone identity exist, domainAccount has no tx.
  //
  // --> no schema migration is needed
  // deactivate currentToken/orgDomainAccount
  // balance transfer not needed

  // scenario 3.
  // DeviceAccount has no tx. phone identity exist, domainAccount has tx.
  //
  // --> no schema migration is needed
  // deactivate currentToken/orgDomainAccount
  // balance transfer not needed

  // scenario 4.
  // DeviceAccount has tx, phone identity doesn't exist, domainAccount has no tx.
  // --> migrate schema for the identity
  // don't deactivate orgDomainAccount
  // balance transfer not needed

  // scenario 5.
  // DeviceAccount has tx, phone identity exist, domainAccount has no tx.
  // --> no schema migration is needed
  // deactivate currentToken/orgDomainAccount
  // balance transfer needed

  // scenario 6.
  // DeviceAccount has tx, phone identity exist, domainAccount has tx.
  // --> no schema migration is needed
  // deactivate currentToken/orgDomainAccount
  // balance transfer needed

  const authPhone = AuthWithPhonePasswordlessService()
  let kratosResult = await authPhone.loginToken({ phone })

  // FIXME: this is a fuzzy error.
  // it exists because we currently make no difference between a registration and login
  if (kratosResult instanceof LikelyNoUserWithThisPhoneExistError) {
    // user is a new user. "happy path"

    // scenario 1 or 4
    // upgrading current session

    kratosResult = await authPhone.createIdentityWithSession({ phone })
    if (kratosResult instanceof Error) return kratosResult

    const newAccount = await AccountsRepository().findByUserId(kratosResult.kratosUserId)
    if (newAccount instanceof Error) return newAccount

    const res2 = await Accounts.updateAccountLevel({ id: newAccount.id, level: 1 })
    if (res2 instanceof Error) return res2

    // TODO: need to modify the User collection to update the userId
    // and add the phone number

    addAttributesToCurrentSpan({
      "login.migrateFromBearerToPhoneWithNoExistingAccount": true,
    })
  } else if (kratosResult instanceof Error) {
    return kratosResult
  } else {
    const ledger = LedgerService()

    const newAccount = await AccountsRepository().findByUserId(kratosResult.kratosUserId)
    if (newAccount instanceof Error) return newAccount

    const newWallets = await WalletsRepository().listByAccountId(newAccount.id)
    if (newWallets instanceof Error) return newWallets

    const wallets = await WalletsRepository().listByAccountId(account.id)
    if (wallets instanceof Error) return wallets
    for (const wallet of wallets) {
      const balance = await ledger.getWalletBalance(wallet.id)
      if (balance instanceof Error) return balance

      if (balance > 0) {
        const recipientWallet = newWallets.find((w) => w.currency === wallet.currency)
        if (recipientWallet === undefined)
          return new CouldNotListWalletsFromWalletCurrencyError()
        const memo = "migration"

        if (wallet.currency === WalletCurrency.Btc) {
          const payment = await Payments.intraledgerPaymentSendWalletIdForBtcWallet({
            senderWalletId: wallet.id,
            recipientWalletId: recipientWallet.id,
            amount: balance,
            memo,
            senderAccount: account,
          })
          if (payment instanceof Error) return payment
        } else {
          const payment = await Payments.intraledgerPaymentSendWalletIdForUsdWallet({
            senderWalletId: wallet.id,
            recipientWalletId: recipientWallet.id,
            amount: balance,
            memo,
            senderAccount: account,
          })
          if (payment instanceof Error) return payment
        }
      }
    }

    const res = await updateAccountStatus({
      id: account.id,
      status: AccountStatus.Locked, // TODO: not necessarily lock it
      comment: "migration",
      updatedByUserId: account.kratosUserId,
    })
    if (res instanceof Error) return res

    // TODO: need to delete the associated UserId
  }

  // returning a new session token
  return kratosResult.sessionToken
}

export const loginUpgradeWithPhoneV2 = async ({
  phone,
  code,
  ip,
  account,
}: {
  authToken: SessionToken
  phone: PhoneNumber
  code: PhoneCode
  ip: IpAddress
  account: Account
}): Promise<SessionToken | ApplicationError> => {
  {
    const limitOk = await checkFailedLoginAttemptPerIpLimits(ip)
    if (limitOk instanceof Error) return limitOk
  }

  {
    const limitOk = await checkFailedLoginAttemptPerPhoneLimits(phone)
    if (limitOk instanceof Error) return limitOk
  }

  const validCode = await isCodeValid({ phone, code })
  if (validCode instanceof Error) return validCode

  await rewardFailedLoginAttemptPerIpLimits(ip)
  await rewardFailedLoginAttemptPerPhoneLimits(phone)

  /// Scenario 1) Happy Path - User logs in with device jwt, no phone account exists, upgrade device to phone account
  ///             kratos => update schema to phone_no_password_v0, remove device trait
  ///             mongo => update account to level 1
  ///                      update user collection and remove device field, add phone
  ///                      should we have a history table recording to upgrade?
  ///
  /// Scenario 2) Double Account Path (no txn) - User logs in with device jwt then he
  ///             wants to upgrade to a phone account that already exists. there are no txns on the device account
  ///             Tell the user to logout and log back in with the phone account
  ///
  /// Scenario 2.5) Double Account Path (txns) - User logs in with device jwt (and does some txns) then he
  ///             wants to upgrade to a phone account that already exists.
  ///             throw an error stating that a phone account already exists and the user needs to manually sweep funds
  ///             to the new account. Here are the steps the user need to perform:
  ///               1. login with phone account and create an invoice (save this invoice)
  ///               2. logout of the phone account
  ///               3. login with device account (it should auto login)
  ///               4  Pay the invoice with max wallet amount.
  ///               5. Logout of the device account
  ///               5. Log into the phone account and check for the funds
  ///
  /// Scenario 3) Unhappy path - User sells phone and forgets to sweep funds to phone account
  ///             Option 1 - too bad, we can't help them
  ///             Option 2 - create some kind of recovery code process?

  const kratosAccount = await AccountsRepository().findByUserId(account.kratosUserId)
  if (kratosAccount instanceof Error) return kratosAccount

  // Scenario 1
  // 1. update kratos
  const updatedKratosAccount = await AuthWithDeviceAccountService().upgradeToPhoneSchema({
    kratosUserId: account.kratosUserId,
    phone,
  })
  if (updatedKratosAccount instanceof Error) return new Error("updatedKratosAccount")
  // 2. update user
  const userRemovedDevice = await UsersRepository().unsetDeviceIdForUser(
    account.kratosUserId,
  )
  if (userRemovedDevice instanceof Error) return userRemovedDevice
  const userAddedPhone = await UsersRepository().update({
    id: account.kratosUserId,
    phone,
  })
  if (userAddedPhone instanceof Error) return userAddedPhone
  // 3. update account
  kratosAccount.level = AccountLevel.One
  const accountLevelOne = await AccountsRepository().update(kratosAccount)
  if (accountLevelOne instanceof Error) return accountLevelOne
  // End Scenario 1

  // returning a new session token
  const authPhone = AuthWithPhonePasswordlessService()
  const kratosResult = await authPhone.loginToken({ phone })
  if (kratosResult instanceof Error) return kratosResult
  return kratosResult.sessionToken
}

export const loginWithDevice = async ({
  jwt,
  ip,
}: {
  jwt: string
  ip: IpAddress
}): Promise<SessionToken | ApplicationError> => {
  {
    const limitOk = await checkFailedLoginAttemptPerIpLimits(ip)
    if (limitOk instanceof Error) return limitOk
  }

  // {
  //   const limitOk = await checkFailedLoginAttemptPerDeviceLimits(device)
  //   if (limitOk instanceof Error) return limitOk
  // }

  // TODO:
  // add fibonachi on failed login
  // https://github.com/animir/node-rate-limiter-flexible/wiki/Overall-example#dynamic-block-duration

  const authService = AuthWithDeviceAccountService()
  const decodedJwt = await authService.verifyJwt(jwt)
  if (decodedJwt instanceof Error) return decodedJwt
  const deviceId = decodedJwt.sub as DeviceToken

  await rewardFailedLoginAttemptPerIpLimits(ip)
  // await rewardFailedLoginAttemptPerDeviceLimits(device)

  let kratosResult = await authService.loginDeviceAccount({ deviceId })
  // FIXME: this is a fuzzy error.
  // it exists because we currently make no difference between a registration and login
  if (kratosResult instanceof LikelyNoUserWithThisPhoneExistError) {
    // user is a new user
    kratosResult = await authService.createDeviceIdentity({ deviceId })
    if (kratosResult instanceof Error) return kratosResult
    addAttributesToCurrentSpan({ "login.newAccount": true })
  } else if (kratosResult instanceof Error) {
    return kratosResult
  }
  return kratosResult.sessionToken
}

// deprecated
export const loginWithEmail = async ({
  kratosUserId,
  emailAddress,
  ip,
}: {
  kratosUserId: string
  emailAddress: string
  ip: IpAddress
}): Promise<{ accountStatus: string } | ApplicationError> => {
  const kratosUserIdValid = checkedToUserId(kratosUserId)
  if (kratosUserIdValid instanceof Error) return kratosUserIdValid

  const emailAddressValid = checkedToEmailAddress(emailAddress)
  if (emailAddressValid instanceof Error) return emailAddressValid

  {
    const limitOk = await checkFailedLoginAttemptPerIpLimits(ip)
    if (limitOk instanceof Error) return limitOk
  }

  {
    const limitOk = await checkfailedLoginAttemptPerEmailAddressLimits(emailAddressValid)
    if (limitOk instanceof Error) return limitOk
  }

  let account = await AccountsRepository().findByUserId(kratosUserIdValid)

  if (account instanceof CouldNotFindAccountFromKratosIdError) {
    addAttributesToCurrentSpan({ "login.newAccount": true })
    account = await createAccountForEmailIdentifier({
      kratosUserId: kratosUserIdValid,
      config: getDefaultAccountsConfig(),
    })
  }
  if (account instanceof Error) return account

  return {
    accountStatus: account.status.toUpperCase(),
  }
}

const checkFailedLoginAttemptPerIpLimits = async (
  ip: IpAddress,
): Promise<true | RateLimiterExceededError> =>
  consumeLimiter({
    rateLimitConfig: RateLimitConfig.failedLoginAttemptPerIp,
    keyToConsume: ip,
  })

const rewardFailedLoginAttemptPerIpLimits = async (
  ip: IpAddress,
): Promise<true | RateLimiterExceededError> => {
  const limiter = RedisRateLimitService({
    keyPrefix: RateLimitPrefix.failedLoginAttemptPerIp,
    limitOptions: getFailedLoginAttemptPerIpLimits(),
  })
  return limiter.reward(ip)
}

const checkFailedLoginAttemptPerPhoneLimits = async (
  phone: PhoneNumber,
): Promise<true | RateLimiterExceededError> =>
  consumeLimiter({
    rateLimitConfig: RateLimitConfig.failedLoginAttemptPerPhone,
    keyToConsume: phone,
  })

const rewardFailedLoginAttemptPerPhoneLimits = async (
  phone: PhoneNumber,
): Promise<true | RateLimiterExceededError> => {
  const limiter = RedisRateLimitService({
    keyPrefix: RateLimitPrefix.failedLoginAttemptPerPhone,
    limitOptions: getFailedLoginAttemptPerPhoneLimits(),
  })

  return limiter.reward(phone)
}

const checkfailedLoginAttemptPerEmailAddressLimits = async (
  emailAddress: EmailAddress,
): Promise<true | RateLimiterExceededError> =>
  consumeLimiter({
    rateLimitConfig: RateLimitConfig.failedLoginAttemptPerEmailAddress,
    keyToConsume: emailAddress,
  })

export const isCodeValid = async ({
  code,
  phone,
}: {
  phone: PhoneNumber
  code: PhoneCode
}) => {
  const testAccounts = getTestAccounts()
  if (TestAccountsChecker(testAccounts).isPhoneValid(phone)) {
    const validTestCode = TestAccountsChecker(testAccounts).isPhoneAndCodeValid({
      code,
      phone,
    })
    if (!validTestCode) {
      return new PhoneCodeInvalidError()
    }
    return true
  }

  // we can't mock this function properly because in the e2e test,
  // the server is been launched as a sub process,
  // so it's not been mocked by jest
  if (getTwilioConfig().accountSid === "AC_twilio_id") {
    return new NotImplementedError("use test account for local dev and tests")
  }

  return TwilioClient().validateVerify({ to: phone, code })
}
