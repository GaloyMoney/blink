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

type GetUsdWalletIdQuery = {
  readonly me?: {
    readonly defaultAccount: {
      readonly id: string
      readonly defaultWalletId: string
      readonly wallets: ReadonlyArray<
        | {
            readonly id: string
            readonly walletCurrency: string
            readonly balance: number
          }
        | {
            readonly id: string
            readonly walletCurrency: string
            readonly balance: number
          }
      >
    }
  } | null
}

const getUsdWalletIdQuery = gql`
  query getUsdWalletId {
    me {
      defaultAccount {
        id
        defaultWalletId
        wallets {
          id
          walletCurrency
          balance
        }
      }
    }
  }
`

type OnChainAddressCurrentMutation = {
  readonly __typename: "Mutation"
  readonly onChainAddressCurrent: {
    readonly __typename: "OnChainAddressPayload"
    readonly address?: string | null
    readonly errors: ReadonlyArray<{
      readonly __typename: "GraphQLApplicationError"
      readonly message: string
    }>
  }
}

const onChainAddressCurrent = gql`
  mutation onChainAddressCurrent($input: OnChainAddressCurrentInput!) {
    onChainAddressCurrent(input: $input) {
      errors {
        message
      }
      address
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

      const client = getCoreClient(token)

      let data: GetUsdWalletIdQuery
      try {
        data = await client.request<GetUsdWalletIdQuery>(getUsdWalletIdQuery)
      } catch (error) {
        console.error(error)
        return NextResponse.json(
          { status: "ERROR", reason: "issue fetching walletId" },
          { status: 400 },
        )
      }

      const accountId = data?.me?.defaultAccount?.id
      if (!accountId) {
        return NextResponse.json(
          { status: "ERROR", reason: "no accountId found" },
          { status: 400 },
        )
      }

      const wallets = data.me?.defaultAccount.wallets

      if (!wallets) {
        return NextResponse.json(
          { status: "ERROR", reason: "no wallets found" },
          { status: 400 },
        )
      }

      const usdWallet = wallets.find((wallet) => wallet.walletCurrency === "USD")
      const walletId = usdWallet?.id

      console.log({ usdWallet, wallets })

      if (!walletId) {
        return NextResponse.json(
          { status: "ERROR", reason: "no usd wallet found" },
          { status: 400 },
        )
      }

      const dataOnchain = await client.request<OnChainAddressCurrentMutation>({
        document: onChainAddressCurrent,
        variables: { input: { walletId } },
      })
      const onchainAddress = dataOnchain?.onChainAddressCurrent?.address
      if (!onchainAddress) {
        console.log(dataOnchain.onChainAddressCurrent, "dataOnchain")
        return NextResponse.json(
          { status: "ERROR", reason: `onchain address not found` },
          { status: 400 },
        )
      }

      const id = generateReadableCode(16)
      console.log({ id, onchainAddress }, "new card id")

      await markCardInitAsUsed(k2CmacKey)

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
        onchainAddress,
        walletId,
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
