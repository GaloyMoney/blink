import { EmailAlreadyExistsError } from "@domain/authentication/errors"
import { AuthWithEmailPasswordlessService } from "@services/kratos"
import { baseLogger } from "@services/logger"
import { UsersRepository } from "@services/mongoose"

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
  if (hasEmail) return new EmailAlreadyExistsError()

  const res = await authServiceEmail.addUnverifiedEmailToIdentity({
    email,
    kratosUserId: userId,
  })
  if (res instanceof Error) return res

  const emailRegistrationId = await authServiceEmail.sendEmailWithCode({ email })
  if (emailRegistrationId instanceof Error) return emailRegistrationId

  const user = await UsersRepository().findById(userId)
  if (user instanceof Error) return user

  const updatedUser = await UsersRepository().update({ ...user, email })
  if (updatedUser instanceof Error) return updatedUser

  return { emailRegistrationId, me: updatedUser }
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
  const res = await authServiceEmail.removeEmailFromIdentity({ kratosUserId: userId })
  if (res instanceof Error) return res

  const user = await UsersRepository().findById(userId)
  if (user instanceof Error) return user

  const deletedEmails = [...(user.deletedEmails ?? [])]
  user.email && deletedEmails.push(user.email)

  const updatedUser = await UsersRepository().update({
    ...user,
    email: undefined,
    deletedEmails,
  })
  if (updatedUser instanceof Error) return updatedUser

  return user
}
