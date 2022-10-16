/**
 * how to run:
 * yarn ts-node --files -r tsconfig-paths/register src/debug/create-usd-wallets.ts
 */

import { IdentityRepository } from "@services/kratos"
import { isUp } from "@services/lnd/health"
import { params as unauthParams } from "@services/lnd/unauth"
import { setupMongoConnection } from "@services/mongodb"
import { Account } from "@services/mongoose/schema"

const createUsdWallets = async () => {
  await setupMongoConnection()

  const identitiesRepo = IdentityRepository()

  let id: KratosUserId
  let phoneMetadata: PhoneMetadata
  let language: UserLanguage | undefined
  let deviceTokens: DeviceToken[]

  let hasError = false

  const accounts = await Account.find({})
  if (accounts instanceof Error) return accounts
  let progress = 0
  for (const account of accounts) {
    id = account.kratosUserId as KratosUserId
    phoneMetadata = account.twilio as PhoneMetadata
    language = account.language as UserLanguage | undefined
    deviceTokens = account.deviceToken as DeviceToken[]

    if (deviceTokens) {
      try {
        await identitiesRepo.setDeviceTokens({ id, deviceTokens })
      } catch (err) {
        hasError = true
        console.log({ id, deviceTokens }, "issue settings up device token")
      }
    }

    if (phoneMetadata) {
      try {
        await identitiesRepo.setPhoneMetadata({ id, phoneMetadata })
      } catch (err) {
        hasError = true
        console.log({ id, phoneMetadata }, "issue settings up phoneMetadata")
      }
    }

    if (language) {
      try {
        await identitiesRepo.setLanguage({ id, language })
      } catch (err) {
        hasError = true
        console.log({ id, language }, "issue settings up phoneMetadata")
      }
    }

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
