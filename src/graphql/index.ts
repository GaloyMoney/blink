import {
  GraphQLID,
  GraphQLObjectType,
  GraphQLScalarType,
  GraphQLString,
  GraphQLInt,
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
  Object: GraphQLObjectType,
  String: GraphQLString,
  Int: GraphQLInt,
  Boolean: GraphQLBoolean,
  Scalar: GraphQLScalarType,
  Enum: GraphQLEnumType,
  NonNull: GraphQLNonNull,
  Kind,

  // Commonly-used Non-nulls
  NonNullID: GraphQLNonNull(GraphQLID),
  NonNullList: (GraphQLType) => GraphQLNonNull(GraphQLList(GraphQLNonNull(GraphQLType))),
}

export * from "./core/index"
export * from "./admin/index"
