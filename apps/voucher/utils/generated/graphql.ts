import { gql } from '@apollo/client';
import * as Apollo from '@apollo/client';
export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
export type MakeEmpty<T extends { [key: string]: unknown }, K extends keyof T> = { [_ in K]?: never };
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
const defaultOptions = {} as const;
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string | number; output: string; }
  String: { input: string; output: string; }
  Boolean: { input: boolean; output: boolean; }
  Int: { input: number; output: number; }
  Float: { input: number; output: number; }
  /** An Opaque Bearer token */
  AuthToken: { input: string; output: string; }
  /** (Positive) Cent amount (1/100 of a dollar) */
  CentAmount: { input: number; output: number; }
  /** An alias name that a user can set for a wallet (with which they have transactions) */
  ContactAlias: { input: string; output: string; }
  /** A CCA2 country code (ex US, FR, etc) */
  CountryCode: { input: string; output: string; }
  /** Display currency of an account */
  DisplayCurrency: { input: string; output: string; }
  /** Email address */
  EmailAddress: { input: string; output: string; }
  /** An id to be passed between registrationInitiate and registrationValidate for confirming email */
  EmailRegistrationId: { input: string; output: string; }
  /** Feedback shared with our user */
  Feedback: { input: string; output: string; }
  /** Hex-encoded string of 32 bytes */
  Hex32Bytes: { input: string; output: string; }
  Language: { input: string; output: string; }
  LnPaymentPreImage: { input: string; output: string; }
  /** BOLT11 lightning invoice payment request with the amount included */
  LnPaymentRequest: { input: string; output: string; }
  LnPaymentSecret: { input: string; output: string; }
  /** Text field in a lightning payment transaction */
  Memo: { input: string; output: string; }
  /** (Positive) amount of minutes */
  Minutes: { input: number; output: number; }
  /** An address for an on-chain bitcoin destination */
  OnChainAddress: { input: string; output: string; }
  OnChainTxHash: { input: string; output: string; }
  /** An authentication code valid for a single use */
  OneTimeAuthCode: { input: string; output: string; }
  PaymentHash: { input: string; output: string; }
  /** Phone number which includes country code */
  Phone: { input: string; output: string; }
  /** Non-fractional signed whole numeric value between -(2^53) + 1 and 2^53 - 1 */
  SafeInt: { input: number; output: number; }
  /** (Positive) Satoshi amount */
  SatAmount: { input: number; output: number; }
  /** (Positive) amount of seconds */
  Seconds: { input: number; output: number; }
  /** An amount (of a currency) that can be negative (e.g. in a transaction) */
  SignedAmount: { input: number; output: number; }
  /** A string amount (of a currency) that can be negative (e.g. in a transaction) */
  SignedDisplayMajorAmount: { input: string; output: string; }
  /** (Positive) Number of blocks in which the transaction is expected to be confirmed */
  TargetConfirmations: { input: number; output: number; }
  /** Timestamp field, serialized as Unix time (the number of seconds since the Unix epoch) */
  Timestamp: { input: number; output: number; }
  /** A time-based one-time password */
  TotpCode: { input: string; output: string; }
  /** An id to be passed between set and verify for confirming totp */
  TotpRegistrationId: { input: string; output: string; }
  /** A secret to generate time-based one-time password */
  TotpSecret: { input: string; output: string; }
  /** Unique identifier of a user */
  Username: { input: string; output: string; }
  /** Unique identifier of a wallet */
  WalletId: { input: string; output: string; }
};

export type Account = {
  readonly csvTransactions: Scalars['String']['output'];
  readonly defaultWalletId: Scalars['WalletId']['output'];
  readonly displayCurrency: Scalars['DisplayCurrency']['output'];
  readonly id: Scalars['ID']['output'];
  readonly level: AccountLevel;
  readonly limits: AccountLimits;
  readonly realtimePrice: RealtimePrice;
  readonly transactions?: Maybe<TransactionConnection>;
  readonly wallets: ReadonlyArray<Wallet>;
};


export type AccountCsvTransactionsArgs = {
  walletIds: ReadonlyArray<Scalars['WalletId']['input']>;
};


export type AccountTransactionsArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  walletIds?: InputMaybe<ReadonlyArray<InputMaybe<Scalars['WalletId']['input']>>>;
};

export type AccountDeletePayload = {
  readonly __typename: 'AccountDeletePayload';
  readonly errors: ReadonlyArray<Error>;
  readonly success: Scalars['Boolean']['output'];
};

export const AccountLevel = {
  One: 'ONE',
  Two: 'TWO',
  Zero: 'ZERO'
} as const;

export type AccountLevel = typeof AccountLevel[keyof typeof AccountLevel];
export type AccountLimit = {
  /** The rolling time interval in seconds that the limits would apply for. */
  readonly interval?: Maybe<Scalars['Seconds']['output']>;
  /** The amount of cents remaining below the limit for the current 24 hour period. */
  readonly remainingLimit?: Maybe<Scalars['CentAmount']['output']>;
  /** The current maximum limit for a given 24 hour period. */
  readonly totalLimit: Scalars['CentAmount']['output'];
};

export type AccountLimits = {
  readonly __typename: 'AccountLimits';
  /** Limits for converting between currencies among a account's own wallets. */
  readonly convert: ReadonlyArray<AccountLimit>;
  /** Limits for sending to other internal accounts. */
  readonly internalSend: ReadonlyArray<AccountLimit>;
  /** Limits for withdrawing to external onchain or lightning destinations. */
  readonly withdrawal: ReadonlyArray<AccountLimit>;
};

export type AccountUpdateDefaultWalletIdInput = {
  readonly walletId: Scalars['WalletId']['input'];
};

export type AccountUpdateDefaultWalletIdPayload = {
  readonly __typename: 'AccountUpdateDefaultWalletIdPayload';
  readonly account?: Maybe<ConsumerAccount>;
  readonly errors: ReadonlyArray<Error>;
};

export type AccountUpdateDisplayCurrencyInput = {
  readonly currency: Scalars['DisplayCurrency']['input'];
};

export type AccountUpdateDisplayCurrencyPayload = {
  readonly __typename: 'AccountUpdateDisplayCurrencyPayload';
  readonly account?: Maybe<ConsumerAccount>;
  readonly errors: ReadonlyArray<Error>;
};

export type AuthTokenPayload = {
  readonly __typename: 'AuthTokenPayload';
  readonly authToken?: Maybe<Scalars['AuthToken']['output']>;
  readonly errors: ReadonlyArray<Error>;
  readonly totpRequired?: Maybe<Scalars['Boolean']['output']>;
};

/** A wallet belonging to an account which contains a BTC balance and a list of transactions. */
export type BtcWallet = Wallet & {
  readonly __typename: 'BTCWallet';
  readonly accountId: Scalars['ID']['output'];
  /** A balance stored in BTC. */
  readonly balance: Scalars['SignedAmount']['output'];
  readonly id: Scalars['ID']['output'];
  /** An unconfirmed incoming onchain balance. */
  readonly pendingIncomingBalance: Scalars['SignedAmount']['output'];
  /** A list of BTC transactions associated with this wallet. */
  readonly transactions?: Maybe<TransactionConnection>;
  readonly transactionsByAddress?: Maybe<TransactionConnection>;
  readonly walletCurrency: WalletCurrency;
};


/** A wallet belonging to an account which contains a BTC balance and a list of transactions. */
export type BtcWalletTransactionsArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
};


/** A wallet belonging to an account which contains a BTC balance and a list of transactions. */
export type BtcWalletTransactionsByAddressArgs = {
  address: Scalars['OnChainAddress']['input'];
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
};

export type BuildInformation = {
  readonly __typename: 'BuildInformation';
  readonly buildTime?: Maybe<Scalars['Timestamp']['output']>;
  readonly commitHash?: Maybe<Scalars['String']['output']>;
  readonly helmRevision?: Maybe<Scalars['Int']['output']>;
};

export type CaptchaCreateChallengePayload = {
  readonly __typename: 'CaptchaCreateChallengePayload';
  readonly errors: ReadonlyArray<Error>;
  readonly result?: Maybe<CaptchaCreateChallengeResult>;
};

export type CaptchaCreateChallengeResult = {
  readonly __typename: 'CaptchaCreateChallengeResult';
  readonly challengeCode: Scalars['String']['output'];
  readonly failbackMode: Scalars['Boolean']['output'];
  readonly id: Scalars['String']['output'];
  readonly newCaptcha: Scalars['Boolean']['output'];
};

export type CaptchaRequestAuthCodeInput = {
  readonly challengeCode: Scalars['String']['input'];
  readonly channel?: InputMaybe<PhoneCodeChannelType>;
  readonly phone: Scalars['Phone']['input'];
  readonly secCode: Scalars['String']['input'];
  readonly validationCode: Scalars['String']['input'];
};

export type CentAmountPayload = {
  readonly __typename: 'CentAmountPayload';
  readonly amount?: Maybe<Scalars['CentAmount']['output']>;
  readonly errors: ReadonlyArray<Error>;
};

export type ConsumerAccount = Account & {
  readonly __typename: 'ConsumerAccount';
  /** return CSV stream, base64 encoded, of the list of transactions in the wallet */
  readonly csvTransactions: Scalars['String']['output'];
  readonly defaultWalletId: Scalars['WalletId']['output'];
  readonly displayCurrency: Scalars['DisplayCurrency']['output'];
  readonly id: Scalars['ID']['output'];
  readonly level: AccountLevel;
  readonly limits: AccountLimits;
  /** List the quiz questions of the consumer account */
  readonly quiz: ReadonlyArray<Quiz>;
  readonly realtimePrice: RealtimePrice;
  /** A list of all transactions associated with walletIds optionally passed. */
  readonly transactions?: Maybe<TransactionConnection>;
  readonly wallets: ReadonlyArray<Wallet>;
};


export type ConsumerAccountCsvTransactionsArgs = {
  walletIds: ReadonlyArray<Scalars['WalletId']['input']>;
};


export type ConsumerAccountTransactionsArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  walletIds?: InputMaybe<ReadonlyArray<InputMaybe<Scalars['WalletId']['input']>>>;
};

export type Coordinates = {
  readonly __typename: 'Coordinates';
  readonly latitude: Scalars['Float']['output'];
  readonly longitude: Scalars['Float']['output'];
};

export type Country = {
  readonly __typename: 'Country';
  readonly id: Scalars['CountryCode']['output'];
  readonly supportedAuthChannels: ReadonlyArray<PhoneCodeChannelType>;
};

export type CreateWithdrawLinkInput = {
  readonly account_type: Scalars['String']['input'];
  readonly commission_percentage?: InputMaybe<Scalars['Float']['input']>;
  readonly escrow_wallet: Scalars['String']['input'];
  readonly id?: InputMaybe<Scalars['ID']['input']>;
  readonly k1?: InputMaybe<Scalars['String']['input']>;
  readonly payment_hash: Scalars['String']['input'];
  readonly payment_request: Scalars['String']['input'];
  readonly payment_secret: Scalars['String']['input'];
  readonly sales_amount: Scalars['Float']['input'];
  readonly status?: InputMaybe<Status>;
  readonly title: Scalars['String']['input'];
  readonly unique_hash: Scalars['String']['input'];
  readonly user_id: Scalars['ID']['input'];
  readonly voucher_amount: Scalars['Float']['input'];
};

export type Currency = {
  readonly __typename: 'Currency';
  readonly flag: Scalars['String']['output'];
  readonly fractionDigits: Scalars['Int']['output'];
  readonly id: Scalars['ID']['output'];
  readonly name: Scalars['String']['output'];
  readonly symbol: Scalars['String']['output'];
};

export type DepositFeesInformation = {
  readonly __typename: 'DepositFeesInformation';
  readonly minBankFee: Scalars['String']['output'];
  /** below this amount minBankFee will be charged */
  readonly minBankFeeThreshold: Scalars['String']['output'];
  /** ratio to charge as basis points above minBankFeeThreshold amount */
  readonly ratio: Scalars['String']['output'];
};

export type DeviceNotificationTokenCreateInput = {
  readonly deviceToken: Scalars['String']['input'];
};

export type Email = {
  readonly __typename: 'Email';
  readonly address?: Maybe<Scalars['EmailAddress']['output']>;
  readonly verified?: Maybe<Scalars['Boolean']['output']>;
};

export type Error = {
  readonly code?: Maybe<Scalars['String']['output']>;
  readonly message: Scalars['String']['output'];
  readonly path?: Maybe<ReadonlyArray<Maybe<Scalars['String']['output']>>>;
};

export const ExchangeCurrencyUnit = {
  Btcsat: 'BTCSAT',
  Usdcent: 'USDCENT'
} as const;

export type ExchangeCurrencyUnit = typeof ExchangeCurrencyUnit[keyof typeof ExchangeCurrencyUnit];
export type FeedbackSubmitInput = {
  readonly feedback: Scalars['Feedback']['input'];
};

