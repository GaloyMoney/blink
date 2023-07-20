import { GraphQLSchema } from "graphql"

import { ALL_INTERFACE_TYPES } from "@graphql/types"

import { QueryType } from "./queries"
import { MutationType } from "./mutations"
import { SubscriptionType } from "./subscriptions"

export { queryFields } from "./queries"
export { mutationFields } from "./mutations"

export const gqlMainSchema = new GraphQLSchema({
  query: QueryType,
  mutation: MutationType,
  subscription: SubscriptionType,
  types: ALL_INTERFACE_TYPES,
})
