import {
  GraphQLID,
  GraphQLObjectType,
  GraphQLInputObjectType,
  GraphQLScalarType,
  GraphQLString,
  GraphQLInt,
  GraphQLFloat,
  GraphQLNonNull,
  GraphQLList,
  GraphQLEnumType,
  Kind,
  GraphQLBoolean,
} from "graphql"

// ##### GraphQL-related utility functions ####

// GraphQL Types
export const GT = {
  // Wrappers/shortners
  Scalar: GraphQLScalarType,
  Object: GraphQLObjectType,
  Input: GraphQLInputObjectType,
  String: GraphQLString,
  Int: GraphQLInt,
  Boolean: GraphQLBoolean,
  Float: GraphQLFloat,
  Enum: GraphQLEnumType,
  NonNull: GraphQLNonNull,
  Kind,

  // Commonly-used Non-nulls
  NonNullID: GraphQLNonNull(GraphQLID),
  NonNullList: (GraphQLType) => GraphQLNonNull(GraphQLList(GraphQLNonNull(GraphQLType))),
}

export * from "./main/index"
export * from "./admin/index"