export type FeesInformation = {
  readonly __typename: 'FeesInformation';
  readonly deposit: DepositFeesInformation;
};

export type FeesResult = {
  readonly __typename: 'FeesResult';
  readonly fees: Scalars['Float']['output'];
};

/** Provides global settings for the application which might have an impact for the user. */
export type Globals = {
  readonly __typename: 'Globals';
  readonly buildInformation: BuildInformation;
  readonly feesInformation: FeesInformation;
  /** The domain name for lightning addresses accepted by this Galoy instance */
  readonly lightningAddressDomain: Scalars['String']['output'];
  readonly lightningAddressDomainAliases: ReadonlyArray<Scalars['String']['output']>;
  /** Which network (mainnet, testnet, regtest, signet) this instance is running on. */
  readonly network: Network;
  /**
   * A list of public keys for the running lightning nodes.
   * This can be used to know if an invoice belongs to one of our nodes.
   */
  readonly nodesIds: ReadonlyArray<Scalars['String']['output']>;
  /** A list of countries and their supported auth channels */
  readonly supportedCountries: ReadonlyArray<Country>;
};

export type GraphQlApplicationError = Error & {
  readonly __typename: 'GraphQLApplicationError';
  readonly code?: Maybe<Scalars['String']['output']>;
  readonly message: Scalars['String']['output'];
  readonly path?: Maybe<ReadonlyArray<Maybe<Scalars['String']['output']>>>;
};

export type InitiationVia = InitiationViaIntraLedger | InitiationViaLn | InitiationViaOnChain;

export type InitiationViaIntraLedger = {
  readonly __typename: 'InitiationViaIntraLedger';
  readonly counterPartyUsername?: Maybe<Scalars['Username']['output']>;
  readonly counterPartyWalletId?: Maybe<Scalars['WalletId']['output']>;
};

export type InitiationViaLn = {
  readonly __typename: 'InitiationViaLn';
  readonly paymentHash: Scalars['PaymentHash']['output'];
};

export type InitiationViaOnChain = {
  readonly __typename: 'InitiationViaOnChain';
  readonly address: Scalars['OnChainAddress']['output'];
};

export type IntraLedgerPaymentSendInput = {
  /** Amount in satoshis. */
  readonly amount: Scalars['SatAmount']['input'];
  /** Optional memo to be attached to the payment. */
  readonly memo?: InputMaybe<Scalars['Memo']['input']>;
  readonly recipientWalletId: Scalars['WalletId']['input'];
  /** The wallet ID of the sender. */
  readonly walletId: Scalars['WalletId']['input'];
};

export type IntraLedgerUpdate = {
  readonly __typename: 'IntraLedgerUpdate';
  readonly amount: Scalars['SatAmount']['output'];
  readonly displayCurrencyPerSat: Scalars['Float']['output'];
  readonly txNotificationType: TxNotificationType;
  /** @deprecated updated over displayCurrencyPerSat */
  readonly usdPerSat: Scalars['Float']['output'];
  readonly walletId: Scalars['WalletId']['output'];
};

export type IntraLedgerUsdPaymentSendInput = {
  /** Amount in cents. */
  readonly amount: Scalars['CentAmount']['input'];
  /** Optional memo to be attached to the payment. */
  readonly memo?: InputMaybe<Scalars['Memo']['input']>;
  readonly recipientWalletId: Scalars['WalletId']['input'];
  /** The wallet ID of the sender. */
  readonly walletId: Scalars['WalletId']['input'];
};

export const InvoicePaymentStatus = {
  Expired: 'EXPIRED',
  Paid: 'PAID',
  Pending: 'PENDING'
} as const;

export type InvoicePaymentStatus = typeof InvoicePaymentStatus[keyof typeof InvoicePaymentStatus];
export type LnInvoice = {
  readonly __typename: 'LnInvoice';
  readonly paymentHash: Scalars['PaymentHash']['output'];
  readonly paymentRequest: Scalars['LnPaymentRequest']['output'];
  readonly paymentSecret: Scalars['LnPaymentSecret']['output'];
  readonly satoshis?: Maybe<Scalars['SatAmount']['output']>;
};

export type LnInvoiceCreateInput = {
  /** Amount in satoshis. */
  readonly amount: Scalars['SatAmount']['input'];
  /** Optional invoice expiration time in minutes. */
  readonly expiresIn?: InputMaybe<Scalars['Minutes']['input']>;
  /** Optional memo for the lightning invoice. */
  readonly memo?: InputMaybe<Scalars['Memo']['input']>;
  /** Wallet ID for a BTC wallet belonging to the current account. */
  readonly walletId: Scalars['WalletId']['input'];
};

export type LnInvoiceCreateOnBehalfOfRecipientInput = {
  /** Amount in satoshis. */
  readonly amount: Scalars['SatAmount']['input'];
  readonly descriptionHash?: InputMaybe<Scalars['Hex32Bytes']['input']>;
  /** Optional invoice expiration time in minutes. */
  readonly expiresIn?: InputMaybe<Scalars['Minutes']['input']>;
  /** Optional memo for the lightning invoice. */
  readonly memo?: InputMaybe<Scalars['Memo']['input']>;
  /** Wallet ID for a BTC wallet which belongs to any account. */
  readonly recipientWalletId: Scalars['WalletId']['input'];
};

export type LnInvoiceFeeProbeInput = {
  readonly paymentRequest: Scalars['LnPaymentRequest']['input'];
  readonly walletId: Scalars['WalletId']['input'];
};

export type LnInvoicePayload = {
  readonly __typename: 'LnInvoicePayload';
  readonly errors: ReadonlyArray<Error>;
  readonly invoice?: Maybe<LnInvoice>;
};

export type LnInvoicePaymentInput = {
  /** Optional memo to associate with the lightning invoice. */
  readonly memo?: InputMaybe<Scalars['Memo']['input']>;
  /** Payment request representing the invoice which is being paid. */
  readonly paymentRequest: Scalars['LnPaymentRequest']['input'];
  /** Wallet ID with sufficient balance to cover amount of invoice.  Must belong to the account of the current user. */
  readonly walletId: Scalars['WalletId']['input'];
};

export type LnInvoicePaymentStatusInput = {
  readonly paymentRequest: Scalars['LnPaymentRequest']['input'];
};

export type LnInvoicePaymentStatusPayload = {
  readonly __typename: 'LnInvoicePaymentStatusPayload';
  readonly errors: ReadonlyArray<Error>;
  readonly status?: Maybe<InvoicePaymentStatus>;
};

export type LnNoAmountInvoice = {
  readonly __typename: 'LnNoAmountInvoice';
  readonly paymentHash: Scalars['PaymentHash']['output'];
  readonly paymentRequest: Scalars['LnPaymentRequest']['output'];
  readonly paymentSecret: Scalars['LnPaymentSecret']['output'];
};

export type LnNoAmountInvoiceCreateInput = {
  /** Optional invoice expiration time in minutes. */
  readonly expiresIn?: InputMaybe<Scalars['Minutes']['input']>;
  /** Optional memo for the lightning invoice. */
  readonly memo?: InputMaybe<Scalars['Memo']['input']>;
  /** ID for either a USD or BTC wallet belonging to the account of the current user. */
  readonly walletId: Scalars['WalletId']['input'];
};

export type LnNoAmountInvoiceCreateOnBehalfOfRecipientInput = {
  /** Optional invoice expiration time in minutes. */
  readonly expiresIn?: InputMaybe<Scalars['Minutes']['input']>;
  /** Optional memo for the lightning invoice. */
  readonly memo?: InputMaybe<Scalars['Memo']['input']>;
  /** ID for either a USD or BTC wallet which belongs to the account of any user. */
  readonly recipientWalletId: Scalars['WalletId']['input'];
};

export type LnNoAmountInvoiceFeeProbeInput = {
  readonly amount: Scalars['SatAmount']['input'];
  readonly paymentRequest: Scalars['LnPaymentRequest']['input'];
  readonly walletId: Scalars['WalletId']['input'];
};

export type LnNoAmountInvoicePayload = {
  readonly __typename: 'LnNoAmountInvoicePayload';
  readonly errors: ReadonlyArray<Error>;
  readonly invoice?: Maybe<LnNoAmountInvoice>;
};

export type LnNoAmountInvoicePaymentInput = {
  /** Amount to pay in satoshis. */
  readonly amount: Scalars['SatAmount']['input'];
  /** Optional memo to associate with the lightning invoice. */
  readonly memo?: InputMaybe<Scalars['Memo']['input']>;
  /** Payment request representing the invoice which is being paid. */
  readonly paymentRequest: Scalars['LnPaymentRequest']['input'];
  /** Wallet ID with sufficient balance to cover amount defined in mutation request.  Must belong to the account of the current user. */
  readonly walletId: Scalars['WalletId']['input'];
};

export type LnNoAmountUsdInvoiceFeeProbeInput = {
  readonly amount: Scalars['CentAmount']['input'];
  readonly paymentRequest: Scalars['LnPaymentRequest']['input'];
  readonly walletId: Scalars['WalletId']['input'];
};

export type LnNoAmountUsdInvoicePaymentInput = {
  /** Amount to pay in USD cents. */
  readonly amount: Scalars['CentAmount']['input'];
  /** Optional memo to associate with the lightning invoice. */
  readonly memo?: InputMaybe<Scalars['Memo']['input']>;
  /** Payment request representing the invoice which is being paid. */
  readonly paymentRequest: Scalars['LnPaymentRequest']['input'];
  /** Wallet ID with sufficient balance to cover amount defined in mutation request.  Must belong to the account of the current user. */
  readonly walletId: Scalars['WalletId']['input'];
};

export type LnUpdate = {
  readonly __typename: 'LnUpdate';
  readonly paymentHash: Scalars['PaymentHash']['output'];
  readonly status: InvoicePaymentStatus;
  readonly walletId: Scalars['WalletId']['output'];
};

export type LnUsdInvoiceCreateInput = {
  /** Amount in USD cents. */
  readonly amount: Scalars['CentAmount']['input'];
  /** Optional invoice expiration time in minutes. */
  readonly expiresIn?: InputMaybe<Scalars['Minutes']['input']>;
  /** Optional memo for the lightning invoice. */
  readonly memo?: InputMaybe<Scalars['Memo']['input']>;
  /** Wallet ID for a USD wallet belonging to the current user. */
  readonly walletId: Scalars['WalletId']['input'];
};

export type LnUsdInvoiceCreateOnBehalfOfRecipientInput = {
  /** Amount in USD cents. */
  readonly amount: Scalars['CentAmount']['input'];
  readonly descriptionHash?: InputMaybe<Scalars['Hex32Bytes']['input']>;
  /** Optional invoice expiration time in minutes. */
  readonly expiresIn?: InputMaybe<Scalars['Minutes']['input']>;
  /** Optional memo for the lightning invoice. Acts as a note to the recipient. */
  readonly memo?: InputMaybe<Scalars['Memo']['input']>;
  /** Wallet ID for a USD wallet which belongs to the account of any user. */
  readonly recipientWalletId: Scalars['WalletId']['input'];
};

export type LnUsdInvoiceFeeProbeInput = {
  readonly paymentRequest: Scalars['LnPaymentRequest']['input'];
  readonly walletId: Scalars['WalletId']['input'];
};

export type MapInfo = {
  readonly __typename: 'MapInfo';
  readonly coordinates: Coordinates;
  readonly title: Scalars['String']['output'];
};

export type MapMarker = {
  readonly __typename: 'MapMarker';
  readonly mapInfo: MapInfo;
  readonly username?: Maybe<Scalars['Username']['output']>;
};

export type MobileVersions = {
  readonly __typename: 'MobileVersions';
  readonly currentSupported: Scalars['Int']['output'];
  readonly minSupported: Scalars['Int']['output'];
  readonly platform: Scalars['String']['output'];
};

