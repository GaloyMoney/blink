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
  GraphQLObjectTypeConfig,
  GraphQLInputObjectTypeConfig,
  GraphQLInterfaceTypeConfig,
  GraphQLUnionTypeConfig,
  GraphQLScalarTypeConfig,
  GraphQLEnumTypeConfig,
} from "graphql"

type GTType = {
  Field<TArgs = any, TSource = any, TContext = GraphQLContext>(
    arg: GraphQLFieldConfig<TSource, TContext, TArgs>,
  ): GraphQLFieldConfig<TSource, TContext, TArgs>

  ID: GraphQLScalarType
  String: GraphQLScalarType
  Int: GraphQLScalarType
  Boolean: GraphQLScalarType
  Float: GraphQLScalarType

  Interface<TSource = any, TContext = GraphQLContext>(
    config: Readonly<GraphQLInterfaceTypeConfig<TSource, TContext>>,
  ): GraphQLInterfaceType
  Union<TSource = any, TContext = GraphQLContext>(
    config: Readonly<GraphQLUnionTypeConfig<TSource, TContext>>,
  ): GraphQLUnionType

  Scalar<TInternal = unknown, TExternal = unknown>(
    config: Readonly<GraphQLScalarTypeConfig<TInternal, TExternal>>,
  ): GraphQLScalarType<TInternal, TExternal>
  Enum(config: Readonly<GraphQLEnumTypeConfig>): GraphQLEnumType

  Object<TSource = any, TContext = GraphQLContext>(
    arg: GraphQLObjectTypeConfig<TSource, TContext>,
  ): GraphQLObjectType<TSource, TContext>
  Input(arg: Readonly<GraphQLInputObjectTypeConfig>): GraphQLInputObjectType

  NonNull(arg: any): GraphQLNonNull<any>
  List(arg: any): GraphQLList<any>

  NonNullID: GraphQLNonNull<any>
  NonNullList(arg: any): GraphQLNonNull<any>

  Kind: typeof Kind
}

// GraphQL Types
export const GT: GTType = {
  ID: GraphQLID,
  String: GraphQLString,
  Int: GraphQLInt,
  Boolean: GraphQLBoolean,
  Float: GraphQLFloat,

  Field: (config) => config,

  Interface: (arg) => new GraphQLInterfaceType(arg),
  Union: (arg) => new GraphQLUnionType(arg),

  Scalar: (arg) => new GraphQLScalarType(arg),
  Enum: (arg) => new GraphQLEnumType(arg),

  Object: (arg) => new GraphQLObjectType(arg),
  Input: (arg) => new GraphQLInputObjectType(arg),

  NonNull: (arg) => new GraphQLNonNull(arg),
  List: (arg) => new GraphQLList(arg),

  // Commonly-used Non-nulls
  NonNullID: new GraphQLNonNull(GraphQLID),
  NonNullList: (arg) => new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(arg))),

  Kind,
}

export * from "./main/index"
export * from "./admin/index"
