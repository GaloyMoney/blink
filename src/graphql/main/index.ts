import { GraphQLSchema, printSchema } from "graphql"

import { ALL_INTERFACE_TYPES } from "@graphql/types"
import { isProd } from "@core/utils"
import QueryType from "./queries"
import MutationType from "./mutations"
import SubscriptionType from "./subscriptions"

export const gqlMainSchema = new GraphQLSchema({
  query: QueryType,
  mutation: MutationType,
  subscription: SubscriptionType,
  types: ALL_INTERFACE_TYPES,
})

if (!isProd) {
  import("@services/fs").then(({ writeSDLFile }) => {
    writeSDLFile(__dirname + "/schema.graphql", printSchema(gqlMainSchema))
  })
}