export type Mutation = {
  readonly __typename: 'Mutation';
  readonly accountDelete: AccountDeletePayload;
  readonly accountUpdateDefaultWalletId: AccountUpdateDefaultWalletIdPayload;
  readonly accountUpdateDisplayCurrency: AccountUpdateDisplayCurrencyPayload;
  readonly captchaCreateChallenge: CaptchaCreateChallengePayload;
  readonly captchaRequestAuthCode: SuccessPayload;
  readonly createWithdrawLink: WithdrawLink;
  readonly deleteWithdrawLink: Scalars['ID']['output'];
  readonly deviceNotificationTokenCreate: SuccessPayload;
  readonly feedbackSubmit: SuccessPayload;
  /**
   * Actions a payment which is internal to the ledger e.g. it does
   * not use onchain/lightning. Returns payment status (success,
   * failed, pending, already_paid).
   */
  readonly intraLedgerPaymentSend: PaymentSendPayload;
  /**
   * Actions a payment which is internal to the ledger e.g. it does
   * not use onchain/lightning. Returns payment status (success,
   * failed, pending, already_paid).
   */
  readonly intraLedgerUsdPaymentSend: PaymentSendPayload;
  /**
   * Returns a lightning invoice for an associated wallet.
   * When invoice is paid the value will be credited to a BTC wallet.
   * Expires after 'expiresIn' or 24 hours.
   */
  readonly lnInvoiceCreate: LnInvoicePayload;
  /**
   * Returns a lightning invoice for an associated wallet.
   * When invoice is paid the value will be credited to a BTC wallet.
   * Expires after 'expiresIn' or 24 hours.
   */
  readonly lnInvoiceCreateOnBehalfOfRecipient: LnInvoicePayload;
  readonly lnInvoiceFeeProbe: SatAmountPayload;
  /**
   * Pay a lightning invoice using a balance from a wallet which is owned by the account of the current user.
   * Provided wallet can be USD or BTC and must have sufficient balance to cover amount in lightning invoice.
   * Returns payment status (success, failed, pending, already_paid).
   */
  readonly lnInvoicePaymentSend: PaymentSendPayload;
  /**
   * Returns a lightning invoice for an associated wallet.
   * Can be used to receive any supported currency value (currently USD or BTC).
   * Expires after 'expiresIn' or 24 hours for BTC invoices or 5 minutes for USD invoices.
   */
  readonly lnNoAmountInvoiceCreate: LnNoAmountInvoicePayload;
  /**
   * Returns a lightning invoice for an associated wallet.
   * Can be used to receive any supported currency value (currently USD or BTC).
   * Expires after 'expiresIn' or 24 hours for BTC invoices or 5 minutes for USD invoices.
   */
  readonly lnNoAmountInvoiceCreateOnBehalfOfRecipient: LnNoAmountInvoicePayload;
  readonly lnNoAmountInvoiceFeeProbe: SatAmountPayload;
  /**
   * Pay a lightning invoice using a balance from a wallet which is owned by the account of the current user.
   * Provided wallet must be BTC and must have sufficient balance to cover amount specified in mutation request.
   * Returns payment status (success, failed, pending, already_paid).
   */
  readonly lnNoAmountInvoicePaymentSend: PaymentSendPayload;
  readonly lnNoAmountUsdInvoiceFeeProbe: CentAmountPayload;
  /**
   * Pay a lightning invoice using a balance from a wallet which is owned by the account of the current user.
   * Provided wallet must be USD and have sufficient balance to cover amount specified in mutation request.
   * Returns payment status (success, failed, pending, already_paid).
   */
  readonly lnNoAmountUsdInvoicePaymentSend: PaymentSendPayload;
  /**
   * Returns a lightning invoice denominated in satoshis for an associated wallet.
   * When invoice is paid the equivalent value at invoice creation will be credited to a USD wallet.
   * Expires after 'expiresIn' or 5 minutes (short expiry time because there is a USD/BTC exchange rate
   * associated with the amount).
   */
  readonly lnUsdInvoiceCreate: LnInvoicePayload;
  /**
   * Returns a lightning invoice denominated in satoshis for an associated wallet.
   * When invoice is paid the equivalent value at invoice creation will be credited to a USD wallet.
   * Expires after 'expiresIn' or 5 minutes (short expiry time because there is a USD/BTC exchange rate
   *   associated with the amount).
   */
  readonly lnUsdInvoiceCreateOnBehalfOfRecipient: LnInvoicePayload;
  readonly lnUsdInvoiceFeeProbe: SatAmountPayload;
  readonly onChainAddressCreate: OnChainAddressPayload;
  readonly onChainAddressCurrent: OnChainAddressPayload;
  readonly onChainPaymentSend: PaymentSendPayload;
  readonly onChainPaymentSendAll: PaymentSendPayload;
  readonly onChainUsdPaymentSend: PaymentSendPayload;
  readonly onChainUsdPaymentSendAsBtcDenominated: PaymentSendPayload;
  readonly quizCompleted: QuizCompletedPayload;
  readonly sendPaymentOnChain: SendPaymentOnChainResult;
  readonly updateWithdrawLink: WithdrawLink;
  /** @deprecated will be moved to AccountContact */
  readonly userContactUpdateAlias: UserContactUpdateAliasPayload;
  readonly userEmailDelete: UserEmailDeletePayload;
  readonly userEmailRegistrationInitiate: UserEmailRegistrationInitiatePayload;
  readonly userEmailRegistrationValidate: UserEmailRegistrationValidatePayload;
  readonly userLogin: AuthTokenPayload;
  readonly userLoginUpgrade: UpgradePayload;
  readonly userLogout: SuccessPayload;
  readonly userPhoneDelete: UserPhoneDeletePayload;
  readonly userPhoneRegistrationInitiate: SuccessPayload;
  readonly userPhoneRegistrationValidate: UserPhoneRegistrationValidatePayload;
  /** @deprecated Use QuizCompletedMutation instead */
  readonly userQuizQuestionUpdateCompleted: UserQuizQuestionUpdateCompletedPayload;
  readonly userRequestAuthCode: SuccessPayload;
  readonly userTotpDelete: UserTotpDeletePayload;
  readonly userTotpRegistrationInitiate: UserTotpRegistrationInitiatePayload;
  readonly userTotpRegistrationValidate: UserTotpRegistrationValidatePayload;
  readonly userUpdateLanguage: UserUpdateLanguagePayload;
  /** @deprecated Username will be moved to @Handle in Accounts. Also SetUsername naming should be used instead of UpdateUsername to reflect the idempotency of Handles */
  readonly userUpdateUsername: UserUpdateUsernamePayload;
};


export type MutationAccountUpdateDefaultWalletIdArgs = {
  input: AccountUpdateDefaultWalletIdInput;
};


export type MutationAccountUpdateDisplayCurrencyArgs = {
  input: AccountUpdateDisplayCurrencyInput;
};


export type MutationCaptchaRequestAuthCodeArgs = {
  input: CaptchaRequestAuthCodeInput;
};


export type MutationCreateWithdrawLinkArgs = {
  input: CreateWithdrawLinkInput;
};


export type MutationDeleteWithdrawLinkArgs = {
  id: Scalars['ID']['input'];
};


export type MutationDeviceNotificationTokenCreateArgs = {
  input: DeviceNotificationTokenCreateInput;
};


export type MutationFeedbackSubmitArgs = {
  input: FeedbackSubmitInput;
};


export type MutationIntraLedgerPaymentSendArgs = {
  input: IntraLedgerPaymentSendInput;
};


export type MutationIntraLedgerUsdPaymentSendArgs = {
  input: IntraLedgerUsdPaymentSendInput;
};


export type MutationLnInvoiceCreateArgs = {
  input: LnInvoiceCreateInput;
};


export type MutationLnInvoiceCreateOnBehalfOfRecipientArgs = {
  input: LnInvoiceCreateOnBehalfOfRecipientInput;
};


export type MutationLnInvoiceFeeProbeArgs = {
  input: LnInvoiceFeeProbeInput;
};


export type MutationLnInvoicePaymentSendArgs = {
  input: LnInvoicePaymentInput;
};


export type MutationLnNoAmountInvoiceCreateArgs = {
  input: LnNoAmountInvoiceCreateInput;
};


export type MutationLnNoAmountInvoiceCreateOnBehalfOfRecipientArgs = {
  input: LnNoAmountInvoiceCreateOnBehalfOfRecipientInput;
};


export type MutationLnNoAmountInvoiceFeeProbeArgs = {
  input: LnNoAmountInvoiceFeeProbeInput;
};


export type MutationLnNoAmountInvoicePaymentSendArgs = {
  input: LnNoAmountInvoicePaymentInput;
};


export type MutationLnNoAmountUsdInvoiceFeeProbeArgs = {
  input: LnNoAmountUsdInvoiceFeeProbeInput;
};


export type MutationLnNoAmountUsdInvoicePaymentSendArgs = {
  input: LnNoAmountUsdInvoicePaymentInput;
};


export type MutationLnUsdInvoiceCreateArgs = {
  input: LnUsdInvoiceCreateInput;
};


export type MutationLnUsdInvoiceCreateOnBehalfOfRecipientArgs = {
  input: LnUsdInvoiceCreateOnBehalfOfRecipientInput;
};


export type MutationLnUsdInvoiceFeeProbeArgs = {
  input: LnUsdInvoiceFeeProbeInput;
};


export type MutationOnChainAddressCreateArgs = {
  input: OnChainAddressCreateInput;
};


export type MutationOnChainAddressCurrentArgs = {
  input: OnChainAddressCurrentInput;
};


export type MutationOnChainPaymentSendArgs = {
  input: OnChainPaymentSendInput;
};


export type MutationOnChainPaymentSendAllArgs = {
  input: OnChainPaymentSendAllInput;
};


export type MutationOnChainUsdPaymentSendArgs = {
  input: OnChainUsdPaymentSendInput;
};


export type MutationOnChainUsdPaymentSendAsBtcDenominatedArgs = {
  input: OnChainUsdPaymentSendAsBtcDenominatedInput;
};


export type MutationQuizCompletedArgs = {
  input: QuizCompletedInput;
};


export type MutationSendPaymentOnChainArgs = {
  btc_wallet_address: Scalars['String']['input'];
  id: Scalars['ID']['input'];
};


export type MutationUpdateWithdrawLinkArgs = {
  id: Scalars['ID']['input'];
  input: UpdateWithdrawLinkInput;
};


export type MutationUserContactUpdateAliasArgs = {
  input: UserContactUpdateAliasInput;
};


export type MutationUserEmailRegistrationInitiateArgs = {
  input: UserEmailRegistrationInitiateInput;
};


export type MutationUserEmailRegistrationValidateArgs = {
  input: UserEmailRegistrationValidateInput;
};


export type MutationUserLoginArgs = {
  input: UserLoginInput;
};


export type MutationUserLoginUpgradeArgs = {
  input: UserLoginUpgradeInput;
};


export type MutationUserLogoutArgs = {
  input: UserLogoutInput;
};


export type MutationUserPhoneRegistrationInitiateArgs = {
  input: UserPhoneRegistrationInitiateInput;
};


export type MutationUserPhoneRegistrationValidateArgs = {
  input: UserPhoneRegistrationValidateInput;
};


export type MutationUserQuizQuestionUpdateCompletedArgs = {
  input: UserQuizQuestionUpdateCompletedInput;
};


export type MutationUserRequestAuthCodeArgs = {
  input: UserRequestAuthCodeInput;
};


export type MutationUserTotpDeleteArgs = {
  input: UserTotpDeleteInput;
};


export type MutationUserTotpRegistrationInitiateArgs = {
  input: UserTotpRegistrationInitiateInput;
};


export type MutationUserTotpRegistrationValidateArgs = {
  input: UserTotpRegistrationValidateInput;
};


export type MutationUserUpdateLanguageArgs = {
  input: UserUpdateLanguageInput;
};


export type MutationUserUpdateUsernameArgs = {
  input: UserUpdateUsernameInput;
};

export type MyUpdatesPayload = {
  readonly __typename: 'MyUpdatesPayload';
  readonly errors: ReadonlyArray<Error>;
  readonly me?: Maybe<User>;
  readonly update?: Maybe<UserUpdate>;
};

export const Network = {
  Mainnet: 'mainnet',
  Regtest: 'regtest',
  Signet: 'signet',
  Testnet: 'testnet'
} as const;

export type Network = typeof Network[keyof typeof Network];
export type OnChainAddressCreateInput = {
  readonly walletId: Scalars['WalletId']['input'];
};

export type OnChainAddressCurrentInput = {
  readonly walletId: Scalars['WalletId']['input'];
};

export type OnChainAddressPayload = {
  readonly __typename: 'OnChainAddressPayload';
  readonly address?: Maybe<Scalars['OnChainAddress']['output']>;
  readonly errors: ReadonlyArray<Error>;
};

export type OnChainPaymentSendAllInput = {
  readonly address: Scalars['OnChainAddress']['input'];
  readonly memo?: InputMaybe<Scalars['Memo']['input']>;
  readonly speed?: InputMaybe<PayoutSpeed>;
  readonly walletId: Scalars['WalletId']['input'];
};

export type OnChainPaymentSendInput = {
  readonly address: Scalars['OnChainAddress']['input'];
  readonly amount: Scalars['SatAmount']['input'];
  readonly memo?: InputMaybe<Scalars['Memo']['input']>;
  readonly speed?: InputMaybe<PayoutSpeed>;
  readonly walletId: Scalars['WalletId']['input'];
};

export type OnChainTxFee = {
  readonly __typename: 'OnChainTxFee';
  readonly amount: Scalars['SatAmount']['output'];
  /** @deprecated Ignored - will be removed */
  readonly targetConfirmations: Scalars['TargetConfirmations']['output'];
};

