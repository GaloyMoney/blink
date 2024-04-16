// pages/api/lnurlw/callback/[id].js
import { decode } from "light-bolt11-decoder"

import { getWithdrawLinkByK1Query, updateWithdrawLinkStatus } from "@/services/db"
import { sendPaymentRequest, getRealtimePrice } from "@/services/galoy"
import { convertCentsToSats } from "@/utils/helpers"
import { env } from "@/env"
const { NEXT_PUBLIC_GALOY_URL } = env

export default async function handler(req: any, res: any) {
  if (req.method === "GET") {
    const { id } = req.query
    const { k1, pr } = req.query

    try {
      const withdrawLink = await getWithdrawLinkByK1Query({ k1 })
      if (!withdrawLink) {
        return res
          .status(404)
          .json({ status: "ERROR", reason: "Withdraw link not found" })
      }

      if (withdrawLink.id !== id) {
        return res.status(404).json({ status: "ERROR", reason: "Invalid Request" })
      }

      if (withdrawLink.status === "PAID") {
        return res.status(404).json({ status: "ERROR", reason: "Withdraw link claimed" })
      }

      if (withdrawLink.accountType === "USD") {
        const response = await getRealtimePrice()
        withdrawLink.voucherAmount = convertCentsToSats(
          response,
          Number(withdrawLink.voucherAmount),
        )
      }

      if (NEXT_PUBLIC_GALOY_URL !== "api.staging.galoy.io") {
        const amount = decode(pr).sections.find(
          (section: any) => section.name === "amount",
        )?.value
        if (!(amount === withdrawLink.voucherAmount * 1000)) {
          if (withdrawLink.accountType === "USD") {
            return res.status(404).json({
              status: "ERROR",
              reason:
                "Invalid amount. This is a USD account Link, try withdrawing fast after scanning the link",
            })
          } else {
            return res.status(404).json({ status: "ERROR", reason: "Invalid amount" })
          }
        }
      }

      await updateWithdrawLinkStatus({ id, status: "PAID" })

      const sendPaymentResponse = await sendPaymentRequest(
        withdrawLink.escrowWallet,
        pr,
        withdrawLink.title,
      )

      const { data: sendPaymentData, errors: sendPaymentErrors } = sendPaymentResponse

      if (sendPaymentErrors) {
        console.error(sendPaymentErrors)
        await updateWithdrawLinkStatus({ id, status: "FUNDED" })
        return res.status(500).json({ status: "ERROR", reason: "Internal Server Error" })
      } else {
        res.status(200).json({ status: "OK" })
      }
    } catch (error) {
      console.log("error paying lnurl", error)
      res.status(500).json({ status: "ERROR", reason: "Internal Server Error" })
    }
  } else {
    res.status(405).json({ status: "ERROR", reason: "INVALID REQUEST" })
  }
}
