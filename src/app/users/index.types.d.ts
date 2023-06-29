type AddDeviceTokenArgs = {
  userId: UserId
  deviceToken: string
}

type UpdateLanguageArgs = {
  userId: UserId
  language: string
}

type Feedback = string & { readonly brand: unique symbol }
