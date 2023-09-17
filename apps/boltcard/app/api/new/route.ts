import { NextRequest, NextResponse } from "next/server"

import { aesDecryptKey, serverUrl } from "../../config"
import { fetchByOneTimeCode } from "../../knex"

interface NewCardResponse {
  protocol_name: string
  protocol_version: number
  card_name: string
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
  const oneTimeCode = searchParams.get("a")

  if (!oneTimeCode) {
    return NextResponse.json(
      { status: "ERROR", reason: "value a is missing" },
      { status: 400 },
    )
  }

  const cardInit = await fetchByOneTimeCode(oneTimeCode)

  if (!cardInit) {
    return NextResponse.json(
      { status: "ERROR", reason: "cardInit not found" },
      { status: 400 },
    )
  }

  if (cardInit.status !== "init") {
    return NextResponse.json(
      { status: "ERROR", reason: "code has already been used" },
      { status: 400 },
    )
  }

  const lnurlwBase = `${serverUrl}/ln`
    .replace("http://", "lnurlw://")
    .replace("https://", "lnurlw://")
  const k1DecryptKey = aesDecryptKey.toString("hex")

  const response: NewCardResponse = {
    protocol_name: "create_bolt_card_response",
    protocol_version: 2,
    card_name: "",
    lnurlw_base: lnurlwBase,
    k0: cardInit.k0AuthKey,
    k1: k1DecryptKey,
    k2: cardInit.k2CmacKey,
    k3: cardInit.k3,
    k4: cardInit.k4,
    uid_privacy: "Y",
  }

  return NextResponse.json(response)
}
