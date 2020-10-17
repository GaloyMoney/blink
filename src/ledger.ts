// assets:

export const lightningAccountingPath = 'Assets:Reserve:Lightning'
export const accountBrokerFtxPath = 'Assets:Broker:FTX'
export const escrowAccountingPath = 'Assets:Reserve:Escrow'

// liabilities
export const customerPath = (uid) => `Liabilities:Customer:${uid}`
export const brokerPath = `Liabilities:Broker`

// expenses
export const accountingExpenses = "Expenses"
export const openChannelFees = 'Expenses:Bitcoin:Fees'