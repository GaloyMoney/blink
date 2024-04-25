import * as bolt11 from "bolt11"
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const decodeInvoice = (
  invoice: string,
): (bolt11.PaymentRequestObject & { tagsObject: bolt11.TagsObject }) | null => {
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

    return bolt11.decode(invoice, network)
  } catch {
    return null
  }
}
