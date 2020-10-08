import { User } from "./mongodb"

// assets:
export const lightningAccountingPath = 'Assets:Reserve:Lightning'

export const ftxAccountingPath = 'Assets:FTX'


// liabilities
export const customerPath = (uid) => { 
  return `Liabilities:Customer:${uid}`
}

export const getBrokerAccountPath = async () => { 
  const {_id} = await User.findOne({role: "broker"}, {_id: 1})
  return customerPath(_id)
}


// expenses

export const accountingExpenses = "Expenses"