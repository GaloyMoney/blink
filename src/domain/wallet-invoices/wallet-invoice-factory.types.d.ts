type WalletInvoiceFactory = {
  create({ registeredInvoice }: { registeredInvoice: RegisteredInvoice }): WalletInvoice
  createForRecipient({
    registeredInvoice,
  }: {
    registeredInvoice: RegisteredInvoice
  }): WalletInvoice
}

type WalletInvoiceFactoryCreateMethod = ({
  registeredInvoice,
}: {
  registeredInvoice: RegisteredInvoice
}) => WalletInvoice
