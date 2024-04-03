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
  ID: { input: string; output: string; }
  String: { input: string; output: string; }
  Boolean: { input: boolean; output: boolean; }
  Int: { input: number; output: number; }
  Float: { input: number; output: number; }
  /** An Opaque Bearer token */
  AuthToken: { input: any; output: any; }
  /** (Positive) Cent amount (1/100 of a dollar) */
  CentAmount: { input: any; output: any; }
  /** An alias name that a user can set for a wallet (with which they have transactions) */
  ContactAlias: { input: any; output: any; }
  /** A CCA2 country code (ex US, FR, etc) */
  CountryCode: { input: any; output: any; }
  /** Display currency of an account */
  DisplayCurrency: { input: any; output: any; }
  /** Email address */
  EmailAddress: { input: any; output: any; }
  /** An id to be passed between registrationInitiate and registrationValidate for confirming email */
  EmailRegistrationId: { input: any; output: any; }
  EndpointId: { input: any; output: any; }
  /** Url that will be fetched on events for the account */
  EndpointUrl: { input: any; output: any; }
  /** Feedback shared with our user */
  Feedback: { input: any; output: any; }
  /** Hex-encoded string of 32 bytes */
  Hex32Bytes: { input: any; output: any; }
  Language: { input: any; output: any; }
  LeaderboardName: { input: any; output: any; }
  LnPaymentPreImage: { input: any; output: any; }
  /** BOLT11 lightning invoice payment request with the amount included */
  LnPaymentRequest: { input: any; output: any; }
  LnPaymentSecret: { input: any; output: any; }
  /** Text field in a lightning payment transaction */
  Memo: { input: any; output: any; }
  /** (Positive) amount of minutes */
  Minutes: { input: any; output: any; }
  NotificationCategory: { input: any; output: any; }
  /** An address for an on-chain bitcoin destination */
  OnChainAddress: { input: any; output: any; }
  OnChainTxHash: { input: any; output: any; }
  /** An authentication code valid for a single use */
  OneTimeAuthCode: { input: any; output: any; }
  PaymentHash: { input: any; output: any; }
  /** Phone number which includes country code */
  Phone: { input: any; output: any; }
  /** Non-fractional signed whole numeric value between -(2^53) + 1 and 2^53 - 1 */
  SafeInt: { input: any; output: any; }
  /** (Positive) Satoshi amount */
  SatAmount: { input: any; output: any; }
  /** (Positive) amount of seconds */
  Seconds: { input: any; output: any; }
  /** An amount (of a currency) that can be negative (e.g. in a transaction) */
  SignedAmount: { input: any; output: any; }
  /** A string amount (of a currency) that can be negative (e.g. in a transaction) */
  SignedDisplayMajorAmount: { input: any; output: any; }
  /** Timestamp field, serialized as Unix time (the number of seconds since the Unix epoch) */
  Timestamp: { input: any; output: any; }
  /** A time-based one-time password */
  TotpCode: { input: any; output: any; }
  /** An id to be passed between set and verify for confirming totp */
  TotpRegistrationId: { input: any; output: any; }
  /** A secret to generate time-based one-time password */
  TotpSecret: { input: any; output: any; }
  /** Unique identifier of a user */
  Username: { input: any; output: any; }
  /** Unique identifier of a wallet */
  WalletId: { input: any; output: any; }
};

export type Account = {
  callbackEndpoints: Array<CallbackEndpoint>;
  csvTransactions: Scalars['String']['output'];
  defaultWallet: PublicWallet;
  /** @deprecated Shifting property to 'defaultWallet.id' */
  defaultWalletId: Scalars['WalletId']['output'];
  displayCurrency: Scalars['DisplayCurrency']['output'];
  id: Scalars['ID']['output'];
  invoices?: Maybe<InvoiceConnection>;
  level: AccountLevel;
  limits: AccountLimits;
  notificationSettings: NotificationSettings;
  pendingIncomingTransactions: Array<Transaction>;
  realtimePrice: RealtimePrice;
  transactions?: Maybe<TransactionConnection>;
  walletById: Wallet;
  wallets: Array<Wallet>;
};


export type AccountCsvTransactionsArgs = {
  walletIds: Array<Scalars['WalletId']['input']>;
};


export type AccountInvoicesArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  walletIds?: InputMaybe<Array<InputMaybe<Scalars['WalletId']['input']>>>;
};


export type AccountPendingIncomingTransactionsArgs = {
  walletIds?: InputMaybe<Array<InputMaybe<Scalars['WalletId']['input']>>>;
};


export type AccountTransactionsArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  walletIds?: InputMaybe<Array<InputMaybe<Scalars['WalletId']['input']>>>;
};


export type AccountWalletByIdArgs = {
  walletId: Scalars['WalletId']['input'];
};

export type AccountDeletePayload = {
  __typename?: 'AccountDeletePayload';
  errors: Array<Error>;
  success: Scalars['Boolean']['output'];
};

export type AccountDisableNotificationCategoryInput = {
  category: Scalars['NotificationCategory']['input'];
  channel?: InputMaybe<NotificationChannel>;
};

export type AccountDisableNotificationChannelInput = {
  channel: NotificationChannel;
};

export type AccountEnableNotificationCategoryInput = {
  category: Scalars['NotificationCategory']['input'];
  channel?: InputMaybe<NotificationChannel>;
};

export type AccountEnableNotificationChannelInput = {
  channel: NotificationChannel;
};

export enum AccountLevel {
  One = 'ONE',
  Two = 'TWO',
  Zero = 'ZERO'
}

export type AccountLimit = {
  /** The rolling time interval in seconds that the limits would apply for. */
  interval?: Maybe<Scalars['Seconds']['output']>;
  /** The amount of cents remaining below the limit for the current 24 hour period. */
  remainingLimit?: Maybe<Scalars['CentAmount']['output']>;
  /** The current maximum limit for a given 24 hour period. */
  totalLimit: Scalars['CentAmount']['output'];
};

export type AccountLimits = {
  __typename?: 'AccountLimits';
  /** Limits for converting between currencies among a account's own wallets. */
  convert: Array<AccountLimit>;
  /** Limits for sending to other internal accounts. */
  internalSend: Array<AccountLimit>;
  /** Limits for withdrawing to external onchain or lightning destinations. */
  withdrawal: Array<AccountLimit>;
};

export type AccountUpdateDefaultWalletIdInput = {
  walletId: Scalars['WalletId']['input'];
};

export type AccountUpdateDefaultWalletIdPayload = {
  __typename?: 'AccountUpdateDefaultWalletIdPayload';
  account?: Maybe<ConsumerAccount>;
  errors: Array<Error>;
};

export type AccountUpdateDisplayCurrencyInput = {
  currency: Scalars['DisplayCurrency']['input'];
};

export type AccountUpdateDisplayCurrencyPayload = {
  __typename?: 'AccountUpdateDisplayCurrencyPayload';
  account?: Maybe<ConsumerAccount>;
  errors: Array<Error>;
};

export type AccountUpdateNotificationSettingsPayload = {
  __typename?: 'AccountUpdateNotificationSettingsPayload';
  account?: Maybe<ConsumerAccount>;
  errors: Array<Error>;
};

export type ApiKey = {
  __typename?: 'ApiKey';
  createdAt: Scalars['Timestamp']['output'];
  expired: Scalars['Boolean']['output'];
  expiresAt?: Maybe<Scalars['Timestamp']['output']>;
  id: Scalars['ID']['output'];
  lastUsedAt?: Maybe<Scalars['Timestamp']['output']>;
  name: Scalars['String']['output'];
  readOnly: Scalars['Boolean']['output'];
  revoked: Scalars['Boolean']['output'];
  scopes: Array<Scope>;
};

export type ApiKeyCreateInput = {
  expireInDays?: InputMaybe<Scalars['Int']['input']>;
  name: Scalars['String']['input'];
  scopes?: Array<Scope>;
};

export type ApiKeyCreatePayload = {
  __typename?: 'ApiKeyCreatePayload';
  apiKey: ApiKey;
  apiKeySecret: Scalars['String']['output'];
};

export type ApiKeyRevokeInput = {
  id: Scalars['ID']['input'];
};

export type ApiKeyRevokePayload = {
  __typename?: 'ApiKeyRevokePayload';
  apiKey: ApiKey;
};

export type AuthTokenPayload = {
  __typename?: 'AuthTokenPayload';
  authToken?: Maybe<Scalars['AuthToken']['output']>;
  errors: Array<Error>;
  totpRequired?: Maybe<Scalars['Boolean']['output']>;
};

export type Authorization = {
  __typename?: 'Authorization';
  scopes: Array<Scope>;
};

/** A wallet belonging to an account which contains a BTC balance and a list of transactions. */
export type BtcWallet = Wallet & {
  __typename?: 'BTCWallet';
  accountId: Scalars['ID']['output'];
  /** A balance stored in BTC. */
  balance: Scalars['SignedAmount']['output'];
  id: Scalars['ID']['output'];
  invoiceByPaymentHash: Invoice;
  /** A list of all invoices associated with walletIds optionally passed. */
  invoices?: Maybe<InvoiceConnection>;
  /** An unconfirmed incoming onchain balance. */
  pendingIncomingBalance: Scalars['SignedAmount']['output'];
  pendingIncomingTransactions: Array<Transaction>;
  pendingIncomingTransactionsByAddress: Array<Transaction>;
  transactionById: Transaction;
  /** A list of BTC transactions associated with this wallet. */
  transactions?: Maybe<TransactionConnection>;
  transactionsByAddress?: Maybe<TransactionConnection>;
  transactionsByPaymentHash: Array<Transaction>;
  transactionsByPaymentRequest: Array<Transaction>;
  walletCurrency: WalletCurrency;
};


/** A wallet belonging to an account which contains a BTC balance and a list of transactions. */
export type BtcWalletInvoiceByPaymentHashArgs = {
  paymentHash: Scalars['PaymentHash']['input'];
};


/** A wallet belonging to an account which contains a BTC balance and a list of transactions. */
export type BtcWalletInvoicesArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
};


/** A wallet belonging to an account which contains a BTC balance and a list of transactions. */
export type BtcWalletPendingIncomingTransactionsByAddressArgs = {
  address: Scalars['OnChainAddress']['input'];
};


