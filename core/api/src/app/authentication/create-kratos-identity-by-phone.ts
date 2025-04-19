import { getPhoneMetadata } from "./get-phone-metadata"

import { IdentifierNotFoundError } from "@/domain/authentication/errors"

import { AuthWithPhonePasswordlessService, IdentityRepository } from "@/services/kratos"

export const createKratosIdentityByPhone = async (
  phone: PhoneNumber,
): Promise<UserId | ApplicationError> => {
  const identities = IdentityRepository()
  const kratosUserId = await identities.getUserIdFromIdentifier(phone)

  if (kratosUserId instanceof IdentifierNotFoundError) {
    const authService = AuthWithPhonePasswordlessService()
    const phoneMetadata = await getPhoneMetadata({ phone })
    if (phoneMetadata instanceof Error) return phoneMetadata

    const kratosResult = await authService.createIdentityWithSession({
      phone,
      phoneMetadata,
    })
    if (kratosResult instanceof Error) return kratosResult

    return kratosResult.kratosUserId
  }

  return kratosUserId
}
