import { GraphQLSchema, printSchema } from "graphql"

import { isDev } from "@core/utils"
import QueryType from "./queries"
import MutationType from "./mutations"

export const gqlAdminSchema = new GraphQLSchema({
  query: QueryType,
  mutation: MutationType,
})

if (isDev) {
  import("@services/fs").then(({ writeSDLFile }) => {
    writeSDLFile(__dirname + "/schema.graphql", printSchema(gqlAdminSchema))
  })
}
