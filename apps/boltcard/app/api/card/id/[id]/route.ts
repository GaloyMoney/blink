import { fetchByCardId } from "@/services/db/card"
import { NextRequest, NextResponse } from "next/server"

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const id = params.id
  const card = fetchByCardId(id)
  return NextResponse.json({ card })
}