export type OnChainUpdate = {
  readonly __typename: 'OnChainUpdate';
  readonly amount: Scalars['SatAmount']['output'];
  readonly displayCurrencyPerSat: Scalars['Float']['output'];
  readonly txHash: Scalars['OnChainTxHash']['output'];
  readonly txNotificationType: TxNotificationType;
  /** @deprecated updated over displayCurrencyPerSat */
  readonly usdPerSat: Scalars['Float']['output'];
  readonly walletId: Scalars['WalletId']['output'];
};

export type OnChainUsdPaymentSendAsBtcDenominatedInput = {
  readonly address: Scalars['OnChainAddress']['input'];
  readonly amount: Scalars['SatAmount']['input'];
  readonly memo?: InputMaybe<Scalars['Memo']['input']>;
  readonly speed?: InputMaybe<PayoutSpeed>;
  readonly walletId: Scalars['WalletId']['input'];
};

export type OnChainUsdPaymentSendInput = {
  readonly address: Scalars['OnChainAddress']['input'];
  readonly amount: Scalars['CentAmount']['input'];
  readonly memo?: InputMaybe<Scalars['Memo']['input']>;
  readonly speed?: InputMaybe<PayoutSpeed>;
  readonly walletId: Scalars['WalletId']['input'];
};

export type OnChainUsdTxFee = {
  readonly __typename: 'OnChainUsdTxFee';
  readonly amount: Scalars['CentAmount']['output'];
  /** @deprecated Ignored - will be removed */
  readonly targetConfirmations: Scalars['TargetConfirmations']['output'];
};

export type OneDayAccountLimit = AccountLimit & {
  readonly __typename: 'OneDayAccountLimit';
  /** The rolling time interval value in seconds for the current 24 hour period. */
  readonly interval?: Maybe<Scalars['Seconds']['output']>;
  /** The amount of cents remaining below the limit for the current 24 hour period. */
  readonly remainingLimit?: Maybe<Scalars['CentAmount']['output']>;
  /** The current maximum limit for a given 24 hour period. */
  readonly totalLimit: Scalars['CentAmount']['output'];
};

/** Information about pagination in a connection. */
export type PageInfo = {
  readonly __typename: 'PageInfo';
  /** When paginating forwards, the cursor to continue. */
  readonly endCursor?: Maybe<Scalars['String']['output']>;
  /** When paginating forwards, are there more items? */
  readonly hasNextPage: Scalars['Boolean']['output'];
  /** When paginating backwards, are there more items? */
  readonly hasPreviousPage: Scalars['Boolean']['output'];
  /** When paginating backwards, the cursor to continue. */
  readonly startCursor?: Maybe<Scalars['String']['output']>;
};

export type PaymentSendPayload = {
  readonly __typename: 'PaymentSendPayload';
  readonly errors: ReadonlyArray<Error>;
  readonly status?: Maybe<PaymentSendResult>;
};

export const PaymentSendResult = {
  AlreadyPaid: 'ALREADY_PAID',
  Failure: 'FAILURE',
  Pending: 'PENDING',
  Success: 'SUCCESS'
} as const;

export type PaymentSendResult = typeof PaymentSendResult[keyof typeof PaymentSendResult];
export const PayoutSpeed = {
  Fast: 'FAST'
} as const;

export type PayoutSpeed = typeof PayoutSpeed[keyof typeof PayoutSpeed];
export const PhoneCodeChannelType = {
  Sms: 'SMS',
  Whatsapp: 'WHATSAPP'
} as const;

export type PhoneCodeChannelType = typeof PhoneCodeChannelType[keyof typeof PhoneCodeChannelType];
/** Price amount expressed in base/offset. To calculate, use: `base / 10^offset` */
export type Price = {
  readonly __typename: 'Price';
  readonly base: Scalars['SafeInt']['output'];
  readonly currencyUnit: Scalars['String']['output'];
  readonly formattedAmount: Scalars['String']['output'];
  readonly offset: Scalars['Int']['output'];
};

/** The range for the X axis in the BTC price graph */
export const PriceGraphRange = {
  FiveYears: 'FIVE_YEARS',
  OneDay: 'ONE_DAY',
  OneMonth: 'ONE_MONTH',
  OneWeek: 'ONE_WEEK',
  OneYear: 'ONE_YEAR'
} as const;

export type PriceGraphRange = typeof PriceGraphRange[keyof typeof PriceGraphRange];
export type PriceInput = {
  readonly amount: Scalars['SatAmount']['input'];
  readonly amountCurrencyUnit: ExchangeCurrencyUnit;
  readonly priceCurrencyUnit: ExchangeCurrencyUnit;
};

export type PriceInterface = {
  readonly base: Scalars['SafeInt']['output'];
  /** @deprecated Deprecated due to type renaming */
  readonly currencyUnit: Scalars['String']['output'];
  readonly offset: Scalars['Int']['output'];
};

/** Price of 1 sat in base/offset. To calculate, use: `base / 10^offset` */
export type PriceOfOneSatInMinorUnit = PriceInterface & {
  readonly __typename: 'PriceOfOneSatInMinorUnit';
  readonly base: Scalars['SafeInt']['output'];
  /** @deprecated Deprecated due to type renaming */
  readonly currencyUnit: Scalars['String']['output'];
  readonly offset: Scalars['Int']['output'];
};

/** Price of 1 sat or 1 usd cent in base/offset. To calculate, use: `base / 10^offset` */
export type PriceOfOneSettlementMinorUnitInDisplayMinorUnit = PriceInterface & {
  readonly __typename: 'PriceOfOneSettlementMinorUnitInDisplayMinorUnit';
  readonly base: Scalars['SafeInt']['output'];
  /** @deprecated Deprecated due to type renaming */
  readonly currencyUnit: Scalars['String']['output'];
  /** @deprecated Deprecated please use `base / 10^offset` */
  readonly formattedAmount: Scalars['String']['output'];
  readonly offset: Scalars['Int']['output'];
};

/** Price of 1 usd cent in base/offset. To calculate, use: `base / 10^offset` */
export type PriceOfOneUsdCentInMinorUnit = PriceInterface & {
  readonly __typename: 'PriceOfOneUsdCentInMinorUnit';
  readonly base: Scalars['SafeInt']['output'];
  /** @deprecated Deprecated due to type renaming */
  readonly currencyUnit: Scalars['String']['output'];
  readonly offset: Scalars['Int']['output'];
};

export type PricePayload = {
  readonly __typename: 'PricePayload';
  readonly errors: ReadonlyArray<Error>;
  readonly price?: Maybe<Price>;
};

export type PricePoint = {
  readonly __typename: 'PricePoint';
  readonly price: Price;
  /** Unix timestamp (number of seconds elapsed since January 1, 1970 00:00:00 UTC) */
  readonly timestamp: Scalars['Timestamp']['output'];
};

/** A public view of a generic wallet which stores value in one of our supported currencies. */
export type PublicWallet = {
  readonly __typename: 'PublicWallet';
  readonly id: Scalars['ID']['output'];
  readonly walletCurrency: WalletCurrency;
};

export type Query = {
  readonly __typename: 'Query';
  readonly accountDefaultWallet: PublicWallet;
  /** @deprecated Deprecated in favor of realtimePrice */
  readonly btcPrice?: Maybe<Price>;
  readonly btcPriceList?: Maybe<ReadonlyArray<Maybe<PricePoint>>>;
  readonly businessMapMarkers?: Maybe<ReadonlyArray<Maybe<MapMarker>>>;
  readonly currencyList: ReadonlyArray<Currency>;
  readonly getAllWithdrawLinks: ReadonlyArray<WithdrawLink>;
  readonly getOnChainPaymentFees: FeesResult;
  readonly getWithdrawLink?: Maybe<WithdrawLink>;
  readonly getWithdrawLinksByUserId: WithdrawLinksByUserIdResult;
  readonly globals?: Maybe<Globals>;
  readonly lnInvoicePaymentStatus: LnInvoicePaymentStatusPayload;
  readonly me?: Maybe<User>;
  readonly mobileVersions?: Maybe<ReadonlyArray<Maybe<MobileVersions>>>;
  readonly onChainTxFee: OnChainTxFee;
  readonly onChainUsdTxFee: OnChainUsdTxFee;
  readonly onChainUsdTxFeeAsBtcDenominated: OnChainUsdTxFee;
  /** @deprecated TODO: remove. we don't need a non authenticated version of this query. the users can only do the query while authenticated */
  readonly quizQuestions?: Maybe<ReadonlyArray<Maybe<QuizQuestion>>>;
  /** Returns 1 Sat and 1 Usd Cent price for the given currency */
  readonly realtimePrice: RealtimePrice;
  /** @deprecated will be migrated to AccountDefaultWalletId */
  readonly userDefaultWalletId: Scalars['WalletId']['output'];
  readonly usernameAvailable?: Maybe<Scalars['Boolean']['output']>;
};


export type QueryAccountDefaultWalletArgs = {
  username: Scalars['Username']['input'];
  walletCurrency?: InputMaybe<WalletCurrency>;
};


export type QueryBtcPriceArgs = {
  currency?: Scalars['DisplayCurrency']['input'];
};


export type QueryBtcPriceListArgs = {
  range: PriceGraphRange;
};


export type QueryGetOnChainPaymentFeesArgs = {
  btc_wallet_address: Scalars['String']['input'];
  id: Scalars['ID']['input'];
};


export type QueryGetWithdrawLinkArgs = {
  id?: InputMaybe<Scalars['ID']['input']>;
  identifier_code?: InputMaybe<Scalars['String']['input']>;
  k1?: InputMaybe<Scalars['String']['input']>;
  payment_hash?: InputMaybe<Scalars['String']['input']>;
  secret_code?: InputMaybe<Scalars['String']['input']>;
  unique_hash?: InputMaybe<Scalars['String']['input']>;
};


export type QueryGetWithdrawLinksByUserIdArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  status?: InputMaybe<Status>;
  user_id: Scalars['ID']['input'];
};


export type QueryLnInvoicePaymentStatusArgs = {
  input: LnInvoicePaymentStatusInput;
};


export type QueryOnChainTxFeeArgs = {
  address: Scalars['OnChainAddress']['input'];
  amount: Scalars['SatAmount']['input'];
  speed?: InputMaybe<PayoutSpeed>;
  walletId: Scalars['WalletId']['input'];
};


export type QueryOnChainUsdTxFeeArgs = {
  address: Scalars['OnChainAddress']['input'];
  amount: Scalars['CentAmount']['input'];
  speed?: InputMaybe<PayoutSpeed>;
  walletId: Scalars['WalletId']['input'];
};


export type QueryOnChainUsdTxFeeAsBtcDenominatedArgs = {
  address: Scalars['OnChainAddress']['input'];
  amount: Scalars['SatAmount']['input'];
  speed?: InputMaybe<PayoutSpeed>;
  walletId: Scalars['WalletId']['input'];
};


export type QueryRealtimePriceArgs = {
  currency?: InputMaybe<Scalars['DisplayCurrency']['input']>;
};


export type QueryUserDefaultWalletIdArgs = {
  username: Scalars['Username']['input'];
};


export type QueryUsernameAvailableArgs = {
  username: Scalars['Username']['input'];
};

export type Quiz = {
  readonly __typename: 'Quiz';
  /** The reward in Satoshis for the quiz question */
  readonly amount: Scalars['SatAmount']['output'];
  readonly completed: Scalars['Boolean']['output'];
  readonly id: Scalars['ID']['output'];
};

export type QuizCompletedInput = {
  readonly id: Scalars['ID']['input'];
};

export type QuizCompletedPayload = {
  readonly __typename: 'QuizCompletedPayload';
  readonly errors: ReadonlyArray<Error>;
  readonly quiz?: Maybe<Quiz>;
};

export type QuizQuestion = {
  readonly __typename: 'QuizQuestion';
  /** The earn reward in Satoshis for the quiz question */
  readonly earnAmount: Scalars['SatAmount']['output'];
  readonly id: Scalars['ID']['output'];
};

export type RealtimePrice = {
  readonly __typename: 'RealtimePrice';
  readonly btcSatPrice: PriceOfOneSatInMinorUnit;
  readonly denominatorCurrency: Scalars['DisplayCurrency']['output'];
  readonly id: Scalars['ID']['output'];
  /** Unix timestamp (number of seconds elapsed since January 1, 1970 00:00:00 UTC) */
  readonly timestamp: Scalars['Timestamp']['output'];
  readonly usdCentPrice: PriceOfOneUsdCentInMinorUnit;
};

export type RealtimePriceInput = {
  readonly currency?: InputMaybe<Scalars['DisplayCurrency']['input']>;
};

export type RealtimePricePayload = {
  readonly __typename: 'RealtimePricePayload';
  readonly errors: ReadonlyArray<Error>;
  readonly realtimePrice?: Maybe<RealtimePrice>;
};

export type SatAmountPayload = {
  readonly __typename: 'SatAmountPayload';
  readonly amount?: Maybe<Scalars['SatAmount']['output']>;
  readonly errors: ReadonlyArray<Error>;
};

