import {
  checkFailedLoginAttemptPerIpLimits,
  checkLoginAttemptPerLoginIdentifierLimits,
  rewardFailedLoginAttemptPerIpLimits,
} from "./ratelimits"

import { activateInvitedAccount } from "./activate-invited-account"
import { getPhoneMetadata } from "./get-phone-metadata"

import { upgradeAccountFromDeviceToPhone } from "@/app/accounts"

import {
  createAccountForDeviceAccount,
  createAccountWithPhoneIdentifier,
} from "@/app/accounts/create-account"
import {
  checkedToEmailCode,
  telegramPassportLoginKey,
  telegramPassportRequestKey,
} from "@/domain/authentication"

import { getAccountsOnboardConfig, getDefaultAccountsConfig } from "@/config"

import {
  EmailUnverifiedError,
  IdentifierNotFoundError,
  InvalidNoncePhoneTelegramPassportError,
  InvalidNonceTelegramPassportError,
  WaitingDataTelegramPassportError,
} from "@/domain/authentication/errors"
import { ChannelType, checkedToChannel } from "@/domain/phone-provider"
import {
  checkedToDeviceId,
  checkedToIdentityPassword,
  checkedToIdentityUsername,
} from "@/domain/users"

import {
  AuthWithEmailPasswordlessService,
  AuthWithPhonePasswordlessService,
  AuthWithUsernamePasswordDeviceIdService,
  IdentityRepository,
} from "@/services/kratos"
import { LedgerService } from "@/services/ledger"
import { WalletsRepository } from "@/services/mongoose"
import {
  addAttributesToCurrentSpan,
  recordExceptionInCurrentSpan,
} from "@/services/tracing"
import { isPhoneCodeValid } from "@/services/twilio-service"

import { IPMetadataAuthorizer } from "@/domain/accounts-ips/ip-metadata-authorizer"

import {
  InvalidIpMetadataError,
  MissingIPMetadataError,
  UnauthorizedIPForOnboardingError,
} from "@/domain/errors"
import { IpFetcher } from "@/services/ipfetcher"

import { IpFetcherServiceError } from "@/domain/ipfetcher"
import { PhoneAccountAlreadyExistsNeedToSweepFundsError } from "@/domain/kratos"
import { RateLimitConfig } from "@/domain/rate-limit"
import { RateLimiterExceededError } from "@/domain/rate-limit/errors"
import { ErrorLevel } from "@/domain/shared"
import { consumeLimiter } from "@/services/rate-limit"

import { RedisCacheService } from "@/services/cache"

const redisCache = RedisCacheService()

export const loginWithPhoneToken = async ({
  phone,
  code,
  ip,
}: {
  phone: PhoneNumber
  code: PhoneCode
  ip: IpAddress
}): Promise<LoginWithPhoneTokenResult | ApplicationError> => {
  {
    const limitOk = await checkFailedLoginAttemptPerIpLimits(ip)
    if (limitOk instanceof Error) return limitOk
  }

  {
    const limitOk = await checkLoginAttemptPerLoginIdentifierLimits(phone)
    if (limitOk instanceof Error) return limitOk
  }

  // TODO:
  // add fibonachi on failed login
  // https://github.com/animir/node-rate-limiter-flexible/wiki/Overall-example#dynamic-block-duration

  const validCode = await isPhoneCodeValid({ phone, code })
  if (validCode instanceof Error) return validCode

  await rewardFailedLoginAttemptPerIpLimits(ip)

  const authService = AuthWithPhonePasswordlessService()

  const identities = IdentityRepository()
  const userId = await identities.getUserIdFromIdentifier(phone)

  if (userId instanceof IdentifierNotFoundError) {
    // user is a new user
    // this branch exists because we currently make no difference between a registration and login
    addAttributesToCurrentSpan({ "login.newAccount": true })

    const phoneMetadata = await isAllowedToOnboard({ ip, phone })
    if (phoneMetadata instanceof Error) return phoneMetadata

    const kratosResult = await authService.createIdentityWithSession({
      phone,
      phoneMetadata,
    })
    if (kratosResult instanceof Error) return kratosResult
    const { kratosUserId } = kratosResult

    const account = await createAccountWithPhoneIdentifier({
      newAccountInfo: { phone, kratosUserId },
      config: getDefaultAccountsConfig(),
      phoneMetadata,
    })
    if (account instanceof Error) {
      recordExceptionInCurrentSpan({
        error: account,
        level: ErrorLevel.Critical,
        attributes: {
          userId: kratosUserId,
          phone,
        },
      })
      return account
    }

    return {
      authToken: kratosResult.authToken,
      totpRequired: false,
      id: kratosResult.kratosUserId,
    }
  }

  if (userId instanceof Error) return userId

  const activeAccount = await activateInvitedAccount(userId)
  if (activeAccount instanceof Error) return activeAccount

  const kratosResult = await authService.loginToken({ phone })
  if (kratosResult instanceof Error) return kratosResult

  // if kratosUserId is not returned, it means that 2fa is required
  const totpRequired = !kratosResult.kratosUserId
  const id = kratosResult.kratosUserId as UserId

  return {
    authToken: kratosResult.authToken,
    totpRequired,
    id,
  }
}

