type NewAccountWithPhoneIdentifier = {
  kratosUserId: UserId
  phone: PhoneNumber
}

type LoginDeviceUpgradeWithPhoneResult = {
  success: true
  sessionToken?: SessionToken
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
  sessionToken: SessionToken
  totpRequired: boolean
}
