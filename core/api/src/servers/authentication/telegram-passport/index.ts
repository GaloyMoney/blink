import express from "express"

import * as LoginMod from "./login"
import * as RequestAuthDataMod from "./request-auth-data"
import * as WebhookMod from "./webhook"

import { wrapAsyncFunctionsToRunInSpan } from "@/services/tracing"

const handlers = wrapAsyncFunctionsToRunInSpan({
  root: true,
  namespace: "servers.authentication.telegram-passport",
  fns: {
    ...LoginMod,
    ...RequestAuthDataMod,
    ...WebhookMod,
  },
})

const router = express.Router({ caseSensitive: true })
router.post("/auth-data", handlers.requestTelegramPassportAuthData)
router.post("/login", handlers.loginWithTelegramPassportNonce)
router.get("/webhook", handlers.handleTelegramPassportWebhookSetup)
router.post("/webhook", handlers.handleTelegramPassportWebhook)

export const telegramPassportRouter = router
