import {
  checkFailedLoginAttemptPerIpLimits,
  checkFailedLoginAttemptPerLoginIdentifierLimits,
  rewardFailedLoginAttemptPerIpLimits,
  rewardFailedLoginAttemptPerLoginIdentifierLimits,
} from "./ratelimits"

import { PhoneAlreadyExistsError } from "@/domain/authentication/errors"

import { isPhoneCodeValid } from "@/services/twilio-service"

import { UsersRepository } from "@/services/mongoose"

import { AuthWithEmailPasswordlessService } from "@/services/kratos"

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
  if (user instanceof Error) return user

  if (user.phone) {
    return new PhoneAlreadyExistsError()
  }

  const update = await users.update({ ...user, phone })
  if (update instanceof Error) return update

  // add phone to identity
  const authService = AuthWithEmailPasswordlessService()
  const res = await authService.addPhoneToIdentity({ phone, userId })
  if (res instanceof Error) return res

  return update
}

export const removePhoneFromIdentity = async ({
  userId,
}: {
  userId: UserId
}): Promise<User | KratosError> => {
  const authServiceEmail = AuthWithEmailPasswordlessService()
  const phone = await authServiceEmail.removePhoneFromIdentity({ kratosUserId: userId })
  if (phone instanceof Error) return phone

  const usersRepo = UsersRepository()

  let user = await usersRepo.findById(userId)
  if (user instanceof Error) return user

  const newUser = {
    ...user,
    deletedPhones: user.deletedPhones ? [...user.deletedPhones, phone] : [phone],
    phone: undefined,
  }

  user = await usersRepo.update(newUser)
  if (user instanceof Error) return user

  return user
}