export type SettlementVia = SettlementViaIntraLedger | SettlementViaLn | SettlementViaOnChain;

export type SettlementViaIntraLedger = {
  readonly __typename: 'SettlementViaIntraLedger';
  /** Settlement destination: Could be null if the payee does not have a username */
  readonly counterPartyUsername?: Maybe<Scalars['Username']['output']>;
  readonly counterPartyWalletId?: Maybe<Scalars['WalletId']['output']>;
};

export type SettlementViaLn = {
  readonly __typename: 'SettlementViaLn';
  /** @deprecated Shifting property to 'preImage' to improve granularity of the LnPaymentSecret type */
  readonly paymentSecret?: Maybe<Scalars['LnPaymentSecret']['output']>;
  readonly preImage?: Maybe<Scalars['LnPaymentPreImage']['output']>;
};

export type SettlementViaOnChain = {
  readonly __typename: 'SettlementViaOnChain';
  readonly transactionHash?: Maybe<Scalars['OnChainTxHash']['output']>;
  readonly vout?: Maybe<Scalars['Int']['output']>;
};

export const Status = {
  Funded: 'FUNDED',
  Paid: 'PAID',
  Unfunded: 'UNFUNDED'
} as const;

export type Status = typeof Status[keyof typeof Status];
export type Subscription = {
  readonly __typename: 'Subscription';
  readonly lnInvoicePaymentStatus: LnInvoicePaymentStatusPayload;
  readonly myUpdates: MyUpdatesPayload;
  readonly price: PricePayload;
  /** Returns the price of 1 satoshi */
  readonly realtimePrice: RealtimePricePayload;
};


export type SubscriptionLnInvoicePaymentStatusArgs = {
  input: LnInvoicePaymentStatusInput;
};


export type SubscriptionPriceArgs = {
  input: PriceInput;
};


export type SubscriptionRealtimePriceArgs = {
  input: RealtimePriceInput;
};

export type SuccessPayload = {
  readonly __typename: 'SuccessPayload';
  readonly errors: ReadonlyArray<Error>;
  readonly success?: Maybe<Scalars['Boolean']['output']>;
};

/**
 * Give details about an individual transaction.
 * Galoy have a smart routing system which is automatically
 * settling intraledger when both the payer and payee use the same wallet
 * therefore it's possible the transactions is being initiated onchain
 * or with lightning but settled intraledger.
 */
export type Transaction = {
  readonly __typename: 'Transaction';
  readonly createdAt: Scalars['Timestamp']['output'];
  readonly direction: TxDirection;
  readonly id: Scalars['ID']['output'];
  /** From which protocol the payment has been initiated. */
  readonly initiationVia: InitiationVia;
  readonly memo?: Maybe<Scalars['Memo']['output']>;
  /** Amount of the settlement currency sent or received. */
  readonly settlementAmount: Scalars['SignedAmount']['output'];
  /** Wallet currency for transaction. */
  readonly settlementCurrency: WalletCurrency;
  readonly settlementDisplayAmount: Scalars['SignedDisplayMajorAmount']['output'];
  readonly settlementDisplayCurrency: Scalars['DisplayCurrency']['output'];
  readonly settlementDisplayFee: Scalars['SignedDisplayMajorAmount']['output'];
  readonly settlementFee: Scalars['SignedAmount']['output'];
  /** Price in WALLETCURRENCY/SETTLEMENTUNIT at time of settlement. */
  readonly settlementPrice: PriceOfOneSettlementMinorUnitInDisplayMinorUnit;
  /** To which protocol the payment has settled on. */
  readonly settlementVia: SettlementVia;
  readonly status: TxStatus;
};

/** A connection to a list of items. */
export type TransactionConnection = {
  readonly __typename: 'TransactionConnection';
  /** A list of edges. */
  readonly edges?: Maybe<ReadonlyArray<TransactionEdge>>;
  /** Information to aid in pagination. */
  readonly pageInfo: PageInfo;
};

/** An edge in a connection. */
export type TransactionEdge = {
  readonly __typename: 'TransactionEdge';
  /** A cursor for use in pagination */
  readonly cursor: Scalars['String']['output'];
  /** The item at the end of the edge */
  readonly node: Transaction;
};

export const TxDirection = {
  Receive: 'RECEIVE',
  Send: 'SEND'
} as const;

export type TxDirection = typeof TxDirection[keyof typeof TxDirection];
export const TxNotificationType = {
  IntraLedgerPayment: 'IntraLedgerPayment',
  IntraLedgerReceipt: 'IntraLedgerReceipt',
  LnInvoicePaid: 'LnInvoicePaid',
  OnchainPayment: 'OnchainPayment',
  OnchainReceipt: 'OnchainReceipt',
  OnchainReceiptPending: 'OnchainReceiptPending'
} as const;

export type TxNotificationType = typeof TxNotificationType[keyof typeof TxNotificationType];
export const TxStatus = {
  Failure: 'FAILURE',
  Pending: 'PENDING',
  Success: 'SUCCESS'
} as const;

export type TxStatus = typeof TxStatus[keyof typeof TxStatus];
export type UpdateWithdrawLinkInput = {
  readonly account_type?: InputMaybe<Scalars['String']['input']>;
  readonly commission_percentage?: InputMaybe<Scalars['Float']['input']>;
  readonly escrow_wallet?: InputMaybe<Scalars['String']['input']>;
  readonly k1?: InputMaybe<Scalars['String']['input']>;
  readonly payment_hash?: InputMaybe<Scalars['String']['input']>;
  readonly payment_request?: InputMaybe<Scalars['String']['input']>;
  readonly payment_secret?: InputMaybe<Scalars['String']['input']>;
  readonly sales_amount?: InputMaybe<Scalars['Float']['input']>;
  readonly status?: InputMaybe<Status>;
  readonly title?: InputMaybe<Scalars['String']['input']>;
  readonly unique_hash?: InputMaybe<Scalars['String']['input']>;
  readonly user_id?: InputMaybe<Scalars['ID']['input']>;
  readonly voucher_amount?: InputMaybe<Scalars['Float']['input']>;
};

export type UpgradePayload = {
  readonly __typename: 'UpgradePayload';
  readonly authToken?: Maybe<Scalars['AuthToken']['output']>;
  readonly errors: ReadonlyArray<Error>;
  readonly success: Scalars['Boolean']['output'];
};

/** A wallet belonging to an account which contains a USD balance and a list of transactions. */
export type UsdWallet = Wallet & {
  readonly __typename: 'UsdWallet';
  readonly accountId: Scalars['ID']['output'];
  readonly balance: Scalars['SignedAmount']['output'];
  readonly id: Scalars['ID']['output'];
  /** An unconfirmed incoming onchain balance. */
  readonly pendingIncomingBalance: Scalars['SignedAmount']['output'];
  readonly transactions?: Maybe<TransactionConnection>;
  readonly transactionsByAddress?: Maybe<TransactionConnection>;
  readonly walletCurrency: WalletCurrency;
};


/** A wallet belonging to an account which contains a USD balance and a list of transactions. */
export type UsdWalletTransactionsArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
};


/** A wallet belonging to an account which contains a USD balance and a list of transactions. */
export type UsdWalletTransactionsByAddressArgs = {
  address: Scalars['OnChainAddress']['input'];
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
};

export type User = {
  readonly __typename: 'User';
  /**
   * Get single contact details.
   * Can include the transactions associated with the contact.
   * @deprecated will be moved to Accounts
   */
  readonly contactByUsername: UserContact;
  /**
   * Get full list of contacts.
   * Can include the transactions associated with each contact.
   * @deprecated will be moved to account
   */
  readonly contacts: ReadonlyArray<UserContact>;
  readonly createdAt: Scalars['Timestamp']['output'];
  readonly defaultAccount: Account;
  /** Email address */
  readonly email?: Maybe<Email>;
  readonly id: Scalars['ID']['output'];
  /**
   * Preferred language for user.
   * When value is 'default' the intent is to use preferred language from OS settings.
   */
  readonly language: Scalars['Language']['output'];
  /** Phone number with international calling code. */
  readonly phone?: Maybe<Scalars['Phone']['output']>;
  /**
   * List the quiz questions the user may have completed.
   * @deprecated use Quiz from Account instead
   */
  readonly quizQuestions: ReadonlyArray<UserQuizQuestion>;
  /** Whether TOTP is enabled for this user. */
  readonly totpEnabled: Scalars['Boolean']['output'];
  /**
   * Optional immutable user friendly identifier.
   * @deprecated will be moved to @Handle in Account and Wallet
   */
  readonly username?: Maybe<Scalars['Username']['output']>;
};


export type UserContactByUsernameArgs = {
  username: Scalars['Username']['input'];
};

export type UserContact = {
  readonly __typename: 'UserContact';
  /**
   * Alias the user can set for this contact.
   * Only the user can see the alias attached to their contact.
   */
  readonly alias?: Maybe<Scalars['ContactAlias']['output']>;
  readonly id: Scalars['Username']['output'];
  /** Paginated list of transactions sent to/from this contact. */
  readonly transactions?: Maybe<TransactionConnection>;
  readonly transactionsCount: Scalars['Int']['output'];
  /** Actual identifier of the contact. */
  readonly username: Scalars['Username']['output'];
};


export type UserContactTransactionsArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
};

export type UserContactUpdateAliasInput = {
  readonly alias: Scalars['ContactAlias']['input'];
  readonly username: Scalars['Username']['input'];
};

export type UserContactUpdateAliasPayload = {
  readonly __typename: 'UserContactUpdateAliasPayload';
  readonly contact?: Maybe<UserContact>;
  readonly errors: ReadonlyArray<Error>;
};

export type UserEmailDeletePayload = {
  readonly __typename: 'UserEmailDeletePayload';
  readonly errors: ReadonlyArray<Error>;
  readonly me?: Maybe<User>;
};

export type UserEmailRegistrationInitiateInput = {
  readonly email: Scalars['EmailAddress']['input'];
};

export type UserEmailRegistrationInitiatePayload = {
  readonly __typename: 'UserEmailRegistrationInitiatePayload';
  readonly emailRegistrationId?: Maybe<Scalars['EmailRegistrationId']['output']>;
  readonly errors: ReadonlyArray<Error>;
  readonly me?: Maybe<User>;
};

export type UserEmailRegistrationValidateInput = {
  readonly code: Scalars['OneTimeAuthCode']['input'];
  readonly emailRegistrationId: Scalars['EmailRegistrationId']['input'];
};

export type UserEmailRegistrationValidatePayload = {
  readonly __typename: 'UserEmailRegistrationValidatePayload';
  readonly errors: ReadonlyArray<Error>;
  readonly me?: Maybe<User>;
};

export type UserLoginInput = {
  readonly code: Scalars['OneTimeAuthCode']['input'];
  readonly phone: Scalars['Phone']['input'];
};

export type UserLoginUpgradeInput = {
  readonly code: Scalars['OneTimeAuthCode']['input'];
  readonly phone: Scalars['Phone']['input'];
};

export type UserLogoutInput = {
  readonly authToken: Scalars['AuthToken']['input'];
};

export type UserPhoneDeletePayload = {
  readonly __typename: 'UserPhoneDeletePayload';
  readonly errors: ReadonlyArray<Error>;
  readonly me?: Maybe<User>;
};

export type UserPhoneRegistrationInitiateInput = {
  readonly channel?: InputMaybe<PhoneCodeChannelType>;
  readonly phone: Scalars['Phone']['input'];
};

export type UserPhoneRegistrationValidateInput = {
  readonly code: Scalars['OneTimeAuthCode']['input'];
  readonly phone: Scalars['Phone']['input'];
};

export type UserPhoneRegistrationValidatePayload = {
  readonly __typename: 'UserPhoneRegistrationValidatePayload';
  readonly errors: ReadonlyArray<Error>;
  readonly me?: Maybe<User>;
};

export type UserQuizQuestion = {
  readonly __typename: 'UserQuizQuestion';
  readonly completed: Scalars['Boolean']['output'];
  readonly question: QuizQuestion;
};

export type UserQuizQuestionUpdateCompletedInput = {
  readonly id: Scalars['ID']['input'];
};

export type UserQuizQuestionUpdateCompletedPayload = {
  readonly __typename: 'UserQuizQuestionUpdateCompletedPayload';
  readonly errors: ReadonlyArray<Error>;
  readonly userQuizQuestion?: Maybe<UserQuizQuestion>;
};

export type UserRequestAuthCodeInput = {
  readonly channel?: InputMaybe<PhoneCodeChannelType>;
  readonly phone: Scalars['Phone']['input'];
};

export type UserTotpDeleteInput = {
  readonly authToken: Scalars['AuthToken']['input'];
};

export type UserTotpDeletePayload = {
  readonly __typename: 'UserTotpDeletePayload';
  readonly errors: ReadonlyArray<Error>;
  readonly me?: Maybe<User>;
};

export type UserTotpRegistrationInitiateInput = {
  readonly authToken: Scalars['AuthToken']['input'];
};

