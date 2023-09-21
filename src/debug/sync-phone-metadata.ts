/**
 * how to run:
 * yarn ts-node --files -r tsconfig-paths/register src/debug/sync-phone-metadata.ts
 */

import { setupMongoConnection } from "@services/mongodb"
import { User } from "@services/mongoose/schema"
import { TwilioClient } from "@services/twilio"

const main = async () => {
  const users = await User.find({ phoneMetadata: { $exists: false } })
  if (users instanceof Error) return users

  console.log("usersCount:", users.length)

  let progress = 0
  for await (const user of users) {
    const phone = user.phone as PhoneNumber
    if (!phone) {
      console.log(`user ${user._id} has no phone`)
      continue
    }

    const newPhoneMetadata = await TwilioClient().getCarrier(phone)
    if (newPhoneMetadata instanceof Error) {
      console.log(`error getting phone metadata for ${phone}: ${newPhoneMetadata}`)
      continue
    }

    const res = await User.updateOne(
      { _id: user._id },
      { $set: { phoneMetadata: newPhoneMetadata } },
    )
    console.log(
      `updated user ${user._id} with phoneMetadata: ${JSON.stringify(
        newPhoneMetadata,
      )}, res: ${JSON.stringify(res)}`,
    )

    progress++
    if (progress % 1000 === 0) {
      console.log(`${progress} accounts iterated`)
    }
  }

  console.log("completed")
}

setupMongoConnection()
  .then(async (mongoose) => {
    await main()
    return mongoose.connection.close()
  })
  .catch((err) => console.log(err))
