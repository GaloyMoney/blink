lnInvoicePaymentSend(walletId, invoice,  memo) {
  // check limits
  wallet = WalletRepository().getById(walletId)

  decodedInvoice = decodeInvoice(invoice)

  lnService = LightningService()
  const isLocal = lnService.isLocal(decodedInvoice.pubkey)
  if (isLocal instanceof Error) return isLocal

    ledgerService = LedgerService()

  walletVolume = ledgerService.txVolumeFor(wallet.id)
  const result = LimitsChecker(wallet.limits).check({ existingVolume: walletVolume,
    pendingAmount: decodeInvoice.amount,
    settlmentMethod: SettlementMethod.IntraLedger})

  if (result instanceof Error)
    return result
  }

  const fees = somehowGetTheFees // probably static config ?!?
  invoices = WalletInvoices()
  walletInvoice = invoices.findByPaymentHash(decodedInvoice.paymentHash)
  if (walletInvoice instanceof CouldNotFindError) {
    // happy path / continue
  } else if (walletInvoice instanceof Error) {
    return walletInvoice
  }

  redislock( () => {
    const balance = getBalanceForWallet(wallet)
    if (balance ...) return balance

    if (balance < decodedInvoice.amount) {
      return new SomethingError
    }

    if (isLocal) {
      // do we need this?
      executerIntraLedgerTransaction()
    } else {
      const result = lnService.payInvoice(decodedInvoice)
    }

    ledger.sendLnTx()

  })
}
