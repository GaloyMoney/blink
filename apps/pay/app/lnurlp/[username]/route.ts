import { NextResponse } from "next/server"

import { env } from "../../../env"
import {
  AccountDefaultWalletDocument,
  AccountDefaultWalletQuery,
  RealtimePriceInitialDocument,
  RealtimePriceInitialQuery,
} from "../../../lib/graphql/generated"

import { getOriginalRequestInfo } from "../../../utils/utils"

import { client } from "./graphql"

const COMMENT_SIZE = 2000 // 2000 characters max for GET

const nostrEnabled = !!env.NOSTR_PUBKEY

export async function GET(
  request: Request,
  { params }: { params: { username: string } },
) {
  const { searchParams } = new URL(request.url)

  const username = params.username

  const amount = searchParams.get("amount")
  const currency = searchParams.get("currency")

  let amountInMsats: number | undefined

  if (amount && currency && currency !== "BTC") {
    const { data } = await client.query<RealtimePriceInitialQuery>({
      query: RealtimePriceInitialDocument,
      variables: { currency },
      context: {
        "x-real-ip": request.headers.get("x-real-ip"),
        "x-forwarded-for": request.headers.get("x-forwarded-for"),
      },
    })

    const { base, offset } = data.realtimePrice.btcSatPrice
    const priceRef = base / 10 ** offset
    const convertedCurrencyAmount = Math.round(Number(amount) / priceRef)
    amountInMsats = convertedCurrencyAmount * 1000
  } else if (amount && Number.isInteger(Number(amount))) {
    amountInMsats = Number(amount) * 1000
  }

  let walletId: string | null = null

  try {
    const { data } = await client.query<AccountDefaultWalletQuery>({
      query: AccountDefaultWalletDocument,
      variables: { username, walletCurrency: "BTC" },
      context: {
        "x-real-ip": request.headers.get("x-real-ip"),
        "x-forwarded-for": request.headers.get("x-forwarded-for"),
      },
    })
    walletId = data?.accountDefaultWallet?.id
  } catch (err: unknown) {
    console.log(err)
  }

  if (!walletId) {
    return NextResponse.json({
      status: "ERROR",
      reason: `Couldn't find user '${username}'.`,
    })
  }

  const originalUrlInfo = getOriginalRequestInfo(request)

  const metadata = JSON.stringify([
    ["text/plain", `Payment to ${username}`],
    ["text/identifier", `${username}@${originalUrlInfo.hostname}`],
  ])

  const callback = `${env.PAY_URL}/lnurlp/${username}/callback`

  let minSendable = 1000 // 1 sat in millisat
  let maxSendable = 100000000000 // 1 BTC in millisat

  if (amountInMsats) {
    minSendable = amountInMsats
    maxSendable = amountInMsats
  }

  return NextResponse.json({
    callback,
    minSendable,
    maxSendable,
    metadata,
    commentAllowed: COMMENT_SIZE,
    tag: "payRequest",
    ...(nostrEnabled
      ? {
          allowsNostr: true,
          nostrPubkey: env.NOSTR_PUBKEY,
        }
      : {}),
  })
}
