import {
  GraphQLID,
  GraphQLObjectType,
  GraphQLInputObjectType,
  GraphQLScalarType,
  GraphQLEnumType,
  GraphQLString,
  GraphQLInt,
  GraphQLFloat,
  GraphQLBoolean,
  GraphQLInterfaceType,
  GraphQLUnionType,
  GraphQLList,
  GraphQLNonNull,
  Kind,
} from "graphql"
import { PubSub } from "graphql-subscriptions"

export const pubsub = new PubSub()

// GraphQL Types
export const GT = {
  // Wrap root configurations for consistency
  Field: (config) => config,

  // Wrappers/shortners
  Interface: GraphQLInterfaceType,
  Union: GraphQLUnionType,

  Scalar: GraphQLScalarType,
  Enum: GraphQLEnumType,

  ID: GraphQLID,
  String: GraphQLString,
  Int: GraphQLInt,
  Boolean: GraphQLBoolean,
  Float: GraphQLFloat,

  Object: GraphQLObjectType,
  Input: GraphQLInputObjectType,

  NonNull: GraphQLNonNull,
  List: GraphQLList,

  // Commonly-used Non-nulls
  NonNullID: GraphQLNonNull(GraphQLID),
  NonNullList: (GraphQLType) => GraphQLNonNull(GraphQLList(GraphQLNonNull(GraphQLType))),

  Kind,
}

export * from "./main/index"
export * from "./admin/index"
