/**
 * how to run:
 *
 * . ./.envrc && yarn ts-node --files -r tsconfig-paths/register src/debug/migrate-users-to-kratos.ts
 *
 */
import { Identity } from "@ory/client"
import { AuthWithPhonePasswordlessService } from "@services/kratos"
import { kratosAdmin } from "@services/kratos/private"
import { setupMongoConnection } from "@services/mongodb"
import { User } from "@services/mongoose/schema"

const main = async () => {
  console.log("Start date:", new Date())

  const accounts = await User.find({}, { _id: 1, phone: 1 })

  console.log("accounts loaded")

  const authService = AuthWithPhonePasswordlessService()

  let identities: Identity[]

  try {
    const res = await kratosAdmin.adminListIdentities()
    identities = res.data
  } catch (err) {
    console.log("issue getting identities")
    return
  }

  let progress = 0
  for (const account of accounts) {
    progress++

    const phone = account.phone as PhoneNumber

    if (identities.find((identity) => identity.traits.phone === phone)) {
      continue
    }

    const kratosUserId = await authService.createIdentityNoSession(phone)
    if (kratosUserId instanceof Error) throw kratosUserId

    await User.updateOne({ _id: account._id }, { kratosUserId })

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
