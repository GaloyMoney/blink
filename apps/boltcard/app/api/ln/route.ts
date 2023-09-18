import { randomBytes } from "crypto"

import { NextRequest, NextResponse } from "next/server"

import { aesDecryptKey, serverUrl } from "@/services/config"
import { getCoreClient } from "@/services/core"
import { aesDecrypt, checkSignature } from "@/services/crypto/aes"
import { decodePToUidCtr } from "@/services/crypto/decoder"
import { createCard, fetchByUid } from "@/services/db/card"
import {
  CardInitInput,
  fetchAllWithStatusFetched,
  markCardInitAsUsed,
} from "@/services/db/card-init"
import { insertPayment } from "@/services/db/payment"
import { gql } from "graphql-request"

function generateReadableCode(numDigits: number): string {
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
    const randomIndex = Math.floor(Math.random() * allowedChars.length)
    code += allowedChars[randomIndex]
  }

  return code
}

function generateSecureRandomString(length: number): string {
  return randomBytes(Math.ceil(length / 2))
    .toString("hex")
    .slice(0, length)
}

const maybeSetupCard = async ({
  uidRaw,
  ctrRawInverseBytes,
  ba_c,
}: {
  uidRaw: Uint8Array
  ctrRawInverseBytes: Uint8Array
  ba_c: Buffer
}): Promise<CardInitInput | null> => {
  const cardInits = await fetchAllWithStatusFetched()

  for (const cardInit of cardInits) {
    console.log({ cardInit }, "cardInit")
    const aesCmacKey = Buffer.from(cardInit.k2CmacKey, "hex")

    const cmacVerified = await checkSignature(
      uidRaw,
      ctrRawInverseBytes,
      aesCmacKey,
      ba_c,
    )

    if (cmacVerified) {
      console.log("cmac verified")
      // associate card
      return cardInit
    }
  }

  return null
}

type GetAccountIdQuery = {
  readonly me?: {
    readonly defaultAccount: {
      readonly id: string
    }
  } | null
}

const getAccountId = gql`
  query getAccountId {
    me {
      defaultAccount {
        id
      }
    }
  }
`

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const raw_p = searchParams.get("p")
  const raw_c = searchParams.get("c")

  if (!raw_p || !raw_c) {
    return NextResponse.json(
      { status: "ERROR", reason: "missing p or c" },
      { status: 400 },
    )
  }

  if (raw_p?.length !== 32 || raw_c?.length !== 16) {
    return NextResponse.json(
      { status: "ERROR", reason: "invalid p or c" },
      { status: 400 },
    )
  }

  const ba_p = Buffer.from(raw_p, "hex")
  const ba_c = Buffer.from(raw_c, "hex")

  const decryptedP = aesDecrypt(aesDecryptKey, ba_p)
  if (decryptedP instanceof Error) {
    return NextResponse.json(
      { status: "ERROR", reason: "impossible to decrypt P" },
      { status: 400 },
    )
  }

  // TODO error management
  const { uidRaw, uid, ctrRawInverseBytes, ctr } = decodePToUidCtr(decryptedP)

  let card = await fetchByUid(uid)

  if (!card) {
    const result = await maybeSetupCard({ uidRaw, ctrRawInverseBytes, ba_c })

    if (result) {
      const { k0AuthKey, k2CmacKey, k3, k4, token } = result
      await markCardInitAsUsed(k2CmacKey)

      const client = getCoreClient(token)
      const data = await client.request<GetAccountIdQuery>(getAccountId)
      const accountId = data?.me?.defaultAccount?.id
      if (!accountId) {
        return NextResponse.json(
          { status: "ERROR", reason: "account not found" },
          { status: 400 },
        )
      }

      const id = generateReadableCode(16)

      card = await createCard({
        id,
        uid,
        k0AuthKey,
        k2CmacKey,
        k3,
        k4,
        ctr,
        token,
        accountId,
      })
    } else {
      return NextResponse.json(
        { status: "ERROR", reason: "card not found" },
        { status: 400 },
      )
    }
  } else {
    if (!card.enabled) {
      return NextResponse.json(
        { status: "ERROR", reason: "card disabled" },
        { status: 400 },
      )
    }

    if (ctr <= card.ctr) {
      return NextResponse.json(
        { status: "ERROR", reason: "ctr has not gone up" },
        { status: 400 },
      )
    }
  }

  // TODO: check walletId and fail if not found
  // this would improve the experience of the POS

  const k1 = generateSecureRandomString(32)

  await insertPayment({ k1, cardId: card.id })

  return NextResponse.json({
    tag: "withdrawRequest",
    callback: serverUrl + "/callback",
    k1,
    defaultDescription: "payment for a blink card",
    minWithdrawable: 1000,
    maxWithdrawable: 1000000000000000,
  })
}
