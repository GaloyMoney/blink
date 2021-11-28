import { GT } from "@graphql/index"

import GraphQLUser from "@graphql/admin/types/object/user"
import Phone from "@graphql/types/scalar/phone"

import { getUserByPhone } from "@app/admin"

const UserDetailsByPhoneQuery = GT.Field({
  type: GT.NonNull(GraphQLUser),
  args: {
    phone: { type: GT.NonNull(Phone) },
  },
  resolve: async (parent, { phone }) => {
    if (phone instanceof Error) {
      throw phone
    }

    const user = await getUserByPhone(phone)
    if (user instanceof Error) {
      throw user
    }

    return user
  },
})

export default UserDetailsByPhoneQuery
