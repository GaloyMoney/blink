import { randomBytes } from "crypto"

import { NextRequest, NextResponse } from "next/server"

import { initiateCardKeysSetup } from "@/services/db/card-init"
import { serverUrl } from "@/services/config"

const randomHex = (): string => randomBytes(16).toString("hex")

function generateReadableCode(numDigits: number, separator: number = 4): string {
  const allowedNumbers = ["3", "4", "6", "7", "9"]
  const allowedLetters = [
    "A",
    "C",
    "D",
    "E",
    "F",
    "G",
    "H",
    "J",
    "K",
    "M",
    "N",
    "P",
    "Q",
    "R",
    "T",
    "U",
    "V",
    "W",
    "X",
    "Y",
  ]

  const allowedChars = [...allowedNumbers, ...allowedLetters]
  let code = ""
  for (let i = 0; i < numDigits; i++) {
    if (i > 0 && i % separator === 0) {
      code += "_"
    }
    const randomIndex = Math.floor(Math.random() * allowedChars.length)
    code += allowedChars[randomIndex]
  }

  return code
}

export async function GET(req: NextRequest) {
  // should be pass with POST? not sure if this would be compatible
  // with the wallet that can initiate cards

  const { searchParams } = new URL(req.url)
  const token = searchParams.get("token")

  if (!token) {
    return NextResponse.json(
      { status: "ERROR", reason: "token missing" },
      { status: 400 },
    )
  }

  // TODO: token validation

  const k0AuthKey = randomHex()
  const k2CmacKey = randomHex()
  const k3 = randomHex()
  const k4 = randomHex()

  const cardId = generateReadableCode(12)

  const result = await initiateCardKeysSetup({
    k0AuthKey,
    k2CmacKey,
    k3,
    k4,
    token,
    cardId,
  })

  if (result instanceof Error) {
    return NextResponse.json(
      { status: "ERROR", reason: "impossible to initiate card" },
      { status: 400 },
    )
  }

  const apiActivationUrl = `${serverUrl}/api/program?cardId=${cardId}`
  const uiActivationUrl = `${serverUrl}/card/${cardId}/program/`
  return NextResponse.json({
    status: "OK",
    apiActivationUrl,
    uiActivationUrl,
  })
}
