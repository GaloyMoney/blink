import { GT } from "@graphql/index"

import GraphQLUser from "@graphql/public/types/object/user"

const MeQuery = GT.Field<null, GraphQLPublicContext>({
  type: GraphQLUser,
  resolve: async (_, __, { user }) => user,
})

export default MeQuery
