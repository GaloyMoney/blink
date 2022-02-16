import { GraphQLSchema, lexicographicSortSchema, printSchema } from "graphql"

import { isDev, isRunningJest } from "@config"

import QueryType from "./queries"
import MutationType from "./mutations"
import { ALL_INTERFACE_TYPES } from "./types"

if (isDev && !isRunningJest) {
  import("@services/fs").then(({ writeSDLFile }) => {
    writeSDLFile(
      __dirname + "/schema.graphql",
      printSchema(lexicographicSortSchema(gqlAdminSchema)),
    )
  })
}

export const gqlAdminSchema = new GraphQLSchema({
  query: QueryType,
  mutation: MutationType,
  types: ALL_INTERFACE_TYPES,
})
