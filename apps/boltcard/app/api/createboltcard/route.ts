import { randomBytes } from "crypto"

import { NextRequest, NextResponse } from "next/server"

import { serverUrl } from "../../config"
import { createCardInit } from "../../knex"

function randomHex(): string {
  try {
    const bytes: Buffer = randomBytes(16)
    return bytes.toString("hex")
  } catch (error) {
    if (error instanceof Error) {
      console.warn(error.message)
      throw error
    }
  }
}

export async function GET(req: NextRequest) {
  // should be pass with POST? not sure if this would be compatible
  // with the wallet that can create cards

  const { searchParams } = new URL(req.url)
  const token = searchParams.get("token")

  if (!token) {
    return NextResponse.json(
      { status: "ERROR", reason: "token missing" },
      { status: 400 },
    )
  }

  // TODO: token validation

  const oneTimeCode = randomHex()
  const k0AuthKey = randomHex()
  const k2CmacKey = randomHex()
  const k3 = randomHex()
  const k4 = randomHex()

  const result = await createCardInit({
    oneTimeCode,
    k0AuthKey,
    k2CmacKey,
    k3,
    k4,
    token,
  })

  if (result instanceof Error) {
    return NextResponse.json(
      { status: "ERROR", reason: "impossible to create card" },
      { status: 400 },
    )
  }

  const url = `${serverUrl}/new?a=${oneTimeCode}`
  return NextResponse.json({
    status: "OK",
    url,
  })
}
