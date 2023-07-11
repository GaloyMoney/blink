import { createAccountForDeviceAccount } from "@app/accounts/create-account"

import {
  EmailNotVerifiedError,
  IdentifierNotFoundError,
} from "@domain/authentication/errors"

import {
  checkedToDeviceId,
  checkedToIdentityPassword,
  checkedToIdentityUsername,
} from "@domain/users"
import {
  AuthWithPhonePasswordlessService,
  AuthWithUsernamePasswordDeviceIdService,
  AuthWithEmailPasswordlessService,
  PhoneAccountAlreadyExistsNeedToSweepFundsError,
  IdentityRepository,
} from "@services/kratos"

import { LedgerService } from "@services/ledger"
import { WalletsRepository } from "@services/mongoose"
import { addAttributesToCurrentSpan } from "@services/tracing"

import { upgradeAccountFromDeviceToPhone } from "@app/accounts"
import { checkedToEmailCode } from "@domain/authentication"
import { isPhoneCodeValid } from "@services/twilio"

import {
  checkFailedLoginAttemptPerIpLimits,
  checkFailedLoginAttemptPerLoginIdentifierLimits,
  rewardFailedLoginAttemptPerIpLimits,
  rewardFailedLoginAttemptPerLoginIdentifierLimits,
} from "./ratelimits"

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
    const limitOk = await checkFailedLoginAttemptPerLoginIdentifierLimits(phone)
    if (limitOk instanceof Error) return limitOk
  }

  // TODO:
  // add fibonachi on failed login
  // https://github.com/animir/node-rate-limiter-flexible/wiki/Overall-example#dynamic-block-duration

  const validCode = await isPhoneCodeValid({ phone, code })
  if (validCode instanceof Error) return validCode

  await rewardFailedLoginAttemptPerIpLimits(ip)
  await rewardFailedLoginAttemptPerLoginIdentifierLimits(phone)

  const authService = AuthWithPhonePasswordlessService()

  const identities = IdentityRepository()
  const userId = await identities.getUserIdFromIdentifier(phone)

  if (userId instanceof IdentifierNotFoundError) {
    // user is a new user
    // this branch exists because we currently make no difference between a registration and login
    addAttributesToCurrentSpan({ "login.newAccount": true })

    const kratosResult = await authService.createIdentityWithSession({ phone })
    if (kratosResult instanceof Error) return kratosResult

    return kratosResult.sessionToken
  }

  if (userId instanceof Error) return userId

  const kratosResult = await authService.loginToken({ phone })
  if (kratosResult instanceof Error) return kratosResult
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
    const limitOk = await checkFailedLoginAttemptPerLoginIdentifierLimits(phone)
    if (limitOk instanceof Error) return limitOk
  }

  // TODO:
  // add fibonachi on failed login
  // https://github.com/animir/node-rate-limiter-flexible/wiki/Overall-example#dynamic-block-duration

  const validCode = await isPhoneCodeValid({ phone, code })
  if (validCode instanceof Error) return validCode

  await Promise.all([
    rewardFailedLoginAttemptPerIpLimits(ip),
    rewardFailedLoginAttemptPerLoginIdentifierLimits(phone),
  ])

  const authService = AuthWithPhonePasswordlessService()

  const identities = IdentityRepository()
  const userId = await identities.getUserIdFromIdentifier(phone)

  if (userId instanceof IdentifierNotFoundError) {
    // user is a new user
    // this branch exists because we currently make no difference between a registration and login
    addAttributesToCurrentSpan({ "login.newAccount": true })

    const kratosResult = await authService.createIdentityWithCookie({ phone })
    if (kratosResult instanceof Error) return kratosResult

    return kratosResult
  }

  if (userId instanceof Error) return userId

  const kratosResult = await authService.loginCookie({ phone })
  if (kratosResult instanceof Error) return kratosResult
  return kratosResult
}

