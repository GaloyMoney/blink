declare const phoneNumberSymbol: unique symbol
type PhoneNumber = string & { [phoneNumberSymbol]: never }

type UserLanguage =
  typeof import("./index").UserLanguage[keyof typeof import("./index").UserLanguage]

type User = {
  id: UserId
  username: Username | null
  phone: PhoneNumber
  language: UserLanguage
  defaultAccountId: AccountId
  createdAt: Date
}

interface IUsersRepository {
  findById(userId: UserId): Promise<User | RepositoryError>
  findByUsername(username: Username): Promise<User | RepositoryError>
}
