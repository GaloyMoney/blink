import { randomBytes } from "crypto"

import { NextRequest, NextResponse } from "next/server"

import { aesDecrypt, checkSignature } from "../../crypto/aes"

import { aesDecryptKey, serverUrl } from "../../config"

import {
  CardInitInput,
  createCard,
  fetchAllWithStatusFetched,
  fetchByUid,
  insertk1,
  markCardInitAsUsed,
} from "../../knex"

import { decryptedPToUidCtr } from "../../decoder"

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

  console.log({ ba_p, ba_c })

  const decryptedP = aesDecrypt(aesDecryptKey, ba_p)
  if (decryptedP instanceof Error) {
    return NextResponse.json(
      { status: "ERROR", reason: "impossible to decrypt P" },
      { status: 400 },
    )
  }

  // TODO error management
  const { uidRaw, uid, ctrRawInverseBytes, ctr } = decryptedPToUidCtr(decryptedP)

  console.log({
    uid,
    uidRaw,
    ctrRawInverseBytes,
  })

  let card = await fetchByUid(uid)
  console.log({ card }, "card")

  if (!card) {
    const result = await maybeSetupCard({ uidRaw, ctrRawInverseBytes, ba_c })

    if (result) {
      const { k0AuthKey, k2CmacKey, k3, k4, token } = result
      await markCardInitAsUsed(k2CmacKey)

      card = await createCard({ uid, k0AuthKey, k2CmacKey, k3, k4, ctr, token })
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
  }

  // TODO: check walletId and fail if not found
  // this would improve the experience of the POS

  const k1 = generateSecureRandomString(32)

  await insertk1({ k1, cardId: card.id })

  return NextResponse.json({
    tag: "withdrawRequest",
    callback: serverUrl + "/callback",
    k1,
    defaultDescription: "payment for a blink card",
    minWithdrawable: 1000,
    maxWithdrawable: 100000000000,
  })
}
