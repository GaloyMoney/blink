import {
  addAttributesToCurrentSpanAndPropagate,
  SemanticAttributes,
  ACCOUNT_USERNAME,
} from "@services/tracing"
import { GT } from "@graphql/index"

import GraphQLUser from "@graphql/types/object/graphql-user"

const MeQuery = GT.Field({
  type: GraphQLUser,
  resolve: async (_, __, { ip, domainUser, domainAccount }) =>
    addAttributesToCurrentSpanAndPropagate(
      {
        [SemanticAttributes.ENDUSER_ID]: domainUser?.id,
        [ACCOUNT_USERNAME]: domainAccount?.username,
        [SemanticAttributes.HTTP_CLIENT_IP]: ip,
      },
      () => domainUser,
    ),
})

export default MeQuery
