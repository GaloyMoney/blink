
import { GT } from "@/graphql/index"
import LnInvoice from "../object/ln-invoice"
import LnNoAmountInvoice from "@/graphql/shared/types/object/ln-noamount-invoice"

const Invoice = GT.Union({
  name: "Invoice",
  types: () => [LnInvoice, LnNoAmountInvoice],
})

export default Invoice
