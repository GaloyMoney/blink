import DataLoader from "dataloader"

import { Accounts, Transactions } from "@app"
import {
  ACCOUNT_USERNAME,
  SemanticAttributes,
  addAttributesToCurrentSpan,
  addAttributesToCurrentSpanAndPropagate,
  recordExceptionInCurrentSpan,
} from "@services/tracing"
import jsonwebtoken from "jsonwebtoken"

import { mapError } from "@graphql/error-map"

import { checkedToUserId } from "@domain/accounts"
import { ValidationError } from "@domain/shared"
import { UsersRepository } from "@services/mongoose"
import { baseLogger } from "@services/logger"

export const sessionPublicContext = ({
  tokenPayload,
  ip,
}: {
  tokenPayload: jsonwebtoken.JwtPayload
  ip: IpAddress | undefined
}): Promise<GraphQLPublicContext> => {
  const logger = baseLogger.child({ tokenPayload })

  let domainAccount: Account | undefined
  let user: User | undefined

  return addAttributesToCurrentSpanAndPropagate(
    {
      "token.sub": tokenPayload?.sub,
      "token.iss": tokenPayload?.iss,
      [SemanticAttributes.HTTP_CLIENT_IP]: ip,
    },
    async () => {
      // note: value should match (ie: "anon") if not an accountId
      // settings from dev/ory/oathkeeper.yml/authenticator/anonymous/config/subjet
      const maybeUserId = checkedToUserId(tokenPayload?.sub ?? "")

      if (!(maybeUserId instanceof ValidationError)) {
        const userId = maybeUserId
        const account = await Accounts.getAccountFromUserId(userId)
        if (account instanceof Error) {
          throw mapError(account)
        } else {
          domainAccount = account
          // not awaiting on purpose. just updating metadata
          // TODO: look if this can be a source of memory leaks
          Accounts.updateAccountIPsInfo({
            accountId: account.id,
            ip,
            logger,
          })
          const userRes = await UsersRepository().findById(account.kratosUserId)
          if (userRes instanceof Error) throw mapError(userRes)
          user = userRes
          addAttributesToCurrentSpan({ [ACCOUNT_USERNAME]: domainAccount?.username })
        }
      }

      const loaders = {
        txnMetadata: new DataLoader(async (keys) => {
          const txnMetadata = await Transactions.getTransactionsMetadataByIds(
            keys as LedgerTransactionId[],
          )
          if (txnMetadata instanceof Error) {
            recordExceptionInCurrentSpan({
              error: txnMetadata,
              level: txnMetadata.level,
            })

            return keys.map(() => undefined)
          }

          return txnMetadata
        }),
      }

      return {
        logger,
        loaders,
        user,
        domainAccount,
        ip,
      }
    },
  )
}