export const loginWithEmail = async ({
  emailFlowId,
  code: codeRaw,
  ip,
}: {
  emailFlowId: EmailFlowId
  code: EmailCode
  ip: IpAddress
}): Promise<LoginWithEmailResult | ApplicationError> => {
  {
    const limitOk = await checkFailedLoginAttemptPerIpLimits(ip)
    if (limitOk instanceof Error) return limitOk
  }

  const code = checkedToEmailCode(codeRaw)
  if (code instanceof Error) return code

  const authServiceEmail = AuthWithEmailPasswordlessService()

  const validateCodeRes = await authServiceEmail.validateCode({
    code,
    emailFlowId,
  })
  if (validateCodeRes instanceof Error) return validateCodeRes

  const email = validateCodeRes.email
  const totpRequired = validateCodeRes.totpRequired

  const isEmailVerified = await authServiceEmail.isEmailVerified({ email })
  if (isEmailVerified instanceof Error) return isEmailVerified
  if (isEmailVerified === false) return new EmailNotVerifiedError()

  await rewardFailedLoginAttemptPerIpLimits(ip)

  const res = await authServiceEmail.loginToken({ email })
  if (res instanceof Error) throw res
  return { sessionToken: res.sessionToken, totpRequired }
}

export const loginDeviceUpgradeWithPhone = async ({
  phone,
  code,
  ip,
  account,
}: {
  phone: PhoneNumber
  code: PhoneCode
  ip: IpAddress
  account: Account
}): Promise<LoginDeviceUpgradeWithPhoneResult | ApplicationError> => {
  {
    const limitOk = await checkFailedLoginAttemptPerIpLimits(ip)
    if (limitOk instanceof Error) return limitOk
  }
  {
    const limitOk = await checkFailedLoginAttemptPerLoginIdentifierLimits(phone)
    if (limitOk instanceof Error) return limitOk
  }

  const validCode = await isPhoneCodeValid({ phone, code })
  if (validCode instanceof Error) return validCode

  await rewardFailedLoginAttemptPerIpLimits(ip)
  await rewardFailedLoginAttemptPerLoginIdentifierLimits(phone)

  const identities = IdentityRepository()
  const userId = await identities.getUserIdFromIdentifier(phone)

  // Happy Path - phone account does not exist
  if (userId instanceof IdentifierNotFoundError) {
    // a. create kratos account
    // b. and c. migrate account/user collection in mongo via kratos/registration webhook

    const success = await AuthWithUsernamePasswordDeviceIdService().upgradeToPhoneSchema({
      phone,
      userId: account.kratosUserId,
    })
    if (success instanceof Error) return success

    const res = await upgradeAccountFromDeviceToPhone({
      userId: account.kratosUserId,
      phone,
    })
    if (res instanceof Error) return res
    return { success }
  }

  // Complex path - Phone account already exists
  // is there still txns left over on the device account?
  const deviceWallets = await WalletsRepository().listByAccountId(account.id)
  if (deviceWallets instanceof Error) return deviceWallets
  const ledger = LedgerService()
  let deviceAccountHasBalance = false
  for (const wallet of deviceWallets) {
    const balance = await ledger.getWalletBalance(wallet.id)
    if (balance instanceof Error) return balance
    if (balance > 0) {
      deviceAccountHasBalance = true
    }
  }
  if (deviceAccountHasBalance) return new PhoneAccountAlreadyExistsNeedToSweepFundsError()

  // no txns on device account but phone account exists, just log the user in with the phone account
  const authService = AuthWithPhonePasswordlessService()
  const kratosResult = await authService.loginToken({ phone })
  if (kratosResult instanceof Error) return kratosResult
  return { success: true, sessionToken: kratosResult.sessionToken }
}

export const loginWithDevice = async ({
  username: usernameRaw,
  password: passwordRaw,
  ip,
  deviceId: deviceIdRaw,
}: {
  ip: IpAddress
  username: string
  password: string
  deviceId: string
}): Promise<SessionToken | ApplicationError> => {
  {
    const limitOk = await checkFailedLoginAttemptPerIpLimits(ip)
    if (limitOk instanceof Error) return limitOk
  }

  const deviceId = checkedToDeviceId(deviceIdRaw)
  if (deviceId instanceof Error) return deviceId

  const username = checkedToIdentityUsername(usernameRaw)
  if (username instanceof Error) return username

  const password = checkedToIdentityPassword(passwordRaw)
  if (password instanceof Error) return password

  const authService = AuthWithUsernamePasswordDeviceIdService()
  const res = await authService.createIdentityWithSession({
    username,
    password,
  })
  if (res instanceof Error) return res

  if (res.newEntity) {
    const account = await createAccountForDeviceAccount({
      userId: res.kratosUserId,
      deviceId,
    })
    if (account instanceof Error) return account
  }

  return res.sessionToken
}
