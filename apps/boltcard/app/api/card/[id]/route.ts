import { NextRequest, NextResponse } from "next/server"

import { fetchPublicByCardId } from "@/services/db/card"

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const id = params.id
  const card = await fetchPublicByCardId(id)
  if (!card) {
    return NextResponse.json(
      { status: "ERROR", reason: "card not found" },
      { status: 400 },
    )
  }

  return NextResponse.json(card)
}
