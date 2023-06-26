import { GT } from "@graphql/index"

import GraphQLUser from "@graphql/types/object/user"

const MeQuery = GT.Field({
  type: GraphQLUser,
  resolve: async (_, __, { user }) => user,
})

export default MeQuery
