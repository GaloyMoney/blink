import { GraphQLSchema, lexicographicSortSchema, printSchema } from "graphql"

import { isDev } from "@config/app"

import QueryType from "./queries"
import MutationType from "./mutations"

if (isDev) {
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
})
