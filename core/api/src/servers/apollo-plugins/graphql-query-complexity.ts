import { ApolloServerPlugin } from "@apollo/server"
import { GraphQLError, GraphQLSchema, separateOperations } from "graphql"
import { ComplexityEstimator, getComplexity } from "graphql-query-complexity"

export const ApolloServerPluginGraphQLQueryComplexity = ({
  schema,
  maximumComplexity,
  estimators,
  onComplete,
  createError = (max, actual) =>
    new GraphQLError(`Query too complex. Value of ${actual} is over the maximum ${max}.`),
}: {
  schema: GraphQLSchema
  maximumComplexity: number
  estimators: Array<ComplexityEstimator>
  onComplete?: (complexity: number) => Promise<void> | void
  createError?: (max: number, actual: number) => Promise<GraphQLError> | GraphQLError
}): ApolloServerPlugin => {
  return {
    async requestDidStart() {
      return {
        async didResolveOperation({ request, document }) {
          const query = request.operationName
            ? separateOperations(document)[request.operationName]
            : document

          const complexity = getComplexity({
            schema,
            query,
            variables: request.variables,
            estimators,
          })

          if (complexity >= maximumComplexity) {
            throw await createError(maximumComplexity, complexity)
          }

          if (onComplete) {
            await onComplete(complexity)
          }
        },
      }
    },
  }
}
