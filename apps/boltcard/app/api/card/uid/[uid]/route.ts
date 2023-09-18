import { fetchByUid } from "@/services/db/card"
import { NextRequest, NextResponse } from "next/server"

export async function GET(req: NextRequest, { params }: { params: { uid: string } }) {
  const uid = params.uid
  const card = fetchByUid(uid)
  return NextResponse.json({ card })
}
