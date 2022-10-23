/**
 * how to run:
 * yarn ts-node --files -r tsconfig-paths/register src/debug/create-usd-wallets.ts
 */

import { isUp } from "@services/lnd/health"
import { params as unauthParams } from "@services/lnd/unauth"
import { setupMongoConnection } from "@services/mongodb"
import { Account } from "@services/mongoose/schema"
import { UsersRepository } from "@services/mongoose/users"

const createUsdWallets = async () => {
  await setupMongoConnection()

  let id: KratosUserId
  let phoneMetadata: PhoneMetadata
  let language: UserLanguage | undefined
  let deviceTokens: DeviceToken[]

  const hasError = false

  const usersRepo = UsersRepository()

  const accounts = await Account.find({})
  if (accounts instanceof Error) return accounts
  let progress = 0
  for (const account of accounts) {
    id = account.kratosUserId as KratosUserId
    phoneMetadata = account.twilio as PhoneMetadata
    language = account.language as UserLanguage | undefined
    deviceTokens = account.deviceToken as DeviceToken[]

    await usersRepo.update({ id, phoneMetadata, language, deviceTokens })

    progress++
    if (progress % 1000 === 0) {
      console.log(`${progress} accounts iterated`)
    }
  }

  if (!hasError) {
    try {
      const res = Account.updateMany(
        {},
        { $unset: { phone: 1, phoneMetadata: 1 } },
        { multi: true },
      )
      console.log({ res }, `update contactEnabled`)
    } catch (error) {
      console.log({ error }, `error removing phone`)
    }
  }

  console.log("completed")
}

const main = async () => {
  return createUsdWallets()
}

setupMongoConnection()
  .then(async (mongoose) => {
    await Promise.all(unauthParams.map((lndParams) => isUp(lndParams)))
    await main()
    return mongoose.connection.close()
  })
  .catch((err) => console.log(err))
