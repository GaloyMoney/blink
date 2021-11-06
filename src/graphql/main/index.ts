import { GraphQLSchema, printSchema } from "graphql"

import { ALL_INTERFACE_TYPES } from "@graphql/types"
import QueryType from "./queries"
import MutationType from "./mutations"
import SubscriptionType from "./subscriptions"
import { getApolloConfig } from "@config/app"

export const gqlMainSchema = new GraphQLSchema({
  query: QueryType,
  mutation: MutationType,
  subscription: SubscriptionType,
  types: ALL_INTERFACE_TYPES,
})

const apolloConfig = getApolloConfig()

if (apolloConfig.playground) {
  import("@services/fs").then(({ writeSDLFile }) => {
    writeSDLFile(__dirname + "/schema.graphql", printSchema(gqlMainSchema))
  })
}