export type UserTotpRegistrationInitiatePayload = {
  readonly __typename: 'UserTotpRegistrationInitiatePayload';
  readonly errors: ReadonlyArray<Error>;
  readonly totpRegistrationId?: Maybe<Scalars['TotpRegistrationId']['output']>;
  readonly totpSecret?: Maybe<Scalars['TotpSecret']['output']>;
};

export type UserTotpRegistrationValidateInput = {
  readonly authToken: Scalars['AuthToken']['input'];
  readonly totpCode: Scalars['TotpCode']['input'];
  readonly totpRegistrationId: Scalars['TotpRegistrationId']['input'];
};

export type UserTotpRegistrationValidatePayload = {
  readonly __typename: 'UserTotpRegistrationValidatePayload';
  readonly errors: ReadonlyArray<Error>;
  readonly me?: Maybe<User>;
};

export type UserUpdate = IntraLedgerUpdate | LnUpdate | OnChainUpdate | Price | RealtimePrice;

export type UserUpdateLanguageInput = {
  readonly language: Scalars['Language']['input'];
};

export type UserUpdateLanguagePayload = {
  readonly __typename: 'UserUpdateLanguagePayload';
  readonly errors: ReadonlyArray<Error>;
  readonly user?: Maybe<User>;
};

export type UserUpdateUsernameInput = {
  readonly username: Scalars['Username']['input'];
};

export type UserUpdateUsernamePayload = {
  readonly __typename: 'UserUpdateUsernamePayload';
  readonly errors: ReadonlyArray<Error>;
  readonly user?: Maybe<User>;
};

/** A generic wallet which stores value in one of our supported currencies. */
export type Wallet = {
  readonly accountId: Scalars['ID']['output'];
  readonly balance: Scalars['SignedAmount']['output'];
  readonly id: Scalars['ID']['output'];
  readonly pendingIncomingBalance: Scalars['SignedAmount']['output'];
  /**
   * Transactions are ordered anti-chronologically,
   * ie: the newest transaction will be first
   */
  readonly transactions?: Maybe<TransactionConnection>;
  /**
   * Transactions are ordered anti-chronologically,
   * ie: the newest transaction will be first
   */
  readonly transactionsByAddress?: Maybe<TransactionConnection>;
  readonly walletCurrency: WalletCurrency;
};


/** A generic wallet which stores value in one of our supported currencies. */
export type WalletTransactionsArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
};


/** A generic wallet which stores value in one of our supported currencies. */
export type WalletTransactionsByAddressArgs = {
  address: Scalars['OnChainAddress']['input'];
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
};

export const WalletCurrency = {
  Btc: 'BTC',
  Usd: 'USD'
} as const;

export type WalletCurrency = typeof WalletCurrency[keyof typeof WalletCurrency];
export type WithdrawLink = {
  readonly __typename: 'WithdrawLink';
  readonly account_type: Scalars['String']['output'];
  readonly commission_percentage?: Maybe<Scalars['Float']['output']>;
  readonly created_at: Scalars['String']['output'];
  readonly escrow_wallet: Scalars['String']['output'];
  readonly id: Scalars['ID']['output'];
  readonly identifier_code?: Maybe<Scalars['String']['output']>;
  readonly invoice_expiration: Scalars['String']['output'];
  readonly k1?: Maybe<Scalars['String']['output']>;
  readonly payment_hash: Scalars['String']['output'];
  readonly payment_request: Scalars['String']['output'];
  readonly payment_secret: Scalars['String']['output'];
  readonly sales_amount: Scalars['Float']['output'];
  readonly secret_code?: Maybe<Scalars['String']['output']>;
  readonly status: Status;
  readonly title: Scalars['String']['output'];
  readonly unique_hash: Scalars['String']['output'];
  readonly updated_at: Scalars['String']['output'];
  readonly user_id: Scalars['ID']['output'];
  readonly voucher_amount: Scalars['Float']['output'];
};

export type WithdrawLinksByUserIdResult = {
  readonly __typename: 'WithdrawLinksByUserIdResult';
  readonly total_links?: Maybe<Scalars['Int']['output']>;
  readonly withdrawLinks: ReadonlyArray<WithdrawLink>;
};

export type SendPaymentOnChainResult = {
  readonly __typename: 'sendPaymentOnChainResult';
  readonly amount: Scalars['Float']['output'];
  readonly status: Scalars['String']['output'];
};

export type CreateWithdrawLinkMutationVariables = Exact<{
  input: CreateWithdrawLinkInput;
}>;


export type CreateWithdrawLinkMutation = { readonly __typename: 'Mutation', readonly createWithdrawLink: { readonly __typename: 'WithdrawLink', readonly id: string, readonly user_id: string, readonly payment_request: string, readonly payment_hash: string, readonly payment_secret: string, readonly sales_amount: number, readonly account_type: string, readonly escrow_wallet: string, readonly status: Status, readonly title: string, readonly voucher_amount: number, readonly unique_hash: string, readonly k1?: string | null, readonly created_at: string, readonly updated_at: string, readonly commission_percentage?: number | null } };

export type UpdateWithdrawLinkMutationVariables = Exact<{
  updateWithdrawLinkId: Scalars['ID']['input'];
  updateWithdrawLinkInput: UpdateWithdrawLinkInput;
}>;


export type UpdateWithdrawLinkMutation = { readonly __typename: 'Mutation', readonly updateWithdrawLink: { readonly __typename: 'WithdrawLink', readonly account_type: string, readonly sales_amount: number, readonly created_at: string, readonly escrow_wallet: string, readonly id: string, readonly k1?: string | null, readonly voucher_amount: number, readonly payment_hash: string, readonly payment_request: string, readonly payment_secret: string, readonly status: Status, readonly title: string, readonly unique_hash: string, readonly user_id: string, readonly updated_at: string, readonly commission_percentage?: number | null } };

export type LnInvoiceCreateOnBehalfOfRecipientMutationVariables = Exact<{
  input: LnInvoiceCreateOnBehalfOfRecipientInput;
}>;


export type LnInvoiceCreateOnBehalfOfRecipientMutation = { readonly __typename: 'Mutation', readonly lnInvoiceCreateOnBehalfOfRecipient: { readonly __typename: 'LnInvoicePayload', readonly errors: ReadonlyArray<{ readonly __typename: 'GraphQLApplicationError', readonly message: string, readonly path?: ReadonlyArray<string | null> | null, readonly code?: string | null }>, readonly invoice?: { readonly __typename: 'LnInvoice', readonly paymentRequest: string, readonly paymentHash: string, readonly paymentSecret: string, readonly satoshis?: number | null } | null } };

export type LnUsdInvoiceCreateOnBehalfOfRecipientMutationVariables = Exact<{
  input: LnUsdInvoiceCreateOnBehalfOfRecipientInput;
}>;


export type LnUsdInvoiceCreateOnBehalfOfRecipientMutation = { readonly __typename: 'Mutation', readonly lnUsdInvoiceCreateOnBehalfOfRecipient: { readonly __typename: 'LnInvoicePayload', readonly errors: ReadonlyArray<{ readonly __typename: 'GraphQLApplicationError', readonly message: string, readonly path?: ReadonlyArray<string | null> | null, readonly code?: string | null }>, readonly invoice?: { readonly __typename: 'LnInvoice', readonly paymentRequest: string, readonly paymentHash: string, readonly paymentSecret: string, readonly satoshis?: number | null } | null } };

export type SendPaymentOnChainMutationVariables = Exact<{
  sendPaymentOnChainId: Scalars['ID']['input'];
  btcWalletAddress: Scalars['String']['input'];
}>;


export type SendPaymentOnChainMutation = { readonly __typename: 'Mutation', readonly sendPaymentOnChain: { readonly __typename: 'sendPaymentOnChainResult', readonly amount: number, readonly status: string } };

export type DeleteWithdrawLinkMutationVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type DeleteWithdrawLinkMutation = { readonly __typename: 'Mutation', readonly deleteWithdrawLink: string };

export type GetWithdrawLinkQueryVariables = Exact<{
  getWithdrawLinkId?: InputMaybe<Scalars['ID']['input']>;
}>;


export type GetWithdrawLinkQuery = { readonly __typename: 'Query', readonly getWithdrawLink?: { readonly __typename: 'WithdrawLink', readonly id: string, readonly user_id: string, readonly payment_request: string, readonly payment_hash: string, readonly payment_secret: string, readonly sales_amount: number, readonly account_type: string, readonly escrow_wallet: string, readonly status: Status, readonly title: string, readonly voucher_amount: number, readonly unique_hash: string, readonly k1?: string | null, readonly created_at: string, readonly updated_at: string, readonly commission_percentage?: number | null, readonly identifier_code?: string | null, readonly secret_code?: string | null, readonly invoice_expiration: string } | null };

export type GetWithdrawLinksByUserIdQueryVariables = Exact<{
  userId: Scalars['ID']['input'];
  status?: InputMaybe<Status>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
}>;


export type GetWithdrawLinksByUserIdQuery = { readonly __typename: 'Query', readonly getWithdrawLinksByUserId: { readonly __typename: 'WithdrawLinksByUserIdResult', readonly total_links?: number | null, readonly withdrawLinks: ReadonlyArray<{ readonly __typename: 'WithdrawLink', readonly id: string, readonly user_id: string, readonly payment_request: string, readonly payment_hash: string, readonly payment_secret: string, readonly sales_amount: number, readonly account_type: string, readonly escrow_wallet: string, readonly status: Status, readonly title: string, readonly voucher_amount: number, readonly unique_hash: string, readonly k1?: string | null, readonly created_at: string, readonly updated_at: string, readonly commission_percentage?: number | null, readonly identifier_code?: string | null, readonly secret_code?: string | null, readonly invoice_expiration: string }> } };

export type CurrencyListQueryVariables = Exact<{ [key: string]: never; }>;


export type CurrencyListQuery = { readonly __typename: 'Query', readonly currencyList: ReadonlyArray<{ readonly __typename: 'Currency', readonly id: string, readonly symbol: string, readonly name: string, readonly flag: string, readonly fractionDigits: number }> };

export type RealtimePriceInitialQueryVariables = Exact<{
  currency: Scalars['DisplayCurrency']['input'];
}>;


export type RealtimePriceInitialQuery = { readonly __typename: 'Query', readonly realtimePrice: { readonly __typename: 'RealtimePrice', readonly timestamp: number, readonly denominatorCurrency: string, readonly btcSatPrice: { readonly __typename: 'PriceOfOneSatInMinorUnit', readonly base: number, readonly offset: number }, readonly usdCentPrice: { readonly __typename: 'PriceOfOneUsdCentInMinorUnit', readonly base: number, readonly offset: number } } };

export type GetOnChainPaymentFeesQueryVariables = Exact<{
  getOnChainPaymentFeesId: Scalars['ID']['input'];
  btcWalletAddress: Scalars['String']['input'];
}>;


export type GetOnChainPaymentFeesQuery = { readonly __typename: 'Query', readonly getOnChainPaymentFees: { readonly __typename: 'FeesResult', readonly fees: number } };

export type GetWithdrawLinkBySecretQueryVariables = Exact<{
  secret_code: Scalars['String']['input'];
}>;


export type GetWithdrawLinkBySecretQuery = { readonly __typename: 'Query', readonly getWithdrawLink?: { readonly __typename: 'WithdrawLink', readonly id: string } | null };

export type LnInvoicePaymentStatusSubscriptionVariables = Exact<{
  payment_request: Scalars['LnPaymentRequest']['input'];
}>;


export type LnInvoicePaymentStatusSubscription = { readonly __typename: 'Subscription', readonly lnInvoicePaymentStatus: { readonly __typename: 'LnInvoicePaymentStatusPayload', readonly status?: InvoicePaymentStatus | null, readonly errors: ReadonlyArray<{ readonly __typename: 'GraphQLApplicationError', readonly message: string, readonly path?: ReadonlyArray<string | null> | null, readonly code?: string | null }> } };

export type RealtimePriceWsSubscriptionVariables = Exact<{
  currency: Scalars['DisplayCurrency']['input'];
}>;


export type RealtimePriceWsSubscription = { readonly __typename: 'Subscription', readonly realtimePrice: { readonly __typename: 'RealtimePricePayload', readonly errors: ReadonlyArray<{ readonly __typename: 'GraphQLApplicationError', readonly message: string }>, readonly realtimePrice?: { readonly __typename: 'RealtimePrice', readonly timestamp: number, readonly denominatorCurrency: string, readonly btcSatPrice: { readonly __typename: 'PriceOfOneSatInMinorUnit', readonly base: number, readonly offset: number }, readonly usdCentPrice: { readonly __typename: 'PriceOfOneUsdCentInMinorUnit', readonly base: number, readonly offset: number } } | null } };

export type PriceSubscriptionVariables = Exact<{
  amount: Scalars['SatAmount']['input'];
  amountCurrencyUnit: ExchangeCurrencyUnit;
  priceCurrencyUnit: ExchangeCurrencyUnit;
}>;


