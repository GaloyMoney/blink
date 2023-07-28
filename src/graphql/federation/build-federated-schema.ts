import {
  lexicographicSortSchema,
  extendSchema,
  parse,
  printSchema,
  GraphQLSchema,
} from "graphql"

import { buildSubgraphSchema } from "@apollo/subgraph"

import { makeExecutableSchema } from "@graphql-tools/schema"

import { getResolversFromSchema } from "@graphql-tools/utils"

import { IMiddlewareGenerator, applyMiddleware } from "graphql-middleware"

/**
 * Builds the GraphQLSchema by extending it with the
 * fedederation.graphql for Apollo Federation. It also applies the middleware
 * @example const schema = buildFederationSchema(
      gqlMainSchema,
      permissions,
      walletIdMiddleware,
      federationExtendTypes,
  )
 * @param schemaInput
 * @param permissions
 * @param walletIdMiddleware
 * @param federationExtendTypes see https://www.apollographql.com/docs/enterprise-guide/federated-schema-design/
 *   @example extend type User @key(fields: "id")
 *
 * @returns GraphQLSchemaWithFragmentReplacements
 */
export function buildFederatedSchema(
  schemaInput: GraphQLSchema,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  permissions: IMiddlewareGenerator<any, any, any>,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  walletIdMiddleware: any,
  federationExtendTypes: string,
  federationLinks: string,
) {
  let schemaString = printSchema(lexicographicSortSchema(schemaInput))
  schemaString = federationLinks + schemaString
  const parsedSDL = parse(schemaString)
  const resolvers = getResolversFromSchema(schemaInput)
  const subgraphSchema = buildSubgraphSchema(parsedSDL)
  const executableSchema = makeExecutableSchema({ typeDefs: subgraphSchema, resolvers })
  let schema = applyMiddleware(executableSchema, permissions, walletIdMiddleware)
  // https://github.com/graphql/graphql-js/issues/1478#issuecomment-415862812
  schema = extendSchema(schema, parse(federationExtendTypes), { assumeValidSDL: true })
  // inject new federated schema
  return schema
}