/** A wallet belonging to an account which contains a BTC balance and a list of transactions. */
export type BtcWalletTransactionByIdArgs = {
  transactionId: Scalars['ID']['input'];
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


/** A wallet belonging to an account which contains a BTC balance and a list of transactions. */
export type BtcWalletTransactionsByPaymentHashArgs = {
  paymentHash: Scalars['PaymentHash']['input'];
};


/** A wallet belonging to an account which contains a BTC balance and a list of transactions. */
export type BtcWalletTransactionsByPaymentRequestArgs = {
  paymentRequest: Scalars['LnPaymentRequest']['input'];
};

export type BuildInformation = {
  __typename?: 'BuildInformation';
  commitHash?: Maybe<Scalars['String']['output']>;
  helmRevision?: Maybe<Scalars['Int']['output']>;
};

export type CallbackEndpoint = {
  __typename?: 'CallbackEndpoint';
  id: Scalars['EndpointId']['output'];
  url: Scalars['EndpointUrl']['output'];
};

export type CallbackEndpointAddInput = {
  /** callback endpoint to be called */
  url: Scalars['EndpointUrl']['input'];
};

export type CallbackEndpointAddPayload = {
  __typename?: 'CallbackEndpointAddPayload';
  errors: Array<Error>;
  id?: Maybe<Scalars['EndpointId']['output']>;
};

export type CallbackEndpointDeleteInput = {
  id: Scalars['EndpointId']['input'];
};

export type CaptchaCreateChallengePayload = {
  __typename?: 'CaptchaCreateChallengePayload';
  errors: Array<Error>;
  result?: Maybe<CaptchaCreateChallengeResult>;
};

export type CaptchaCreateChallengeResult = {
  __typename?: 'CaptchaCreateChallengeResult';
  challengeCode: Scalars['String']['output'];
  failbackMode: Scalars['Boolean']['output'];
  id: Scalars['String']['output'];
  newCaptcha: Scalars['Boolean']['output'];
};

export type CaptchaRequestAuthCodeInput = {
  challengeCode: Scalars['String']['input'];
  channel?: InputMaybe<PhoneCodeChannelType>;
  phone: Scalars['Phone']['input'];
  secCode: Scalars['String']['input'];
  validationCode: Scalars['String']['input'];
};

export type CentAmountPayload = {
  __typename?: 'CentAmountPayload';
  amount?: Maybe<Scalars['CentAmount']['output']>;
  errors: Array<Error>;
};

export type ConsumerAccount = Account & {
  __typename?: 'ConsumerAccount';
  callbackEndpoints: Array<CallbackEndpoint>;
  /** return CSV stream, base64 encoded, of the list of transactions in the wallet */
  csvTransactions: Scalars['String']['output'];
  defaultWallet: PublicWallet;
  defaultWalletId: Scalars['WalletId']['output'];
  displayCurrency: Scalars['DisplayCurrency']['output'];
  firstName?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  /** A list of all invoices associated with walletIds optionally passed. */
  invoices?: Maybe<InvoiceConnection>;
  lastName?: Maybe<Scalars['String']['output']>;
  level: AccountLevel;
  limits: AccountLimits;
  notificationSettings: NotificationSettings;
  onboardingStatus?: Maybe<OnboardingStatus>;
  pendingIncomingTransactions: Array<Transaction>;
  /** List the quiz questions of the consumer account */
  quiz: Array<Quiz>;
  realtimePrice: RealtimePrice;
  /** A list of all transactions associated with walletIds optionally passed. */
  transactions?: Maybe<TransactionConnection>;
  walletById: Wallet;
  wallets: Array<Wallet>;
  welcomeProfile?: Maybe<WelcomeProfile>;
};


export type ConsumerAccountCsvTransactionsArgs = {
  walletIds: Array<Scalars['WalletId']['input']>;
};


export type ConsumerAccountInvoicesArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  walletIds?: InputMaybe<Array<InputMaybe<Scalars['WalletId']['input']>>>;
};


export type ConsumerAccountPendingIncomingTransactionsArgs = {
  walletIds?: InputMaybe<Array<InputMaybe<Scalars['WalletId']['input']>>>;
};


export type ConsumerAccountTransactionsArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  walletIds?: InputMaybe<Array<InputMaybe<Scalars['WalletId']['input']>>>;
};


export type ConsumerAccountWalletByIdArgs = {
  walletId: Scalars['WalletId']['input'];
};

export type Coordinates = {
  __typename?: 'Coordinates';
  latitude: Scalars['Float']['output'];
  longitude: Scalars['Float']['output'];
};

export type Country = {
  __typename?: 'Country';
  id: Scalars['CountryCode']['output'];
  supportedAuthChannels: Array<PhoneCodeChannelType>;
};

export type CreateWithdrawLinkInput = {
  accountType: Scalars['String']['input'];
  commissionPercentage?: InputMaybe<Scalars['Float']['input']>;
  escrowWallet: Scalars['String']['input'];
  id?: InputMaybe<Scalars['ID']['input']>;
  k1?: InputMaybe<Scalars['String']['input']>;
  paymentHash: Scalars['String']['input'];
  paymentRequest: Scalars['String']['input'];
  paymentSecret: Scalars['String']['input'];
  salesAmount: Scalars['Float']['input'];
  status?: InputMaybe<Status>;
  title: Scalars['String']['input'];
  uniqueHash: Scalars['String']['input'];
  userId: Scalars['ID']['input'];
  voucherAmount: Scalars['Float']['input'];
};

export type Currency = {
  __typename?: 'Currency';
  flag: Scalars['String']['output'];
  fractionDigits: Scalars['Int']['output'];
  id: Scalars['ID']['output'];
  name: Scalars['String']['output'];
  symbol: Scalars['String']['output'];
};

export type DepositFeesInformation = {
  __typename?: 'DepositFeesInformation';
  minBankFee: Scalars['String']['output'];
  /** below this amount minBankFee will be charged */
  minBankFeeThreshold: Scalars['String']['output'];
  /** ratio to charge as basis points above minBankFeeThreshold amount */
  ratio: Scalars['String']['output'];
};

export type DeviceNotificationTokenCreateInput = {
  deviceToken: Scalars['String']['input'];
};

export type Email = {
  __typename?: 'Email';
  address?: Maybe<Scalars['EmailAddress']['output']>;
  verified?: Maybe<Scalars['Boolean']['output']>;
};

export type Error = {
  code?: Maybe<Scalars['String']['output']>;
  message: Scalars['String']['output'];
  path?: Maybe<Array<Maybe<Scalars['String']['output']>>>;
};

export enum ExchangeCurrencyUnit {
  Btcsat = 'BTCSAT',
  Usdcent = 'USDCENT'
}

export type FeedbackSubmitInput = {
  feedback: Scalars['Feedback']['input'];
};

export type FeesInformation = {
  __typename?: 'FeesInformation';
  deposit: DepositFeesInformation;
};

export type FeesResult = {
  __typename?: 'FeesResult';
  fees: Scalars['Float']['output'];
};

/** Provides global settings for the application which might have an impact for the user. */
export type Globals = {
  __typename?: 'Globals';
  buildInformation: BuildInformation;
  feesInformation: FeesInformation;
  /** The domain name for lightning addresses accepted by this Galoy instance */
  lightningAddressDomain: Scalars['String']['output'];
  lightningAddressDomainAliases: Array<Scalars['String']['output']>;
  /** Which network (mainnet, testnet, regtest, signet) this instance is running on. */
  network: Network;
  /**
   * A list of public keys for the running lightning nodes.
   * This can be used to know if an invoice belongs to one of our nodes.
   */
  nodesIds: Array<Scalars['String']['output']>;
  /** A list of countries and their supported auth channels */
  supportedCountries: Array<Country>;
};

export type GraphQlApplicationError = Error & {
  __typename?: 'GraphQLApplicationError';
  code?: Maybe<Scalars['String']['output']>;
  message: Scalars['String']['output'];
  path?: Maybe<Array<Maybe<Scalars['String']['output']>>>;
};

export type InitiationVia = InitiationViaIntraLedger | InitiationViaLn | InitiationViaOnChain;

export type InitiationViaIntraLedger = {
  __typename?: 'InitiationViaIntraLedger';
  counterPartyUsername?: Maybe<Scalars['Username']['output']>;
  counterPartyWalletId?: Maybe<Scalars['WalletId']['output']>;
};

export type InitiationViaLn = {
  __typename?: 'InitiationViaLn';
  paymentHash: Scalars['PaymentHash']['output'];
  /** Bolt11 invoice */
  paymentRequest: Scalars['LnPaymentRequest']['output'];
};

export type InitiationViaOnChain = {
  __typename?: 'InitiationViaOnChain';
  address: Scalars['OnChainAddress']['output'];
};

export type IntraLedgerPaymentSendInput = {
  /** Amount in satoshis. */
  amount: Scalars['SatAmount']['input'];
  /** Optional memo to be attached to the payment. */
  memo?: InputMaybe<Scalars['Memo']['input']>;
  recipientWalletId: Scalars['WalletId']['input'];
  /** The wallet ID of the sender. */
  walletId: Scalars['WalletId']['input'];
};

export type IntraLedgerUpdate = {
  __typename?: 'IntraLedgerUpdate';
  /** @deprecated Deprecated in favor of transaction */
  amount: Scalars['SatAmount']['output'];
  /** @deprecated Deprecated in favor of transaction */
  displayCurrencyPerSat: Scalars['Float']['output'];
  transaction: Transaction;
  txNotificationType: TxNotificationType;
  /** @deprecated updated over displayCurrencyPerSat */
  usdPerSat: Scalars['Float']['output'];
  /** @deprecated Deprecated in favor of transaction */
  walletId: Scalars['WalletId']['output'];
};

export type IntraLedgerUsdPaymentSendInput = {
  /** Amount in cents. */
  amount: Scalars['CentAmount']['input'];
  /** Optional memo to be attached to the payment. */
  memo?: InputMaybe<Scalars['Memo']['input']>;
  recipientWalletId: Scalars['WalletId']['input'];
  /** The wallet ID of the sender. */
  walletId: Scalars['WalletId']['input'];
};

/** A lightning invoice. */
export type Invoice = {
  createdAt: Scalars['Timestamp']['output'];
  /** The payment hash of the lightning invoice. */
  paymentHash: Scalars['PaymentHash']['output'];
  /** The bolt11 invoice to be paid. */
  paymentRequest: Scalars['LnPaymentRequest']['output'];
  /** The payment secret of the lightning invoice. This is not the preimage of the payment hash. */
  paymentSecret: Scalars['LnPaymentSecret']['output'];
  /** The payment status of the invoice. */
  paymentStatus: InvoicePaymentStatus;
};

/** A connection to a list of items. */
export type InvoiceConnection = {
  __typename?: 'InvoiceConnection';
  /** A list of edges. */
  edges?: Maybe<Array<InvoiceEdge>>;
  /** Information to aid in pagination. */
  pageInfo: PageInfo;
};

/** An edge in a connection. */
export type InvoiceEdge = {
  __typename?: 'InvoiceEdge';
  /** A cursor for use in pagination */
  cursor: Scalars['String']['output'];
  /** The item at the end of the edge */
  node: Invoice;
};

export enum InvoicePaymentStatus {
  Expired = 'EXPIRED',
  Paid = 'PAID',
  Pending = 'PENDING'
}

