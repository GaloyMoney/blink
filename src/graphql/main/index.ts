import { GraphQLSchema } from "graphql"

import { ALL_INTERFACE_TYPES } from "@graphql/types"

import { MutationType } from "./mutations"
import { QueryType } from "./queries"
import { SubscriptionType } from "./subscriptions"

export { mutationFields } from "./mutations"
export { queryFields } from "./queries"

export const gqlMainSchema = new GraphQLSchema({
  query: QueryType,
  mutation: MutationType,
  subscription: SubscriptionType,
  types: ALL_INTERFACE_TYPES,
})
