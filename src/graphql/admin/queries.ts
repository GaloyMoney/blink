import { User } from "@services/mongoose/schema"

import { GT } from "@graphql/index"
import Phone from "../types/scalar/phone"
import WalletName from "../types/scalar/wallet-name"
import AccountLevel from "../types/scalar/account-level"
import UserDetails from "../types/object/user-details"

// TODO: redo/move root fields
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
        username: { type: GT.NonNull(WalletName) },
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
