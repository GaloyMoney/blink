import { KratosError } from "./errors"

import { AuthWithPhonePasswordlessService } from "./auth-phone-no-password"

export const AuthWithDeviceAccountService = (): IAuthWithDeviceAccountService => {
  const upgradeToPhoneSchema = async ({
    phone,
    deviceId,
  }: {
    phone: PhoneNumber
    deviceId: UserId
  }): Promise<SessionToken | KratosError> => {
    // 1. create kratos account
    // 2. kratos webhook calls /kratos/registration to update mongo
    //    account/user collection to ref kratos uuid instead of device id
    const authService = AuthWithPhonePasswordlessService()
    const kratosResult = await authService.createIdentityWithDeviceId({ phone, deviceId })
    if (kratosResult instanceof Error) return kratosResult
    return kratosResult.sessionToken
  }

  return {
    upgradeToPhoneSchema,
  }
}
