
export interface IWallet {
  getCurrency(): any // TODO
  getBalance(): any // TODO
  getTransactions(): any // TODO
}

export interface ILightningWallet extends IWallet {
  payInvoice(invoice: string): boolean
  getAddress(): any // TODO
}

export interface FiatTransaction {
  amount: number, 
  date: number,
  icon: string,
  name: string,
  onchain_tx?: string, // should be HEX?
}
