// pages/api/lnurlw/callback/[id].js
import {
  getWithdrawLinkByK1Query,
  updateWithdrawLinkStatus,
} from "../../../../../utils/crud";
import { sendPaymentRequest, getRealtimePrice } from "@/services/galoy";
import { decode } from "light-bolt11-decoder";
import { convertCentsToSats } from "@/utils/helpers";
import { env } from "@/env";
const { NEXT_PUBLIC_GALOY_URL } = env;

export default async function handler(req: any, res: any) {
  if (req.method === "GET") {
    const { id } = req.query;
    const { k1, pr } = req.query;

    try {
      const withdrawLink = await getWithdrawLinkByK1Query(k1);
      if (!withdrawLink) {
        return res
          .status(404)
          .json({ status: "ERROR", reason: "Withdraw link not found" });
      }

      if (withdrawLink.id !== id) {
        return res
          .status(404)
          .json({ status: "ERROR", reason: "Invalid Request" });
      }

      if (withdrawLink.status === "PAID") {
        return res
          .status(404)
          .json({ status: "ERROR", reason: "Withdraw link claimed" });
      }

      if (withdrawLink.account_type === "USD") {
        const response = await getRealtimePrice();
        withdrawLink.voucher_amount = convertCentsToSats(
          response,
          Number(withdrawLink.voucher_amount)
        );
      }

      if (NEXT_PUBLIC_GALOY_URL !== "api.staging.galoy.io") {
        const amount = decode(pr).sections.find(
          (section: any) => section.name === "amount"
        )?.value;
        if (!(amount === withdrawLink.voucher_amount * 1000)) {
          if (withdrawLink.account_type === "USD") {
            return res.status(404).json({
              status: "ERROR",
              reason:
                "Invalid amount. This is a USD account Link, try withdrawing fast after scanning the link",
            });
          } else {
            return res
              .status(404)
              .json({ status: "ERROR", reason: "Invalid amount" });
          }
        }
      }

      await updateWithdrawLinkStatus(id, "PAID");

      const sendPaymentResponse = await sendPaymentRequest(
        withdrawLink.escrow_wallet,
        pr,
        withdrawLink.title
      );

      const { data: sendPaymentData, errors: sendPaymentErrors } =
        sendPaymentResponse;

      if (sendPaymentErrors) {
        console.error(sendPaymentErrors);
        await updateWithdrawLinkStatus(id, "FUNDED");
        return res
          .status(500)
          .json({ status: "ERROR", reason: "Internal Server Error" });
      } else {
        res.status(200).json({ status: "OK" });
      }
    } catch (error) {
      console.log("error paying lnurl", error);
      res
        .status(500)
        .json({ status: "ERROR", reason: "Internal Server Error" });
    }
  } else {
    res.status(405).json({ status: "ERROR", reason: "INVALID REQUEST" });
  }
}
