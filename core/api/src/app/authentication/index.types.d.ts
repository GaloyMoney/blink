type NewAccountWithPhoneIdentifier = {
  kratosUserId: UserId
  phone: PhoneNumber
}

type LoginDeviceUpgradeWithPhoneResult = {
  success: true
  authToken?: AuthToken
}

type InitiateTotpRegistrationResult = {
  totpRegistrationId: TotpRegistrationId
  totpSecret: TotpSecret
}

type AddEmailToIdentityResult = {
  emailRegistrationId: EmailFlowId
  me: User
}

type LoginWithEmailResult = {
  authToken: AuthToken
  totpRequired: boolean
  id?: UserId
}

type LoginWithPhoneTokenResult = {
  authToken: AuthToken
  totpRequired: boolean
  id?: UserId
}
