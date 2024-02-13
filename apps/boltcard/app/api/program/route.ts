import { NextRequest, NextResponse } from "next/server"

import { aesDecryptKey, serverUrl } from "@/services/config"
import { fetchByCarksKeysSetupCardId } from "@/services/db/card-init"

interface ActivateCardResponse {
  warning: boolean
  protocol_name: string
  protocol_version: number
  card_name: string
  cardId: string
  lnurlw_base: string
  k0: string
  k1: string
  k2: string
  k3: string
  k4: string
  uid_privacy: string
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const cardId = searchParams.get("cardId")

  if (!cardId) {
    return NextResponse.json(
      { status: "ERROR", reason: "value a is missing" },
      { status: 400 },
    )
  }

  const cardKeysSetup = await fetchByCarksKeysSetupCardId(cardId)

  if (!cardKeysSetup) {
    return NextResponse.json(
      { status: "ERROR", reason: "cardKeysSetup not found" },
      { status: 400 },
    )
  }

  let warningReusedCode = false

  if (cardKeysSetup.status !== "init") {
    warningReusedCode = true
  }

  const lnurlwBase = `${serverUrl}/api/ln`
    .replace("http://", "lnurlw://")
    .replace("https://", "lnurlw://")

  const k1DecryptKey = aesDecryptKey.toString("hex")

  const response: ActivateCardResponse = {
    warning: warningReusedCode,
    protocol_name: "create_bolt_card_response",
    protocol_version: 2,
    card_name: cardKeysSetup.cardId,
    cardId: cardKeysSetup.cardId,
    lnurlw_base: lnurlwBase,
    k0: cardKeysSetup.k0AuthKey,
    k1: k1DecryptKey,
    k2: cardKeysSetup.k2CmacKey,
    k3: cardKeysSetup.k3,
    k4: cardKeysSetup.k4,
    uid_privacy: "Y",
  }

  return NextResponse.json(response)
}
