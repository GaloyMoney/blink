import { GraphQLSchema } from "graphql"

import { QueryType } from "./queries"
import { MutationType } from "./mutations"
import { ALL_INTERFACE_TYPES } from "./types"

export { queryFields as adminQueryFields } from "./queries"
export { mutationFields as adminMutationFields } from "./mutations"

export const gqlAdminSchema = new GraphQLSchema({
  query: QueryType,
  mutation: MutationType,
  types: ALL_INTERFACE_TYPES,
})
