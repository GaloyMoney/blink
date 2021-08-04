import fs from "fs"
import path from "path"
import { GraphQLSchema, printSchema } from "graphql"

import { isDev } from "@core/utils"
import QueryType from "./queries"
import MutationType from "./mutations"
import SubscriptionType from "./subscriptions"

export const gqlSchema = new GraphQLSchema({
  query: QueryType,
  mutation: MutationType,
  subscription: SubscriptionType,
})

if (isDev) {
  fs.writeFileSync(
    path.resolve("./src/graphql/main/schema.graphql"),
    printSchema(gqlSchema),
  )
}