export type PriceSubscription = { readonly __typename: 'Subscription', readonly price: { readonly __typename: 'PricePayload', readonly errors: ReadonlyArray<{ readonly __typename: 'GraphQLApplicationError', readonly message: string }>, readonly price?: { readonly __typename: 'Price', readonly base: number, readonly offset: number, readonly currencyUnit: string, readonly formattedAmount: string } | null } };


export const CreateWithdrawLinkDocument = gql`
    mutation CreateWithdrawLink($input: CreateWithdrawLinkInput!) {
  createWithdrawLink(input: $input) {
    id
    user_id
    payment_request
    payment_hash
    payment_secret
    sales_amount
    account_type
    escrow_wallet
    status
    title
    voucher_amount
    unique_hash
    k1
    created_at
    updated_at
    commission_percentage
  }
}
    `;
export type CreateWithdrawLinkMutationFn = Apollo.MutationFunction<CreateWithdrawLinkMutation, CreateWithdrawLinkMutationVariables>;

/**
 * __useCreateWithdrawLinkMutation__
 *
 * To run a mutation, you first call `useCreateWithdrawLinkMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useCreateWithdrawLinkMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [createWithdrawLinkMutation, { data, loading, error }] = useCreateWithdrawLinkMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useCreateWithdrawLinkMutation(baseOptions?: Apollo.MutationHookOptions<CreateWithdrawLinkMutation, CreateWithdrawLinkMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<CreateWithdrawLinkMutation, CreateWithdrawLinkMutationVariables>(CreateWithdrawLinkDocument, options);
      }
export type CreateWithdrawLinkMutationHookResult = ReturnType<typeof useCreateWithdrawLinkMutation>;
export type CreateWithdrawLinkMutationResult = Apollo.MutationResult<CreateWithdrawLinkMutation>;
export type CreateWithdrawLinkMutationOptions = Apollo.BaseMutationOptions<CreateWithdrawLinkMutation, CreateWithdrawLinkMutationVariables>;
export const UpdateWithdrawLinkDocument = gql`
    mutation UpdateWithdrawLink($updateWithdrawLinkId: ID!, $updateWithdrawLinkInput: UpdateWithdrawLinkInput!) {
  updateWithdrawLink(id: $updateWithdrawLinkId, input: $updateWithdrawLinkInput) {
    account_type
    sales_amount
    created_at
    escrow_wallet
    id
    k1
    voucher_amount
    payment_hash
    payment_request
    payment_secret
    status
    title
    unique_hash
    user_id
    updated_at
    commission_percentage
  }
}
    `;
export type UpdateWithdrawLinkMutationFn = Apollo.MutationFunction<UpdateWithdrawLinkMutation, UpdateWithdrawLinkMutationVariables>;

/**
 * __useUpdateWithdrawLinkMutation__
 *
 * To run a mutation, you first call `useUpdateWithdrawLinkMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useUpdateWithdrawLinkMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [updateWithdrawLinkMutation, { data, loading, error }] = useUpdateWithdrawLinkMutation({
 *   variables: {
 *      updateWithdrawLinkId: // value for 'updateWithdrawLinkId'
 *      updateWithdrawLinkInput: // value for 'updateWithdrawLinkInput'
 *   },
 * });
 */
export function useUpdateWithdrawLinkMutation(baseOptions?: Apollo.MutationHookOptions<UpdateWithdrawLinkMutation, UpdateWithdrawLinkMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<UpdateWithdrawLinkMutation, UpdateWithdrawLinkMutationVariables>(UpdateWithdrawLinkDocument, options);
      }
export type UpdateWithdrawLinkMutationHookResult = ReturnType<typeof useUpdateWithdrawLinkMutation>;
export type UpdateWithdrawLinkMutationResult = Apollo.MutationResult<UpdateWithdrawLinkMutation>;
export type UpdateWithdrawLinkMutationOptions = Apollo.BaseMutationOptions<UpdateWithdrawLinkMutation, UpdateWithdrawLinkMutationVariables>;
export const LnInvoiceCreateOnBehalfOfRecipientDocument = gql`
    mutation LnInvoiceCreateOnBehalfOfRecipient($input: LnInvoiceCreateOnBehalfOfRecipientInput!) {
  lnInvoiceCreateOnBehalfOfRecipient(input: $input) {
    errors {
      message
      path
      code
    }
    invoice {
      paymentRequest
      paymentHash
      paymentSecret
      satoshis
    }
  }
}
    `;
export type LnInvoiceCreateOnBehalfOfRecipientMutationFn = Apollo.MutationFunction<LnInvoiceCreateOnBehalfOfRecipientMutation, LnInvoiceCreateOnBehalfOfRecipientMutationVariables>;

/**
 * __useLnInvoiceCreateOnBehalfOfRecipientMutation__
 *
 * To run a mutation, you first call `useLnInvoiceCreateOnBehalfOfRecipientMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useLnInvoiceCreateOnBehalfOfRecipientMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [lnInvoiceCreateOnBehalfOfRecipientMutation, { data, loading, error }] = useLnInvoiceCreateOnBehalfOfRecipientMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useLnInvoiceCreateOnBehalfOfRecipientMutation(baseOptions?: Apollo.MutationHookOptions<LnInvoiceCreateOnBehalfOfRecipientMutation, LnInvoiceCreateOnBehalfOfRecipientMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<LnInvoiceCreateOnBehalfOfRecipientMutation, LnInvoiceCreateOnBehalfOfRecipientMutationVariables>(LnInvoiceCreateOnBehalfOfRecipientDocument, options);
      }
export type LnInvoiceCreateOnBehalfOfRecipientMutationHookResult = ReturnType<typeof useLnInvoiceCreateOnBehalfOfRecipientMutation>;
export type LnInvoiceCreateOnBehalfOfRecipientMutationResult = Apollo.MutationResult<LnInvoiceCreateOnBehalfOfRecipientMutation>;
export type LnInvoiceCreateOnBehalfOfRecipientMutationOptions = Apollo.BaseMutationOptions<LnInvoiceCreateOnBehalfOfRecipientMutation, LnInvoiceCreateOnBehalfOfRecipientMutationVariables>;
export const LnUsdInvoiceCreateOnBehalfOfRecipientDocument = gql`
    mutation LnUsdInvoiceCreateOnBehalfOfRecipient($input: LnUsdInvoiceCreateOnBehalfOfRecipientInput!) {
  lnUsdInvoiceCreateOnBehalfOfRecipient(input: $input) {
    errors {
      message
      path
      code
    }
    invoice {
      paymentRequest
      paymentHash
      paymentSecret
      satoshis
    }
  }
}
    `;
export type LnUsdInvoiceCreateOnBehalfOfRecipientMutationFn = Apollo.MutationFunction<LnUsdInvoiceCreateOnBehalfOfRecipientMutation, LnUsdInvoiceCreateOnBehalfOfRecipientMutationVariables>;

/**
 * __useLnUsdInvoiceCreateOnBehalfOfRecipientMutation__
 *
 * To run a mutation, you first call `useLnUsdInvoiceCreateOnBehalfOfRecipientMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useLnUsdInvoiceCreateOnBehalfOfRecipientMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [lnUsdInvoiceCreateOnBehalfOfRecipientMutation, { data, loading, error }] = useLnUsdInvoiceCreateOnBehalfOfRecipientMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useLnUsdInvoiceCreateOnBehalfOfRecipientMutation(baseOptions?: Apollo.MutationHookOptions<LnUsdInvoiceCreateOnBehalfOfRecipientMutation, LnUsdInvoiceCreateOnBehalfOfRecipientMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<LnUsdInvoiceCreateOnBehalfOfRecipientMutation, LnUsdInvoiceCreateOnBehalfOfRecipientMutationVariables>(LnUsdInvoiceCreateOnBehalfOfRecipientDocument, options);
      }
export type LnUsdInvoiceCreateOnBehalfOfRecipientMutationHookResult = ReturnType<typeof useLnUsdInvoiceCreateOnBehalfOfRecipientMutation>;
export type LnUsdInvoiceCreateOnBehalfOfRecipientMutationResult = Apollo.MutationResult<LnUsdInvoiceCreateOnBehalfOfRecipientMutation>;
export type LnUsdInvoiceCreateOnBehalfOfRecipientMutationOptions = Apollo.BaseMutationOptions<LnUsdInvoiceCreateOnBehalfOfRecipientMutation, LnUsdInvoiceCreateOnBehalfOfRecipientMutationVariables>;
export const SendPaymentOnChainDocument = gql`
    mutation SendPaymentOnChain($sendPaymentOnChainId: ID!, $btcWalletAddress: String!) {
  sendPaymentOnChain(
    id: $sendPaymentOnChainId
    btc_wallet_address: $btcWalletAddress
  ) {
    amount
    status
  }
}
    `;
export type SendPaymentOnChainMutationFn = Apollo.MutationFunction<SendPaymentOnChainMutation, SendPaymentOnChainMutationVariables>;

/**
 * __useSendPaymentOnChainMutation__
 *
 * To run a mutation, you first call `useSendPaymentOnChainMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useSendPaymentOnChainMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [sendPaymentOnChainMutation, { data, loading, error }] = useSendPaymentOnChainMutation({
 *   variables: {
 *      sendPaymentOnChainId: // value for 'sendPaymentOnChainId'
 *      btcWalletAddress: // value for 'btcWalletAddress'
 *   },
 * });
 */
export function useSendPaymentOnChainMutation(baseOptions?: Apollo.MutationHookOptions<SendPaymentOnChainMutation, SendPaymentOnChainMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<SendPaymentOnChainMutation, SendPaymentOnChainMutationVariables>(SendPaymentOnChainDocument, options);
      }
export type SendPaymentOnChainMutationHookResult = ReturnType<typeof useSendPaymentOnChainMutation>;
export type SendPaymentOnChainMutationResult = Apollo.MutationResult<SendPaymentOnChainMutation>;
export type SendPaymentOnChainMutationOptions = Apollo.BaseMutationOptions<SendPaymentOnChainMutation, SendPaymentOnChainMutationVariables>;
export const DeleteWithdrawLinkDocument = gql`
    mutation DeleteWithdrawLink($id: ID!) {
  deleteWithdrawLink(id: $id)
}
    `;
export type DeleteWithdrawLinkMutationFn = Apollo.MutationFunction<DeleteWithdrawLinkMutation, DeleteWithdrawLinkMutationVariables>;

/**
 * __useDeleteWithdrawLinkMutation__
 *
 * To run a mutation, you first call `useDeleteWithdrawLinkMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useDeleteWithdrawLinkMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [deleteWithdrawLinkMutation, { data, loading, error }] = useDeleteWithdrawLinkMutation({
 *   variables: {
 *      id: // value for 'id'
 *   },
 * });
 */
export function useDeleteWithdrawLinkMutation(baseOptions?: Apollo.MutationHookOptions<DeleteWithdrawLinkMutation, DeleteWithdrawLinkMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<DeleteWithdrawLinkMutation, DeleteWithdrawLinkMutationVariables>(DeleteWithdrawLinkDocument, options);
      }
export type DeleteWithdrawLinkMutationHookResult = ReturnType<typeof useDeleteWithdrawLinkMutation>;
export type DeleteWithdrawLinkMutationResult = Apollo.MutationResult<DeleteWithdrawLinkMutation>;
export type DeleteWithdrawLinkMutationOptions = Apollo.BaseMutationOptions<DeleteWithdrawLinkMutation, DeleteWithdrawLinkMutationVariables>;
export const GetWithdrawLinkDocument = gql`
    query GetWithdrawLink($getWithdrawLinkId: ID) {
  getWithdrawLink(id: $getWithdrawLinkId) {
    id
    user_id
    payment_request
    payment_hash
    payment_secret
    sales_amount
    account_type
    escrow_wallet
    status
    title
    voucher_amount
    unique_hash
    k1
    created_at
    updated_at
    commission_percentage
    identifier_code
    secret_code
    invoice_expiration
  }
}
    `;

/**
 * __useGetWithdrawLinkQuery__
 *
 * To run a query within a React component, call `useGetWithdrawLinkQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetWithdrawLinkQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetWithdrawLinkQuery({
 *   variables: {
 *      getWithdrawLinkId: // value for 'getWithdrawLinkId'
 *   },
 * });
 */
export function useGetWithdrawLinkQuery(baseOptions?: Apollo.QueryHookOptions<GetWithdrawLinkQuery, GetWithdrawLinkQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<GetWithdrawLinkQuery, GetWithdrawLinkQueryVariables>(GetWithdrawLinkDocument, options);
      }
export function useGetWithdrawLinkLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<GetWithdrawLinkQuery, GetWithdrawLinkQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<GetWithdrawLinkQuery, GetWithdrawLinkQueryVariables>(GetWithdrawLinkDocument, options);
        }
