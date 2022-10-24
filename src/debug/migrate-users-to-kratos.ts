/**
 * how to run:
 *
 * . ./.envrc && yarn ts-node --files -r tsconfig-paths/register src/debug/migrate-users-to-kratos.ts
 *
 */
import { AuthWithPhonePasswordlessService, listIdentities } from "@services/kratos"
import { setupMongoConnection } from "@services/mongodb"
import { User } from "@services/mongoose/schema"

const main = async () => {
  console.log("Start date:", new Date())

  const accounts = await User.find({}, { _id: 1, phone: 1 })

  console.log("accounts loaded")

  const authService = AuthWithPhonePasswordlessService()

  let identities: IdentityPhone[]

  try {
    const res = await listIdentities()
    if (res instanceof Error) throw res
    identities = res
  } catch (err) {
    console.log("issue getting identities")
    return
  }

  let progress = 0
  for (const account of accounts) {
    progress++

    const phone = account.phone as PhoneNumber

    if (identities.find((identity) => identity.phone === phone)) {
      continue
    }

    const kratosUserId = await authService.createIdentityNoSession(phone)
    if (kratosUserId instanceof Error) throw kratosUserId

    await User.updateOne({ _id: account._id }, { $set: { kratosUserId } })

    if (progress % 1000 === 0) {
      console.log(`${progress} users updated`)
    }
  }

  console.log("End date:", new Date())
}

setupMongoConnection()
  .then(async (mongoose) => {
    await main()
    if (mongoose) await mongoose.connection.close()
  })
  .catch((err) => console.log(err))
