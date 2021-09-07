type PreparePayment = {
  intraledger({
    walletId,
    userId,
    paymentHash,
    memo,
  }: {
    walletId: WalletId
    userId: UserId
    paymentHash: PaymentHash
    memo?: string
  }): Promise<
    | {
        recipientPubkey: Pubkey
        recipientWalletId: WalletId
        sendLnTxArgsLocal: {
          payerWalletName?: WalletName
          recipientWalletName?: WalletName
          memoPayer?: string
        }
      }
    | ApplicationError
  >

  extraledger({
    decodedInvoice,
    lnService,
  }: {
    decodedInvoice: LnInvoice
    lnService: ILightningService
  }): Promise<
    | { route: CachedRoute | null; lndAuthForRoute: AuthenticatedLnd | null }
    | ApplicationError
  >
}

type ExecutePayment = {
  intraledger({
    pubkey,
  }: {
    pubkey: Pubkey
  }): Promise<PaymentSendStatus | ApplicationError>

  extraledger({
    route,
    lndAuthForRoute,
    decodedInvoice,
    maxFee,
    liabilitiesAccountId,
    journalId,
  }: {
    route: CachedRoute | null
    lndAuthForRoute: AuthenticatedLnd | null
    decodedInvoice: LnInvoice
    milliSatsAmount: MilliSatoshis
    maxFee: Satoshis
    liabilitiesAccountId: LiabilitiesAccountId
    journalId: LedgerJournalId
  }): Promise<PaymentSendStatus | ApplicationError>
}
