import { NextRequest } from "next/server"

import { getWithdrawLinkByK1Query, updateWithdrawLinkStatus } from "@/services/db"
import { createMemo, getWalletDetails } from "@/utils/helpers"
import { PaymentSendResult, Status } from "@/lib/graphql/generated"
import { escrowApolloClient } from "@/services/galoy/client/escrow"
import { fetchUserData } from "@/services/galoy/query/me"
import { lnInvoicePaymentSend } from "@/services/galoy/mutation/ln-invoice-payment-send"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const searchParams = request.nextUrl.searchParams
  const { id } = params
  const k1 = searchParams.get("k1")
  const pr = searchParams.get("pr")

  if (!k1 || !pr || !id)
    return Response.json({
      status: "ERROR",
      reason: "Invalid Request",
    })

  const client = escrowApolloClient()
  const escrowData = await fetchUserData({ client })
  if (escrowData instanceof Error || !escrowData?.me?.defaultAccount?.wallets)
    return Response.json({ status: "ERROR", reason: "Internal Server Error" })

  const { usdWallet } = getWalletDetails({
    wallets: escrowData?.me?.defaultAccount?.wallets,
  })
  if (usdWallet instanceof Error || !usdWallet)
    return Response.json({ status: "ERROR", reason: "Internal Server Error" })

  try {
    const withdrawLink = await getWithdrawLinkByK1Query({ k1 })
    if (!withdrawLink) {
      return Response.json({ status: "ERROR", reason: "Withdraw link not found" })
    }

    if (withdrawLink instanceof Error)
      return Response.json({ status: "ERROR", reason: "Internal Server Error" })

    if (withdrawLink.id !== id)
      return Response.json({ status: "ERROR", reason: "Invalid Request" })

    // locking so some else can't use this link at the same time
    if (withdrawLink.status === Status.Paid)
      return Response.json({ status: "ERROR", reason: "Withdraw link claimed" })

    const client = escrowApolloClient()

    // TODO this function is suppose to check if amount request is exactly same as the amount we want to send. But it is not always same therefore need to check approximate value and requested should smaller than or equal to actual value
    // const realTimePriceResponse = await getRealtimePriceQuery({
    //   client,
    // })

    // if (realTimePriceResponse instanceof Error)
    //   return Response.json({ status: "ERROR", reason: "Internal Server Error" })

    // withdrawLink.voucherAmount = convertCentsToSats({
    //   response: realTimePriceResponse,
    //   cents: Number(withdrawLink.voucherAmount),
    // })

    // if (NEXT_PUBLIC_GALOY_URL !== "api.staging.galoy.io") {
    //   const amount = decode(pr).sections.find(
    //     (section: any) => section.name === "amount",
    //   )?.value
    //   if (!(amount === withdrawLink.voucherAmount * 1000)) {
    //     if (withdrawLink.accountType === "USD") {
    //       return Response.json({
    //         status: "ERROR",
    //         reason:
    //           "Invalid amount. This is a USD account Link, try withdrawing fast after scanning the link",
    //       })
    //     } else {
    //       return Response.json({ status: "ERROR", reason: "Invalid amount" })
    //     }
    //   }
    // }

    await updateWithdrawLinkStatus({ id, status: Status.Paid })

    const lnInvoicePaymentSendResponse = await lnInvoicePaymentSend({
      client,
      input: {
        memo: createMemo({
          voucherAmountInCents: withdrawLink.voucherAmountInCents,
          identifierCode: withdrawLink.identifierCode,
          commissionPercentage: withdrawLink.commissionPercentage,
        }),
        walletId: usdWallet.id,
        paymentRequest: pr,
      },
    })

    if (lnInvoicePaymentSendResponse instanceof Error) {
      console.error(lnInvoicePaymentSendResponse)
      await updateWithdrawLinkStatus({ id, status: Status.Active })
      return Response.json({
        status: "ERROR",
        reason: lnInvoicePaymentSendResponse.message,
      })
    }

    if (lnInvoicePaymentSendResponse.lnInvoicePaymentSend.errors.length > 0) {
      console.error(lnInvoicePaymentSendResponse.lnInvoicePaymentSend.errors)
      await updateWithdrawLinkStatus({ id, status: Status.Active })
      return Response.json({
        status: "ERROR",
        reason: lnInvoicePaymentSendResponse.lnInvoicePaymentSend.errors[0].message,
      })
    }

    if (
      lnInvoicePaymentSendResponse?.lnInvoicePaymentSend?.status !==
      PaymentSendResult.Success
    ) {
      await updateWithdrawLinkStatus({ id, status: Status.Active })
      return Response.json({ status: "ERROR", reason: "Payment not paid" })
    }

    return Response.json({ status: "OK" })
  } catch (error) {
    console.error("error paying lnurlw", error)
    Response.json({ status: "ERROR", reason: "Internal Server Error" })
  }
}
