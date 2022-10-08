import { Accounts, Users } from "@app"
import {
  ACCOUNT_USERNAME,
  addAttributesToCurrentSpan,
  addAttributesToCurrentSpanAndPropagate,
  SemanticAttributes,
} from "@services/tracing"
import { ApolloError } from "apollo-server-express"
import jsonwebtoken from "jsonwebtoken"

import { checkedToAccountId, InvalidAccountIdError } from "@domain/accounts"

import Geetest from "@services/geetest"

import { getGeetestConfig } from "@config"
import { baseLogger } from "@services/logger"

import { AuthenticationError, AuthorizationError } from "@graphql/error"
import { rule } from "graphql-shield"

const graphqlLogger = baseLogger.child({
  module: "graphql",
})

const geeTestConfig = getGeetestConfig()
const geetest = Geetest(geeTestConfig)

export const sessionContext = ({
  tokenPayload,
  ip,
  body,
}: {
  tokenPayload: jsonwebtoken.JwtPayload
  ip: IpAddress | undefined
  body: unknown
}): Promise<GraphQLContext> => {
  const logger = graphqlLogger.child({ tokenPayload, body })

  let domainUser: User | null = null
  let domainAccount: Account | undefined

  // note: value should match (ie: "anon") if not an accountId
  // settings from dev/ory/oathkeeper.yml/authenticator/anonymous/config/subjet
  const maybeAid = checkedToAccountId(tokenPayload.sub || "")

  return addAttributesToCurrentSpanAndPropagate(
    {
      [SemanticAttributes.ENDUSER_ID]: tokenPayload.sub,
      [SemanticAttributes.HTTP_CLIENT_IP]: ip,
    },
    async () => {
      if (!(maybeAid instanceof InvalidAccountIdError)) {
        const userId = maybeAid as string as UserId // FIXME: fix until User is attached to kratos
        const loggedInUser = await Users.getUserForLogin({ userId, ip, logger })
        if (loggedInUser instanceof Error)
          throw new ApolloError("Invalid user authentication", "INVALID_AUTHENTICATION", {
            reason: loggedInUser,
          })
        domainUser = loggedInUser

        const loggedInDomainAccount = await Accounts.getAccount(maybeAid)
        if (loggedInDomainAccount instanceof Error) throw Error
        domainAccount = loggedInDomainAccount

        addAttributesToCurrentSpan({ [ACCOUNT_USERNAME]: domainAccount?.username })
      }

      return {
        logger,
        // FIXME: we should not return this for the admin graphql endpoint
        domainUser,
        domainAccount,
        geetest,
        ip,
      }
    },
  )
}

export const isAuthenticated = rule({ cache: "contextual" })(
  (parent, args, ctx: GraphQLContext) => {
    return ctx.domainAccount !== null
      ? true
      : new AuthenticationError({ logger: baseLogger })
  },
)

export const isEditor = rule({ cache: "contextual" })(
  (parent, args, ctx: GraphQLContextForUser) => {
    return ctx.domainAccount.isEditor
      ? true
      : new AuthorizationError({ logger: baseLogger })
  },
)
