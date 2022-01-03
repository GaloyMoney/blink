/* eslint-disable @typescript-eslint/no-explicit-any */
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
  GraphQLFieldConfig,
} from "graphql"

type GTType = {
  Field<TArgs = any, TSource = null, TContext = GraphQLContext>(
    arg: GraphQLFieldConfig<TSource, TContext, TArgs>,
  ): GraphQLFieldConfig<TSource, TContext, TArgs>
  Interface: typeof GraphQLInterfaceType
  Union: typeof GraphQLUnionType
  Scalar: typeof GraphQLScalarType
  Enum: typeof GraphQLEnumType
  ID: GraphQLScalarType
  String: GraphQLScalarType
  Int: GraphQLScalarType
  Boolean: GraphQLScalarType
  Float: GraphQLScalarType
  Object: typeof GraphQLObjectType
  Input: typeof GraphQLInputObjectType
  NonNull: (arg: any) => GraphQLNonNull<any>
  List: (arg: any) => GraphQLList<any>
  NonNullID: GraphQLNonNull<any>
  NonNullList: (arg: any) => GraphQLNonNull<any>
  Kind: typeof Kind
}

// GraphQL Types
export const GT: GTType = {
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

  NonNull: (arg) => new GraphQLNonNull(arg),
  List: (arg) => new GraphQLList(arg),

  // Commonly-used Non-nulls
  NonNullID: new GraphQLNonNull(GraphQLID),
  NonNullList: (arg) => new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(arg))),

  Kind,
}

export * from "./main/index"
export * from "./admin/index"
