import { rule } from "graphql-shield"

export const isAuthenticated = rule({ cache: "contextual" })(
  (parent, args, ctx: GraphQLContextForUser) => {
    return ctx.domainAccount !== null ? true : "NOT_AUTHENTICATED"
  },
)

export const isEditor = rule({ cache: "contextual" })(
  (parent, args, ctx: GraphQLContextForUser) => {
    return ctx.domainAccount.isEditor ? true : "NOT_AUTHORIZED"
  },
)

const shouldGetNewServer = () => {
  return process.env.NEW_SERVER?.toLowerCase() === "true"
}

export const serverPath = shouldGetNewServer()
  ? "./graphql-server-new"
  : "./graphql-server-legacy"