export type Leader = {
  __typename?: 'Leader';
  name?: Maybe<Scalars['LeaderboardName']['output']>;
  points: Scalars['Int']['output'];
  rank: Scalars['Int']['output'];
};

export type Leaderboard = {
  __typename?: 'Leaderboard';
  leaders: Array<Leader>;
  range: WelcomeRange;
};

export type LnAddressPaymentSendInput = {
  /** Amount in satoshis. */
  amount: Scalars['SatAmount']['input'];
  /** Lightning address to send to. */
  lnAddress: Scalars['String']['input'];
  /** Wallet ID to send bitcoin from. */
  walletId: Scalars['WalletId']['input'];
};

export type LnInvoice = Invoice & {
  __typename?: 'LnInvoice';
  createdAt: Scalars['Timestamp']['output'];
  paymentHash: Scalars['PaymentHash']['output'];
  paymentRequest: Scalars['LnPaymentRequest']['output'];
  paymentSecret: Scalars['LnPaymentSecret']['output'];
  paymentStatus: InvoicePaymentStatus;
  satoshis: Scalars['SatAmount']['output'];
};

export type LnInvoiceCancelInput = {
  paymentHash: Scalars['PaymentHash']['input'];
  /** Wallet ID for a wallet associated with the current account. */
  walletId: Scalars['WalletId']['input'];
};

export type LnInvoiceCreateInput = {
  /** Amount in satoshis. */
  amount: Scalars['SatAmount']['input'];
  /** Optional invoice expiration time in minutes. */
  expiresIn?: InputMaybe<Scalars['Minutes']['input']>;
  /** Optional memo for the lightning invoice. */
  memo?: InputMaybe<Scalars['Memo']['input']>;
  /** Wallet ID for a BTC wallet belonging to the current account. */
  walletId: Scalars['WalletId']['input'];
};

export type LnInvoiceCreateOnBehalfOfRecipientInput = {
  /** Amount in satoshis. */
  amount: Scalars['SatAmount']['input'];
  descriptionHash?: InputMaybe<Scalars['Hex32Bytes']['input']>;
  /** Optional invoice expiration time in minutes. */
  expiresIn?: InputMaybe<Scalars['Minutes']['input']>;
  /** Optional memo for the lightning invoice. */
  memo?: InputMaybe<Scalars['Memo']['input']>;
  /** Wallet ID for a BTC wallet which belongs to any account. */
  recipientWalletId: Scalars['WalletId']['input'];
};

export type LnInvoiceFeeProbeInput = {
  paymentRequest: Scalars['LnPaymentRequest']['input'];
  walletId: Scalars['WalletId']['input'];
};

export type LnInvoicePayload = {
  __typename?: 'LnInvoicePayload';
  errors: Array<Error>;
  invoice?: Maybe<LnInvoice>;
};

export type LnInvoicePaymentInput = {
  /** Optional memo to associate with the lightning invoice. */
  memo?: InputMaybe<Scalars['Memo']['input']>;
  /** Payment request representing the invoice which is being paid. */
  paymentRequest: Scalars['LnPaymentRequest']['input'];
  /** Wallet ID with sufficient balance to cover amount of invoice.  Must belong to the account of the current user. */
  walletId: Scalars['WalletId']['input'];
};

export type LnInvoicePaymentStatus = {
  __typename?: 'LnInvoicePaymentStatus';
  paymentHash?: Maybe<Scalars['PaymentHash']['output']>;
  paymentRequest?: Maybe<Scalars['LnPaymentRequest']['output']>;
  status?: Maybe<InvoicePaymentStatus>;
};

export type LnInvoicePaymentStatusByHashInput = {
  paymentHash: Scalars['PaymentHash']['input'];
};

export type LnInvoicePaymentStatusByPaymentRequestInput = {
  paymentRequest: Scalars['LnPaymentRequest']['input'];
};

export type LnInvoicePaymentStatusInput = {
  paymentRequest: Scalars['LnPaymentRequest']['input'];
};

export type LnInvoicePaymentStatusPayload = {
  __typename?: 'LnInvoicePaymentStatusPayload';
  errors: Array<Error>;
  paymentHash?: Maybe<Scalars['PaymentHash']['output']>;
  paymentRequest?: Maybe<Scalars['LnPaymentRequest']['output']>;
  status?: Maybe<InvoicePaymentStatus>;
};

export type LnNoAmountInvoice = Invoice & {
  __typename?: 'LnNoAmountInvoice';
  createdAt: Scalars['Timestamp']['output'];
  paymentHash: Scalars['PaymentHash']['output'];
  paymentRequest: Scalars['LnPaymentRequest']['output'];
  paymentSecret: Scalars['LnPaymentSecret']['output'];
  paymentStatus: InvoicePaymentStatus;
};

export type LnNoAmountInvoiceCreateInput = {
  /** Optional invoice expiration time in minutes. */
  expiresIn?: InputMaybe<Scalars['Minutes']['input']>;
  /** Optional memo for the lightning invoice. */
  memo?: InputMaybe<Scalars['Memo']['input']>;
  /** ID for either a USD or BTC wallet belonging to the account of the current user. */
  walletId: Scalars['WalletId']['input'];
};

export type LnNoAmountInvoiceCreateOnBehalfOfRecipientInput = {
  /** Optional invoice expiration time in minutes. */
  expiresIn?: InputMaybe<Scalars['Minutes']['input']>;
  /** Optional memo for the lightning invoice. */
  memo?: InputMaybe<Scalars['Memo']['input']>;
  /** ID for either a USD or BTC wallet which belongs to the account of any user. */
  recipientWalletId: Scalars['WalletId']['input'];
};

export type LnNoAmountInvoiceFeeProbeInput = {
  amount: Scalars['SatAmount']['input'];
  paymentRequest: Scalars['LnPaymentRequest']['input'];
  walletId: Scalars['WalletId']['input'];
};

export type LnNoAmountInvoicePayload = {
  __typename?: 'LnNoAmountInvoicePayload';
  errors: Array<Error>;
  invoice?: Maybe<LnNoAmountInvoice>;
};

export type LnNoAmountInvoicePaymentInput = {
  /** Amount to pay in satoshis. */
  amount: Scalars['SatAmount']['input'];
  /** Optional memo to associate with the lightning invoice. */
  memo?: InputMaybe<Scalars['Memo']['input']>;
  /** Payment request representing the invoice which is being paid. */
  paymentRequest: Scalars['LnPaymentRequest']['input'];
  /** Wallet ID with sufficient balance to cover amount defined in mutation request.  Must belong to the account of the current user. */
  walletId: Scalars['WalletId']['input'];
};

export type LnNoAmountUsdInvoiceFeeProbeInput = {
  amount: Scalars['CentAmount']['input'];
  paymentRequest: Scalars['LnPaymentRequest']['input'];
  walletId: Scalars['WalletId']['input'];
};

export type LnNoAmountUsdInvoicePaymentInput = {
  /** Amount to pay in USD cents. */
  amount: Scalars['CentAmount']['input'];
  /** Optional memo to associate with the lightning invoice. */
  memo?: InputMaybe<Scalars['Memo']['input']>;
  /** Payment request representing the invoice which is being paid. */
  paymentRequest: Scalars['LnPaymentRequest']['input'];
  /** Wallet ID with sufficient balance to cover amount defined in mutation request.  Must belong to the account of the current user. */
  walletId: Scalars['WalletId']['input'];
};

export type LnUpdate = {
  __typename?: 'LnUpdate';
  /** @deprecated Deprecated in favor of transaction */
  paymentHash: Scalars['PaymentHash']['output'];
  status: InvoicePaymentStatus;
  transaction: Transaction;
  /** @deprecated Deprecated in favor of transaction */
  walletId: Scalars['WalletId']['output'];
};

export type LnUsdInvoiceBtcDenominatedCreateOnBehalfOfRecipientInput = {
  /** Amount in satoshis. */
  amount: Scalars['SatAmount']['input'];
  descriptionHash?: InputMaybe<Scalars['Hex32Bytes']['input']>;
  /** Optional invoice expiration time in minutes. */
  expiresIn?: InputMaybe<Scalars['Minutes']['input']>;
  /** Optional memo for the lightning invoice. Acts as a note to the recipient. */
  memo?: InputMaybe<Scalars['Memo']['input']>;
  /** Wallet ID for a USD wallet which belongs to the account of any user. */
  recipientWalletId: Scalars['WalletId']['input'];
};

export type LnUsdInvoiceCreateInput = {
  /** Amount in USD cents. */
  amount: Scalars['CentAmount']['input'];
  /** Optional invoice expiration time in minutes. */
  expiresIn?: InputMaybe<Scalars['Minutes']['input']>;
  /** Optional memo for the lightning invoice. */
  memo?: InputMaybe<Scalars['Memo']['input']>;
  /** Wallet ID for a USD wallet belonging to the current user. */
  walletId: Scalars['WalletId']['input'];
};

export type LnUsdInvoiceCreateOnBehalfOfRecipientInput = {
  /** Amount in USD cents. */
  amount: Scalars['CentAmount']['input'];
  descriptionHash?: InputMaybe<Scalars['Hex32Bytes']['input']>;
  /** Optional invoice expiration time in minutes. */
  expiresIn?: InputMaybe<Scalars['Minutes']['input']>;
  /** Optional memo for the lightning invoice. Acts as a note to the recipient. */
  memo?: InputMaybe<Scalars['Memo']['input']>;
  /** Wallet ID for a USD wallet which belongs to the account of any user. */
  recipientWalletId: Scalars['WalletId']['input'];
};

export type LnUsdInvoiceFeeProbeInput = {
  paymentRequest: Scalars['LnPaymentRequest']['input'];
  walletId: Scalars['WalletId']['input'];
};

export type LnurlPaymentSendInput = {
  /** Amount in satoshis. */
  amount: Scalars['SatAmount']['input'];
  /** Lnurl string to send to. */
  lnurl: Scalars['String']['input'];
  /** Wallet ID to send bitcoin from. */
  walletId: Scalars['WalletId']['input'];
};

export type MapInfo = {
  __typename?: 'MapInfo';
  coordinates: Coordinates;
  title: Scalars['String']['output'];
};

export type MapMarker = {
  __typename?: 'MapMarker';
  mapInfo: MapInfo;
  username: Scalars['Username']['output'];
};

export type Merchant = {
  __typename?: 'Merchant';
  /** GPS coordinates for the merchant that can be used to place the related business on a map */
  coordinates: Coordinates;
  createdAt: Scalars['Timestamp']['output'];
  id: Scalars['ID']['output'];
  title: Scalars['String']['output'];
  /** The username of the merchant */
  username: Scalars['Username']['output'];
  /** Whether the merchant has been validated */
  validated: Scalars['Boolean']['output'];
};

export type MerchantMapSuggestInput = {
  latitude: Scalars['Float']['input'];
  longitude: Scalars['Float']['input'];
  title: Scalars['String']['input'];
  username: Scalars['Username']['input'];
};

