declare const phoneNumberSymbol: unique symbol
type PhoneNumber = string & { [phoneNumberSymbol]: never }

type UserLanguage =
  typeof import("./index").UserLanguage[keyof typeof import("./index").UserLanguage]

declare const latitudeSymbol: unique symbol
type Latitude = number & { [latitudeSymbol]: never }

declare const longitudeSymbol: unique symbol
type Longitude = number & { [longitudeSymbol]: never }

declare const titleSymbol: unique symbol
type Title = string & { [titleSymbol]: never }

type User = {
  id: UserId
  username: Username | null
  phone: PhoneNumber
  language: UserLanguage
  defaultAccountId: AccountId
  createdAt: Date
  coordinate?: {
    latitude: Latitude
    longitude: Longitude
  }
  title?: Title
}

interface IUsersRepository {
  findById(userId: UserId): Promise<User | RepositoryError>
  findByUsername(username: Username): Promise<User | RepositoryError>
  update(user: User): Promise<User | RepositoryError>
}
