import { NextRequest, NextResponse } from "next/server"

import { AES_DECRYPT_KEY } from "../../../services/config"

import { fetchByCardId, fetchByOneTimeCode } from "../../../services/db/schema"

export async function GET(req: NextRequest) {
  // should be pass with POST? not sure if this would be compatible
  // with the wallet that can create cards

  const { searchParams } = new URL(req.url)
  const cardId = searchParams.get("cardId")
  const oneTimeCode = searchParams.get("a")

  if (!cardId && !oneTimeCode) {
    return NextResponse.json(
      { status: "ERROR", reason: "cardId or a missing" },
      { status: 400 },
    )
  }
  // TODO authorization

  // TODO may be both on CardInit and Card table
  let card
  if (cardId) {
    card = await fetchByCardId(cardId)
  } else if (oneTimeCode) {
    card = await fetchByOneTimeCode(oneTimeCode)
  } else {
    return NextResponse.json(
      { status: "ERROR", reason: "cardId or a missing" },
      { status: 400 },
    )
  }

  if (!card) {
    return NextResponse.json(
      { status: "ERROR", reason: "card not found" },
      { status: 400 },
    )
  }

  return NextResponse.json({
    status: "OK",
    action: "wipe",
    k0: card.k0AuthKey,
    k1: AES_DECRYPT_KEY,
    k2: card.k2CmacKey,
    k3: card.k3,
    k4: card.k4,
    uid: card.uid,
    version: 1,
  })
}
