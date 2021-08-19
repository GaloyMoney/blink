declare const phoneNumberSymbol: unique symbol
type PhoneNumber = string & { [phoneNumberSymbol]: never }

type UserLanguage =
  typeof import("./index").UserLanguage[keyof typeof import("./index").UserLanguage]

declare const deviceTokenSymbol: unique symbol
type DeviceToken = number & { [deviceTokenSymbol]: never }

type User = {
  id: UserId
  username: Username | null
  phone: PhoneNumber
  language: UserLanguage
  defaultAccountId: AccountId
  deviceToken: DeviceToken[]
  createdAt: Date
}

interface IUsersRepository {
  findById(userId: UserId): Promise<User | RepositoryError>
  findByUsername(username: Username): Promise<User | RepositoryError>
}
