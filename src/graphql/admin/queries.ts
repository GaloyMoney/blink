import { User } from "@services/mongoose/schema"

import { GT } from "../index"
import Phone from "../types/scalars/phone"
import Username from "../types/scalars/username"
import AccountLevel from "../types/account-level"
import UserDetails from "../types/user-details"
import { UsersRepository } from "@services/mongoose"

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
        const usersRepo = UsersRepository()
        const user = await usersRepo.findByUsername(username)
        if (user instanceof Error) throw user

        return user
      },
    },
  }),
})

export default QueryType
