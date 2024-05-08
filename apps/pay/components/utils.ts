import * as bolt11 from "bolt11"
import { twMerge } from "tailwind-merge"
import { clsx, type ClassValue } from "clsx"

import { baseLogger } from "@/lib/logger"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export type Invoice = bolt11.PaymentRequestObject & {
  tagsObject: bolt11.TagsObject
  memo: string | undefined
}

export const decodeInvoice = (invoice: string): Invoice | null => {
  if (!invoice) return null

  try {
    let network: bolt11.Network | undefined = undefined
    // hack to support signet invoices, remove when it is supported in bolt11
    if (invoice.startsWith("lntbs")) {
      network = {
        bech32: "tbs",
        pubKeyHash: 0x6f,
        scriptHash: 0xc4,
        validWitnessVersions: [0, 1],
      }
    }

    const decodedInvoice = bolt11.decode(invoice, network)
    const memo =
      decodedInvoice.tags?.find((t) => t.tagName === "description")?.data?.toString() ||
      ""

    return { ...decodedInvoice, memo }
  } catch (error) {
    baseLogger.error({ error }, "Error decodeInvoice")
    return null
  }
}
