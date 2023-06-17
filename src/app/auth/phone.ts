import {
  LikelyNoUserWithThisPhoneExistError,
  PhoneAlreadyExistsError,
} from "@domain/authentication/errors"

import { isPhoneCodeValid } from "@services/twilio"

import { UsersRepository } from "@services/mongoose"

import { AuthWithEmailPasswordlessService } from "@services/kratos"

import {
  checkFailedLoginAttemptPerIpLimits,
  checkFailedLoginAttemptPerLoginIdentifierLimits,
  rewardFailedLoginAttemptPerIpLimits,
  rewardFailedLoginAttemptPerLoginIdentifierLimits,
} from "./ratelimits"

export const verifyPhone = async ({
  userId,
  phone,
  code,
  ip,
}: {
  userId: UserId
  phone: PhoneNumber
  code: PhoneCode
  ip: IpAddress
}): Promise<User | ApplicationError> => {
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

  const users = UsersRepository()

  // add phone to User collection
  const user = await users.findById(userId)
  if (user instanceof Error) return new LikelyNoUserWithThisPhoneExistError()

  if (user.phone) {
    return new PhoneAlreadyExistsError()
  }

  const update = await users.update({ ...user, phone })
  if (update instanceof Error) return update

  // add phone to identity
  const authService = AuthWithEmailPasswordlessService()
  const res = await authService.addPhoneToIdentity({ phone, userId })

  if (res instanceof Error) {
    // TODO: critical error, we should rollback
    // TODO: how to ensure the error is critical for pager duty?
    return res
  }

  return user
}

export const removePhoneFromIdentity = async ({
  userId,
}: {
  userId: UserId
}): Promise<User | KratosError> => {
  const authServiceEmail = AuthWithEmailPasswordlessService()
  const res = await authServiceEmail.removePhoneFromIdentity({ kratosUserId: userId })
  if (res instanceof Error) return res

  const usersRepo = UsersRepository()

  let user = await usersRepo.findById(userId)
  if (user instanceof Error) return user

  if (user.phone) {
    const newUser = {
      ...user,
      deletedPhones: user.deletedPhones
        ? [...user.deletedPhones, user.phone]
        : [user.phone],
      phone: undefined,
    }
    user = await usersRepo.update(newUser)
    if (user instanceof Error) return user
  }

  return user
}
