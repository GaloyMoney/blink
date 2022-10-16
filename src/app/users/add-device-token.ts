import { checkedToDeviceToken } from "@domain/users"
import { IdentityRepository } from "@services/kratos"

type AddDeviceTokenArgs = {
  kratosUserId: KratosUserId
  deviceToken: string
}

export const addDeviceToken = async ({
  kratosUserId,
  deviceToken,
}: AddDeviceTokenArgs): Promise<IdentityPhone | ApplicationError> => {
  const identityRepo = IdentityRepository()

  const deviceTokenChecked = checkedToDeviceToken(deviceToken)
  if (deviceTokenChecked instanceof Error) return deviceTokenChecked

  const user = await identityRepo.getIdentity(kratosUserId)
  if (user instanceof Error) return user

  const deviceTokens = user.deviceTokens

  if (!deviceTokens.includes(deviceTokenChecked)) {
    deviceTokens.push(deviceTokenChecked)
  }

  return identityRepo.setDeviceTokens({ id: kratosUserId, deviceTokens })
}
