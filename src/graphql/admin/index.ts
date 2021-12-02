import { GraphQLSchema, printSchema } from "graphql"

import { ALL_INTERFACE_TYPES } from "@graphql/types"

import QueryType from "./queries"
import MutationType from "./mutations"
import { isDev } from "@core/utils"

export const gqlAdminSchema = new GraphQLSchema({
  query: QueryType,
  mutation: MutationType,
  types: ALL_INTERFACE_TYPES,
})

if (isDev) {
  import("@services/fs").then(({ writeSDLFile }) => {
    writeSDLFile(__dirname + "/schema.graphql", printSchema(gqlAdminSchema))
  })
}
