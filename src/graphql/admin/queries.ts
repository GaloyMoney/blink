import { User } from "@services/mongoose/schema"

import { GT } from "../index"
import Phone from "../types/scalars/phone"
import Username from "../types/scalars/username"
import AccountLevel from "../types/account-level"
import UserDetails from "../types/user-details"

const QueryType = new GT.Object({
  name: "Query",
  fields: () => ({
    allLevels: {
      type: GT.NonNullList(AccountLevel),
      resolve: () => {
        return [1, 2]
      },
    },
    userDetailsByPhone: {
      type: GT.NonNull(UserDetails),
      args: {
        phone: { type: GT.NonNull(Phone) },
      },
      resolve: async (parent, { phone }) => {
        const user = await User.getUserByPhone(phone)
        if (!user) {
          throw new Error("User not found")
        }
        return user
      },
    },
    userDetailsByUsername: {
      type: GT.NonNull(UserDetails),
      args: {
        username: { type: GT.NonNull(Username) },
      },
      resolve: async (parent, { username }) => {
        const user = await User.getUserByUsername(username)
        if (!user) {
          throw new Error("User not found")
        }
        return user
      },
    },
  }),
})

export default QueryType
