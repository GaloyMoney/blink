import { NextRequest, NextResponse } from "next/server"

import { fetchPublicByCardUid } from "@/services/db/card"

export async function GET(req: NextRequest, { params }: { params: { uid: string } }) {
  const uid = params.uid
  const card = await fetchPublicByCardUid(uid)
  if (!card) {
    return NextResponse.json(
      { status: "ERROR", reason: "card not found" },
      { status: 400 },
    )
  }

  return NextResponse.json(card)
}
