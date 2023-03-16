import { GraphQLSchema } from "graphql"

import { MutationType } from "./mutations"
import { QueryType } from "./queries"
import { ALL_INTERFACE_TYPES } from "./types"

export { mutationFields as adminMutationFields } from "./mutations"
export { queryFields as adminQueryFields } from "./queries"

export const gqlAdminSchema = new GraphQLSchema({
  query: QueryType,
  mutation: MutationType,
  types: ALL_INTERFACE_TYPES,
})
