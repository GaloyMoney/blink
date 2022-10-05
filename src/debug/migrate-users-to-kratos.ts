/**
 * how to run:
 *
 * . ./.envrc && yarn ts-node --files -r tsconfig-paths/register src/debug/migrate-users-to-kratos.ts
 *
 */
import { AuthWithPhoneNoPassword } from "@services/kratos"
import { setupMongoConnection } from "@services/mongodb"
import { User } from "@services/mongoose/schema"

const main = async () => {
  console.log("Start date:", new Date())

  const accounts = await User.find({}, { _id: 1, phone: 1 })

  console.log("accounts loaded")

  const authService = AuthWithPhoneNoPassword()

  let progress = 0
  for (const account of accounts) {
    progress++

    const kratosUserId = await authService.createNoSession(account.phone as PhoneNumber)
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
