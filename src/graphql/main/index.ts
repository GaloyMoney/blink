import { GraphQLSchema, printSchema } from "graphql"

import { isDev } from "@core/utils"
import QueryType from "./queries"
import MutationType from "./mutations"
import SubscriptionType from "./subscriptions"

export const gqlMainSchema = new GraphQLSchema({
  query: QueryType,
  mutation: MutationType,
  subscription: SubscriptionType,
})

if (isDev) {
  import("@services/fs").then(({ writeSDLFile }) => {
    writeSDLFile(__dirname + "/schema.graphql", printSchema(gqlMainSchema))
  })
}
