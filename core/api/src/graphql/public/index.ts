import { GraphQLSchema } from "graphql"

import { QueryType } from "./queries"
import { MutationType } from "./mutations"
import { SubscriptionType } from "./subscriptions"

import { ALL_INTERFACE_TYPES } from "@/graphql/public/types"

export { queryFields } from "./queries"
export { mutationFields } from "./mutations"

export const gqlPublicSchema = new GraphQLSchema({
  query: QueryType,
  mutation: MutationType,
  subscription: SubscriptionType,
  types: ALL_INTERFACE_TYPES,
})
