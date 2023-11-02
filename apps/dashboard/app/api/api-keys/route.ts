import { createApiKey, revokeApiKey } from "@/services/graphql/mutations/api-keys"
import { getServerSession } from "next-auth"

import { NextRequest, NextResponse } from "next/server"
import { authOptions } from "../auth/[...nextauth]/route"

export async function DELETE(request: NextRequest) {
  const { id }: { id: string } = await request.json()

  const session = await getServerSession(authOptions)
  const token = session?.accessToken

  if (!id) {
    return new NextResponse(
      JSON.stringify({ error: "API Key ID to revoke is not present" }),
      { status: 400 },
    )
  }

  if (!token) {
    return new NextResponse(JSON.stringify({ error: "Token is not present" }), {
      status: 400,
    })
  }

  await revokeApiKey(token, id)

  return new NextResponse(JSON.stringify({ ok: true }), {
    status: 200,
  })
}

export async function POST(request: NextRequest) {
  const { name }: { name: string } = await request.json()

  const session = await getServerSession(authOptions)
  const token = session?.accessToken

  if (!name) {
    return new NextResponse(
      JSON.stringify({ error: "API Key name to create is not present" }),
      { status: 400 },
    )
  }

  if (!token) {
    return new NextResponse(JSON.stringify({ error: "Token is not present" }), {
      status: 400,
    })
  }

  const data = await createApiKey(token, name)

  return new NextResponse(JSON.stringify({ secret: data?.apiKeyCreate.apiKeySecret }), {
    status: 200,
  })
}
