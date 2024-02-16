import { AccountAlreadyHasEmailError } from "@/domain/authentication/errors"
import { AuthWithEmailPasswordlessService } from "@/services/kratos"
import { baseLogger } from "@/services/logger"
import { UsersRepository } from "@/services/mongoose"
import { NotificationsService } from "@/services/notifications"

export const addEmailToIdentity = async ({
  email,
  userId,
}: {
  email: EmailAddress
  userId: UserId
}): Promise<AddEmailToIdentityResult | KratosError> => {
  const authServiceEmail = AuthWithEmailPasswordlessService()

  const hasEmail = await authServiceEmail.hasEmail({ kratosUserId: userId })
  if (hasEmail instanceof Error) return hasEmail
  if (hasEmail) return new AccountAlreadyHasEmailError()

  const res = await authServiceEmail.addUnverifiedEmailToIdentity({
    email,
    kratosUserId: userId,
  })
  if (res instanceof Error) return res

  const emailRegistrationId = await authServiceEmail.sendEmailWithCode({ email })
  if (emailRegistrationId instanceof Error) return emailRegistrationId

  await NotificationsService().updateEmailAddress({ userId, email })

  const user = await UsersRepository().findById(userId)
  if (user instanceof Error) return user

  return { emailRegistrationId, me: user }
}

export const verifyEmail = async ({
  emailRegistrationId,
  code,
}: {
  emailRegistrationId: EmailRegistrationId
  code: EmailCode
}): Promise<User | KratosError | RepositoryError> => {
  baseLogger.info({ emailRegistrationId }, "RequestVerifyEmail called")

  const authServiceEmail = AuthWithEmailPasswordlessService()
  const res = await authServiceEmail.validateCode({
    code,
    emailFlowId: emailRegistrationId,
  })
  if (res instanceof Error) return res

  await NotificationsService().updateEmailAddress({
    userId: res.kratosUserId,
    email: res.email,
  })

  const user = await UsersRepository().findById(res.kratosUserId)
  if (user instanceof Error) return user

  return user
}

export const removeEmail = async ({
  userId,
}: {
  userId: UserId
}): Promise<User | KratosError> => {
  const authServiceEmail = AuthWithEmailPasswordlessService()
  const email = await authServiceEmail.removeEmailFromIdentity({ kratosUserId: userId })
  if (email instanceof Error) return email

  const user = await UsersRepository().findById(userId)
  if (user instanceof Error) return user

  const deletedEmails = [...(user.deletedEmails ?? [])]
  deletedEmails.push(email)

  const updatedUser = await UsersRepository().update({
    ...user,
    deletedEmails,
  })
  if (updatedUser instanceof Error) return updatedUser

  await NotificationsService().removeEmailAddress({ userId })

  return user
}
