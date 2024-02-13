import { NextRequest, NextResponse } from "next/server"

import { AES_DECRYPT_KEY } from "@/services/config"
import { fetchByCardId } from "@/services/db/card"
import { fetchByCarksKeysSetupCardId } from "@/services/db/card-init"

export async function GET(req: NextRequest) {
  // should be pass with POST? not sure if this would be compatible
  // with the wallet that can initiate cards

  const { searchParams } = new URL(req.url)
  const cardId = searchParams.get("cardId")

  if (!cardId) {
    return NextResponse.json(
      { status: "ERROR", reason: "cardId or a missing" },
      { status: 400 },
    )
  }
  // TODO authorization

  // TODO may be both on CardKeysSetup and Card table
  let card = await fetchByCardId(cardId)

  if (!card) {
    card = await fetchByCarksKeysSetupCardId(cardId)
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