export type GetWithdrawLinkQueryHookResult = ReturnType<typeof useGetWithdrawLinkQuery>;
export type GetWithdrawLinkLazyQueryHookResult = ReturnType<typeof useGetWithdrawLinkLazyQuery>;
export type GetWithdrawLinkQueryResult = Apollo.QueryResult<GetWithdrawLinkQuery, GetWithdrawLinkQueryVariables>;
export const GetWithdrawLinksByUserIdDocument = gql`
    query GetWithdrawLinksByUserId($userId: ID!, $status: Status, $limit: Int, $offset: Int) {
  getWithdrawLinksByUserId(
    user_id: $userId
    status: $status
    limit: $limit
    offset: $offset
  ) {
    total_links
    withdrawLinks {
      id
      user_id
      payment_request
      payment_hash
      payment_secret
      sales_amount
      account_type
      escrow_wallet
      status
      title
      voucher_amount
      unique_hash
      k1
      created_at
      updated_at
      commission_percentage
      identifier_code
      secret_code
      invoice_expiration
    }
  }
}
    `;

/**
 * __useGetWithdrawLinksByUserIdQuery__
 *
 * To run a query within a React component, call `useGetWithdrawLinksByUserIdQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetWithdrawLinksByUserIdQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetWithdrawLinksByUserIdQuery({
 *   variables: {
 *      userId: // value for 'userId'
 *      status: // value for 'status'
 *      limit: // value for 'limit'
 *      offset: // value for 'offset'
 *   },
 * });
 */
export function useGetWithdrawLinksByUserIdQuery(baseOptions: Apollo.QueryHookOptions<GetWithdrawLinksByUserIdQuery, GetWithdrawLinksByUserIdQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<GetWithdrawLinksByUserIdQuery, GetWithdrawLinksByUserIdQueryVariables>(GetWithdrawLinksByUserIdDocument, options);
      }
export function useGetWithdrawLinksByUserIdLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<GetWithdrawLinksByUserIdQuery, GetWithdrawLinksByUserIdQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<GetWithdrawLinksByUserIdQuery, GetWithdrawLinksByUserIdQueryVariables>(GetWithdrawLinksByUserIdDocument, options);
        }
export type GetWithdrawLinksByUserIdQueryHookResult = ReturnType<typeof useGetWithdrawLinksByUserIdQuery>;
export type GetWithdrawLinksByUserIdLazyQueryHookResult = ReturnType<typeof useGetWithdrawLinksByUserIdLazyQuery>;
export type GetWithdrawLinksByUserIdQueryResult = Apollo.QueryResult<GetWithdrawLinksByUserIdQuery, GetWithdrawLinksByUserIdQueryVariables>;
export const CurrencyListDocument = gql`
    query CurrencyList {
  currencyList {
    id
    symbol
    name
    flag
    fractionDigits
  }
}
    `;

/**
 * __useCurrencyListQuery__
 *
 * To run a query within a React component, call `useCurrencyListQuery` and pass it any options that fit your needs.
 * When your component renders, `useCurrencyListQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useCurrencyListQuery({
 *   variables: {
 *   },
 * });
 */
export function useCurrencyListQuery(baseOptions?: Apollo.QueryHookOptions<CurrencyListQuery, CurrencyListQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<CurrencyListQuery, CurrencyListQueryVariables>(CurrencyListDocument, options);
      }
export function useCurrencyListLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<CurrencyListQuery, CurrencyListQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<CurrencyListQuery, CurrencyListQueryVariables>(CurrencyListDocument, options);
        }
export type CurrencyListQueryHookResult = ReturnType<typeof useCurrencyListQuery>;
export type CurrencyListLazyQueryHookResult = ReturnType<typeof useCurrencyListLazyQuery>;
export type CurrencyListQueryResult = Apollo.QueryResult<CurrencyListQuery, CurrencyListQueryVariables>;
export const RealtimePriceInitialDocument = gql`
    query realtimePriceInitial($currency: DisplayCurrency!) {
  realtimePrice(currency: $currency) {
    timestamp
    btcSatPrice {
      base
      offset
    }
    usdCentPrice {
      base
      offset
    }
    denominatorCurrency
  }
}
    `;

/**
 * __useRealtimePriceInitialQuery__
 *
 * To run a query within a React component, call `useRealtimePriceInitialQuery` and pass it any options that fit your needs.
 * When your component renders, `useRealtimePriceInitialQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useRealtimePriceInitialQuery({
 *   variables: {
 *      currency: // value for 'currency'
 *   },
 * });
 */
export function useRealtimePriceInitialQuery(baseOptions: Apollo.QueryHookOptions<RealtimePriceInitialQuery, RealtimePriceInitialQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<RealtimePriceInitialQuery, RealtimePriceInitialQueryVariables>(RealtimePriceInitialDocument, options);
      }
export function useRealtimePriceInitialLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<RealtimePriceInitialQuery, RealtimePriceInitialQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<RealtimePriceInitialQuery, RealtimePriceInitialQueryVariables>(RealtimePriceInitialDocument, options);
        }
export type RealtimePriceInitialQueryHookResult = ReturnType<typeof useRealtimePriceInitialQuery>;
export type RealtimePriceInitialLazyQueryHookResult = ReturnType<typeof useRealtimePriceInitialLazyQuery>;
export type RealtimePriceInitialQueryResult = Apollo.QueryResult<RealtimePriceInitialQuery, RealtimePriceInitialQueryVariables>;
export const GetOnChainPaymentFeesDocument = gql`
    query GetOnChainPaymentFees($getOnChainPaymentFeesId: ID!, $btcWalletAddress: String!) {
  getOnChainPaymentFees(
    id: $getOnChainPaymentFeesId
    btc_wallet_address: $btcWalletAddress
  ) {
    fees
  }
}
    `;

/**
 * __useGetOnChainPaymentFeesQuery__
 *
 * To run a query within a React component, call `useGetOnChainPaymentFeesQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetOnChainPaymentFeesQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetOnChainPaymentFeesQuery({
 *   variables: {
 *      getOnChainPaymentFeesId: // value for 'getOnChainPaymentFeesId'
 *      btcWalletAddress: // value for 'btcWalletAddress'
 *   },
 * });
 */
export function useGetOnChainPaymentFeesQuery(baseOptions: Apollo.QueryHookOptions<GetOnChainPaymentFeesQuery, GetOnChainPaymentFeesQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<GetOnChainPaymentFeesQuery, GetOnChainPaymentFeesQueryVariables>(GetOnChainPaymentFeesDocument, options);
      }
export function useGetOnChainPaymentFeesLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<GetOnChainPaymentFeesQuery, GetOnChainPaymentFeesQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<GetOnChainPaymentFeesQuery, GetOnChainPaymentFeesQueryVariables>(GetOnChainPaymentFeesDocument, options);
        }
export type GetOnChainPaymentFeesQueryHookResult = ReturnType<typeof useGetOnChainPaymentFeesQuery>;
export type GetOnChainPaymentFeesLazyQueryHookResult = ReturnType<typeof useGetOnChainPaymentFeesLazyQuery>;
export type GetOnChainPaymentFeesQueryResult = Apollo.QueryResult<GetOnChainPaymentFeesQuery, GetOnChainPaymentFeesQueryVariables>;
export const GetWithdrawLinkBySecretDocument = gql`
    query GetWithdrawLinkBySecret($secret_code: String!) {
  getWithdrawLink(secret_code: $secret_code) {
    id
  }
}
    `;

/**
 * __useGetWithdrawLinkBySecretQuery__
 *
 * To run a query within a React component, call `useGetWithdrawLinkBySecretQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetWithdrawLinkBySecretQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetWithdrawLinkBySecretQuery({
 *   variables: {
 *      secret_code: // value for 'secret_code'
 *   },
 * });
 */
export function useGetWithdrawLinkBySecretQuery(baseOptions: Apollo.QueryHookOptions<GetWithdrawLinkBySecretQuery, GetWithdrawLinkBySecretQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<GetWithdrawLinkBySecretQuery, GetWithdrawLinkBySecretQueryVariables>(GetWithdrawLinkBySecretDocument, options);
      }
export function useGetWithdrawLinkBySecretLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<GetWithdrawLinkBySecretQuery, GetWithdrawLinkBySecretQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<GetWithdrawLinkBySecretQuery, GetWithdrawLinkBySecretQueryVariables>(GetWithdrawLinkBySecretDocument, options);
        }
export type GetWithdrawLinkBySecretQueryHookResult = ReturnType<typeof useGetWithdrawLinkBySecretQuery>;
export type GetWithdrawLinkBySecretLazyQueryHookResult = ReturnType<typeof useGetWithdrawLinkBySecretLazyQuery>;
export type GetWithdrawLinkBySecretQueryResult = Apollo.QueryResult<GetWithdrawLinkBySecretQuery, GetWithdrawLinkBySecretQueryVariables>;
export const LnInvoicePaymentStatusDocument = gql`
    subscription LnInvoicePaymentStatus($payment_request: LnPaymentRequest!) {
  lnInvoicePaymentStatus(input: {paymentRequest: $payment_request}) {
    status
    errors {
      message
      path
      code
    }
  }
}
    `;

/**
 * __useLnInvoicePaymentStatusSubscription__
 *
 * To run a query within a React component, call `useLnInvoicePaymentStatusSubscription` and pass it any options that fit your needs.
 * When your component renders, `useLnInvoicePaymentStatusSubscription` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the subscription, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useLnInvoicePaymentStatusSubscription({
 *   variables: {
 *      payment_request: // value for 'payment_request'
 *   },
 * });
 */
export function useLnInvoicePaymentStatusSubscription(baseOptions: Apollo.SubscriptionHookOptions<LnInvoicePaymentStatusSubscription, LnInvoicePaymentStatusSubscriptionVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useSubscription<LnInvoicePaymentStatusSubscription, LnInvoicePaymentStatusSubscriptionVariables>(LnInvoicePaymentStatusDocument, options);
      }
export type LnInvoicePaymentStatusSubscriptionHookResult = ReturnType<typeof useLnInvoicePaymentStatusSubscription>;
export type LnInvoicePaymentStatusSubscriptionResult = Apollo.SubscriptionResult<LnInvoicePaymentStatusSubscription>;
export const RealtimePriceWsDocument = gql`
    subscription realtimePriceWs($currency: DisplayCurrency!) {
  realtimePrice(input: {currency: $currency}) {
    errors {
      message
    }
    realtimePrice {
      timestamp
      btcSatPrice {
        base
        offset
      }
      usdCentPrice {
        base
        offset
      }
      denominatorCurrency
    }
  }
}
    `;

/**
 * __useRealtimePriceWsSubscription__
 *
 * To run a query within a React component, call `useRealtimePriceWsSubscription` and pass it any options that fit your needs.
 * When your component renders, `useRealtimePriceWsSubscription` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the subscription, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useRealtimePriceWsSubscription({
 *   variables: {
 *      currency: // value for 'currency'
 *   },
 * });
 */
export function useRealtimePriceWsSubscription(baseOptions: Apollo.SubscriptionHookOptions<RealtimePriceWsSubscription, RealtimePriceWsSubscriptionVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useSubscription<RealtimePriceWsSubscription, RealtimePriceWsSubscriptionVariables>(RealtimePriceWsDocument, options);
      }
export type RealtimePriceWsSubscriptionHookResult = ReturnType<typeof useRealtimePriceWsSubscription>;
export type RealtimePriceWsSubscriptionResult = Apollo.SubscriptionResult<RealtimePriceWsSubscription>;
export const PriceDocument = gql`
    subscription price($amount: SatAmount!, $amountCurrencyUnit: ExchangeCurrencyUnit!, $priceCurrencyUnit: ExchangeCurrencyUnit!) {
  price(
    input: {amount: $amount, amountCurrencyUnit: $amountCurrencyUnit, priceCurrencyUnit: $priceCurrencyUnit}
  ) {
    errors {
      message
    }
    price {
      base
      offset
      currencyUnit
      formattedAmount
    }
  }
}
    `;

/**
 * __usePriceSubscription__
 *
 * To run a query within a React component, call `usePriceSubscription` and pass it any options that fit your needs.
 * When your component renders, `usePriceSubscription` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the subscription, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = usePriceSubscription({
 *   variables: {
 *      amount: // value for 'amount'
 *      amountCurrencyUnit: // value for 'amountCurrencyUnit'
 *      priceCurrencyUnit: // value for 'priceCurrencyUnit'
 *   },
 * });
 */
export function usePriceSubscription(baseOptions: Apollo.SubscriptionHookOptions<PriceSubscription, PriceSubscriptionVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useSubscription<PriceSubscription, PriceSubscriptionVariables>(PriceDocument, options);
      }
export type PriceSubscriptionHookResult = ReturnType<typeof usePriceSubscription>;
export type PriceSubscriptionResult = Apollo.SubscriptionResult<PriceSubscription>;