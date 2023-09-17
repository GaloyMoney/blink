import { NextRequest, NextResponse } from "next/server"

import { fetchByUid } from "@/app/knex"

export async function GET(req: NextRequest, { params }: { params: { uid: string } }) {
  const uid = params.uid
  const card = fetchByUid(uid)
  return NextResponse.json({ card })
}
