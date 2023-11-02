import { revokeApiKey } from "@/services/graphql/mutations/api-keys"
import { getServerSession } from "next-auth"

import { NextRequest, NextResponse } from "next/server"
import { authOptions } from "../auth/[...nextauth]/route"

export async function DELETE(request: NextRequest) {
  const { id }: { id: string } = await request.json()

  const session = await getServerSession(authOptions)
  const token = session?.accessToken

  if (!id) {
    return new NextResponse(
      JSON.stringify({ name: "API Key ID to revoke is not present" }),
      { status: 400 },
    )
  }

  if (!token) {
    return new NextResponse(JSON.stringify({ name: "Token is not present" }), {
      status: 400,
    })
  }

  await revokeApiKey(token, id)

  return new NextResponse(JSON.stringify({ ok: true }), {
    status: 200,
  })
}
