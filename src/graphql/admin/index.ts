import { GraphQLSchema, printSchema } from "graphql"

import { isProd } from "@core/utils"

import { ALL_INTERFACE_TYPES } from "@graphql/types"

import QueryType from "./queries"
import MutationType from "./mutations"

export const gqlAdminSchema = new GraphQLSchema({
  query: QueryType,
  mutation: MutationType,
  types: ALL_INTERFACE_TYPES,
})

if (!isProd) {
  import("@services/fs").then(({ writeSDLFile }) => {
    writeSDLFile(__dirname + "/schema.graphql", printSchema(gqlAdminSchema))
  })
}
