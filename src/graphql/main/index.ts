import {
  GraphQLSchema,
  GraphQLString,
  lexicographicSortSchema,
  printSchema,
} from "graphql"

import { ALL_INTERFACE_TYPES } from "@graphql/types"

import { isDev, isRunningJest } from "@config"

import { GT } from ".."

import QueryType from "./queries"
import MutationType from "./mutations"
import SubscriptionType from "./subscriptions"

if (isDev && !isRunningJest) {
  import("@services/fs").then(({ writeSDLFile }) => {
    writeSDLFile(
      __dirname + "/schema.graphql",
      printSchema(lexicographicSortSchema(gqlMainSchema)),
    )
    writeSDLFile(
      __dirname + "/subscription.graphql",
      printSchema(lexicographicSortSchema(gqlSubscriptionSchema)),
    )
  })
}

export const gqlMainSchema = new GraphQLSchema({
  query: QueryType,
  mutation: MutationType,
  subscription: SubscriptionType,
  types: ALL_INTERFACE_TYPES,
})

export const gqlSubscriptionSchema = new GraphQLSchema({
  subscription: SubscriptionType,
  types: ALL_INTERFACE_TYPES,
  query: GT.Object({
    name: "Query",
    fields: {
      _: {
        type: GraphQLString,
      },
    },
  }),
})
