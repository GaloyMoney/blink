import { getWithdrawLinkByUniqueHashQuery } from "../../../../utils/crud";
import { getRealtimePrice } from "@/services/galoy";
import { convertCentsToSats } from "@/utils/helpers";
import { env } from "@/env";
const { NEXT_PUBLIC_LOCAL_URL } = env;
// TODO: Add interface for request and response objects
export default async function handler(req: any, res: any) {
  if (req.method === "GET") {
    try {
      const uniqueHash = req.query.unique_hash;
      const withdrawLink = await getWithdrawLinkByUniqueHashQuery(uniqueHash);
      if (!withdrawLink) {
        return res.status(404).json({ error: "Withdraw link not found" });
      }

      if (withdrawLink.account_type === "USD") {
        const response = await getRealtimePrice();
        withdrawLink.voucher_amount = convertCentsToSats(
          response,
          Number(withdrawLink.voucher_amount)
        );
      }

      res.status(200).json({
        tag: "withdrawRequest",
        callback: `${NEXT_PUBLIC_LOCAL_URL}/api/lnurlw/callback/${withdrawLink.id}`,
        k1: withdrawLink.k1,
        minWithdrawable: withdrawLink.voucher_amount * 1000,
        maxWithdrawable: withdrawLink.voucher_amount * 1000,
        defaultDescription: withdrawLink.title,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  } else {
    res.status(405).json({ error: "Method Not Allowed" });
  }
}
