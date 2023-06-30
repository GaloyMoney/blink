type AddDeviceTokenArgs = {
  userId: UserId
  deviceToken: string
}

type RemoveDeviceTokensArgs = {
  userId: UserId
  deviceTokens: DeviceToken[]
}

type UpdateLanguageArgs = {
  userId: UserId
  language: string
}

type Feedback = string & { readonly brand: unique symbol }
