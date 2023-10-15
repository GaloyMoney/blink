import { GraphQLObjectType } from "graphql"

import AccountStatus from "../scalar/account-status"

import GraphQLUser from "./audited-user"

import { Wallets, Users } from "@/app"
import { GT } from "@/graphql/index"
import Coordinates from "@/graphql/shared/types/object/coordinates"
import Timestamp from "@/graphql/shared/types/scalar/timestamp"
import Username from "@/graphql/shared/types/scalar/username"
import Wallet from "@/graphql/shared/types/abstract/wallet"
import { mapError } from "@/graphql/error-map"

import AccountLevel from "@/graphql/shared/types/scalar/account-level"
import ExternalId from "@/graphql/shared/types/scalar/external-id"

const AuditedAccount: GraphQLObjectType<Account> = GT.Object<Account>({
  name: "AuditedAccount",
  description:
    "AuditedAccount are core to the Admin Api. they are linked to wallets and an owner",
  fields: () => ({
    id: { type: GT.NonNullID },
    externalId: { type: ExternalId },
    username: { type: Username },
    level: { type: GT.NonNull(AccountLevel) },
    status: { type: GT.NonNull(AccountStatus) },
    title: { type: GT.String },
    wallets: {
      type: GT.NonNullList(Wallet),
      resolve: async (source) => {
        const result = await Wallets.listWalletsByAccountId(source.id)
        if (result instanceof Error) throw mapError(result)
        return result
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
        const user = await Users.getUser(source.kratosUserId)
        if (user instanceof Error) {
          throw mapError(user)
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

export default AuditedAccount
