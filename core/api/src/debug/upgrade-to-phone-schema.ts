/**
 * how to run:
 *
 * pnpm tsx src/debug/upgrade-to-phone-schema.ts <phone> <userId>
 *
 * <phone>: phone number to upgrade to
 * <userId>: kratos user ID
 */

import { IdentifierNotFoundError } from "@/domain/authentication/errors"

import {
  AuthWithUsernamePasswordDeviceIdService,
  IdentityRepository,
} from "@/services/kratos"
import { UsersRepository } from "@/services/mongoose"
import { setupMongoConnection } from "@/services/mongodb"

const upgradeToPhoneSchema = async ({
  phone,
  userId,
}: {
  phone: PhoneNumber
  userId: UserId
}) => {
  const userUpdated = await UsersRepository().findById(userId)
  if (userUpdated instanceof Error) return userUpdated

  const identities = IdentityRepository()
  const result = await identities.getUserIdFromIdentifier(phone)

  // phone account must not exist
  if (result instanceof IdentifierNotFoundError) {
    return await AuthWithUsernamePasswordDeviceIdService().upgradeToPhoneSchema({
      phone,
      userId,
    })
  }

  if (result instanceof Error) return result

  return new Error(`Schema already upgraded for user ${result}`)
}

const main = async () => {
  const args = process.argv.slice(-2)
  const params = {
    phone: args[0] as PhoneNumber,
    userId: args[1] as UserId,
  }

  const result = await upgradeToPhoneSchema(params)
  if (result instanceof Error) {
    console.error("Error:", result)
    return
  }

  console.log(
    `Successfully upgraded user ${params.userId} to phone schema with phone ${params.phone}`,
  )
}

setupMongoConnection()
  .then(async (mongoose) => {
    await main()
    if (mongoose) await mongoose.connection.close()
  })
  .catch((err) => console.log(err))
