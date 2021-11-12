import { GT } from "@graphql/index"

import GraphQLUser from "@graphql/admin/types/object/user"
import Phone from "@graphql/types/scalar/phone"

import { User } from "@services/mongoose/schema"

const UserDetailsByPhoneQuery = GT.Field({
  type: GT.NonNull(GraphQLUser),
  args: {
    phone: { type: GT.NonNull(Phone) },
  },
  resolve: async (parent, { phone }) => {
    if (phone instanceof Error) {
      throw phone
    }

    const user = await User.getUserByPhone(phone)
    if (!user) {
      throw new Error("User not found")
    }

    return user
  },
})

export default UserDetailsByPhoneQuery
