import { getNamedType, resolveObjMapThunk } from "graphql"
import {
  ConnectionArguments,
  ConnectionConfig,
  GraphQLConnectionDefinitions,
} from "graphql-relay"

import { GT } from "."

// The following function is temporary. It shloud be replaced by db pagination.

// It's a slightly modified version of the same function in graphql-relay.
// The original function uses offset-based cursors which means
// reusing the function on a different array of data reuses cursor values.
// That's a problem for client's merging of paginated sets.

// This modified version uses the identity of the objects in array
// for cursor values instead.

export const connectionFromArray = <T extends { id: string }>(
  array: ReadonlyArray<T>,
  args: ConnectionArguments,
) => {
  const { after, before, first, last } = args
  const sliceStart = 0
  const arrayLength = array.length
  const sliceEnd = sliceStart + array.length

  let startOffset = Math.max(sliceStart, 0)
  let endOffset = Math.min(sliceEnd, arrayLength)

  const afterOffset = after ? array.findIndex((obj) => obj.id === after) : -1
  if (0 <= afterOffset && afterOffset < arrayLength) {
    startOffset = Math.max(startOffset, afterOffset + 1)
  }

  const beforeOffset = before ? array.findIndex((obj) => obj.id === before) : endOffset
  if (0 <= beforeOffset && beforeOffset < arrayLength) {
    endOffset = Math.min(endOffset, beforeOffset)
  }

  if (typeof first === "number") {
    if (first < 0) {
      throw new Error('Argument "first" must be a non-negative integer')
    }

    endOffset = Math.min(endOffset, startOffset + first)
  }

  if (typeof last === "number") {
    if (last < 0) {
      throw new Error('Argument "last" must be a non-negative integer')
    }

    startOffset = Math.max(startOffset, endOffset - last)
  }

  // If supplied slice is too large, trim it down before mapping over it.
  const slice = array.slice(startOffset - sliceStart, endOffset - sliceStart)

  const edges = slice.map((obj) => ({ cursor: obj.id, node: obj }))

  const firstEdge = edges[0]
  const lastEdge = edges[edges.length - 1]
  const lowerBound = after != null ? afterOffset + 1 : 0
  const upperBound = before != null ? beforeOffset : arrayLength

  return {
    edges,
    pageInfo: {
      startCursor: firstEdge ? firstEdge.cursor : null,
      endCursor: lastEdge ? lastEdge.cursor : null,
      hasPreviousPage: typeof last === "number" ? startOffset > lowerBound : false,
      hasNextPage: typeof first === "number" ? endOffset < upperBound : false,
    },
  }
}

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
