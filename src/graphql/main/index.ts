import { GraphQLSchema, lexicographicSortSchema, printSchema } from "graphql"

import { ALL_INTERFACE_TYPES } from "@graphql/types"

import { isDev } from "@config"

import QueryType from "./queries"
import MutationType from "./mutations"
import SubscriptionType from "./subscriptions"

if (isDev) {
  import("@services/fs").then(({ writeSDLFile }) => {
    writeSDLFile(
      __dirname + "/schema.graphql",
      printSchema(lexicographicSortSchema(gqlMainSchema)),
    )
  })
}

export const gqlMainSchema = new GraphQLSchema({
  query: QueryType,
  mutation: MutationType,
  subscription: SubscriptionType,
  types: ALL_INTERFACE_TYPES,
})
