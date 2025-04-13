import express from "express"

import * as LoginMod from "./login"
import * as RequestParamsMod from "./request-params"
import * as WebhookMod from "./webhook"

import { wrapAsyncFunctionsToRunInSpan } from "@/services/tracing"

const handlers = wrapAsyncFunctionsToRunInSpan({
  root: true,
  namespace: "servers.authentication.telegram-passport",
  fns: {
    ...LoginMod,
    ...RequestParamsMod,
    ...WebhookMod,
  },
})

const router = express.Router({ caseSensitive: true })
router.post("/request-params", handlers.getTelegramPassportRequestParams)
router.post("/login", handlers.loginWithTelegramPassportNonce)
router.get("/webhook", handlers.handleTelegramPassportWebhookSetup)
router.post("/webhook", handlers.handleTelegramPassportWebhook)

export const telegramPassportRouter = router
