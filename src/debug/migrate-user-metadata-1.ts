/**
 * how to run:
 * yarn ts-node --files -r tsconfig-paths/register src/debug/create-usd-wallets.ts
 */

import { setupMongoConnection } from "@services/mongodb"
import { Account } from "@services/mongoose/schema"
import { UsersRepository } from "@services/mongoose"

const migrateUserMetadata = async () => {
  let id: UserId
  let phoneMetadata: PhoneMetadata
  let language: UserLanguage | undefined
  let phone: PhoneNumber | undefined
  let deviceTokens: DeviceToken[]
  let createdAt: Date

  const usersRepo = UsersRepository()

  const accounts = await Account.find({})
  if (accounts instanceof Error) return accounts
  let progress = 0

  for (const account of accounts) {
    id = account.kratosUserId as UserId
    phoneMetadata = account.twilio as PhoneMetadata
    language = account.language as UserLanguage | undefined
    deviceTokens = account.deviceToken as DeviceToken[]
    phone = account.phone as PhoneNumber | undefined
    createdAt = account.created_at

    await usersRepo.update({
      id,
      phoneMetadata,
      language,
      deviceTokens,
      phone,
      createdAt,
    })

    progress++
    if (progress % 1000 === 0) {
      console.log(`${progress} accounts iterated`)
    }
  }
}

setupMongoConnection()
  .then(async (mongoose) => {
    await migrateUserMetadata()
    return mongoose.connection.close()
  })
  .catch((err) => console.log(err))
