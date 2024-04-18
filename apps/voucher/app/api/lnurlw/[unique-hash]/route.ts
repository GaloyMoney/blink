import { getWithdrawLinkByUniqueHashQuery } from "@/services/db"
import { convertCentsToSats, createMemo } from "@/utils/helpers"
import { env } from "@/env"
import { getRealtimePriceQuery } from "@/services/galoy/query/get-real-time-price"
import { escrowApolloClient } from "@/services/galoy/client/escrow"
import { Status } from "@/lib/graphql/generated"
const { NEXT_PUBLIC_VOUCHER_URL } = env

export async function GET(
  request: Request,
  { params }: { params: { "unique-hash": string } },
) {
  const { "unique-hash": uniqueHash } = params

  try {
    const withdrawLink = await getWithdrawLinkByUniqueHashQuery({ uniqueHash })

    if (!withdrawLink)
      return Response.json({ error: "Withdraw link not found", status: 404 })
    if (withdrawLink instanceof Error)
      return Response.json({ error: "Internal Server Error", status: 500 })
    if (withdrawLink.status === Status.Paid)
      return Response.json({ error: "Withdraw link claimed", status: 500 })

    const client = escrowApolloClient()
    const realTimePriceResponse = await getRealtimePriceQuery({
      client,
    })

    if (realTimePriceResponse instanceof Error)
      return Response.json({ error: "Internal Server Error", status: 500 })

    const voucherAmountInSats = convertCentsToSats({
      response: realTimePriceResponse,
      cents: Number(withdrawLink.voucherAmountInCents),
    })

    return Response.json({
      tag: "withdrawRequest",
      callback: `${NEXT_PUBLIC_VOUCHER_URL}/api/lnurlw/callback/${withdrawLink.id}`,
      k1: withdrawLink.k1,
      minWithdrawable: voucherAmountInSats * 1000,
      maxWithdrawable: voucherAmountInSats * 1000,
      defaultDescription: createMemo({
        voucherAmountInCents: withdrawLink.voucherAmountInCents,
        identifierCode: withdrawLink.identifierCode,
        commissionPercentage: withdrawLink.commissionPercentage,
      }),
    })
  } catch (error) {
    return Response.json({
      status: 500,
      error: "Internal Server Error",
    })
  }
}
