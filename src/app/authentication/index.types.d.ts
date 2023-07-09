type NewAccountWithPhoneIdentifier = {
  kratosUserId: UserId
  phone: PhoneNumber
}

type LoginDeviceUpgradeWithPhoneResult = {
  success: true
  sessionToken?: SessionToken
}

type initiateTotpRegistrationResult = {
  flow: FlowId
  totpSecret: TotpSecret
}

type AddEmailToIdentityResult = {
  flow: FlowId
  me: User
}

type LoginWithEmailResult = {
  sessionToken: SessionToken
  totpRequired: boolean
}
