export const KnownLndErrorDetails = {
  // Off-chain
  InsufficientBalance: /insufficient local balance/,
  InsufficientBalanceToAttemptPayment: /InsufficientBalanceToAttemptPayment/,
  InvoiceNotFound: /unable to locate invoice/,
  InvoiceAlreadyPaid: /invoice is already paid/,
  UnableToFindRoute: /PaymentPathfindingFailedToFindPossibleRoute/,
  FailedToFindRoute: /FailedToFindPayableRouteToDestination/,
  UnknownNextPeer: /UnknownNextPeer/,
  LndDbCorruption: /payment isn't initiated/,
  PaymentRejectedByDestination: /PaymentRejectedByDestination/,
  UnknownPaymentHash: /UnknownPaymentHash/,
  PaymentAttemptsTimedOut: /PaymentAttemptsTimedOut/,
  ProbeForRouteTimedOut: /ProbeForRouteTimedOut/,
  SentPaymentNotFound: /SentPaymentNotFound/,
  PaymentInTransition: /payment is in transition/,
  PaymentForDeleteNotFound: /non bucket element in payments bucket/,
  SecretDoesNotMatchAnyExistingHodlInvoice: /SecretDoesNotMatchAnyExistingHodlInvoice/,
  TemporaryChannelFailure: /TemporaryChannelFailure/,
  TemporaryNodeFailure: /TemporaryNodeFailure/,
  InvoiceAlreadySettled: /invoice already settled/,
  MissingDependentFeature: /missing dependent feature/,
  FeaturePairExists: /feature pair exists/,

  // On-chain
  InsufficientFunds: /insufficient funds available to construct transaction/,
  CPFPAncestorLimitReached:
    /unmatched backend error: -26: too-long-mempool-chain, too many .* \[limit: \d+\]/,
  DustAmount: /transaction output is dust/,

  // Common
  NoConnectionEstablished: /No connection established/,
  ConnectionDropped: /Connection dropped/,
  ConnectionRefused: /connection refused/,
} as const
