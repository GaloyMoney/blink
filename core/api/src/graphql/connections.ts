import { getNamedType, resolveObjMapThunk } from "graphql"
import { ConnectionConfig, GraphQLConnectionDefinitions } from "graphql-relay"

import { GT } from "."

import { InputValidationError } from "@/graphql/error"
import { DEFAULT_MAX_CONNECTION_LIMIT } from "@/services/ledger/paginated-ledger"

const CURSOR_REGEX = /^[A-Fa-f0-9]{24}$/

// The following function is temporary. It should be replaced by db pagination.

// It's a slightly modified version of the same function in graphql-relay.
// The original function uses offset-based cursors which means
// reusing the function on a different array of data reuses cursor values.
// That's a problem for client's merging of paginated sets.

// This modified version uses the identity of the objects in array
// for cursor values instead.

export const connectionFromPaginatedArray = <T extends { id: string }>(
  array: ReadonlyArray<T>,
  totalLength: number,
  args: PaginationArgs,
) => {
  const { after, before, first, last } = args

  const sliceStart = 0
  const sliceEnd = sliceStart + array.length

  let startOffset = Math.max(sliceStart, 0)
  let endOffset = Math.min(sliceEnd, totalLength)

  const afterOffset = after ? array.findIndex((obj) => obj.id === after) : -1
  if (0 <= afterOffset && afterOffset < totalLength) {
    startOffset = Math.max(startOffset, afterOffset + 1)
  }

  const beforeOffset = before ? array.findIndex((obj) => obj.id === before) : endOffset
  if (0 <= beforeOffset && beforeOffset < totalLength) {
    endOffset = Math.min(endOffset, beforeOffset)
  }

  if (first) {
    endOffset = Math.min(endOffset, startOffset + first)
  }

  if (last) {
    startOffset = Math.max(startOffset, endOffset - last)
  }

  // If supplied slice is too large, trim it down before mapping over it.
  const slice = array.slice(startOffset - sliceStart, endOffset - sliceStart)

  const edges = slice.map((obj) => ({ cursor: obj.id, node: obj }))

  const firstEdge = edges[0]
  const lastEdge = edges[edges.length - 1]
  const lowerBound = after != null ? afterOffset + 1 : 0
  const upperBound = before != null ? beforeOffset : totalLength

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

export const checkedConnectionArgs = (args: PaginationArgs): PaginationArgs | Error => {
  if (typeof args.first === "number" && args.first > DEFAULT_MAX_CONNECTION_LIMIT) {
    return new InputValidationError({
      message: `Requesting ${args.first} records on this connection exceeds the "first" limit of ${DEFAULT_MAX_CONNECTION_LIMIT} records.`,
    })
  }

  if (typeof args.last === "number" && args.last > DEFAULT_MAX_CONNECTION_LIMIT) {
    return new InputValidationError({
      message: `Requesting ${args.last} records on this connection exceeds the "last" limit of ${DEFAULT_MAX_CONNECTION_LIMIT} records.`,
    })
  }

  if (typeof args.first === "number" && args.first <= 0) {
    return new InputValidationError({
      message: 'Argument "first" must be greater than 0',
    })
  }

  if (typeof args.last === "number" && args.last <= 0) {
    return new InputValidationError({ message: 'Argument "last" must be greater than 0' })
  }

  // FIXME: make first or last required (after making sure no one is using them as optional)
  if (args.first === undefined && args.last === undefined) {
    args.first = DEFAULT_MAX_CONNECTION_LIMIT
  }

  if (args.after && typeof args.after === "string" && !CURSOR_REGEX.test(args.after)) {
    return new InputValidationError({
      message: 'Argument "after" must be a valid cursor',
    })
  }

  if (args.before && typeof args.before === "string" && !CURSOR_REGEX.test(args.before)) {
    return new InputValidationError({
      message: 'Argument "before" must be a valid cursor',
    })
  }

  return args
}
