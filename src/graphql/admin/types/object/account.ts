import { Users, Wallets } from "@app"
import { GT } from "@graphql/index"
import Coordinates from "@graphql/types/object/coordinates"
import Timestamp from "@graphql/types/scalar/timestamp"
import Username from "@graphql/types/scalar/username"
import { GraphQLObjectType } from "graphql"
import Wallet from "@graphql/types/abstract/wallet"

import AccountLevel from "../scalar/account-level"
import AccountStatus from "../scalar/account-status"

import GraphQLUser from "./user"

const Account: GraphQLObjectType<Account> = GT.Object<Account>({
  name: "Account",
  description:
    "Accounts are core to the Galoy architecture. they have users, and own wallets",
  fields: () => ({
    id: { type: GT.NonNullID },
    username: { type: Username },
    level: { type: GT.NonNull(AccountLevel) },
    status: { type: GT.NonNull(AccountStatus) },
    title: { type: GT.String },
    wallets: {
      type: GT.NonNullList(Wallet),
      resolve: async (source) => {
        return Wallets.listWalletsByAccountId(source.id)
      },
    },
    owner: {
      // should be used for individual account only,
      // ie: when there are no multiple users
      // probably separating AccountDetail to DetailConsumerAccount
      // with DetailCorporateAccount is a way to have owner only in DetailConsumerAccount
      // and users: [Users] in DetailCorporateAccount

      type: GT.NonNull(GraphQLUser),
      resolve: async (source) => {
        const user = await Users.getUser(source.ownerId)
        if (user instanceof Error) {
          throw user
        }

        return user
      },
    },
    coordinates: {
      type: Coordinates,
      description:
        "GPS coordinates for the account that can be used to place the related business on a map",
    },
    createdAt: {
      type: GT.NonNull(Timestamp),
      resolve: (source) => source.createdAt,
    },
  }),
})

export default Account
