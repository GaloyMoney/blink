export type Side = "buy" | "sell"
export type Currency = "USD" | "BTC"


// Lightning

export type IAddInvoiceRequest = {
    value: number,
    memo: string
}

export type IAddInvoiceResponse = {
    request: string
}

export type TransactionType = "payment" | "inflight-payment" | 
    "paid-invoice" | "unconfirmed-invoice" | "earn"

export interface ILightningTransaction {
    amount: number
    description: string
    created_at: Date
    hash?: string
    destination?: string
    type: TransactionType
}

export interface IPaymentRequest {
    pubkey: string;
    amount: number;
    message?: string;
    hash?: string;
    routes?: object[]; // FIXME
}

export type IPayInvoice = {
    invoice: string
}

export interface IQuoteRequest {
    side: Side, 
    satAmount?: number, // sell
    invoice?: string,   // buy
}

// quotes

export interface IQuoteResponse {
    side: Side, 
    satPrice?: number,  // buy
    signature?: string, // buy
    invoice: string,    // buy and sell
}

export interface IBuyRequest {
    side: "buy", 
    invoice: string, // other party invoice
    satPrice: number,
    signature: string,
}

// onboarding

export enum Onboarding {
    walletDownloaded = "walletDownloaded",
    walletActivated = "walletActivated",
    whatIsBitcoin = "whatIsBitcoin",
    whereBitcoinExist="whereBitcoinExist",
    whoControlsBitcoin="whoControlsBitcoin",
    copyBitcoin="copyBitcoin",
    sat = "sat",
    moneyImportantGovernement = "moneyImportantGovernement",
    moneyIsImportant= "moneyIsImportant",
    whyStonesShellGold= "whyStonesShellGold",
    moneyEvolution= "moneyEvolution",
    coincidenceOfWants= "coincidenceOfWants",
    moneySocialAggrement= "moneySocialAggrement",
    freeMoney = "freeMoney",
    custody = "custody",
    digitalKeys = "digitalKeys",
    backupWallet = "backupWallet",
    fiatMoney = "fiatMoney",
    bitcoinUnique = "bitcoinUnique",
    moneySupply =  "moneySupply",
    newBitcoin =  "newBitcoin",
    creator = "creator",
    volatility = "volatility",
    activateNotifications = "activateNotifications",
    phoneVerification = "phoneVerification",
    firstLnPayment = "firstLnPayment",
    transaction = "transaction",
    paymentProcessing = "paymentProcessing",
    decentralization = "decentralization",
    privacy = "privacy",
    inviteAFriend = "inviteAFriend",
    bankOnboarded = "bankOnboarded",
    buyFirstSats = "buyFirstSats",
    debitCardActivation = "debitCardActivation",
    firstCardSpending = "firstCardSpending",
    firstSurvey = "firstSurvey",
    activateDirectDeposit = "activateDirectDeposit",
    doubleSpend = "doubleSpend",
    exchangeHack = "exchangeHack",
    energy = "energy",
    difficultyAdjustment = "difficultyAdjustment",
    dollarCostAveraging = "dollarCostAveraging",
    scalability = "scalability",
    lightning = "lightning",
    moneyLaundering = "moneyLaundering",
    tweet = "tweet",


    WhatIsFiat="WhatIsFiat",
    whyCareAboutFiatMoney="whyCareAboutFiatMoney",
    GovernementCanPrintMoney="GovernementCanPrintMoney",
    FiatLosesValueOverTime="FiatLosesValueOverTime",
    OtherIssues="OtherIssues",
    LimitedSupply="LimitedSupply",
    Decentralized="Decentralized",
    NoCounterfeitMoney="NoCounterfeitMoney",
    HighlyDivisible="HighlyDivisible",
    securePartOne="securePartOne",
    securePartTwo="securePartTwo",

}

export const OnboardingEarn = {
    walletDownloaded: 1,
    walletActivated: 1,
    sat: 1,
    whatIsBitcoin: 1,
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
