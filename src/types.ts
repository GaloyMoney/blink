import { Logger as PinoLogger } from "pino"
import { User } from "./schema"

export type Side = "buy" | "sell"
export type Currency = "USD" | "BTC"

export type ISuccess = boolean

export type Logger = PinoLogger

export type Primitive = string | boolean | number

export interface ILightningWalletUser {
  // FIXME: Add a type for user here.
  user: unknown
  logger: Logger
}

// Lightning

export interface IAddInvoiceRequest {
  value: number
  memo: string | undefined
  selfGenerated?: boolean
}

export interface IAddBTCInvoiceRequest {
  value: number | undefined
  memo?: string | undefined
  selfGenerated?: boolean
}

export interface IAddUSDInvoiceRequest {
  value: number
  memo: string | undefined
}

export type IAddInvoiceResponse = {
  request: string
}

export type ChainType = "lightning" | "onchain"

// TODO:
// refactor lightning/onchain and payment/receipt/onus
// to 2 different variables.
// also log have renamed "paid-invoice" --> "receipt"

export type TransactionType =
  | "payment"
  | "paid-invoice"
  | "on_us"
  | "onchain_receipt"
  | "onchain_payment"
  | "onchain_on_us"
  | "exchange_rebalance"
  | "fee"
  | "escrow"
  | "deposit_fee"
  | "routing_fee"
  | "onchain_receipt_pending" // only for notification, not persistent in mongodb

export const Levels = [1, 2]

export interface IOnChainPayment {
  address: string
  amount: number
  memo?: string
}

export interface ITransaction {
  amount: number
  description: string
  created_at: Date
  hash?: string
  destination?: string
  type: TransactionType
  pending: boolean
  addresses?: [string]
}

export interface IFeeRequest {
  destination?: string
  amount?: number
  invoice?: string
  username?: string
}

export interface IPaymentRequest {
  destination?: string
  username?: string
  amount?: number
  invoice?: string
  memo?: string
  isReward?: boolean
}

export type IPayInvoice = {
  invoice: string
}

export interface IQuoteRequest {
  side: Side
  satAmount?: number // sell
  invoice?: string // buy
}

export interface IDataNotification {
  type: TransactionType
  amount: number
  hash?: string
  txid?: string // FIXME in mongodb, there is no differenciation between hash and txid?
}

export interface IPaymentNotification {
  amount: number
  type: string
  user: typeof User
  logger: Logger
  hash?: string
  txid?: string
}

export interface INotification {
  user: typeof User
  title: string
  data?: IDataNotification
  body?: string
  logger: Logger
}

// onboarding
export const OnboardingEarn = {
  walletDownloaded: 1,
  walletActivated: 1,
  whatIsBitcoin: 1,
  sat: 2,
  whereBitcoinExist: 5,
  whoControlsBitcoin: 5,
  copyBitcoin: 5,
  moneyImportantGovernement: 10,
  moneyIsImportant: 10,
  whyStonesShellGold: 10,
  moneyEvolution: 10,
  coincidenceOfWants: 10,
  moneySocialAggrement: 10,

  WhatIsFiat: 10,
  whyCareAboutFiatMoney: 10,
  GovernementCanPrintMoney: 10,
  FiatLosesValueOverTime: 10,
  OtherIssues: 10,
  LimitedSupply: 20,
  Decentralized: 20,
  NoCounterfeitMoney: 20,
  HighlyDivisible: 20,
  securePartOne: 20,
  securePartTwo: 20,

  freeMoney: 50,
  custody: 100,
  digitalKeys: 100,
  backupWallet: 500,
  fiatMoney: 100,
  bitcoinUnique: 100,
  moneySupply: 100,
  newBitcoin: 100,
  creator: 100,
  volatility: 50000,
  activateNotifications: 500,
  phoneVerification: 2000,
  firstLnPayment: 1000,
  transaction: 500,
  paymentProcessing: 500,
  decentralization: 500,
  privacy: 500,
  mining: 500,
  inviteAFriend: 5000,
  bankOnboarded: 10000,
  buyFirstSats: 10000,
  debitCardActivation: 10000,
  firstCardSpending: 10000,
  firstSurvey: 10000,
  activateDirectDeposit: 10000,
  doubleSpend: 500,
  exchangeHack: 500,
  energy: 500,
  difficultyAdjustment: 500,
  dollarCostAveraging: 500,
  scalability: 500,
  lightning: 500,
  moneyLaundering: 500,
  tweet: 1000,
}