export const loginWithEmailToken = async ({
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
  if (isEmailVerified === false) return new EmailUnverifiedError()

  await rewardFailedLoginAttemptPerIpLimits(ip)

  const res = await authServiceEmail.loginToken({ email })
  if (res instanceof Error) return res
  return { authToken: res.authToken, totpRequired, id: res.kratosUserId }
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
    const limitOk = await checkLoginAttemptPerLoginIdentifierLimits(phone)
    if (limitOk instanceof Error) return limitOk
  }

  const validCode = await isPhoneCodeValid({ phone, code })
  if (validCode instanceof Error) return validCode

  await rewardFailedLoginAttemptPerIpLimits(ip)

  const identities = IdentityRepository()
  const userId = await identities.getUserIdFromIdentifier(phone)

  // Happy Path - phone account does not exist
  if (userId instanceof IdentifierNotFoundError) {
    // a. create kratos account
    // b. and c. migrate account/user collection in mongo via kratos/registration webhook

    // check if account is upgradeable
    const phoneMetadata = await isAllowedToOnboard({ ip, phone })
    if (phoneMetadata instanceof Error) return phoneMetadata

    const success = await AuthWithUsernamePasswordDeviceIdService().upgradeToPhoneSchema({
      phone,
      userId: account.kratosUserId,
    })
    if (success instanceof Error) return success

    const res = await upgradeAccountFromDeviceToPhone({
      userId: account.kratosUserId,
      phone,
      phoneMetadata,
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
  return { success: true, authToken: kratosResult.authToken }
}

export const loginTelegramPassportNonceWithPhone = async ({
  phone,
  nonce,
  ip,
}: {
  phone: PhoneNumber
  nonce: TelegramPassportNonce
  ip: IpAddress
}): Promise<LoginWithPhoneTokenResult | ApplicationError> => {
  const isValidPhoneForChannel = checkedToChannel(phone, ChannelType.Telegram)
  if (isValidPhoneForChannel instanceof Error) return isValidPhoneForChannel

  {
    const limitOk = await checkFailedLoginAttemptPerIpLimits(ip)
    if (limitOk instanceof Error) return limitOk
  }

  {
    const limitOk = await checkLoginAttemptPerLoginIdentifierLimits(phone)
    if (limitOk instanceof Error) return limitOk
  }

  const loginKey = telegramPassportLoginKey(nonce)
  const phoneNumberFromNonce = await redisCache.get<PhoneNumber>({ key: loginKey })
  if (phoneNumberFromNonce instanceof Error) {
    // if it is valid telegram has not sent data to the webhook
    const requestKey = telegramPassportRequestKey(nonce)
    const validRequestNonce = await redisCache.get<PhoneNumber>({ key: requestKey })
    if (validRequestNonce instanceof Error)
      return new InvalidNonceTelegramPassportError(nonce)

    return new WaitingDataTelegramPassportError(nonce)
  }

  if (phoneNumberFromNonce !== phone) {
    return new InvalidNoncePhoneTelegramPassportError(nonce)
  }

  // invalidate login with the same nonce
  await redisCache.clear({ key: loginKey })

  await rewardFailedLoginAttemptPerIpLimits(ip)

  const authService = AuthWithPhonePasswordlessService()

  const identities = IdentityRepository()
  const userId = await identities.getUserIdFromIdentifier(phone)

  if (userId instanceof IdentifierNotFoundError) {
    // user is a new user
    // this branch exists because we currently make no difference between a registration and login
    addAttributesToCurrentSpan({ "login.newAccount": true })

    const phoneMetadata = await isAllowedToOnboard({ ip, phone })
    if (phoneMetadata instanceof Error) return phoneMetadata

    const kratosResult = await authService.createIdentityWithSession({
      phone,
      phoneMetadata,
    })
    if (kratosResult instanceof Error) return kratosResult
    const { kratosUserId } = kratosResult

    const account = await createAccountWithPhoneIdentifier({
      newAccountInfo: { phone, kratosUserId },
      config: getDefaultAccountsConfig(),
      phoneMetadata,
    })
    if (account instanceof Error) {
      recordExceptionInCurrentSpan({
        error: account,
        level: ErrorLevel.Critical,
        attributes: {
          userId: kratosUserId,
          phone,
        },
      })
      return account
    }

    return {
      authToken: kratosResult.authToken,
      totpRequired: false,
      id: kratosResult.kratosUserId,
    }
  }

  if (userId instanceof Error) return userId

  const activeAccount = await activateInvitedAccount(userId)
  if (activeAccount instanceof Error) return activeAccount

  const kratosResult = await authService.loginToken({ phone })
  if (kratosResult instanceof Error) return kratosResult

  // if kratosUserId is not returned, it means that 2fa is required
  const totpRequired = !kratosResult.kratosUserId
  const id = kratosResult.kratosUserId as UserId

  return {
    authToken: kratosResult.authToken,
    totpRequired,
    id,
  }
}

export const loginWithDevice = async ({
  username: usernameRaw,
  password: passwordRaw,
  deviceId: deviceIdRaw,
  appcheckJti,
  ip,
}: {
  username: string
  password: string
  deviceId: string
  appcheckJti: string
  ip: IpAddress
}): Promise<AuthToken | ApplicationError> => {
  {
    const limitOk = await checkFailedLoginAttemptPerIpLimits(ip)
    if (limitOk instanceof Error) return limitOk
  }

  const check = await checkDeviceLoginAttemptPerAppcheckJtiLimits(
    appcheckJti as AppcheckJti,
  )

  if (check instanceof Error) return check

  const deviceId = checkedToDeviceId(deviceIdRaw)
  if (deviceId instanceof Error) return deviceId

  const username = checkedToIdentityUsername(usernameRaw)
  if (username instanceof Error) return username

  const password = checkedToIdentityPassword(passwordRaw)
  if (password instanceof Error) return password

  const { ipMetadataValidationSettings } = getAccountsOnboardConfig()

  if (ipMetadataValidationSettings.enabled) {
    const ipFetcherInfo = await IpFetcher().fetchIPInfo(ip)

    if (ipFetcherInfo instanceof IpFetcherServiceError) {
      recordExceptionInCurrentSpan({
        error: ipFetcherInfo,
        level: ErrorLevel.Critical,
        attributes: { ip },
      })
      return ipFetcherInfo
    }

    const authorizedIPMetadata = IPMetadataAuthorizer(
      ipMetadataValidationSettings,
    ).authorize(ipFetcherInfo)

    if (authorizedIPMetadata instanceof Error) {
      if (authorizedIPMetadata instanceof MissingIPMetadataError)
        return new InvalidIpMetadataError(authorizedIPMetadata)

      return new UnauthorizedIPForOnboardingError(authorizedIPMetadata)
    }
  }

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

  return res.authToken
}

const isAllowedToOnboard = async ({
  ip,
  phone,
}: {
  ip: IpAddress
  phone: PhoneNumber
}): Promise<PhoneMetadata | undefined | DomainError> => {
  const { phoneMetadataValidationSettings, ipMetadataValidationSettings } =
    getAccountsOnboardConfig()

  addAttributesToCurrentSpan({
    "login.phoneMetadataValidation": phoneMetadataValidationSettings.enabled,
  })
  addAttributesToCurrentSpan({
    "login.ipMetadataValidation": ipMetadataValidationSettings.enabled,
  })

  if (ipMetadataValidationSettings.enabled) {
    const ipFetcherInfo = await IpFetcher().fetchIPInfo(ip)

    if (ipFetcherInfo instanceof IpFetcherServiceError) {
      recordExceptionInCurrentSpan({
        error: ipFetcherInfo,
        level: ErrorLevel.Critical,
        attributes: { ip },
      })
      return ipFetcherInfo
    }

    addAttributesToCurrentSpan({
      "login.ipFetcherInfo": JSON.stringify(ipFetcherInfo),
    })

    const authorizedIPMetadata = IPMetadataAuthorizer(
      ipMetadataValidationSettings,
    ).authorize(ipFetcherInfo)

    if (authorizedIPMetadata instanceof Error) {
      if (authorizedIPMetadata instanceof MissingIPMetadataError)
        return new InvalidIpMetadataError(authorizedIPMetadata)

      return new UnauthorizedIPForOnboardingError(authorizedIPMetadata)
    }
  }

  return getPhoneMetadata({ phone })
}

const checkDeviceLoginAttemptPerAppcheckJtiLimits = async (
  appcheckJti: AppcheckJti,
): Promise<true | RateLimiterExceededError> =>
  consumeLimiter({
    rateLimitConfig: RateLimitConfig.deviceAccountCreate,
    keyToConsume: appcheckJti,
  })
