import { NextRequest } from "next/server"

import { getWithdrawLinkByK1Query, updateWithdrawLinkStatus } from "@/services/db"
import { createMemo, getWalletDetails, decodeInvoice } from "@/utils/helpers"
import { PaymentSendResult, Status } from "@/lib/graphql/generated"
import { escrowApolloClient } from "@/services/galoy/client/escrow"
import { fetchUserData } from "@/services/galoy/query/me"
import { lnInvoicePaymentSend } from "@/services/galoy/mutation/ln-invoice-payment-send"

const QUOTE_EXPIRATION_MS = 2 * 60 * 1000 // 2 minutes

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

    if (!withdrawLink)
      return Response.json({ status: "ERROR", reason: "Withdraw link not found" })

    if (withdrawLink instanceof Error)
      return Response.json({ status: "ERROR", reason: "Internal Server Error" })

    if (withdrawLink.id !== id)
      return Response.json({ status: "ERROR", reason: "Invalid Request" })

    if (withdrawLink.status === Status.Pending)
      return Response.json({
        status: "ERROR",
        reason:
          "Withdrawal link is in pending state. Please contact support if the error persists.",
      })

    if (withdrawLink.status !== Status.Active)
      return Response.json({ status: "ERROR", reason: "Withdraw link is not Active" })

    if (!withdrawLink.voucherAmountInSats || !withdrawLink.voucherAmountInSatsAt) {
      return Response.json({ error: "Invalid invoice amount", status: 400 })
    }

    const expirationMs =
      withdrawLink.voucherAmountInSatsAt.getTime() + QUOTE_EXPIRATION_MS

    if (Date.now() > expirationMs) {
      return Response.json({ error: "Quote has expired, please try again", status: 400 })
    }

    const decodedInvoice = decodeInvoice(pr)
    const hasValidAmount =
      decodedInvoice?.satoshis === Number(withdrawLink.voucherAmountInSats)

    if (!hasValidAmount) {
      return Response.json({ error: "Invalid invoice amount", status: 400 })
    }

    await updateWithdrawLinkStatus({ id, status: Status.Pending })

    const client = escrowApolloClient()
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
      lnInvoicePaymentSendResponse?.lnInvoicePaymentSend?.status ===
      PaymentSendResult.Pending
    ) {
      return Response.json({ status: "ERROR", reason: "Payment went on Pending state" })
    }

    if (
      lnInvoicePaymentSendResponse?.lnInvoicePaymentSend?.status !==
      PaymentSendResult.Success
    ) {
      await updateWithdrawLinkStatus({ id, status: Status.Active })
      return Response.json({ status: "ERROR", reason: "Payment not paid" })
    }

    await updateWithdrawLinkStatus({ id, status: Status.Paid })
    return Response.json({ status: "OK" })
  } catch (error) {
    console.error("error paying lnurlw", error)
    Response.json({ status: "ERROR", reason: "Internal Server Error" })
  }
}
