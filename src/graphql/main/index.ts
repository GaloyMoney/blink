import fs from "fs"
import path from "path"
import { GraphQLSchema, printSchema } from "graphql"

import { isDev } from "@core/utils"

import QueryType from "./queries"
import MutationType from "./mutations"
import SubscriptionType from "./subscriptions"
import { TYPE_FOR_INTERFACES } from "@graphql/types"

export const gqlSchema = new GraphQLSchema({
  query: QueryType,
  mutation: MutationType,
  subscription: SubscriptionType,
  types: TYPE_FOR_INTERFACES,
})

if (isDev) {
  fs.writeFileSync(
    path.resolve("./src/graphql/main/schema.graphql"),
    printSchema(gqlSchema),
  )
}
