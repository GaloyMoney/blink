import { GT } from "@graphql/index"

import GraphQLUser from "@graphql/types/object/graphql-user"

const MeQuery = GT.Field({
  type: GraphQLUser,
  resolve: async (_, __, { domainUser }) => domainUser,
})

export default MeQuery
