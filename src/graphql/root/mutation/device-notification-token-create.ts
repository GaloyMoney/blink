import { GT } from "@graphql/index"

import SuccessPayload from "@graphql/types/payload/success-payload"
import { User } from "@services/mongoose/schema"
import { toObjectId } from "@services/mongoose/utils"

const DeviceNotificationTokenCreateInput = GT.Input({
  name: "DeviceNotificationTokenCreateInput",
  fields: () => ({
    deviceToken: { type: GT.NonNull(GT.String) },
  }),
})

const DeviceNotificationTokenCreateMutation = GT.Field<
  { input: { deviceToken: string } },
  null,
  GraphQLContextForUser
>({
  extensions: {
    complexity: 120,
  },
  type: GT.NonNull(SuccessPayload),
  args: {
    input: { type: GT.NonNull(DeviceNotificationTokenCreateInput) },
  },
  resolve: async (_, args, { domainUser }) => {
    const { deviceToken } = args.input

    try {
      // FIXME: this should be moved to a use case
      const user = await User.findOne({ _id: toObjectId<UserId>(domainUser.id) })
      if (!user) throw Error("find user issue")

      if (!user.deviceToken.includes(deviceToken)) {
        user.deviceToken.push(deviceToken)
      }
      await user.save()
    } catch (err) {
      return { errors: [{ message: err.message }] }
    }

    return { errors: [], success: true }
  },
})

export default DeviceNotificationTokenCreateMutation
