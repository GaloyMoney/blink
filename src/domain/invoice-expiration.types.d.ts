declare const invoiceExpirationSymbol: unique symbol
type InvoiceExpiration = Date & { [invoiceExpirationSymbol]: never }
