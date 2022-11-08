import { JWT_SECRET } from "@config"
import { ErrorLevel } from "@domain/shared"
import { LikelyNoUserWithThisPhoneExistError } from "@domain/authentication/errors"
import { RedisCacheService } from "@services/cache"
import { AuthWithPhonePasswordlessService } from "@services/kratos"
import { AccountsRepository, UsersRepository } from "@services/mongoose"
import {
  recordExceptionInCurrentSpan,
  addAttributesToCurrentSpan,
} from "@services/tracing"
import { NextFunction, Request, Response } from "express"
import * as jwt from "jsonwebtoken"
const jwtAlgorithms: jwt.Algorithm[] = ["HS256"]

export const updateToken = async (req: Request, res: Response, next: NextFunction) => {
  const headers = req?.headers
  let tokenPayload: string | jwt.JwtPayload | null = null
  const authz = headers.orgauthorization

  if (!authz) {
    addAttributesToCurrentSpan({ authUpgrade: "no orgauthorization header" })

    next()
    return
  }

  const rawToken = authz.slice(7) as LegacyJwtToken

  if (rawToken.length === 32) {
    addAttributesToCurrentSpan({ authUpgrade: "kratos token" })

    next()
    return
  }

  try {
    tokenPayload = jwt.verify(rawToken, JWT_SECRET, {
      algorithms: jwtAlgorithms,
    })
  } catch (err) {
    addAttributesToCurrentSpan({ authUpgrade: "token decoding issue" })

    next()
    return
  }

  if (typeof tokenPayload === "string") {
    addAttributesToCurrentSpan({ authUpgrade: "token not a string" })

    next()
    return
  }

  if (!tokenPayload) {
    addAttributesToCurrentSpan({ authUpgrade: "no tokenPayload" })

    next()
    return
  }

  const uid = tokenPayload.uid
  const user = await UsersRepository().findById(uid)
  if (user instanceof Error) {
    addAttributesToCurrentSpan({ authUpgrade: "no uid" })

    // TODO: log error
    next()
    return
  }

  const { phone } = user

  if (!phone) {
    addAttributesToCurrentSpan({ authUpgrade: "no phone" })

    // TODO: log error
    // is there users who doesn't have phone on bbw?
    next()
    return
  }

  let kratosToken: SessionToken

  // the cache aim to limit to 1 session per kratos user on mobile phone
  // previously, with JWT, there is no notion of session.
  //
  // sessions will be useful because:
  // - it be possible for a user to know if other sessions are open from his account
  // and eventually log those accounts out
  // - it will be possible for an admin to revoke all sessions
  // - it will be possible to enhance user protection. if a session is attached to a mobile phone
  // then if the user agent in the request changes, it could be advisable for the user to relogin
  //
  // to keep the sessions clean, here we are caching the user credentials, so there is a lower likely that
  // during the migrations, a user is sending many requests simoultaneously and ends up with multiple sessions
  // just because the mobile app would not have update the token by the time another request is been initiated
  const cacheRes = await RedisCacheService().get<SessionToken>({ key: rawToken })
  if (!(cacheRes instanceof Error)) {
    addAttributesToCurrentSpan({ authUpgrade: "returning token from cache" })

    kratosToken = cacheRes
    res.set("kratos-session-token", kratosToken)
    next()
    return
  }

  const authService = AuthWithPhonePasswordlessService()

  let kratosResult = await authService.login(phone)

  // FIXME: only if we don't run the migration before
  if (kratosResult instanceof LikelyNoUserWithThisPhoneExistError) {
    // user has not migrated to kratos or it's a new user
    kratosResult = await authService.createIdentityWithSession(phone)
  }

  if (kratosResult instanceof Error) {
    addAttributesToCurrentSpan({ authUpgrade: "kratos issue" })

    next()
    return
  }

  const kratosUserId = kratosResult.kratosUserId

  const account = await AccountsRepository().findById(uid)
  if (account instanceof Error) {
    addAttributesToCurrentSpan({ authUpgrade: "account findby issue" })

    next()
    return
  }

  const updatedAccount = await AccountsRepository().update({
    ...account,
    kratosUserId,
  })

  if (updatedAccount instanceof Error) {
    addAttributesToCurrentSpan({ authUpgrade: "updateAccount issue" })

    recordExceptionInCurrentSpan({
      error: `error with attachKratosUser update-token: ${updatedAccount}`,
      level: ErrorLevel.Critical,
      attributes: { kratosUserId, uid, phone },
    })
  }

  kratosToken = kratosResult.sessionToken
  res.set("kratos-session-token", kratosToken)
  next()

  addAttributesToCurrentSpan({ authUpgrade: "token has been sent (without cache)" })

  const twoMonths = (60 * 60 * 24 * 30) as Seconds

  await RedisCacheService().set<SessionToken>({
    key: rawToken,
    value: kratosToken,
    ttlSecs: twoMonths,
  })

  return
}
