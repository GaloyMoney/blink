import { getNamedType, resolveObjMapThunk } from "graphql"
import { ConnectionConfig, GraphQLConnectionDefinitions } from "graphql-relay"

import { GT } from "."

const pageInfoType = GT.Object({
  name: "PageInfo",
  description: "Information about pagination in a connection.",
  fields: () => ({
    hasNextPage: {
      type: GT.NonNull(GT.Boolean),
      description: "When paginating forwards, are there more items?",
    },
    hasPreviousPage: {
      type: GT.NonNull(GT.Boolean),
      description: "When paginating backwards, are there more items?",
    },
    startCursor: {
      type: GT.String,
      description: "When paginating backwards, the cursor to continue.",
    },
    endCursor: {
      type: GT.String,
      description: "When paginating forwards, the cursor to continue.",
    },
  }),
})

// The following modified version of connectionDefinitions
// changes the type of edges to be [Edge!] instead of [Edge]
// and the type of Edge to have the nodeType non-nullable as well

export const connectionDefinitions = (
  config: ConnectionConfig,
): GraphQLConnectionDefinitions => {
  const { nodeType } = config
  const name = config.name ?? getNamedType(nodeType).name
  const edgeType = GT.Object({
    name: name + "Edge",
    description: "An edge in a connection.",
    fields: () => ({
      node: {
        type: GT.NonNull(nodeType),
        resolve: config.resolveNode,
        description: "The item at the end of the edge",
      },
      cursor: {
        type: GT.NonNull(GT.String),
        resolve: config.resolveCursor,
        description: "A cursor for use in pagination",
      },
      ...resolveObjMapThunk(config.edgeFields ?? {}),
    }),
  })
  const connectionType = GT.Object({
    name: name + "Connection",
    description: "A connection to a list of items.",
    fields: () => ({
      pageInfo: {
        type: GT.NonNull(pageInfoType),
        description: "Information to aid in pagination.",
      },
      edges: {
        type: GT.List(GT.NonNull(edgeType)),
        description: "A list of edges.",
      },
      ...resolveObjMapThunk(config.connectionFields ?? {}),
    }),
  })

  return { edgeType, connectionType }
}

export { connectionArgs } from "graphql-relay"
