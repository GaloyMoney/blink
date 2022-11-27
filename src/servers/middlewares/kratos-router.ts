import cors from "cors"
import express from "express"

import { getDefaultAccountsConfig, getKratosConfig } from "@config"
import { wrapAsyncToRunInSpan } from "@services/tracing"
import { createAccountWithPhoneIdentifier } from "@app/accounts"

const kratosRouter = express.Router({ caseSensitive: true })

const { corsAllowedOrigins } = getKratosConfig()

kratosRouter.use(cors({ origin: corsAllowedOrigins, credentials: true }))
kratosRouter.use(express.json())

kratosRouter.post(
  "/registration",
  wrapAsyncToRunInSpan({
    namespace: "registration",
    fn: async (req: express.Request, res: express.Response) => {
      const body = req.body
      const { identity_id: kratosUserId, phone, schema_id } = body

      console.log({ phone, schema_id })

      const account = await createAccountWithPhoneIdentifier({
        newAccountInfo: { phone, kratosUserId },
        config: getDefaultAccountsConfig(),
      })
      if (account instanceof Error) {
        res.status(500)
        return
      }

      res.send("ok\n")
    },
  }),
)

export default kratosRouter