export type MerchantPayload = {
  __typename?: 'MerchantPayload';
  errors: Array<Error>;
  merchant?: Maybe<Merchant>;
};

export type MobileVersions = {
  __typename?: 'MobileVersions';
  currentSupported: Scalars['Int']['output'];
  minSupported: Scalars['Int']['output'];
  platform: Scalars['String']['output'];
};

export type Mutation = {
  __typename?: 'Mutation';
  accountDelete: AccountDeletePayload;
  accountDisableNotificationCategory: AccountUpdateNotificationSettingsPayload;
  accountDisableNotificationChannel: AccountUpdateNotificationSettingsPayload;
  accountEnableNotificationCategory: AccountUpdateNotificationSettingsPayload;
  accountEnableNotificationChannel: AccountUpdateNotificationSettingsPayload;
  accountUpdateDefaultWalletId: AccountUpdateDefaultWalletIdPayload;
  accountUpdateDisplayCurrency: AccountUpdateDisplayCurrencyPayload;
  apiKeyCreate: ApiKeyCreatePayload;
  apiKeyRevoke: ApiKeyRevokePayload;
  callbackEndpointAdd: CallbackEndpointAddPayload;
  callbackEndpointDelete: SuccessPayload;
  captchaCreateChallenge: CaptchaCreateChallengePayload;
  captchaRequestAuthCode: SuccessPayload;
  createWithdrawLink: WithdrawLink;
  deleteWithdrawLink: Scalars['ID']['output'];
  deviceNotificationTokenCreate: SuccessPayload;
  feedbackSubmit: SuccessPayload;
  /**
   * Actions a payment which is internal to the ledger e.g. it does
   * not use onchain/lightning. Returns payment status (success,
   * failed, pending, already_paid).
   */
  intraLedgerPaymentSend: PaymentSendPayload;
  /**
   * Actions a payment which is internal to the ledger e.g. it does
   * not use onchain/lightning. Returns payment status (success,
   * failed, pending, already_paid).
   */
  intraLedgerUsdPaymentSend: PaymentSendPayload;
  /** Sends a payment to a lightning address. */
  lnAddressPaymentSend: PaymentSendPayload;
  /** Cancel an unpaid lightning invoice for an associated wallet. */
  lnInvoiceCancel: SuccessPayload;
  /**
   * Returns a lightning invoice for an associated wallet.
   * When invoice is paid the value will be credited to a BTC wallet.
   * Expires after 'expiresIn' or 24 hours.
   */
  lnInvoiceCreate: LnInvoicePayload;
  /**
   * Returns a lightning invoice for an associated wallet.
   * When invoice is paid the value will be credited to a BTC wallet.
   * Expires after 'expiresIn' or 24 hours.
   */
  lnInvoiceCreateOnBehalfOfRecipient: LnInvoicePayload;
  lnInvoiceFeeProbe: SatAmountPayload;
  /**
   * Pay a lightning invoice using a balance from a wallet which is owned by the account of the current user.
   * Provided wallet can be USD or BTC and must have sufficient balance to cover amount in lightning invoice.
   * Returns payment status (success, failed, pending, already_paid).
   */
  lnInvoicePaymentSend: PaymentSendPayload;
  /**
   * Returns a lightning invoice for an associated wallet.
   * Can be used to receive any supported currency value (currently USD or BTC).
   * Expires after 'expiresIn' or 24 hours for BTC invoices or 5 minutes for USD invoices.
   */
  lnNoAmountInvoiceCreate: LnNoAmountInvoicePayload;
  /**
   * Returns a lightning invoice for an associated wallet.
   * Can be used to receive any supported currency value (currently USD or BTC).
   * Expires after 'expiresIn' or 24 hours for BTC invoices or 5 minutes for USD invoices.
   */
  lnNoAmountInvoiceCreateOnBehalfOfRecipient: LnNoAmountInvoicePayload;
  lnNoAmountInvoiceFeeProbe: SatAmountPayload;
  /**
   * Pay a lightning invoice using a balance from a wallet which is owned by the account of the current user.
   * Provided wallet must be BTC and must have sufficient balance to cover amount specified in mutation request.
   * Returns payment status (success, failed, pending, already_paid).
   */
  lnNoAmountInvoicePaymentSend: PaymentSendPayload;
  lnNoAmountUsdInvoiceFeeProbe: CentAmountPayload;
  /**
   * Pay a lightning invoice using a balance from a wallet which is owned by the account of the current user.
   * Provided wallet must be USD and have sufficient balance to cover amount specified in mutation request.
   * Returns payment status (success, failed, pending, already_paid).
   */
  lnNoAmountUsdInvoicePaymentSend: PaymentSendPayload;
  /**
   * Returns a lightning invoice denominated in satoshis for an associated wallet.
   * When invoice is paid the equivalent value at invoice creation will be credited to a USD wallet.
   * Expires after 'expiresIn' or 5 minutes (short expiry time because there is a USD/BTC exchange rate
   *   associated with the amount).
   */
  lnUsdInvoiceBtcDenominatedCreateOnBehalfOfRecipient: LnInvoicePayload;
  /**
   * Returns a lightning invoice denominated in satoshis for an associated wallet.
   * When invoice is paid the equivalent value at invoice creation will be credited to a USD wallet.
   * Expires after 'expiresIn' or 5 minutes (short expiry time because there is a USD/BTC exchange rate
   * associated with the amount).
   */
  lnUsdInvoiceCreate: LnInvoicePayload;
  /**
   * Returns a lightning invoice denominated in satoshis for an associated wallet.
   * When invoice is paid the equivalent value at invoice creation will be credited to a USD wallet.
   * Expires after 'expiresIn' or 5 minutes (short expiry time because there is a USD/BTC exchange rate
   *   associated with the amount).
   */
  lnUsdInvoiceCreateOnBehalfOfRecipient: LnInvoicePayload;
  lnUsdInvoiceFeeProbe: SatAmountPayload;
  /** Sends a payment to a lightning address. */
  lnurlPaymentSend: PaymentSendPayload;
  merchantMapSuggest: MerchantPayload;
  onChainAddressCreate: OnChainAddressPayload;
  onChainAddressCurrent: OnChainAddressPayload;
  onChainPaymentSend: PaymentSendPayload;
  onChainPaymentSendAll: PaymentSendPayload;
  onChainUsdPaymentSend: PaymentSendPayload;
  onChainUsdPaymentSendAsBtcDenominated: PaymentSendPayload;
  onboardingFlowStart: OnboardingFlowStartResult;
  quizClaim: QuizClaimPayload;
  sendPaymentOnChain: SendPaymentOnChainResult;
  supportChatMessageAdd: SupportChatMessageAddPayload;
  updateWithdrawLink: WithdrawLink;
  /** @deprecated will be moved to AccountContact */
  userContactUpdateAlias: UserContactUpdateAliasPayload;
  userEmailDelete: UserEmailDeletePayload;
  userEmailRegistrationInitiate: UserEmailRegistrationInitiatePayload;
  userEmailRegistrationValidate: UserEmailRegistrationValidatePayload;
  userLogin: AuthTokenPayload;
  userLoginUpgrade: UpgradePayload;
  userLogout: SuccessPayload;
  userPhoneDelete: UserPhoneDeletePayload;
  userPhoneRegistrationInitiate: SuccessPayload;
  userPhoneRegistrationValidate: UserPhoneRegistrationValidatePayload;
  userTotpDelete: UserTotpDeletePayload;
  userTotpRegistrationInitiate: UserTotpRegistrationInitiatePayload;
  userTotpRegistrationValidate: UserTotpRegistrationValidatePayload;
  userUpdateLanguage: UserUpdateLanguagePayload;
  /** @deprecated Username will be moved to @Handle in Accounts. Also SetUsername naming should be used instead of UpdateUsername to reflect the idempotency of Handles */
  userUpdateUsername: UserUpdateUsernamePayload;
};


export type MutationAccountDisableNotificationCategoryArgs = {
  input: AccountDisableNotificationCategoryInput;
};


export type MutationAccountDisableNotificationChannelArgs = {
  input: AccountDisableNotificationChannelInput;
};


export type MutationAccountEnableNotificationCategoryArgs = {
  input: AccountEnableNotificationCategoryInput;
};


export type MutationAccountEnableNotificationChannelArgs = {
  input: AccountEnableNotificationChannelInput;
};


export type MutationAccountUpdateDefaultWalletIdArgs = {
  input: AccountUpdateDefaultWalletIdInput;
};


export type MutationAccountUpdateDisplayCurrencyArgs = {
  input: AccountUpdateDisplayCurrencyInput;
};


export type MutationApiKeyCreateArgs = {
  input: ApiKeyCreateInput;
};


export type MutationApiKeyRevokeArgs = {
  input: ApiKeyRevokeInput;
};


export type MutationCallbackEndpointAddArgs = {
  input: CallbackEndpointAddInput;
};


