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
  const user = await UsersRepository().findById(userId)
  if (user instanceof Error) return user

  const identities = IdentityRepository()
  const kratosUserId = await identities.getUserIdFromIdentifier(phone)

  // phone account must not exist
  if (kratosUserId instanceof IdentifierNotFoundError) {
    return AuthWithUsernamePasswordDeviceIdService().upgradeToPhoneSchema({
      phone,
      userId,
    })
  }

  if (kratosUserId instanceof Error) return kratosUserId

  if (kratosUserId !== user.id)
    return new Error(
      `User ids do not match. kratosUserId: ${kratosUserId} - UserId: ${user.id}`,
    )

  return new Error(`Schema already upgraded for user ${kratosUserId}`)
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
