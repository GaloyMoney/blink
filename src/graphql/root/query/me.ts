import {
  addAttributesToCurrentSpanAndPropagate,
  SemanticAttributes,
  ENDUSER_ALIAS,
} from "@services/tracing"
import { GT } from "@graphql/index"

import GraphQLUser from "@graphql/types/object/graphql-user"

const MeQuery = GT.Field({
  type: GraphQLUser,
  resolve: async (_, __, { ip, domainUser }) =>
    addAttributesToCurrentSpanAndPropagate(
      {
        [SemanticAttributes.ENDUSER_ID]: domainUser?.id,
        [ENDUSER_ALIAS]: domainUser?.username,
        [SemanticAttributes.HTTP_CLIENT_IP]: ip,
      },
      () => domainUser,
    ),
})

export default MeQuery