export type MutationCallbackEndpointDeleteArgs = {
  input: CallbackEndpointDeleteInput;
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


export type MutationLnAddressPaymentSendArgs = {
  input: LnAddressPaymentSendInput;
};


export type MutationLnInvoiceCancelArgs = {
  input: LnInvoiceCancelInput;
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


export type MutationLnUsdInvoiceBtcDenominatedCreateOnBehalfOfRecipientArgs = {
  input: LnUsdInvoiceBtcDenominatedCreateOnBehalfOfRecipientInput;
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


export type MutationLnurlPaymentSendArgs = {
  input: LnurlPaymentSendInput;
};


export type MutationMerchantMapSuggestArgs = {
  input: MerchantMapSuggestInput;
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


export type MutationOnboardingFlowStartArgs = {
  input: OnboardingFlowStartInput;
};


export type MutationQuizClaimArgs = {
  input: QuizClaimInput;
};


export type MutationSendPaymentOnChainArgs = {
  btcWalletAddress: Scalars['String']['input'];
  id: Scalars['ID']['input'];
};


export type MutationSupportChatMessageAddArgs = {
  input: SupportChatMessageAddInput;
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
  input?: InputMaybe<UserLogoutInput>;
};


export type MutationUserPhoneRegistrationInitiateArgs = {
  input: UserPhoneRegistrationInitiateInput;
};


export type MutationUserPhoneRegistrationValidateArgs = {
  input: UserPhoneRegistrationValidateInput;
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
  __typename?: 'MyUpdatesPayload';
  errors: Array<Error>;
  me?: Maybe<User>;
  update?: Maybe<UserUpdate>;
};

export enum Network {
  Mainnet = 'mainnet',
  Regtest = 'regtest',
  Signet = 'signet',
  Testnet = 'testnet'
}

export enum NotificationChannel {
  Push = 'PUSH'
}

export type NotificationChannelSettings = {
  __typename?: 'NotificationChannelSettings';
  disabledCategories: Array<Scalars['NotificationCategory']['output']>;
  enabled: Scalars['Boolean']['output'];
};

export type NotificationSettings = {
  __typename?: 'NotificationSettings';
  push: NotificationChannelSettings;
};

export type OnChainAddressCreateInput = {
  walletId: Scalars['WalletId']['input'];
};

export type OnChainAddressCurrentInput = {
  walletId: Scalars['WalletId']['input'];
};

export type OnChainAddressPayload = {
  __typename?: 'OnChainAddressPayload';
  address?: Maybe<Scalars['OnChainAddress']['output']>;
  errors: Array<Error>;
};

export type OnChainPaymentSendAllInput = {
  address: Scalars['OnChainAddress']['input'];
  memo?: InputMaybe<Scalars['Memo']['input']>;
  speed?: PayoutSpeed;
  walletId: Scalars['WalletId']['input'];
};

export type OnChainPaymentSendInput = {
  address: Scalars['OnChainAddress']['input'];
  amount: Scalars['SatAmount']['input'];
  memo?: InputMaybe<Scalars['Memo']['input']>;
  speed?: PayoutSpeed;
  walletId: Scalars['WalletId']['input'];
};

export type OnChainTxFee = {
  __typename?: 'OnChainTxFee';
  amount: Scalars['SatAmount']['output'];
};

export type OnChainUpdate = {
  __typename?: 'OnChainUpdate';
  /** @deprecated Deprecated in favor of transaction */
  amount: Scalars['SatAmount']['output'];
  /** @deprecated Deprecated in favor of transaction */
  displayCurrencyPerSat: Scalars['Float']['output'];
  transaction: Transaction;
  /** @deprecated Deprecated in favor of transaction */
  txHash: Scalars['OnChainTxHash']['output'];
  txNotificationType: TxNotificationType;
  /** @deprecated updated over displayCurrencyPerSat */
  usdPerSat: Scalars['Float']['output'];
  /** @deprecated Deprecated in favor of transaction */
  walletId: Scalars['WalletId']['output'];
};

export type OnChainUsdPaymentSendAsBtcDenominatedInput = {
  address: Scalars['OnChainAddress']['input'];
  amount: Scalars['SatAmount']['input'];
  memo?: InputMaybe<Scalars['Memo']['input']>;
  speed?: PayoutSpeed;
  walletId: Scalars['WalletId']['input'];
};

export type OnChainUsdPaymentSendInput = {
  address: Scalars['OnChainAddress']['input'];
  amount: Scalars['CentAmount']['input'];
  memo?: InputMaybe<Scalars['Memo']['input']>;
  speed?: PayoutSpeed;
  walletId: Scalars['WalletId']['input'];
};

export type OnChainUsdTxFee = {
  __typename?: 'OnChainUsdTxFee';
  amount: Scalars['CentAmount']['output'];
};

export type OnboardingFlowStartInput = {
  firstName: Scalars['String']['input'];
  lastName: Scalars['String']['input'];
};

export type OnboardingFlowStartResult = {
  __typename?: 'OnboardingFlowStartResult';
  tokenAndroid: Scalars['String']['output'];
  tokenIos: Scalars['String']['output'];
  tokenWeb: Scalars['String']['output'];
  workflowRunId: Scalars['String']['output'];
};

export enum OnboardingStatus {
  Abandoned = 'ABANDONED',
  Approved = 'APPROVED',
  AwaitingInput = 'AWAITING_INPUT',
  Declined = 'DECLINED',
  Error = 'ERROR',
  NotStarted = 'NOT_STARTED',
  Processing = 'PROCESSING',
  Review = 'REVIEW'
}

export type OneDayAccountLimit = AccountLimit & {
  __typename?: 'OneDayAccountLimit';
  /** The rolling time interval value in seconds for the current 24 hour period. */
  interval?: Maybe<Scalars['Seconds']['output']>;
  /** The amount of cents remaining below the limit for the current 24 hour period. */
  remainingLimit?: Maybe<Scalars['CentAmount']['output']>;
  /** The current maximum limit for a given 24 hour period. */
  totalLimit: Scalars['CentAmount']['output'];
};

/** Information about pagination in a connection. */
export type PageInfo = {
  __typename?: 'PageInfo';
  /** When paginating forwards, the cursor to continue. */
  endCursor?: Maybe<Scalars['String']['output']>;
  /** When paginating forwards, are there more items? */
  hasNextPage: Scalars['Boolean']['output'];
  /** When paginating backwards, are there more items? */
  hasPreviousPage: Scalars['Boolean']['output'];
  /** When paginating backwards, the cursor to continue. */
  startCursor?: Maybe<Scalars['String']['output']>;
};

export type PaymentSendPayload = {
  __typename?: 'PaymentSendPayload';
  errors: Array<Error>;
  status?: Maybe<PaymentSendResult>;
  transaction?: Maybe<Transaction>;
};

export enum PaymentSendResult {
  AlreadyPaid = 'ALREADY_PAID',
  Failure = 'FAILURE',
  Pending = 'PENDING',
  Success = 'SUCCESS'
}

export enum PayoutSpeed {
  Fast = 'FAST'
}

export enum PhoneCodeChannelType {
  Sms = 'SMS',
  Whatsapp = 'WHATSAPP'
}

/** Price amount expressed in base/offset. To calculate, use: `base / 10^offset` */
export type Price = {
  __typename?: 'Price';
  base: Scalars['SafeInt']['output'];
  currencyUnit: Scalars['String']['output'];
  formattedAmount: Scalars['String']['output'];
  offset: Scalars['Int']['output'];
};

/** The range for the X axis in the BTC price graph */
export enum PriceGraphRange {
  FiveYears = 'FIVE_YEARS',
  OneDay = 'ONE_DAY',
  OneMonth = 'ONE_MONTH',
  OneWeek = 'ONE_WEEK',
  OneYear = 'ONE_YEAR'
}

export type PriceInput = {
  amount: Scalars['SatAmount']['input'];
  amountCurrencyUnit: ExchangeCurrencyUnit;
  priceCurrencyUnit: ExchangeCurrencyUnit;
};

export type PriceInterface = {
  base: Scalars['SafeInt']['output'];
  /** @deprecated Deprecated due to type renaming */
  currencyUnit: Scalars['String']['output'];
  offset: Scalars['Int']['output'];
};

/** Price of 1 sat in base/offset. To calculate, use: `base / 10^offset` */
export type PriceOfOneSatInMinorUnit = PriceInterface & {
  __typename?: 'PriceOfOneSatInMinorUnit';
  base: Scalars['SafeInt']['output'];
  /** @deprecated Deprecated due to type renaming */
  currencyUnit: Scalars['String']['output'];
  offset: Scalars['Int']['output'];
};

/** Price of 1 sat or 1 usd cent in base/offset. To calculate, use: `base / 10^offset` */
export type PriceOfOneSettlementMinorUnitInDisplayMinorUnit = PriceInterface & {
  __typename?: 'PriceOfOneSettlementMinorUnitInDisplayMinorUnit';
  base: Scalars['SafeInt']['output'];
  /** @deprecated Deprecated due to type renaming */
  currencyUnit: Scalars['String']['output'];
  /** @deprecated Deprecated please use `base / 10^offset` */
  formattedAmount: Scalars['String']['output'];
  offset: Scalars['Int']['output'];
};

/** Price of 1 usd cent in base/offset. To calculate, use: `base / 10^offset` */
export type PriceOfOneUsdCentInMinorUnit = PriceInterface & {
  __typename?: 'PriceOfOneUsdCentInMinorUnit';
  base: Scalars['SafeInt']['output'];
  /** @deprecated Deprecated due to type renaming */
  currencyUnit: Scalars['String']['output'];
  offset: Scalars['Int']['output'];
};

export type PricePayload = {
  __typename?: 'PricePayload';
  errors: Array<Error>;
  price?: Maybe<Price>;
};

export type PricePoint = {
  __typename?: 'PricePoint';
  price: Price;
  /** Unix timestamp (number of seconds elapsed since January 1, 1970 00:00:00 UTC) */
  timestamp: Scalars['Timestamp']['output'];
};

/** A public view of a generic wallet which stores value in one of our supported currencies. */
export type PublicWallet = {
  __typename?: 'PublicWallet';
  currency: WalletCurrency;
  id: Scalars['ID']['output'];
  /** @deprecated Shifting property to 'currency' */
  walletCurrency: WalletCurrency;
};

export type Query = {
  __typename?: 'Query';
  accountDefaultWallet: PublicWallet;
  /** Retrieve the list of scopes permitted for the user's token or API key */
  authorization: Authorization;
  btcPriceList?: Maybe<Array<Maybe<PricePoint>>>;
  businessMapMarkers: Array<MapMarker>;
  currencyList: Array<Currency>;
  getAllWithdrawLinks: Array<WithdrawLink>;
  getOnChainPaymentFees: FeesResult;
  getWithdrawLink?: Maybe<WithdrawLink>;
  getWithdrawLinksByUserId: WithdrawLinksByUserIdResult;
  globals?: Maybe<Globals>;
  /** @deprecated Deprecated in favor of lnInvoicePaymentStatusByPaymentRequest */
  lnInvoicePaymentStatus: LnInvoicePaymentStatusPayload;
  lnInvoicePaymentStatusByHash: LnInvoicePaymentStatus;
  lnInvoicePaymentStatusByPaymentRequest: LnInvoicePaymentStatus;
  me?: Maybe<User>;
  mobileVersions?: Maybe<Array<Maybe<MobileVersions>>>;
  onChainTxFee: OnChainTxFee;
  onChainUsdTxFee: OnChainUsdTxFee;
  onChainUsdTxFeeAsBtcDenominated: OnChainUsdTxFee;
  /** Returns 1 Sat and 1 Usd Cent price for the given currency in minor unit */
  realtimePrice: RealtimePrice;
  /** @deprecated will be migrated to AccountDefaultWalletId */
  userDefaultWalletId: Scalars['WalletId']['output'];
  usernameAvailable?: Maybe<Scalars['Boolean']['output']>;
  welcomeLeaderboard: Leaderboard;
};


export type QueryAccountDefaultWalletArgs = {
  username: Scalars['Username']['input'];
  walletCurrency?: InputMaybe<WalletCurrency>;
};


export type QueryBtcPriceListArgs = {
  range: PriceGraphRange;
};


export type QueryGetOnChainPaymentFeesArgs = {
  btcWalletAddress: Scalars['String']['input'];
  id: Scalars['ID']['input'];
};


export type QueryGetWithdrawLinkArgs = {
  id?: InputMaybe<Scalars['ID']['input']>;
  identifierCode?: InputMaybe<Scalars['String']['input']>;
  k1?: InputMaybe<Scalars['String']['input']>;
  paymentHash?: InputMaybe<Scalars['String']['input']>;
  secretCode?: InputMaybe<Scalars['String']['input']>;
  uniqueHash?: InputMaybe<Scalars['String']['input']>;
};


export type QueryGetWithdrawLinksByUserIdArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  status?: InputMaybe<Status>;
  userId: Scalars['ID']['input'];
};


export type QueryLnInvoicePaymentStatusArgs = {
  input: LnInvoicePaymentStatusInput;
};


export type QueryLnInvoicePaymentStatusByHashArgs = {
  input: LnInvoicePaymentStatusByHashInput;
};


export type QueryLnInvoicePaymentStatusByPaymentRequestArgs = {
  input: LnInvoicePaymentStatusByPaymentRequestInput;
};


export type QueryOnChainTxFeeArgs = {
  address: Scalars['OnChainAddress']['input'];
  amount: Scalars['SatAmount']['input'];
  speed?: PayoutSpeed;
  walletId: Scalars['WalletId']['input'];
};


export type QueryOnChainUsdTxFeeArgs = {
  address: Scalars['OnChainAddress']['input'];
  amount: Scalars['CentAmount']['input'];
  speed?: PayoutSpeed;
  walletId: Scalars['WalletId']['input'];
};


export type QueryOnChainUsdTxFeeAsBtcDenominatedArgs = {
  address: Scalars['OnChainAddress']['input'];
  amount: Scalars['SatAmount']['input'];
  speed?: PayoutSpeed;
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


export type QueryWelcomeLeaderboardArgs = {
  input: WelcomeLeaderboardInput;
};

export type Quiz = {
  __typename?: 'Quiz';
  /** The reward in Satoshis for the quiz question */
  amount: Scalars['SatAmount']['output'];
  completed: Scalars['Boolean']['output'];
  id: Scalars['ID']['output'];
  notBefore?: Maybe<Scalars['Timestamp']['output']>;
};

export type QuizClaimInput = {
  id: Scalars['ID']['input'];
};

export type QuizClaimPayload = {
  __typename?: 'QuizClaimPayload';
  errors: Array<Error>;
  quizzes: Array<Quiz>;
};

export type RealtimePrice = {
  __typename?: 'RealtimePrice';
  btcSatPrice: PriceOfOneSatInMinorUnit;
  /** @deprecated Deprecated in favor of denominatorCurrencyDetails */
  denominatorCurrency: Scalars['DisplayCurrency']['output'];
  denominatorCurrencyDetails: Currency;
  id: Scalars['ID']['output'];
  /** Unix timestamp (number of seconds elapsed since January 1, 1970 00:00:00 UTC) */
  timestamp: Scalars['Timestamp']['output'];
  usdCentPrice: PriceOfOneUsdCentInMinorUnit;
};

export type RealtimePriceInput = {
  currency?: InputMaybe<Scalars['DisplayCurrency']['input']>;
};

export type RealtimePricePayload = {
  __typename?: 'RealtimePricePayload';
  errors: Array<Error>;
  realtimePrice?: Maybe<RealtimePrice>;
};

export type SatAmountPayload = {
  __typename?: 'SatAmountPayload';
  amount?: Maybe<Scalars['SatAmount']['output']>;
  errors: Array<Error>;
};

export enum Scope {
  Read = 'READ',
  Receive = 'RECEIVE',
  Write = 'WRITE'
}

export type SendPaymentOnChainResult = {
  __typename?: 'SendPaymentOnChainResult';
  amount: Scalars['Float']['output'];
  status: Scalars['String']['output'];
};

export type SettlementVia = SettlementViaIntraLedger | SettlementViaLn | SettlementViaOnChain;

export type SettlementViaIntraLedger = {
  __typename?: 'SettlementViaIntraLedger';
  /** Settlement destination: Could be null if the payee does not have a username */
  counterPartyUsername?: Maybe<Scalars['Username']['output']>;
  counterPartyWalletId?: Maybe<Scalars['WalletId']['output']>;
  preImage?: Maybe<Scalars['LnPaymentPreImage']['output']>;
};

export type SettlementViaLn = {
  __typename?: 'SettlementViaLn';
  /** @deprecated Shifting property to 'preImage' to improve granularity of the LnPaymentSecret type */
  paymentSecret?: Maybe<Scalars['LnPaymentSecret']['output']>;
  preImage?: Maybe<Scalars['LnPaymentPreImage']['output']>;
};

export type SettlementViaOnChain = {
  __typename?: 'SettlementViaOnChain';
  arrivalInMempoolEstimatedAt?: Maybe<Scalars['Timestamp']['output']>;
  transactionHash?: Maybe<Scalars['OnChainTxHash']['output']>;
  vout?: Maybe<Scalars['Int']['output']>;
};

export enum Status {
  Funded = 'FUNDED',
  Paid = 'PAID',
  Unfunded = 'UNFUNDED'
}

export type Subscription = {
  __typename?: 'Subscription';
  /** @deprecated Deprecated in favor of lnInvoicePaymentStatusByPaymentRequest */
  lnInvoicePaymentStatus: LnInvoicePaymentStatusPayload;
  lnInvoicePaymentStatusByHash: LnInvoicePaymentStatusPayload;
  lnInvoicePaymentStatusByPaymentRequest: LnInvoicePaymentStatusPayload;
  myUpdates: MyUpdatesPayload;
  price: PricePayload;
  /** Returns the price of 1 satoshi */
  realtimePrice: RealtimePricePayload;
};


export type SubscriptionLnInvoicePaymentStatusArgs = {
  input: LnInvoicePaymentStatusInput;
};


export type SubscriptionLnInvoicePaymentStatusByHashArgs = {
  input: LnInvoicePaymentStatusByHashInput;
};


export type SubscriptionLnInvoicePaymentStatusByPaymentRequestArgs = {
  input: LnInvoicePaymentStatusByPaymentRequestInput;
};


export type SubscriptionPriceArgs = {
  input: PriceInput;
};


export type SubscriptionRealtimePriceArgs = {
  input: RealtimePriceInput;
};

export type SuccessPayload = {
  __typename?: 'SuccessPayload';
  errors: Array<Error>;
  success?: Maybe<Scalars['Boolean']['output']>;
};

export type SupportChatMessageAddInput = {
  message: Scalars['String']['input'];
};

export type SupportChatMessageAddPayload = {
  __typename?: 'SupportChatMessageAddPayload';
  errors: Array<Error>;
  supportMessage?: Maybe<Array<Maybe<SupportMessage>>>;
};

export type SupportMessage = {
  __typename?: 'SupportMessage';
  id: Scalars['ID']['output'];
  message: Scalars['String']['output'];
  role: SupportRole;
  timestamp: Scalars['Timestamp']['output'];
};

export enum SupportRole {
  Assistant = 'ASSISTANT',
  User = 'USER'
}

/**
 * Give details about an individual transaction.
 * Galoy have a smart routing system which is automatically
 * settling intraledger when both the payer and payee use the same wallet
 * therefore it's possible the transactions is being initiated onchain
 * or with lightning but settled intraledger.
 */
export type Transaction = {
  __typename?: 'Transaction';
  createdAt: Scalars['Timestamp']['output'];
  direction: TxDirection;
  id: Scalars['ID']['output'];
  /** From which protocol the payment has been initiated. */
  initiationVia: InitiationVia;
  memo?: Maybe<Scalars['Memo']['output']>;
  /** Amount of the settlement currency sent or received. */
  settlementAmount: Scalars['SignedAmount']['output'];
  /** Wallet currency for transaction. */
  settlementCurrency: WalletCurrency;
  settlementDisplayAmount: Scalars['SignedDisplayMajorAmount']['output'];
  settlementDisplayCurrency: Scalars['DisplayCurrency']['output'];
  settlementDisplayFee: Scalars['SignedDisplayMajorAmount']['output'];
  settlementFee: Scalars['SignedAmount']['output'];
  /** Price in WALLETCURRENCY/SETTLEMENTUNIT at time of settlement. */
  settlementPrice: PriceOfOneSettlementMinorUnitInDisplayMinorUnit;
  /** To which protocol the payment has settled on. */
  settlementVia: SettlementVia;
  status: TxStatus;
};

/** A connection to a list of items. */
export type TransactionConnection = {
  __typename?: 'TransactionConnection';
  /** A list of edges. */
  edges?: Maybe<Array<TransactionEdge>>;
  /** Information to aid in pagination. */
  pageInfo: PageInfo;
};

/** An edge in a connection. */
export type TransactionEdge = {
  __typename?: 'TransactionEdge';
  /** A cursor for use in pagination */
  cursor: Scalars['String']['output'];
  /** The item at the end of the edge */
  node: Transaction;
};

export enum TxDirection {
  Receive = 'RECEIVE',
  Send = 'SEND'
}

export enum TxNotificationType {
  IntraLedgerPayment = 'IntraLedgerPayment',
  IntraLedgerReceipt = 'IntraLedgerReceipt',
  LigtningReceipt = 'LigtningReceipt',
  OnchainPayment = 'OnchainPayment',
  OnchainReceipt = 'OnchainReceipt',
  OnchainReceiptPending = 'OnchainReceiptPending'
}

export enum TxStatus {
  Failure = 'FAILURE',
  Pending = 'PENDING',
  Success = 'SUCCESS'
}

export type UpdateWithdrawLinkInput = {
  accountType?: InputMaybe<Scalars['String']['input']>;
  commissionPercentage?: InputMaybe<Scalars['Float']['input']>;
  escrowWallet?: InputMaybe<Scalars['String']['input']>;
  k1?: InputMaybe<Scalars['String']['input']>;
  paymentHash?: InputMaybe<Scalars['String']['input']>;
  paymentRequest?: InputMaybe<Scalars['String']['input']>;
  paymentSecret?: InputMaybe<Scalars['String']['input']>;
  salesAmount?: InputMaybe<Scalars['Float']['input']>;
  status?: InputMaybe<Status>;
  title?: InputMaybe<Scalars['String']['input']>;
  uniqueHash?: InputMaybe<Scalars['String']['input']>;
  userId?: InputMaybe<Scalars['ID']['input']>;
  voucherAmount?: InputMaybe<Scalars['Float']['input']>;
};

export type UpgradePayload = {
  __typename?: 'UpgradePayload';
  authToken?: Maybe<Scalars['AuthToken']['output']>;
  errors: Array<Error>;
  success: Scalars['Boolean']['output'];
};

/** A wallet belonging to an account which contains a USD balance and a list of transactions. */
export type UsdWallet = Wallet & {
  __typename?: 'UsdWallet';
  accountId: Scalars['ID']['output'];
  balance: Scalars['SignedAmount']['output'];
  id: Scalars['ID']['output'];
  invoiceByPaymentHash: Invoice;
  /** A list of all invoices associated with walletIds optionally passed. */
  invoices?: Maybe<InvoiceConnection>;
  /** An unconfirmed incoming onchain balance. */
  pendingIncomingBalance: Scalars['SignedAmount']['output'];
  pendingIncomingTransactions: Array<Transaction>;
  pendingIncomingTransactionsByAddress: Array<Transaction>;
  transactionById: Transaction;
  transactions?: Maybe<TransactionConnection>;
  transactionsByAddress?: Maybe<TransactionConnection>;
  transactionsByPaymentHash: Array<Transaction>;
  transactionsByPaymentRequest: Array<Transaction>;
  walletCurrency: WalletCurrency;
};


/** A wallet belonging to an account which contains a USD balance and a list of transactions. */
export type UsdWalletInvoiceByPaymentHashArgs = {
  paymentHash: Scalars['PaymentHash']['input'];
};


/** A wallet belonging to an account which contains a USD balance and a list of transactions. */
export type UsdWalletInvoicesArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
};


/** A wallet belonging to an account which contains a USD balance and a list of transactions. */
export type UsdWalletPendingIncomingTransactionsByAddressArgs = {
  address: Scalars['OnChainAddress']['input'];
};


/** A wallet belonging to an account which contains a USD balance and a list of transactions. */
export type UsdWalletTransactionByIdArgs = {
  transactionId: Scalars['ID']['input'];
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


/** A wallet belonging to an account which contains a USD balance and a list of transactions. */
export type UsdWalletTransactionsByPaymentHashArgs = {
  paymentHash: Scalars['PaymentHash']['input'];
};


/** A wallet belonging to an account which contains a USD balance and a list of transactions. */
export type UsdWalletTransactionsByPaymentRequestArgs = {
  paymentRequest: Scalars['LnPaymentRequest']['input'];
};

export type User = {
  __typename?: 'User';
  apiKeys: Array<ApiKey>;
  /**
   * Get single contact details.
   * Can include the transactions associated with the contact.
   * @deprecated will be moved to Accounts
   */
  contactByUsername: UserContact;
  /**
   * Get full list of contacts.
   * Can include the transactions associated with each contact.
   * @deprecated will be moved to account
   */
  contacts: Array<UserContact>;
  createdAt: Scalars['Timestamp']['output'];
  defaultAccount: Account;
  /** Email address */
  email?: Maybe<Email>;
  id: Scalars['ID']['output'];
  /**
   * Preferred language for user.
   * When value is 'default' the intent is to use preferred language from OS settings.
   */
  language: Scalars['Language']['output'];
  /** Phone number with international calling code. */
  phone?: Maybe<Scalars['Phone']['output']>;
  supportChat: Array<SupportMessage>;
  /** Whether TOTP is enabled for this user. */
  totpEnabled: Scalars['Boolean']['output'];
  /**
   * Optional immutable user friendly identifier.
   * @deprecated will be moved to @Handle in Account and Wallet
   */
  username?: Maybe<Scalars['Username']['output']>;
};


export type UserContactByUsernameArgs = {
  username: Scalars['Username']['input'];
};

export type UserContact = {
  __typename?: 'UserContact';
  /**
   * Alias the user can set for this contact.
   * Only the user can see the alias attached to their contact.
   */
  alias?: Maybe<Scalars['ContactAlias']['output']>;
  id: Scalars['Username']['output'];
  /** Paginated list of transactions sent to/from this contact. */
  transactions?: Maybe<TransactionConnection>;
  transactionsCount: Scalars['Int']['output'];
  /** Actual identifier of the contact. */
  username: Scalars['Username']['output'];
};


export type UserContactTransactionsArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
};

export type UserContactUpdateAliasInput = {
  alias: Scalars['ContactAlias']['input'];
  username: Scalars['Username']['input'];
};

export type UserContactUpdateAliasPayload = {
  __typename?: 'UserContactUpdateAliasPayload';
  contact?: Maybe<UserContact>;
  errors: Array<Error>;
};

export type UserEmailDeletePayload = {
  __typename?: 'UserEmailDeletePayload';
  errors: Array<Error>;
  me?: Maybe<User>;
};

export type UserEmailRegistrationInitiateInput = {
  email: Scalars['EmailAddress']['input'];
};

export type UserEmailRegistrationInitiatePayload = {
  __typename?: 'UserEmailRegistrationInitiatePayload';
  emailRegistrationId?: Maybe<Scalars['EmailRegistrationId']['output']>;
  errors: Array<Error>;
  me?: Maybe<User>;
};

export type UserEmailRegistrationValidateInput = {
  code: Scalars['OneTimeAuthCode']['input'];
  emailRegistrationId: Scalars['EmailRegistrationId']['input'];
};

export type UserEmailRegistrationValidatePayload = {
  __typename?: 'UserEmailRegistrationValidatePayload';
  errors: Array<Error>;
  me?: Maybe<User>;
};

export type UserLoginInput = {
  code: Scalars['OneTimeAuthCode']['input'];
  phone: Scalars['Phone']['input'];
};

export type UserLoginUpgradeInput = {
  code: Scalars['OneTimeAuthCode']['input'];
  phone: Scalars['Phone']['input'];
};

export type UserLogoutInput = {
  deviceToken: Scalars['String']['input'];
};

export type UserPhoneDeletePayload = {
  __typename?: 'UserPhoneDeletePayload';
  errors: Array<Error>;
  me?: Maybe<User>;
};

export type UserPhoneRegistrationInitiateInput = {
  channel?: InputMaybe<PhoneCodeChannelType>;
  phone: Scalars['Phone']['input'];
};

export type UserPhoneRegistrationValidateInput = {
  code: Scalars['OneTimeAuthCode']['input'];
  phone: Scalars['Phone']['input'];
};

export type UserPhoneRegistrationValidatePayload = {
  __typename?: 'UserPhoneRegistrationValidatePayload';
  errors: Array<Error>;
  me?: Maybe<User>;
};

export type UserTotpDeletePayload = {
  __typename?: 'UserTotpDeletePayload';
  errors: Array<Error>;
  me?: Maybe<User>;
};

export type UserTotpRegistrationInitiatePayload = {
  __typename?: 'UserTotpRegistrationInitiatePayload';
  errors: Array<Error>;
  totpRegistrationId?: Maybe<Scalars['TotpRegistrationId']['output']>;
  totpSecret?: Maybe<Scalars['TotpSecret']['output']>;
};

export type UserTotpRegistrationValidateInput = {
  authToken?: InputMaybe<Scalars['AuthToken']['input']>;
  totpCode: Scalars['TotpCode']['input'];
  totpRegistrationId: Scalars['TotpRegistrationId']['input'];
};

export type UserTotpRegistrationValidatePayload = {
  __typename?: 'UserTotpRegistrationValidatePayload';
  errors: Array<Error>;
  me?: Maybe<User>;
};

export type UserUpdate = IntraLedgerUpdate | LnUpdate | OnChainUpdate | Price | RealtimePrice;

export type UserUpdateLanguageInput = {
  language: Scalars['Language']['input'];
};

export type UserUpdateLanguagePayload = {
  __typename?: 'UserUpdateLanguagePayload';
  errors: Array<Error>;
  user?: Maybe<User>;
};

export type UserUpdateUsernameInput = {
  username: Scalars['Username']['input'];
};

export type UserUpdateUsernamePayload = {
  __typename?: 'UserUpdateUsernamePayload';
  errors: Array<Error>;
  user?: Maybe<User>;
};

/** A generic wallet which stores value in one of our supported currencies. */
export type Wallet = {
  accountId: Scalars['ID']['output'];
  balance: Scalars['SignedAmount']['output'];
  id: Scalars['ID']['output'];
  invoiceByPaymentHash: Invoice;
  invoices?: Maybe<InvoiceConnection>;
  pendingIncomingBalance: Scalars['SignedAmount']['output'];
  /**
   * Pending incoming OnChain transactions. When transactions
   * are confirmed they will receive a new id and be found in the transactions
   * list. Transactions are ordered anti-chronologically,
   * ie: the newest transaction will be first
   */
  pendingIncomingTransactions: Array<Transaction>;
  /**
   * Pending incoming OnChain transactions. When transactions
   * are confirmed they will receive a new id and be found in the transactions
   * list. Transactions are ordered anti-chronologically,
   * ie: the newest transaction will be first
   */
  pendingIncomingTransactionsByAddress: Array<Transaction>;
  transactionById: Transaction;
  /**
   * Transactions are ordered anti-chronologically,
   * ie: the newest transaction will be first
   */
  transactions?: Maybe<TransactionConnection>;
  /**
   * Transactions are ordered anti-chronologically,
   * ie: the newest transaction will be first
   */
  transactionsByAddress?: Maybe<TransactionConnection>;
  /** Returns the transactions that include this paymentHash. This should be a list of size one for a received lightning payment. This can be more that one transaction for a sent lightning payment. */
  transactionsByPaymentHash: Array<Transaction>;
  /** Returns the transactions that include this paymentRequest. */
  transactionsByPaymentRequest: Array<Transaction>;
  walletCurrency: WalletCurrency;
};


/** A generic wallet which stores value in one of our supported currencies. */
export type WalletInvoiceByPaymentHashArgs = {
  paymentHash: Scalars['PaymentHash']['input'];
};


/** A generic wallet which stores value in one of our supported currencies. */
export type WalletInvoicesArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
};


/** A generic wallet which stores value in one of our supported currencies. */
export type WalletPendingIncomingTransactionsByAddressArgs = {
  address: Scalars['OnChainAddress']['input'];
};


/** A generic wallet which stores value in one of our supported currencies. */
export type WalletTransactionByIdArgs = {
  transactionId: Scalars['ID']['input'];
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


/** A generic wallet which stores value in one of our supported currencies. */
export type WalletTransactionsByPaymentHashArgs = {
  paymentHash: Scalars['PaymentHash']['input'];
};


/** A generic wallet which stores value in one of our supported currencies. */
export type WalletTransactionsByPaymentRequestArgs = {
  paymentRequest: Scalars['LnPaymentRequest']['input'];
};

export enum WalletCurrency {
  Btc = 'BTC',
  Usd = 'USD'
}

export type WelcomeLeaderboardInput = {
  range: WelcomeRange;
};

export type WelcomeProfile = {
  __typename?: 'WelcomeProfile';
  allTimePoints: Scalars['Int']['output'];
  allTimeRank: Scalars['Int']['output'];
  innerCircleAllTimeCount: Scalars['Int']['output'];
  innerCircleThisMonthCount: Scalars['Int']['output'];
  leaderboardName?: Maybe<Scalars['LeaderboardName']['output']>;
  outerCircleAllTimeCount: Scalars['Int']['output'];
  outerCircleThisMonthCount: Scalars['Int']['output'];
  thisMonthPoints: Scalars['Int']['output'];
  thisMonthRank: Scalars['Int']['output'];
};

export enum WelcomeRange {
  AllTime = 'AllTime',
  ThisMonth = 'ThisMonth'
}

export type WithdrawLink = {
  __typename?: 'WithdrawLink';
  accountType: Scalars['String']['output'];
  commissionPercentage?: Maybe<Scalars['Float']['output']>;
  createdAt: Scalars['String']['output'];
  escrowWallet: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  identifierCode?: Maybe<Scalars['String']['output']>;
  invoiceExpiration: Scalars['String']['output'];
  k1?: Maybe<Scalars['String']['output']>;
  paymentHash: Scalars['String']['output'];
  paymentRequest: Scalars['String']['output'];
  paymentSecret: Scalars['String']['output'];
  salesAmount: Scalars['Float']['output'];
  secretCode?: Maybe<Scalars['String']['output']>;
  status: Status;
  title: Scalars['String']['output'];
  uniqueHash: Scalars['String']['output'];
  updatedAt: Scalars['String']['output'];
  userId: Scalars['ID']['output'];
  voucherAmount: Scalars['Float']['output'];
};

export type WithdrawLinksByUserIdResult = {
  __typename?: 'WithdrawLinksByUserIdResult';
  totalLinks?: Maybe<Scalars['Int']['output']>;
  withdrawLinks: Array<WithdrawLink>;
};

export type CreateWithdrawLinkMutationVariables = Exact<{
  input: CreateWithdrawLinkInput;
}>;


export type CreateWithdrawLinkMutation = { __typename?: 'Mutation', createWithdrawLink: { __typename?: 'WithdrawLink', id: string, userId: string, paymentRequest: string, paymentHash: string, paymentSecret: string, salesAmount: number, accountType: string, escrowWallet: string, status: Status, title: string, voucherAmount: number, uniqueHash: string, k1?: string | null, createdAt: string, updatedAt: string, commissionPercentage?: number | null } };

export type UpdateWithdrawLinkMutationVariables = Exact<{
  updateWithdrawLinkId: Scalars['ID']['input'];
  updateWithdrawLinkInput: UpdateWithdrawLinkInput;
}>;


export type UpdateWithdrawLinkMutation = { __typename?: 'Mutation', updateWithdrawLink: { __typename?: 'WithdrawLink', accountType: string, salesAmount: number, createdAt: string, escrowWallet: string, id: string, k1?: string | null, voucherAmount: number, paymentHash: string, paymentRequest: string, paymentSecret: string, status: Status, title: string, uniqueHash: string, userId: string, updatedAt: string, commissionPercentage?: number | null } };

export type LnInvoiceCreateOnBehalfOfRecipientMutationVariables = Exact<{
  input: LnInvoiceCreateOnBehalfOfRecipientInput;
}>;


export type LnInvoiceCreateOnBehalfOfRecipientMutation = { __typename?: 'Mutation', lnInvoiceCreateOnBehalfOfRecipient: { __typename?: 'LnInvoicePayload', errors: Array<{ __typename?: 'GraphQLApplicationError', message: string, path?: Array<string | null> | null, code?: string | null }>, invoice?: { __typename?: 'LnInvoice', paymentRequest: any, paymentHash: any, paymentSecret: any, satoshis: any } | null } };

export type LnUsdInvoiceCreateOnBehalfOfRecipientMutationVariables = Exact<{
  input: LnUsdInvoiceCreateOnBehalfOfRecipientInput;
}>;


export type LnUsdInvoiceCreateOnBehalfOfRecipientMutation = { __typename?: 'Mutation', lnUsdInvoiceCreateOnBehalfOfRecipient: { __typename?: 'LnInvoicePayload', errors: Array<{ __typename?: 'GraphQLApplicationError', message: string, path?: Array<string | null> | null, code?: string | null }>, invoice?: { __typename?: 'LnInvoice', paymentRequest: any, paymentHash: any, paymentSecret: any, satoshis: any } | null } };

export type SendPaymentOnChainMutationVariables = Exact<{
  sendPaymentOnChainId: Scalars['ID']['input'];
  btcWalletAddress: Scalars['String']['input'];
}>;


export type SendPaymentOnChainMutation = { __typename?: 'Mutation', sendPaymentOnChain: { __typename?: 'SendPaymentOnChainResult', amount: number, status: string } };

export type DeleteWithdrawLinkMutationVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type DeleteWithdrawLinkMutation = { __typename?: 'Mutation', deleteWithdrawLink: string };

export type GetWithdrawLinkQueryVariables = Exact<{
  getWithdrawLinkId?: InputMaybe<Scalars['ID']['input']>;
}>;


export type GetWithdrawLinkQuery = { __typename?: 'Query', getWithdrawLink?: { __typename?: 'WithdrawLink', id: string, userId: string, paymentRequest: string, paymentHash: string, paymentSecret: string, salesAmount: number, accountType: string, escrowWallet: string, status: Status, title: string, voucherAmount: number, uniqueHash: string, k1?: string | null, createdAt: string, updatedAt: string, commissionPercentage?: number | null, identifierCode?: string | null, secretCode?: string | null, invoiceExpiration: string } | null };

export type GetWithdrawLinksByUserIdQueryVariables = Exact<{
  userId: Scalars['ID']['input'];
  status?: InputMaybe<Status>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
}>;


export type GetWithdrawLinksByUserIdQuery = { __typename?: 'Query', getWithdrawLinksByUserId: { __typename?: 'WithdrawLinksByUserIdResult', totalLinks?: number | null, withdrawLinks: Array<{ __typename?: 'WithdrawLink', id: string, userId: string, paymentRequest: string, paymentHash: string, paymentSecret: string, salesAmount: number, accountType: string, escrowWallet: string, status: Status, title: string, voucherAmount: number, uniqueHash: string, k1?: string | null, createdAt: string, updatedAt: string, commissionPercentage?: number | null, identifierCode?: string | null, secretCode?: string | null, invoiceExpiration: string }> } };

export type CurrencyListQueryVariables = Exact<{ [key: string]: never; }>;


export type CurrencyListQuery = { __typename?: 'Query', currencyList: Array<{ __typename?: 'Currency', id: string, symbol: string, name: string, flag: string, fractionDigits: number }> };

export type RealtimePriceInitialQueryVariables = Exact<{
  currency: Scalars['DisplayCurrency']['input'];
}>;


export type RealtimePriceInitialQuery = { __typename?: 'Query', realtimePrice: { __typename?: 'RealtimePrice', timestamp: any, denominatorCurrency: any, btcSatPrice: { __typename?: 'PriceOfOneSatInMinorUnit', base: any, offset: number }, usdCentPrice: { __typename?: 'PriceOfOneUsdCentInMinorUnit', base: any, offset: number } } };

export type GetOnChainPaymentFeesQueryVariables = Exact<{
  getOnChainPaymentFeesId: Scalars['ID']['input'];
  btcWalletAddress: Scalars['String']['input'];
}>;


export type GetOnChainPaymentFeesQuery = { __typename?: 'Query', getOnChainPaymentFees: { __typename?: 'FeesResult', fees: number } };

export type GetWithdrawLinkBySecretQueryVariables = Exact<{
  secretCode: Scalars['String']['input'];
}>;


export type GetWithdrawLinkBySecretQuery = { __typename?: 'Query', getWithdrawLink?: { __typename?: 'WithdrawLink', id: string } | null };

export type LnInvoicePaymentStatusSubscriptionVariables = Exact<{
  paymentRequest: Scalars['LnPaymentRequest']['input'];
}>;


export type LnInvoicePaymentStatusSubscription = { __typename?: 'Subscription', lnInvoicePaymentStatus: { __typename?: 'LnInvoicePaymentStatusPayload', status?: InvoicePaymentStatus | null, errors: Array<{ __typename?: 'GraphQLApplicationError', message: string, path?: Array<string | null> | null, code?: string | null }> } };

export type RealtimePriceWsSubscriptionVariables = Exact<{
  currency: Scalars['DisplayCurrency']['input'];
}>;


export type RealtimePriceWsSubscription = { __typename?: 'Subscription', realtimePrice: { __typename?: 'RealtimePricePayload', errors: Array<{ __typename?: 'GraphQLApplicationError', message: string }>, realtimePrice?: { __typename?: 'RealtimePrice', timestamp: any, denominatorCurrency: any, btcSatPrice: { __typename?: 'PriceOfOneSatInMinorUnit', base: any, offset: number }, usdCentPrice: { __typename?: 'PriceOfOneUsdCentInMinorUnit', base: any, offset: number } } | null } };

export type PriceSubscriptionVariables = Exact<{
  amount: Scalars['SatAmount']['input'];
  amountCurrencyUnit: ExchangeCurrencyUnit;
  priceCurrencyUnit: ExchangeCurrencyUnit;
}>;


export type PriceSubscription = { __typename?: 'Subscription', price: { __typename?: 'PricePayload', errors: Array<{ __typename?: 'GraphQLApplicationError', message: string }>, price?: { __typename?: 'Price', base: any, offset: number, currencyUnit: string, formattedAmount: string } | null } };


export const CreateWithdrawLinkDocument = gql`
    mutation CreateWithdrawLink($input: CreateWithdrawLinkInput!) {
  createWithdrawLink(input: $input) {
    id
    userId
    paymentRequest
    paymentHash
    paymentSecret
    salesAmount
    accountType
    escrowWallet
    status
    title
    voucherAmount
    uniqueHash
    k1
    createdAt
    updatedAt
    commissionPercentage
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
    accountType
    salesAmount
    createdAt
    escrowWallet
    id
    k1
    voucherAmount
    paymentHash
    paymentRequest
    paymentSecret
    status
    title
    uniqueHash
    userId
    updatedAt
    commissionPercentage
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
    btcWalletAddress: $btcWalletAddress
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
    userId
    paymentRequest
    paymentHash
    paymentSecret
    salesAmount
    accountType
    escrowWallet
    status
    title
    voucherAmount
    uniqueHash
    k1
    createdAt
    updatedAt
    commissionPercentage
    identifierCode
    secretCode
    invoiceExpiration
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
    userId: $userId
    status: $status
    limit: $limit
    offset: $offset
  ) {
    totalLinks
    withdrawLinks {
      id
      userId
      paymentRequest
      paymentHash
      paymentSecret
      salesAmount
      accountType
      escrowWallet
      status
      title
      voucherAmount
      uniqueHash
      k1
      createdAt
      updatedAt
      commissionPercentage
      identifierCode
      secretCode
      invoiceExpiration
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
    query RealtimePriceInitial($currency: DisplayCurrency!) {
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
    btcWalletAddress: $btcWalletAddress
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
    query GetWithdrawLinkBySecret($secretCode: String!) {
  getWithdrawLink(secretCode: $secretCode) {
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
 *      secretCode: // value for 'secretCode'
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
    subscription LnInvoicePaymentStatus($paymentRequest: LnPaymentRequest!) {
  lnInvoicePaymentStatus(input: {paymentRequest: $paymentRequest}) {
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
 *      paymentRequest: // value for 'paymentRequest'
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