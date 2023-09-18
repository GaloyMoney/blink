import { NextRequest, NextResponse } from "next/server"

import { fetchByUid } from "@/services/db/card"

export async function GET(req: NextRequest, { params }: { params: { uid: string } }) {
  const uid = params.uid
  const card = await fetchByUid(uid)
  if (!card) {
    return NextResponse.json(
      { status: "ERROR", reason: "card not found" },
      { status: 400 },
    )
  }

  return NextResponse.json(card)
}
